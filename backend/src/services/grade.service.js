const parseGradeReport = require('../parser/grade');
const db = require('../db/connection');

async function parseAndSave(filePath, userId) {
  const parsed = await parseGradeReport(filePath);

  const VALID_TERMS = new Set(['1', '2', 'summer', 'winter']);

  function toTerm(raw) {
    if (!raw) return null;
    if (raw === '1학기') return '1';
    if (raw === '2학기') return '2';
    if (raw === '하계' || raw === '여름') return 'summer';
    if (raw === '동계' || raw === '겨울') return 'winter';
    return null; // 학점인정 등 매핑 불가하면 건너뜀
  }

  // 완료 과목 + 수강신청내역(현학기)을 학기별로 묶음
  const semesterMap = {};

  for (const c of parsed.courses) {
    const term = toTerm(c.semester);
    if (!term || !VALID_TERMS.has(term)) continue;
    const key = `${c.year}-${term}`;
    if (!semesterMap[key]) semesterMap[key] = { year: c.year, term, courses: [] };
    semesterMap[key].courses.push(c);
  }

  for (const c of (parsed.enrolledCourses || [])) {
    const term = toTerm(c.semester);
    if (!term || !VALID_TERMS.has(term)) continue;
    const key = `${c.year}-${term}`;
    if (!semesterMap[key]) semesterMap[key] = { year: c.year, term, courses: [] };
    semesterMap[key].courses.push(c);
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 재업로드 기존데이터 전부 삭제 후 재삽입 (데이터 누적 => replace)
    await conn.query('DELETE FROM semesters WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM graduation_requirements WHERE user_id = ?', [userId]);

    for (const sem of Object.values(semesterMap)) {
      const [semResult] = await conn.query(
        `INSERT INTO semesters (user_id, semester_year, term)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
        [userId, sem.year, sem.term]
      );
      const semesterId = semResult.insertId;

      // 재업로드 시 중복 방지: 기존 과목 삭제 후 재삽입
      await conn.query('DELETE FROM courses WHERE semester_id = ?', [semesterId]);

      for (const c of sem.courses) {
        await conn.query(
          `INSERT INTO courses
             (semester_id, code, name, credit, division, category, grade, area, sub_area)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [semesterId, c.courseCode, c.courseName, c.credits,
           c.category, c.courseType, c.grade ?? null, c.area ?? null, c.subArea ?? null]
        );
      }
    }

    // 졸업요건 저장 (파싱 결과에서 추출한 값)
    const reqList = [
      ['총졸업',  parsed.graduationRequired],
      ['전공필수', parsed.majorRequired?.required],
      ['전공선택', parsed.majorRequired?.elective],
      ['개신기초교양',     parsed.liberalRequired?.['개신기초']],
      ['자연이공계기초과학', parsed.liberalRequired?.['자연이공기초']],
      ['일반교양',         parsed.liberalRequired?.['일반']],
      ['확대교양',         parsed.liberalRequired?.['확대']],
    ];
    for (const [area, required] of reqList) {
      if (required == null) continue;
      await conn.query(
        `INSERT INTO graduation_requirements (user_id, area, required)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE required = VALUES(required)`,
        [userId, area, required]
      );
    }

    // 학과, 학년, 백분위(프로필 정보) 존재하면 저장 (엑셀 업로드 시 갱신)
    if (parsed.department || parsed.gradeYear || parsed.percentile != null) {
      await conn.query(
        `UPDATE users SET department=?, grade_year=?, percentile=? WHERE id=?`,
        [parsed.department || null, parsed.gradeYear || null,
         parsed.percentile ?? null, userId]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return parsed;
}

module.exports = { parseAndSave };

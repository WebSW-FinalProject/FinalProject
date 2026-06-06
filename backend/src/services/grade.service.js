const parseGradeReport = require('../parser/grade');
const db = require('../db/connection'); // 통합 상대경로 수정

async function parseAndSave(filePath, userId) {
  const parsed = await parseGradeReport(filePath);

  const VALID_TERMS = new Set(['1', '2', 'summer', 'winter']);

  function toTerm(raw) {
    if (!raw) return null;
    if (raw === '1학기') return '1';
    if (raw === '2학기') return '2';
    if (raw === '하계' || raw === '여름') return 'summer';
    if (raw === '동계' || raw === '겨울') return 'winter';
    return null; // 학점인정 등 매핑 불가 → 건너뜀
  }

  const semesterMap = {};
  for (const c of parsed.courses) {
    const term = toTerm(c.semester);
    if (!term || !VALID_TERMS.has(term)) continue; // 유효하지 않은 학기 스킵
    const key = `${c.year}-${term}`;
    if (!semesterMap[key]) semesterMap[key] = { year: c.year, term, courses: [] };
    semesterMap[key].courses.push(c);
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const sem of Object.values(semesterMap)) {
      const [semResult] = await conn.query(
        `INSERT INTO semesters (user_id, semester_year, term)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
        [userId, sem.year, sem.term]
      );
      const semesterId = semResult.insertId;

      for (const c of sem.courses) {
        await conn.query(
          `INSERT INTO courses
             (semester_id, code, name, credit, division, category, grade, area, sub_area)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE grade=VALUES(grade)`,
          [semesterId, c.courseCode, c.courseName, c.credits,
           c.category, c.courseType, c.grade, c.area, c.subArea]
        );
      }
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
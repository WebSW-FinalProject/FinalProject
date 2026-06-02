const parseGradeReport = require('../parser/grade');
const db = require('../../db/connection');

async function parseAndSave(filePath, userId) {
  const parsed = await parseGradeReport(filePath);

  const semesterMap = {};
  for (const c of parsed.courses) {
    const key = `${c.year}-${c.semester}`;
    if (!semesterMap[key]) semesterMap[key] = { year: c.year, term: c.semester, courses: [] };
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
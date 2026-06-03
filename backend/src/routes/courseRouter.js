const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/connection');

// 수강 과목 목록 조회
router.get('/', async (req, res) => {
  try {
    const { semester_id } = req.params;

    const [rows] = await db.query(
      'SELECT * FROM courses WHERE semester_id = ?',
      [semester_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '과목 목록 조회 실패', error: err.message });
  }
});

// 과목 추가
router.post('/', async (req, res) => {
  try {
    const { semester_id } = req.params;
    const { credit, code, name, division, area, sub_area, category, grade, grade_points } = req.body;

    if (!name || !credit) {
      return res.status(400).json({ message: 'name, credit은 필수입니다.' });
    }

    const [result] = await db.query(
      'INSERT INTO courses (semester_id, credit, code, name, division, area, sub_area, category, grade, grade_points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [semester_id, credit, code || null, name, division || null, area || null, sub_area || null, category || null, grade || null, grade_points || null]
    );

    const [created] = await db.query(
      'SELECT * FROM courses WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(500).json({ message: '과목 추가 실패', error: err.message });
  }
});

// 과목 수정
router.put('/:course_id', async (req, res) => {
  try {
    const { semester_id, course_id } = req.params;
    const { credit, code, name, division, area, sub_area, category, grade, grade_points } = req.body;

    const [course] = await db.query(
      'SELECT id FROM courses WHERE id = ? AND semester_id = ?',
      [course_id, semester_id]
    );
    if (course.length === 0) {
      return res.status(404).json({ message: '과목을 찾을 수 없습니다.' });
    }

    await db.query(
      'UPDATE courses SET credit=?, code=?, name=?, division=?, area=?, sub_area=?, category=?, grade=?, grade_points=? WHERE id=?',
      [credit, code || null, name, division || null, area || null, sub_area || null, category || null, grade || null, grade_points || null, course_id]
    );

    const [updated] = await db.query('SELECT * FROM courses WHERE id = ?', [course_id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: '과목 수정 실패', error: err.message });
  }
});

// 과목 삭제
router.delete('/:course_id', async (req, res) => {
  try {
    const { semester_id, course_id } = req.params;

    const [course] = await db.query(
      'SELECT id FROM courses WHERE id = ? AND semester_id = ?',
      [course_id, semester_id]
    );
    if (course.length === 0) {
      return res.status(404).json({ message: '과목을 찾을 수 없습니다.' });
    }

    await db.query('DELETE FROM courses WHERE id = ?', [course_id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: '과목 삭제 실패', error: err.message });
  }
});

module.exports = router;

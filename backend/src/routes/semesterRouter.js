const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// 학기 목록 조회
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      'SELECT * FROM semesters WHERE user_id = ? ORDER BY semester_year ASC, CASE term WHEN "1" THEN 1 WHEN "summer" THEN 2 WHEN "2" THEN 3 WHEN "winter" THEN 4 END ASC',
      [userId]
      // 배포 설정 문제로 추가
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '학기 목록 조회 실패', error: err.message });
  }
});


// 학기 추가
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { semester_year, term } = req.body;

    if (!semester_year || !term) {
      return res.status(400).json({ message: 'semester_year, term은 필수입니다.' });
    }

    const [existing] = await db.query(
      'SELECT id FROM semesters WHERE user_id = ? AND semester_year = ? AND term = ?',
      [userId, semester_year, term]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: '이미 존재하는 학기입니다.' });
    }

    const [result] = await db.query(
      'INSERT INTO semesters (user_id, semester_year, term, gpa) VALUES (?, ?, ?, NULL)',
      [userId, semester_year, term]
    );

    const [created] = await db.query(
      'SELECT * FROM semesters WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(500).json({ message: '학기 추가 실패', error: err.message });
  }
});


// 학기 GPA 업데이트 ("Dashboard.tsx - 학기 완료 버튼" 누르면 호출) 
router.patch('/:semester_id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { semester_id } = req.params;
    const { gpa } = req.body;
    const val = parseFloat(gpa); // 문자열을 숫자(float) 변환
    
    if (isNaN(val)) return res.status(400).json(
      { message: 'GPA 값 오류' }
    ); // 숫자꼴이 아닌 이상한 문자열 방지.. (isNaN : 변환실패)

    await db.query(
      'UPDATE semesters SET gpa = ? WHERE id = ? AND user_id = ?',
      [val, semester_id, userId]
    ); // db UPDATE 를 통해 gpa 입력된 NOT 현재학기로 patch
       // 특정 유저 user_id 의 id 학기 update(patch)

    res.status(204).send();
  } 
  catch (err) {
    res.status(500).json(
      { message: '학기 업데이트 실패', error: err.message });
  }
});


// 학기 삭제
router.delete('/:semester_id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { semester_id } = req.params;

    const [rows] = await db.query(
      'SELECT id FROM semesters WHERE id = ? AND user_id = ?',
      [semester_id, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '학기를 찾을 수 없습니다.' });
    }

    await db.query('DELETE FROM courses WHERE semester_id = ?', [semester_id]);
    await db.query('DELETE FROM semesters WHERE id = ?', [semester_id]);

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: '학기 삭제 실패', error: err.message });
  }
});

module.exports = router;
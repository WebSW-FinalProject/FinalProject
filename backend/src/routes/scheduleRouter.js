
const express = require('express');
const router  = express.Router();
const pool    = require('../db/connection');

 // back api 추가 (6.10 명세 갱신) 


// GET /api/schedule — 내 일정 목록
//   (오늘~이후만 불러옴 + D-day 다가오는 순)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, DATE_FORMAT(event_date, '%Y-%m-%d')
       AS event_date, event_time, type, memo
       FROM schedule_events
       WHERE user_id = ? AND event_date >= CURDATE()
       ORDER BY event_date, event_time`,
      [req.user.id]
    ); 
    // 일정 추가 시 날짜 오차 수정 (mysql2 드라이버 관련문제)

    res.json(rows);
  } 
  catch (e) {
    console.log("server error : " + e);
    res.status(500).json({message: '500 server error'})
  }
});

// POST /api/schedule — 일정 추가
router.post('/', async (req, res, next) => {
  try {
    const { title, event_date, event_time, type, memo } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({ message: '일정 이름, 날짜는 필수입니다.' });
    }

    const [result] = await pool.query(
      `INSERT INTO schedule_events 
      (user_id, title, event_date, event_time, type, memo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, event_date, 
                    event_time || null, type || '기타', memo || null]
    );
    res.json({ ok: true, id: result.insertId });
  } 
  catch (e) {
    console.log("server error : " + e);
    res.status(500).json({message: '500 server error'})
  }
});

// DELETE /api/schedule/:id — 일정 삭제 (본인 것만)
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM schedule_events WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } 
  catch (e) {
    console.log("server error : ", e);
    res.status(500).json({message: '500 server error'})
  }
});

module.exports = router;

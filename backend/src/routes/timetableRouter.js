
const express = require('express');
const router  = express.Router();
const pool    = require('../db/connection');

// back api (시간표 블럭)

// GET /api/timetable  - 시간표 데이터 불러오기
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, col, grid_row, name, time, type
       FROM timetable_blocks
       WHERE user_id = ?
       ORDER BY col, grid_row`,
      [req.user.id]
    );
    res.json(rows);
  }
  catch (e) {
    console.log("server error : ", e);
    res.status(500).json({ message: '500 server error' });
  }
});

// POST /api/timetable — 블럭 추가
router.post('/', async (req, res, next) => {
  try {
    const { col, grid_row, name, time, type } = req.body;

    if (!col || !grid_row || !name || !time || !type) {
      return res.status(400).json(
        { message: '모든 항목이 필요합니다.' }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO timetable_blocks
       (user_id, col, grid_row, name, time, type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, col, grid_row, name, time, type]
    );
    res.json({ ok: true, id: result.insertId });
  }
  catch (e) {
    console.log("server error : ", e);
    res.status(500).json({ message: '500 server error' });
  }
});

// DELETE /api/timetable/:id — 블럭 삭제 (본인 것만)
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM timetable_blocks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  }
  catch (e) {
    console.log("server error : ", e);
    res.status(500).json({ message: '500 server error' });
  }
});

module.exports = router;

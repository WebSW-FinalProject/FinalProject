const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// 졸업 요건 기준학점 조회
// GET /api/graduation/requirements
router.get('/requirements', async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      'SELECT * FROM graduation_requirements WHERE user_id = ? ORDER BY id ASC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '졸업 요건 조회 실패', error: err.message });
  }
});

// 졸업 미이수 내역 조회
// GET /api/graduation/status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      'SELECT * FROM graduation_status WHERE user_id = ? ORDER BY id ASC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '졸업 미이수 내역 조회 실패', error: err.message });
  }
});

// 졸업 미이수 내역 저장 (엑셀 파싱 결과 — 기존 데이터 삭제 후 재삽입)
// POST /api/graduation/status
router.post('/status', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const userId = req.user.id;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items 배열은 필수입니다.' });
    }

    for (const item of items) {
      if (!item.todo_type || !item.todo_detail) {
        return res.status(400).json({ message: 'todo_type, todo_detail은 필수입니다.' });
      }
    }

    await conn.beginTransaction();

    await conn.query('DELETE FROM graduation_status WHERE user_id = ?', [userId]);

    for (const item of items) {
      await conn.query(
        'INSERT INTO graduation_status (user_id, todo_type, todo_detail, note) VALUES (?, ?, ?, ?)',
        [userId, item.todo_type, item.todo_detail, item.note ?? null]
      );
    }

    await conn.commit();

    const [saved] = await conn.query(
      'SELECT * FROM graduation_status WHERE user_id = ? ORDER BY id ASC',
      [userId]
    );
    res.status(201).json(saved);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: '졸업 미이수 내역 저장 실패', error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;

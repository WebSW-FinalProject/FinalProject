const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db/connection');

// multer 설정 (표준이수모형 이미지 업로드)
const uploadDir = path.join(__dirname, '../../uploads/course-plan');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `plan_${req.user.id}_${Date.now()}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('이미지 파일만 업로드 가능합니다.'));
  },
});


//수강신청 계획 과목 목록

// GET /api/course-plan/:semester_id/items
// 이번 학기 수강신청 계획 과목 목록 조회
router.get('/:semester_id/items', async (req, res, next) => {
  try {
    const { semester_id } = req.params;
    const [rows] = await db.query(
      `SELECT id, name, category, professor, credit, is_enrolled, sort_order
       FROM course_plan_items
       WHERE user_id = ? AND semester_id = ?
       ORDER BY sort_order ASC, id ASC`,
      [req.user.id, semester_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});


// POST /api/course-plan/:semester_id/items
// 과목 추가
router.post('/:semester_id/items', async (req, res, next) => {
  try {
    const { semester_id } = req.params;
    const { name, category = '전공필수', professor = '', credit = 3 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: '과목명은 필수입니다.' });
    }

    const [[{ maxOrder }]] = await db.query(
      `SELECT COALESCE(MAX(sort_order), -1) AS maxOrder
       FROM course_plan_items
       WHERE user_id = ? AND semester_id = ?`,
      [req.user.id, semester_id]
    );

    const [result] = await db.query(
      `INSERT INTO course_plan_items
         (user_id, semester_id, name, category, professor, credit, is_enrolled, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [req.user.id, semester_id, name.trim(), category, professor || null,
       Number(credit), maxOrder + 1]
    );

    const [[created]] = await db.query(
      'SELECT * FROM course_plan_items WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(created);
  } catch (err) { next(err); }
});


// PATCH /api/course-plan/:semester_id/items/:id
// 담김/담기 토글 또는 드래그 순서 일괄 변경
router.patch('/:semester_id/items/:id', async (req, res, next) => {
  try {
    const { semester_id, id } = req.params;

    // 순서 일괄 업데이트 (드래그앤드롭)
    if (req.body.orders) {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        for (const { id: itemId, sort_order } of req.body.orders) {
          await conn.query(
            `UPDATE course_plan_items SET sort_order = ?
             WHERE id = ? AND user_id = ? AND semester_id = ?`,
            [sort_order, itemId, req.user.id, semester_id]
          );
        }
        await conn.commit();
        return res.json({ ok: true });
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
    }

    // 담김/담기 토글
    if (req.body.is_enrolled !== undefined) {
      await db.query(
        `UPDATE course_plan_items SET is_enrolled = ?
         WHERE id = ? AND user_id = ? AND semester_id = ?`,
        [req.body.is_enrolled ? 1 : 0, id, req.user.id, semester_id]
      );
      const [[updated]] = await db.query(
        'SELECT * FROM course_plan_items WHERE id = ?', [id]
      );
      return res.json(updated);
    }

    res.status(400).json({ message: 'is_enrolled 또는 orders 필드가 필요합니다.' });
  } catch (err) { next(err); }
});


// DELETE /api/course-plan/:semester_id/items/:id
// 과목 삭제
router.delete('/:semester_id/items/:id', async (req, res, next) => {
  try {
    const { semester_id, id } = req.params;
    const [result] = await db.query(
      `DELETE FROM course_plan_items
       WHERE id = ? AND user_id = ? AND semester_id = ?`,
      [id, req.user.id, semester_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '과목을 찾을 수 없습니다.' });
    }
    res.status(204).send();
  } catch (err) { next(err); }
});


// GET /api/course-plan/:semester_id/meta
// 메모 + 이미지 경로 조회
router.get('/:semester_id/meta', async (req, res, next) => {
  try {
    const { semester_id } = req.params;
    const [[row]] = await db.query(
      `SELECT memo, image_path FROM course_plan_meta
       WHERE user_id = ? AND semester_id = ?`,
      [req.user.id, semester_id]
    );
    res.json(row || { memo: '', image_path: null });
  } catch (err) { next(err); }
});


// PUT /api/course-plan/:semester_id/meta
// 메모 저장 (없으면 INSERT, 있으면 UPDATE)
router.put('/:semester_id/meta', async (req, res, next) => {
  try {
    const { semester_id } = req.params;
    const { memo = '' } = req.body;

    await db.query(
      `INSERT INTO course_plan_meta (user_id, semester_id, memo)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE memo = VALUES(memo)`,
      [req.user.id, semester_id, memo]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});


// POST /api/course-plan/:semester_id/meta/image
// 표준이수모형 이미지 업로드
router.post('/:semester_id/meta/image',
  upload.single('image'),
  async (req, res, next) => {
    try {
      const { semester_id } = req.params;
      if (!req.file) {
        return res.status(400).json({ message: '이미지 파일이 없습니다.' });
      }

      const imagePath = `/uploads/course-plan/${req.file.filename}`;

      // 기존 이미지 파일 삭제 (있으면)
      const [[existing]] = await db.query(
        `SELECT image_path FROM course_plan_meta
         WHERE user_id = ? AND semester_id = ?`,
        [req.user.id, semester_id]
      );
      if (existing?.image_path) {
        const oldFile = path.join(__dirname, '../../', existing.image_path);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }

      await db.query(
        `INSERT INTO course_plan_meta (user_id, semester_id, image_path)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE image_path = VALUES(image_path)`,
        [req.user.id, semester_id, imagePath]
      );

      res.json({ image_path: imagePath });
    } catch (err) { next(err); }
  }
);

module.exports = router;

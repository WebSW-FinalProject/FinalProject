const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../../authMiddleware');
const gradeService = require('../services/grade.service');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
      cb(null, `${Date.now()}_${base}${ext}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    ['.xlsx', '.xls'].includes(ext) ? cb(null, true) : cb(new Error('엑셀 파일만 업로드 가능합니다.'));
  }
});

const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.post('/parse', auth, upload.single('file'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: '파일이 필요합니다.' });
  try {
    const result = await gradeService.parseAndSave(req.file.path, req.user.id);
    res.json({ ok: true, data: result });
  } finally {
    try { fs.unlinkSync(req.file.path); } catch {}
  }
}));

module.exports = router;
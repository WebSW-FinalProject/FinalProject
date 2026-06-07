
// Node express 기초 공부

const express = require('express'); 
const cors    = require('cors');   

require('dotenv').config(); 
 // .env 변수를 config():파싱

const app = express();
 // express app 객체 생성 (서버설정, 라우팅..)


// 미들웨어
// 1) CORS(Cross-Origin Resource Sharing, 교차 출처 리소스 공유)는 
// 보안적으로 밖(도메인, 포트 등) 서버 간에 리소스를 주고받을 수 있도록 
// 허용하거나 제한하는 HTTP 헤더 기반의 메커니즘

// 2) json 객체로 요청 본문이 들어오면 그것을 파싱해줌 (express.json())
// req.body.* 형태로 데이터 취급할 수 있음!

app.use(cors());          
app.use(express.json());  


const pool = require('./src/db/connection'); 
  // connection.js DB  pool 가져옴 =>  DB연결의 통로역할(다중처리)
app.get('/api/db-test', async (req, res) => {
  const [rows] = await pool.query('SELECT 1+1 AS result');
  res.json(rows[0]);
}); 
// db 연결 test용 라우터
// DB 에 가벼운 쿼리 보내서 잘 동작하는지 확인


const authRouter = require('./src/routes/auth');
app.use('/api/auth', authRouter); 
// auth.js 와 연결되어 동작 (api/auth => auth: register, login)

const authMiddleware = require('./authMiddleware');
app.get('/api/users/mypage', authMiddleware, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, email, username, enroll_date FROM users WHERE id = ?',
    [req.user.id]
  );
  res.json(rows[0]);
});

const usersRouter = require('./src/routes/users');
app.use('/api/users', usersRouter);  

const boardRouter = require('./src/routes/board.routes');
app.use('/api/board', boardRouter);

const semesterRouter = require('./src/routes/semesterRouter');
app.use('/api/semesters', authMiddleware, semesterRouter);

const gradeRouter = require('./src/routes/grade.routes');
app.use('/api/grade', authMiddleware, gradeRouter);

const courseRouter = require('./src/routes/courseRouter');
app.use('/api/semesters/:semester_id/courses', authMiddleware, courseRouter);

// 졸업 요건 조회    GET  /api/graduation
app.get('/api/graduation', authMiddleware, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT area, required FROM graduation_requirements WHERE user_id = ?',
    [req.user.id]
  );
  res.json(rows);
});

// 졸업 이수 현황    GET  /api/graduation/status
// division·category 기준 이수학점 집계 (F 제외, NULL 제외)
app.get('/api/graduation/status', authMiddleware, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.division, c.category, CAST(SUM(c.credit) AS UNSIGNED) AS earned
     FROM courses c
     JOIN semesters s ON c.semester_id = s.id
     WHERE s.user_id = ?
       AND c.grade IS NOT NULL
       AND c.grade != 'F'
       AND c.division IS NOT NULL
     GROUP BY c.division, c.category`,
    [req.user.id]
  );
  res.json(rows);
});

// 졸업 기준 설정   POST /api/graduation/requirements
// body: { area: string, required: number }
app.post('/api/graduation/requirements', authMiddleware, async (req, res) => {
  const { area, required } = req.body;
  if (!area || required == null) {
    return res.status(400).json({ message: 'area, required 필수' });
  }
  await pool.query(
    `INSERT INTO graduation_requirements (user_id, area, required)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE required = VALUES(required)`,
    [req.user.id, area, required]
  );
  res.json({ ok: true });
});


// 졸업 라우터 (GET /requirements, GET /status(graduation_status), POST /status)
// inline 엔드포인트보다 뒤에 마운트 → 충돌 없음
const graduationRouter = require('./src/routes/graduationRouter');
app.use('/api/graduation', authMiddleware, graduationRouter);

app.use((err, req, res, next) => {
  const status  = err.status || 500;
  const message = err.message || '서버 오류가 발생했습니다.';
  console.error(`[${req.method}] ${req.path} →`, err);
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
});



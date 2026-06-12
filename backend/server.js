
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
    `SELECT id, email, username, target_gpa, department,
     grade_year, enroll_date, percentile FROM users WHERE id = ?`,
    [req.user.id]
  ); // 미들웨어에 학과, 학년, 백분율 정보 추가 (프로필 정보)
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

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const coursePlanRouter = require('./src/routes/coursePlanRouter');
app.use('/api/course-plan', authMiddleware, coursePlanRouter);


// 졸업 라우터 수정
// (GET /, GET /requirements, GET /status, 
//  GET /todos, POST /requirements, POST /status)
const graduationRouter = require('./src/routes/graduationRouter');
app.use('/api/graduation', authMiddleware, graduationRouter);

// 시간표 - 일정 추가 라우터
const scheduleRouter = require('./src/routes/scheduleRouter');
app.use('/api/schedule', authMiddleware, scheduleRouter);

// 시간표 라우터
const timetableRouter = require('./src/routes/timetableRouter');
app.use('/api/timetable', authMiddleware, timetableRouter);

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



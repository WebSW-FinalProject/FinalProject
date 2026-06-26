

const router = require('express').Router();
const pool   = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

// require = 외부 라이브러리(또는 export 객체) 불러오기
// Router(): express lib 함수


// POST /api/auth/register
router.post('/register', async (req, res) => {
    // router : node.js express 함수
    // router : 말 그대로 라우팅 주선해주는 함수

    // post : router 객체가 가지고 있는 메서드 (함수)
    // POST 방식 요청 대응
    // post('라우팅경로' async( ))

    // await == JS에서 시간이 드는 작업 끝날때까지 wait
    // await 쓰려면 async 함수여야 함 (비동기 작업 전제)


    // req.body = 요청 본문
    try{
        const {email, password, username} = req.body;
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        ) 
        // pool.query = 데이터베이스(DB)에 명령(SQL)을 내리는 함수
        // 여기서 pool은 DB와 미리 연결해둔 통로들의 묶음(Connection Pool)

        if(rows.length > 0 ) {
            return res.status(409).json({
                message: '이미 가입된 이메일입니다. 다른 이메일을 사용하세요.'
            })
        }  
        // 서버가 브라우저에게 요청 결과 코드로 보여주는 것 (200, 201, 400..)
        // .json({}) == 문제인 부분을 message 로 logging

        const hash = await bcrypt.hash(password, 10);
        // bcrypt 해싱함수 이용해서 복잡도 10으로 password 해싱 => password_hash 저장
 
        await pool.query(
            'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)',
            [email, hash, username]
        ) 

        res.status(201).json({ message: '회원가입 성공'});
    }
    catch(err){
        console.error("register error:", err.message);
        res.status(500).json({message: '500 server error'})
    }
  
});

// POST /api/auth/login
router.post('/login', async (req, res) => {

  try{
    const {email, password, rememberMe} = req.body;
    const [rows] = await pool.query(
        'SELECT id, email, password_hash, username FROM users WHERE email = ?',
        [email]
    ); 
    // rows = JS 배열 형태 DB 줄들이 모여있음 (여러개 조회시 복수, 1개면 단수)
    /*[
    { id: 1, email: 'kim@test.com', name: '김철수', age: 25 },
    { id: 2, email: 'lee@test.com', name: '이영희', age: 30 }
    ]  => 이런 식으로 들어옴 */

    if(rows.length === 0){
        return res.status(400).json({ 
            message: '가입되지 않은 이메일입니다.'
        })
    }
    const users = rows[0];

    const isMatch = await bcrypt.compare(password, users.password_hash);
    if (!isMatch) {
        return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // rememberMe: true => 30일, false => 24시간
    const expiresIn = rememberMe ? '30d' : '24h';
    const token = jwt.sign(
        { id: users.id, email: users.email },
        process.env.JWT_SECRET,
        { expiresIn }  // 토큰 유효시간
    );

    return res.status(200).json({ message: '로그인 성공!', token: token });
  }
  catch(err) {
    console.error("login error:", err.message);
    res.status(500).json({message: '500 server error'})
  }

});


module.exports = router;

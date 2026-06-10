const router = require('express').Router();
const pool = require('../db/connection');
const authMiddleware = require('../../authMiddleware');

// DELETE /api/users
router.delete('/', authMiddleware, async (req, res) => {
    try{
        await pool.query(
        'DELETE FROM users WHERE id = ?',
        [req.user.id]
        ) // delete 는 response 안 줌.
        res.json( {message : '회원탈퇴 완료'} )
    }
    catch (error){
        res.status(500).json({
            message : error
        })
    }
});


// PUT /api/users/target-gpa (사용자 목표학점 추가 API)
// dashboard.tsx - 목표 성적 블럭에서의 수정 버튼이 trigger(saveTargetGpa())
router.put('/target-gpa', authMiddleware, async (req, res) => {
  const { target_gpa } = req.body;
  const val = parseFloat(target_gpa);

  if (isNaN(val) ||
       val < 0 || val > 4.5) {
    return res.status(400).json({ message: '범위 외 입력 (0.00 ~ 4.50)' });
  }

  await pool.query(
    'UPDATE users SET target_gpa = ? WHERE id = ?', 
    [val, req.user.id]); // target.gpa 설정
    
   res.status(204).send(); 
});

module.exports = router;

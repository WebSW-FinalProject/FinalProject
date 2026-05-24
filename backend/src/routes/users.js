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

module.exports = router;

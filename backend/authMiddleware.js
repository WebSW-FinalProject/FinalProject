
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
   const author = req.headers.authorization;

   if(!author) {
     return res.status(401).json({
        message : '로그인이 필요합니다.'
     })
   }

   const token = author.split(' ')[1];
   try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) 
    req.user = decoded;
    next();
   } 
   
   catch (error) {
    return res.status(401).json({
        message: error
    })
   }
};


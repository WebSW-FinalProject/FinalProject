
// Node express 기초 공부

const express = require('express'); 
const cors    = require('cors');   
require('dotenv').config();


const app = express();


app.use(cors());          
app.use(express.json());  

app.get('/api/health', (req, res) => {
  res.json({ status: "ok", message: "서버가 정상작동중!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
});
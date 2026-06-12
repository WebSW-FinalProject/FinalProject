const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const https   = require('https');

// 학기 term => 표시용 문자열
function termLabel(term) {
  if (term === '1') return '1학기';
  if (term === '2') return '2학기';
  if (term === 'summer') return '하계';
  if (term === 'winter') return '동계';
  return term;
}


// AI 사용 부분은 AI 도움 받음!

// Groq REST API 호출 (OpenAI 호환) 
// systemMsg: 언어/형식 규칙, userMsg: 실제 분석 데이터+지시
function callGroq(apiKey, systemMsg, userMsg) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user',   content: userMsg   },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body, 'utf8'),
      },
    };

    const req = https.request(options, (apiRes) => {
      apiRes.setEncoding('utf8'); // 한글 깨짐 방지
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message || 'Groq API 오류'));
          const text = json.choices?.[0]?.message?.content || '';
          resolve(text);
        } catch (e) {
          reject(new Error('응답 파싱 실패'));
        }
      });
    });

    req.on('error', reject);
    req.write(body, 'utf8');
    req.end();
  });
}

// GET /api/ai/analyze — 성적 데이터 기반 AI 분석
// query: lang=ko|en, question=상담내용(선택)
router.get('/analyze', async (req, res, next) => {
  try {
    const userId   = req.user.id;
    const lang     = req.query.lang === 'en' ? 'en' : 'ko';
    const question = (req.query.question || '').trim();
    const conn     = await db.getConnection();

    // 유저 기본 정보
    const [[user]] = await conn.query(
      `SELECT username, department, grade_year, percentile, target_gpa
       FROM users WHERE id = ?`, [userId]
    );

    // 학기 목록
    const [semesters] = await conn.query(
      `SELECT id, semester_year, term, gpa
       FROM semesters WHERE user_id = ?
       ORDER BY semester_year, term`, [userId]
    );

    // 과목 전체
    const [courses] = await conn.query(
      `SELECT c.name, c.credit, c.division, c.category, c.area, c.grade, s.semester_year, s.term
       FROM courses c
       JOIN semesters s ON c.semester_id = s.id
       WHERE s.user_id = ?`, [userId]
    );

    // 졸업요건
    const [gradReqs] = await conn.query(
      `SELECT area, required FROM graduation_requirements WHERE user_id = ?`, [userId]
    );

    conn.release();

    // ── 프롬프트용 데이터 가공 ──
    const doneSems = semesters.filter(s => s.gpa != null);
    const avgGPA   = doneSems.length
      ? (doneSems.reduce((a, s) => a + parseFloat(s.gpa), 0) / doneSems.length).toFixed(2)
      : 'N/A';

    const semSummary = doneSems
      .map(s => `${s.semester_year} ${termLabel(s.term)}: GPA ${parseFloat(s.gpa).toFixed(2)}`)
      .join(' / ');

    const doneCourses    = courses.filter(c => c.grade && c.grade !== 'F');
    const majorCourses   = doneCourses.filter(c => c.division === '전공');
    const liberalCourses = doneCourses.filter(c => c.division === '교양');

    // 현재 수강 중 (grade 없음)
    const inProgressCourses = courses.filter(c => !c.grade);
    const inProgressList    = inProgressCourses.map(c => `${c.name}(${c.credit}학점)`).join(', ');

    const gradeCount = (div, grade) =>
      courses.filter(c => c.division === div && c.grade?.startsWith(grade)).length;

    const gradReqText = gradReqs.map(r => `${r.area} ${r.required}학점`).join(', ');
    const earnedTotal = doneCourses.reduce((a, c) => a + c.credit, 0);
    const totalReq    = gradReqs.find(r => r.area === '총졸업')?.required ?? 0;

    // GPA 추이
    const gpaArr = doneSems.map(s => parseFloat(s.gpa));
    let gpaTrend = 'stable';
    if (gpaArr.length >= 2) {
      const diff = gpaArr[gpaArr.length - 1] - gpaArr[0];
      gpaTrend = diff > 0.2 ? 'improving' : diff < -0.2 ? 'declining' : 'stable';
    }

    // 전공 과목: 성적 있는 것 / P·NP 패논패 분리
    const majorGraded   = majorCourses.filter(c => c.grade !== 'P' && c.grade !== 'NP');
    const majorPassFail = majorCourses.filter(c => c.grade === 'P' || c.grade === 'NP');

    // 성적순 정렬 (A+ → F)
    const gradeOrder = ['A+','A0','B+','B0','C+','C0','D+','D0','F'];
    const sortedMajor = [...majorGraded].sort(
      (a, b) => gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade)
    );
    const topCourses = sortedMajor.slice(0, 5).map(c => `${c.name}(${c.grade})`).join(', ');
    const lowCourses = sortedMajor.slice(-3).reverse().map(c => `${c.name}(${c.grade})`).join(', ');
    const majorGradeList = majorGraded.map(c => `${c.name}(${c.grade})`).join(', ');
    const majorPassList  = majorPassFail.map(c => `${c.name}`).join(', ');

    // ── System 메시지: 언어 규칙 ──
    const systemMsg = lang === 'en'
      ? `You are an expert university academic advisor. Write all responses in English only. Return valid JSON only.`
      : `당신은 대학교 학업 상담 전문가입니다. 모든 응답을 반드시 한국어로만 작성하세요.

절대 금지 규칙 (어기면 응답이 무효가 됩니다):
- 한자(漢字) 사용 금지. 예: 参與→참여, 教科書→교과서, 將來→미래, 企業→기업
- 외국어 단어의 한글 음역 금지. 예: 리버럴 아츠→교양과목, 퍼센타일→백분율
- 영어, 스페인어, 일본어 등 한국어가 아닌 단어 삽입 금지
- 오직 한글, 숫자, 일반 문장부호만 사용할 것

과목명 표기 규칙 (반드시 준수):
- 과목을 언급할 때는 항상 '과목명(등급)' 형식으로 표기할 것
- 예시: "자료구조(A+)와 알고리즘(A0)에서 높은 성취를 보였습니다"
- '높은 성적을 보였습니다'처럼 등급 없이 끝내는 표현 금지
JSON 형식만 반환하고 마크다운 코드블록 없이 순수 JSON만 출력하세요.`;

    // ── User 메시지: 데이터 + 분석 지시 ──
    const consultationField = question ? `
  "consultation": {
    "question": "${question.replace(/"/g, '\\"')}",
    "answer": "학생의 질문에 대해 실제 과목명(등급) 데이터를 근거로 25~35문장의 상세한 답변 작성. 다음 구조로 서술: (1) 질문의 핵심 파악 및 현재 데이터 기반 상황 진단 5~7문장, (2) 강점 과목과 약점 과목을 과목명(등급) 형식으로 인용하며 질문과 연관된 구체적 분석 7~10문장, (3) 단계별 실행 가능한 조언 — 단기(이번 학기)/중기(1년)/장기(졸업까지) 각 3~5문장씩, (4) 결론 및 격려 2~3문장. 막연한 일반론과 추상적 표현 금지. 모든 주장은 제공된 성적 데이터로 근거 제시."
  },` : '';

    const userMsg = `
[학생 정보]
- 이름: ${user.username} / 학과: ${user.department || '미입력'} / 학년: ${user.grade_year || '미입력'}학년
- 누적 평점: ${avgGPA}/4.5 | 백분율: ${user.percentile != null ? user.percentile + '%' : '미입력'} | 목표 GPA: ${user.target_gpa}
- GPA 추이: ${gpaTrend} (${gpaArr.map(g => g.toFixed(2)).join(' → ')})

[학기별 GPA]
${semSummary || '없음'}

[전공 과목 — 성적 높은 순]
전체: ${majorGradeList || '없음'}
상위 5개: ${topCourses || '없음'}
하위 3개: ${lowCourses || '없음'}

[패논패 과목 — 성적 분석 제외, 약점으로 언급 금지]
${majorPassList || '없음'}

[현재 수강 중 (미이수)]
${inProgressList || '없음'}

[이수 현황]
- 총 이수학점: ${earnedTotal}/${totalReq || '미설정'}학점
- 전공 A학점 비율: ${majorCourses.length ? Math.round(gradeCount('전공','A') / majorCourses.length * 100) : 0}%
- 교양 A학점 비율: ${liberalCourses.length ? Math.round(gradeCount('교양','A') / liberalCourses.length * 100) : 0}%

[졸업요건]
${gradReqText || '미설정'}
${question ? `\n[상담 요청]\n${question}` : ''}

아래 JSON 구조로만 응답 (설명 금지, JSON만):
{${consultationField}
  "summary": "현재 학업 상태 요약 2~3문장. GPA 추이와 현재 수강 중 과목도 언급.",
  "strength": {
    "title": "강점 한 줄 제목 — 반드시 실제 과목명 포함",
    "description": "상위 과목들을 '과목명(등급)' 형식으로 직접 인용 — 예: 자료구조(A+)에서 탁월한 성과를 보임. 어떤 역량(이론적 사고/구현력/수학적 이해 등)이 강한지 구체적으로 분석. 그 역량이 왜 가치 있는지까지 3~4문장."
  },
  "improvement": {
    "title": "개선 포인트 한 줄 제목 — 실제 과목명 포함",
    "description": "하위 과목들을 '과목명(등급)' 형식으로 직접 인용 — 예: 운영체제(C+)에서 개선 필요. 어떤 유형의 학습이 부족한지 원인 분석. 구체적인 개선 방법 3~4문장."
  },
  "graduationOutlook": {
    "title": "졸업 전망 한 줄",
    "description": "잔여 학점, 현재 수강 중 과목 포함 시 이수 가능 학점, 예상 졸업 시기 3~4문장."
  },
  "strategies": [
    "전략1 — 실제 약한 과목 기반 구체적 행동",
    "전략2 — 강한 분야 심화 방법",
    "전략3 — 현재 수강 중 과목 활용법",
    "전략4 — 학점 관리 구체적 방법",
    "전략5 — 진로 연결 단기 행동"
  ],
  "career": {
    "title": "상위 과목에서 도출한 구체적 진로 제목 — 과목명(등급) 포함",
    "fields": ["분야1", "분야2", "분야3"],
    "description": "강점 과목 → 해당 역량 → 구체적 직무/산업 연결 순서로 4~5문장. '이런 분야가 있습니다' 수준의 일반론 금지. 왜 이 학생에게 맞는지 데이터 근거 명시."
  },
  "report": [
    {
      "title": "전공 성취 패턴 분석",
      "content": "과목명을 직접 인용하며 어떤 유형의 과목(이론/실습/수학/구현 등)에서 강한지 패턴 분석. 현재 수강 중 과목과 연결. 5~6문장."
    },
    {
      "title": "맞춤형 학습 전략",
      "content": "약한 과목 유형 보완법, 강한 과목 심화법, 현재 수강 중 과목 공략법을 각각 명시. 5~6문장."
    },
    {
      "title": "진로 로드맵",
      "content": "강점 과목 → 관련 프로젝트/인턴 → 첫 취업까지 단계별 로드맵. 현재 학년 기준으로 시기 명시. 5~6문장."
    }
  ]
}`;

    // ── Groq 호출 ──
    const groqKey = req.headers['x-ai-key'];
    if (!groqKey) return res.status(400).json({ message: 'Groq API 키가 필요합니다.' });

    const text     = await callGroq(groqKey, systemMsg, userMsg);
    const analysis = JSON.parse(text);

    // ── 분석 결과 DB 저장 (user_id 기준 1행 upsert) ──
    const saveConn = await db.getConnection();
    await saveConn.query(
      `INSERT INTO ai_analysis_results (user_id, result, lang, question)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         result      = VALUES(result),
         lang        = VALUES(lang),
         question    = VALUES(question),
         analyzed_at = CURRENT_TIMESTAMP`,
      [userId, JSON.stringify(analysis), lang, question || null]
    );
    saveConn.release();

    res.json(analysis);
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/saved — 저장된 분석 결과 불러오기
router.get('/saved', async (req, res, next) => {
  try {
    const [[row]] = await db.query(
      `SELECT result, lang, question, analyzed_at
       FROM ai_analysis_results WHERE user_id = ?`,
      [req.user.id]
    );
    if (!row) return res.status(404).json({ message: '저장된 분석 없음' });

    const result = typeof row.result === 'string' ? JSON.parse(row.result) : row.result;
    res.json({
      result,
      lang:        row.lang,
      question:    row.question,
      analyzed_at: row.analyzed_at,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

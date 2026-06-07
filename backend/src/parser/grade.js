const ExcelJS = require('exceljs');
const fs = require('fs');

// 병합셀 때문에 getCell로 읽어야 함, 중복값 제거
function uniqRow(ws, rn) {
  const seen = new Set();
  const result = [];
  for (let c = 1; c <= ws.columnCount; c++) {
    let v = ws.getCell(rn, c).value;
    if (!v) continue;
    v = typeof v === 'object' && v.text ? String(v.text).trim() : String(v).trim();
    if (v && !seen.has(v)) {
      seen.add(v);
      result.push([c, v]);
    }
  }
  return result;
}

function getVal(ws, rn, cn) {
  let v = ws.getCell(rn, cn).value;
  if (!v) return null;
  return typeof v === 'object' && v.text ? String(v.text).trim() : String(v).trim();
}

// 특정 키워드들이 다 있는 행 찾기
function findRow(ws, keywords) {
  for (let rn = 1; rn <= ws.rowCount; rn++) {
    const vals = uniqRow(ws, rn).map(([, v]) => v);
    if (vals.length && keywords.every(kw => vals.includes(kw))) return rn;
  }
  return null;
}

module.exports = async function parseGradeReport(filePath) {
  const wb = new ExcelJS.Workbook();
  const buffer = fs.readFileSync(filePath);
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];

  // 학번, 이름
  let studentId = null, name = null;
  for (let rn = 1; rn <= ws.rowCount; rn++) {
    const row = uniqRow(ws, rn);
    for (let i = 0; i < row.length - 1; i++) {
      const [, v] = row[i];
      const [, next] = row[i + 1];
      if (v === '학번' && !studentId) studentId = next;
      if (v === '성명' && !name) name = next;
    }
    if (studentId && name) break;
  }

  // 평점평균
  let gpa = null;
  for (let rn = 1; rn <= ws.rowCount; rn++) {
    const row = uniqRow(ws, rn);
    const idx = row.findIndex(([, v]) => v.replace(/\s/g, '') === '평점평균');
    if (idx !== -1 && row[idx + 1]) {
      gpa = parseFloat(row[idx + 1][1]);
      break;
    }
  }

  // 졸업기준학점, 이수학점, 전공기준
  let graduationRequired = null, totalEarned = null;
  let majorRequired = { required: null, elective: null };

  for (let rn = 1; rn <= ws.rowCount; rn++) {
    const vals = uniqRow(ws, rn).map(([, v]) => v);
    if (vals.some(v => v.includes('이수구분별 취득학점 상세 합계표'))) {
      graduationRequired = getVal(ws, rn + 3, 85) ? parseInt(getVal(ws, rn + 3, 85)) : null;
      totalEarned = getVal(ws, rn + 4, 85) ? parseInt(getVal(ws, rn + 4, 85)) : null;
      majorRequired.required = getVal(ws, rn + 3, 29) ? parseInt(getVal(ws, rn + 3, 29)) : null;
      majorRequired.elective = getVal(ws, rn + 3, 34) ? parseInt(getVal(ws, rn + 3, 34)) : null;
      break;
    }
  }

  // 과목 목록
  const COLS = ['구분', '영역', '세부영역', '년도', '학기', '교과목번호', '교과목명', '학점', '이수구분', '성적'];
  const headerRow = findRow(ws, ['구분', '교과목명', '학점', '성적', '년도']);
  if (!headerRow) throw new Error('성적 헤더를 찾을 수 없습니다.');

  // 헤더행에서 각 컬럼 위치 매핑
  const cm = {};
  const seen = new Set();
  for (let c = 1; c <= ws.columnCount; c++) {
    const v = getVal(ws, headerRow, c);
    if (v && COLS.includes(v) && !seen.has(v)) {
      cm[v] = c;
      seen.add(v);
    }
  }

  const get = (rn, k) => cm[k] ? getVal(ws, rn, cm[k]) : null;

  const courses = [];
  for (let rn = headerRow + 1; rn <= ws.rowCount; rn++) {
    const vals = uniqRow(ws, rn).map(([, v]) => v);
    if (vals.some(v => v.startsWith('▶') || v === '자격종별') && !vals.includes('교과목명')) break;

    const courseName = get(rn, '교과목명');
    if (!courseName) continue;

    courses.push({
      category:   get(rn, '구분'),
      area:       get(rn, '영역'),
      subArea:    get(rn, '세부영역'),
      year:       get(rn, '년도') ? parseInt(get(rn, '년도')) : null,
      semester:   get(rn, '학기'),
      courseCode: get(rn, '교과목번호'),
      courseName,
      credits:    get(rn, '학점') ? parseFloat(get(rn, '학점')) : null,
      courseType: get(rn, '이수구분'),
      grade:      get(rn, '성적'),
    });
  }

  // 수강신청내역 (현학기 수강 중 — 성적 없음)
  const enrolledCourses = [];
  for (let rn = 1; rn <= ws.rowCount; rn++) {
    const vals = uniqRow(ws, rn).map(([, v]) => v);
    const headerVal = vals.find(v => v.includes('수강신청내역'));
    if (!headerVal) continue;

    // 헤더 텍스트에서 년도/학기 추출 (예: "2026학년도 1학기 수강신청내역")
    let enrollYear = null, enrollSemester = null;
    const yearMatch = headerVal.match(/(\d{4})/);
    if (yearMatch) enrollYear = parseInt(yearMatch[1]);
    if (headerVal.includes('1학기'))     enrollSemester = '1학기';
    else if (headerVal.includes('2학기')) enrollSemester = '2학기';
    else if (headerVal.includes('하계')) enrollSemester = '하계';
    else if (headerVal.includes('동계')) enrollSemester = '동계';

    // 수강신청내역 컬럼 헤더 찾기 (교과목번호, 교과목명, 학점, 이수구분)
    const enrollKeys = ['교과목번호', '교과목명', '학점', '이수구분'];
    const ecm = {};
    for (let r2 = rn + 1; r2 <= Math.min(rn + 10, ws.rowCount); r2++) {
      for (let c = 1; c <= ws.columnCount; c++) {
        const v = getVal(ws, r2, c);
        if (v && enrollKeys.includes(v) && !ecm[v]) ecm[v] = c;
      }
      if (enrollKeys.every(k => ecm[k])) {
        // 데이터 행 파싱
        for (let dr = r2 + 1; dr <= ws.rowCount; dr++) {
          const courseName = getVal(ws, dr, ecm['교과목명']);
          if (!courseName) break;
          const courseType = getVal(ws, dr, ecm['이수구분']);
          const division = courseType?.includes('전공') ? '전공'
                         : courseType?.includes('교양') ? '교양' : null;
          enrolledCourses.push({
            year: enrollYear,
            semester: enrollSemester,
            courseCode: getVal(ws, dr, ecm['교과목번호']),
            courseName,
            credits: getVal(ws, dr, ecm['학점']) ? parseFloat(getVal(ws, dr, ecm['학점'])) : null,
            courseType,
            category: division,
            area: null,
            subArea: null,
            grade: null,
          });
        }
        break;
      }
    }
    break; // 수강신청내역 섹션 하나만
  }

  return { studentId, name, gpa, graduationRequired, totalEarned, majorRequired, courses, enrolledCourses };
};

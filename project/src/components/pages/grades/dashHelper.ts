// Dashboard.tsx 상수 및 함수 정의 (일부분)

// 졸업요건 res꼴 (GET /api/graduation)
export interface GradReq { area: string; required: number; }

// 게시글 res꼴 (GET /api/board)
export interface BoardPost {
  id: number; title: string; category: string;
  author_username: string; create_date: string;
  like_count: number; view_count: number;
}


// #### 형식정의

// 성적 => 학점 환산
export const GRADE_SCALE: Record<string, number> = {
  'A+': 4.5, 'A0': 4.0, 'B+': 3.5, 'B0': 3.0,
  'C+': 2.5, 'C0': 2.0, 'D+': 1.5, 'D0': 1.0, 'F': 0,
};

// GRADE_SCALE 키 배열 (select option 용)
export const GRADES = ['A+', 'A0', 'B+', 'B0', 'C+', 'C0', 'D+', 'D0', 'F'];

// 게시글 카테고리 영문 => 한글 태그
export const POST_TAG: Record<string, string> = {
  GRADUATION: '졸업', JOB_HUNT: '취준', DAILY: '자유', NOTICE: '공지',
};



// #### 함수 LIST 

// 학기로 다듬기 : "2024-1", "2025-하계" 형식..
export function semLabel(sem: any): string {
  const t = sem.term === '1' ? '1' : sem.term === '2' ? '2'
    : sem.term === 'summer' ? '하계' : '동계';
  return `${sem.semester_year}-${t}`;
}

// SVG 차트 y 좌표 (viewBox y: 8~78, GPA: 3.5~4.5) #svg 차트 : ai도움 비중 큼
export function toChartY(gpa: number) {
  return Math.max(8, Math.min(78, 70 - (gpa - 3.5) * 50));
}

// 학기 수에 따라 SVG X 좌표 동적 배분
export function getChartXs(count: number) {
  if (count === 0) return [];
  if (count === 1) return [280];
  const xs = [];
  for (let i = 0; i < count; i++) {
    xs.push(30 + Math.round(i * (500 / (count - 1))));
  } 
  return xs;
}

// 학점 등급 스타일 매핑
export function gradeStyle(g: string) {
  if (g.startsWith('A')) return 'text-(--text-1) font-bold tabular-nums';
  if (g.startsWith('B')) return 'text-(--text-2) font-bold tabular-nums';
  if (g === 'F') return 'text-red-500 font-bold tabular-nums';
  return 'text-(--text-3) font-bold tabular-nums';
}

// 과목 구분 circle dot 색
export function dotColor(cat: string) {
  if (cat === '전공필수') return 'bg-(--timetable-b-bd)';
  if (cat === '전공선택') return 'bg-(--timetable-p-bd)';
  if (cat === '교양선택') return 'bg-(--timetable-c-bd)';
  return 'bg-(--timetable-g-bd)';
}

// ISO 날짜 => N분/시간/일 전
export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}분 전`;
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

// 성적 문자 (A,B..) => 점수
export function gradeToPoints(g: string | null): number | null {
  if (!g) return null;
  return GRADE_SCALE[g] ?? null;
}

// 과목 배열 => 총 학점 합계
export function sumCredits(courses: any[]) {
  let total = 0;
  for (const c of courses) total += c.credit;
  return total;
}

// 과목 배열 => GPA 계산 
export function calcGpa(courses: any[]) {
  let totalPoints = 0;
  let totalCredits = 0;
  for (const c of courses) {
    const pts = gradeToPoints(c.grade);
    if (pts === null) continue;
    totalPoints  += pts * c.credit;
    totalCredits += c.credit;
  }
  if (totalCredits === 0) return null;
  return totalPoints / totalCredits;
}
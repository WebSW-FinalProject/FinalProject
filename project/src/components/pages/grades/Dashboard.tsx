
import { useState } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { mockSemesters, mockCourses, mockPosts } from '../../../data/mock';

import gradeImg from '../../../assets/grade.png';


// mock.ts data 형태는 아래와 같음

// mockSemesters :   { id: 2, user_id: 1, semester_year: 2023, term: '2', gpa: 4.00 }꼴
// mockCourses : { id: 1,  semester_id: 1, credit: 3, code: 'CS101', name: '프로그래밍기초',
//                    division: '전공', category: '전공필수', grade: 'A0',
//                    grade_points: 4.0, area: null, sub_area: null },
// mockPosts : { id: 1, user_id: 2, category: 'GRADUATION', title: ' ... ',
//               body: 'AI 관련 논문 쓰려고 하는데 주제 추천 부탁드려요', 
//                enroll_date: '2025-05-20T10:00:00.000Z', 
//                modify_date: '2025-05-20T10:00:00.000Z', 
//                author_name: '김민준', like_count: 12, comment_count: 5 },


// 헬퍼 함수  
// # 인덱스1, 2, 3, .. → "1-1", "1-2" ... 형식 변환
function semLabel(i: number) {
  return `${Math.floor(i / 2) + 1}-${(i % 2) + 1}`;
  //  i=3(4학기째)이면 2-2!
}

// # mock data 를 SVG 차트로 변환하기.  (viewBox y: 8~78, GPA: 3.5~4.5)
const CHART_X = [116, 226, 336, 446, 530];
function toChartY(gpa: number) {
  return Math.max(8, Math.min(78, 70 - (gpa - 3.5) * 50));
}

// 학점 등급 스타일 매칭 ..
function gradeStyle(g: string) {
  if (g.startsWith('A')) return 'text-(--text-1) font-bold tabular-nums';
  if (g.startsWith('B')) return 'text-(--text-2) font-bold tabular-nums';
  if (g === 'F') return 'text-red-500 font-bold tabular-nums';
  return 'text-(--text-3) font-bold tabular-nums';
}

// 과목 구분 circle dot
function dotColor(cat: string) {
  if (cat === '전공필수') return 'bg-(--timetable-b-bd)';
  if (cat === '전공선택') return 'bg-(--timetable-p-bd)';
  if (cat === '교양선택') return 'bg-(--timetable-c-bd)';
  return 'bg-(--timetable-g-bd)';
}

// ISO 날짜 → N분/시간/일 전
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}분 전`;
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

// 게시글 카테고리 영문 => 한글 태그
const POST_TAG: Record<string, string> = {
  GRADUATION: '졸업', JOB_HUNT: '취준', DAILY: '자유', NOTICE: '공지',
};

// 성적 => 학점 환산
const GRADE_SCALE: Record<string, number> = {
  'A+': 4.5, 'A0': 4.0, 'B+': 3.5, 'B0': 3.0,
  'C+': 2.5, 'C0': 2.0, 'D+': 1.5, 'D0': 1.0, 'F': 0,
};



// 메인 컴포넌트 함수
function Dashboard() {

  // 열려있는 학기 토글 블럭 useState 
  const [expandedSems, setExpandedSems] = useState<number[]>([]);
  // 현재 학기 성적 입력값 { 강의번호 : "A+" }
  const [grades, setGrades] = useState<Record<number, string>>({});

  
  // 성적 입력되지 않은 열을 현학기로 지정
  const currentSem = mockSemesters.find(s => s.gpa === null)!;
  // 현학기(currentSem)의 모든 과목이 이번 학기 수강 과목.
  const currentCourses = mockCourses.filter(c => c.semester_id === currentSem.id);

  // 성적이 입력된 과목만 => GPA 계산
  const filledCourses = currentCourses.filter(c => grades[c.id]);
  const expectedGPA = filledCourses.length > 0
    ? filledCourses.reduce((sum, c) => sum + GRADE_SCALE[grades[c.id]] * c.credit, 0) /
      filledCourses.reduce((sum, c) => sum + c.credit, 0)
    : null;

  // SVG 차트용 데이터
  const chartData = mockSemesters
    .map((s, i) => ({ x: CHART_X[i], y: s.gpa !== null ? toChartY(s.gpa) : null, gpa: s.gpa }))
    .filter(p => p.y !== null) as Array<{ x: number; y: number; gpa: number }>;
  const linePath = chartData.map(p => `${p.x},${p.y}`).join(' ');
  const fillPath = chartData.length > 0
    ? `${linePath} ${chartData.at(-1)!.x},78 ${chartData[0].x},78`
    : '';

    
  // Mock data 연결
  const gpaList = chartData.map(p => p.gpa);
  const maxGPA = gpaList.length > 0 ? Math.max(...gpaList) : 0;
  const minGPA = gpaList.length > 0 ? Math.min(...gpaList) : 0;
  const avgGPA = gpaList.length > 0 ? gpaList.reduce((s, v) => s + v, 0) / gpaList.length : 0;


  // 해당 학기의 expandedSems 여부 파악후 열려있으면 닫고, 닫혀있음 열기.
  function toggle(id: number) {
    if (expandedSems.includes(id)) {
      setExpandedSems(expandedSems.filter(s => s !== id));
    } else {
      setExpandedSems([...expandedSems, id]);
    }
  }

  return (
    <div className="p-3.5 pb-15 w-full">

      {/* ## alert 섹션 (임시, 하드코딩) */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg
                      bg-(--accent-bg) border border-(--border) 
                      mb-3 text-xs text-(--text-2)">
        <Clock size={11} className="text-(--accent) shrink-0" />
        <span className="text-[10px] font-bold text-(--accent)">D-7</span>
        <span>중간성적 입력 마감</span>
        <span className="text-(--text-3)">·</span>
        <span><b>06.02</b> 수강신청</span>
        <span className="text-(--text-3)">·</span>
        <span><b>06.15</b> 기말고사</span>
        <span className="ml-auto text-[10px] text-(--text-3)">
          2025년 1학기 · 소프트웨어학부
          </span>
      </div>

      {/* ## TOP 2열 구조 (메인 GPA + 졸업현황 블록) */}
      <div className="flex flex-col md:flex-row gap-2.5 mb-3.5">

        {/* GPA 메인 카드 */}
        <div className="flex-8 card p-3.5 min-w-0 overflow-hidden flex items-center
                        bg-(--surface) rounded-xl border border-(--border)"
             style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-4 flex-wrap w-full">

            {/* 메인 카드 좌측 섹션 : 누적 성적 */}
            <div className="flex items-center gap-3.5 flex-1 min-w-44">
              <div className="w-16 h-16 rounded-xl bg-transparent 
                              flex items-center justify-center shrink-0">
                <img src={gradeImg} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-(--text-3) mb-1 flex items-center gap-1">
                  누적 성적
                </p>
                <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[38px] font-bold text-(--accent) tabular-nums leading-none"
                        style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif", letterSpacing: '-.03em' }}>
                    4.0
                  </span>
                  <span className="text-sm text-(--text-3)">/ 4.5</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                                   bg-(--badge-neutral-bg) text-(--badge-neutral-text)">
                    상위 8.2%
                  </span>
                </div>
                <div className="flex gap-3 text-[11px] text-(--text-2) flex-wrap">
                  <span>전공 <b className="text-(--text-1) tabular-nums">4.0</b></span>
                  <span>교양 <b className="text-(--text-1) tabular-nums">4.0</b></span>
                  <span>최고 <b className="text-(--accent) tabular-nums">4.3</b>
                    <span className="text-[10px] text-(--text-3) ml-0.5">(2-2)</span></span>
                  <span>등록 <b className="text-(--text-1) tabular-nums">5</b>학기</span>
                </div>
              </div>
            </div>

            {/* 메인 카드 우측 섹션 : 현재 상태 블럭들 */}
            <div className="flex gap-1.5 shrink flex-wrap">
              {/* 데이터 연결 필요 (임시, 하드코딩) */}
              {[
                { label: '이수학점', value: '80', sub: '/ 140', barPct: 57, badge: null },
                { label: '전공',     value: '36', sub: '/ 85',  barPct: null, badge: '49 잔여' },
                { label: '교양',     value: '40', sub: '/ 42',  barPct: null, badge: '거의 완료' },
                { label: '목표 GPA', value: '4.2', sub: 'A+ 2개', barPct: null, badge: '달성 가능' },
              ].map(box => (
                
                <div key={box.label}
                     className="flex-1 min-w-16 max-w-24 rounded-lg 
                                bg-(--inner-bg) px-3 py-2.5 text-center">
                  <p className="text-[9px] text-(--text-3) mb-1 
                                whitespace-nowrap"> 
                                {box.label}
                  </p>

                  <p className="text-xl font-bold text-(--text-1) 
                                tabular-nums leading-none"
                     style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                    {box.value}
                  </p>

                  {/* 그래프 유무(barPct)로 레이아웃 나누는 것이 합리적*/}
                  {box.barPct !== null 
                  ? (
                      <>
                        {/* 임시 그래프 바 ... (임시, 하드코딩) */}
                        <div className="h-1.5 rounded-full bg-(--bar-track) mt-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-(--bar)" 
                               style={{ width: `${box.barPct}%` }} />
                        </div> 

                        <p className="text-[9px] text-(--text-3) 
                                      mt-0.5 whitespace-nowrap">{box.sub}</p>
                      </>
                  ) 
                  : (
                      <>
                        <p className="text-[9px] text-(--text-3) 
                                      mt-0.5 whitespace-nowrap">{box.sub}</p>
                        {box.badge && (
                          <span className="inline-block mt-1 px-1.5 py-px rounded-full text-[8px] 
                                            font-semibold bg-(--surface-2) whitespace-nowrap 
                                            text-(--text-2) border border-(--border)">
                            {box.badge}
                          </span>
                        )}
                      </>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* 졸업 현황 카드 (임시, 하드코딩) */}
        <div className="flex-2 min-w-32.5 bg-(--surface) 
                        rounded-xl border border-(--border) p-3.5
                        flex flex-col justify-between"
             style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-[9px] font-bold text-(--text-3) uppercase tracking-widest mb-2 flex items-center gap-1">
            졸업 현황
          </p>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[28px] font-extrabold text-(--accent) tabular-nums leading-none"
                    style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif", letterSpacing: '-.03em' }}>
                57%
              </span>
            </div>
            <p className="text-[9px] text-(--text-3) mt-0.5">졸업 달성률</p>
            <div className="h-1 rounded-full bg-(--bar-track) mt-2 mb-2.5 overflow-hidden">
              <div className="h-full rounded-full bg-(--bar)" style={{ width: '57%' }} />
            </div>
          </div>
          <div className="border-t border-(--border) pt-2 flex flex-col gap-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-(--text-3)">잔여 학기</span>
              <b className="text-(--text-1)">3학기</b>
            </div>
            <div className="flex justify-between text-[10px] items-center">
              <span className="text-(--text-3)">졸업인증</span>
              <span className="px-1.5 py-px rounded-full text-[8px] font-semibold
                               bg-(--surface-2) text-(--text-2) border border-(--border)">
                미완료
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* ## 중간 부분 3열 구조 grid 구성 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr] gap-3.5">

        {/* #1열 : 학기별 성적 컴포넌트 
            (* 내용이 많아 실제 데이터 연결하며 구조화 메모 필요) */}
         <div className="bg-(--surface) rounded-xl 
                          border border-(--border) overflow-hidden"
              style={{ boxShadow: 'var(--shadow-card)' }}>

            {/* TOP */}
            <div className="px-4.5 py-3.5 border-b border-(--border) 
                            flex justify-between items-center">
              <span className="font-bold text-sm flex items-center gap-1.5">
                학기별 성적
              </span>
              { /* 학기 추가 버튼 @ */ }
              <button className="text-[11px] font-medium text-(--text-2) border 
                                border-(--border) rounded-lg
                                px-2.5 py-1 hover:bg-(--surface-2) transition-colors">
                + 학기 추가
              </button>
            </div>

            {/* 학기별 GPA 추이 차트 (임시, 하드코딩) */}
            <div className="px-4.5 py-4 border-b border-(--border)">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[11px] text-(--text-3)">학기별 GPA 추이</span>
                <div className="flex gap-4 text-[11px] text-(--text-3)">
                  <span>최고 <b className="text-(--accent) tabular-nums">{maxGPA.toFixed(1)}</b></span>
                  <span>최저 <b className="tabular-nums">{minGPA.toFixed(1)}</b></span>
                  <span>평균 <b className="text-(--text-1) tabular-nums">{avgGPA.toFixed(1)}</b></span>
                </div>
              </div>

              <svg viewBox="0 0 560 90" style={{ width: '100%', display: 'block',
                                                 maxHeight: 70 }}>
                <defs>
                  <linearGradient id="chartfill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity=".18"/>
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
                  </linearGradient>
                </defs>

                {/* 그리드 선 */}
                <line x1="20" y1="20" x2="540" y2="20" stroke="var(--border)"
                       strokeWidth={1} strokeDasharray="4 4"/>
                <line x1="20" y1="45" x2="540" y2="45" stroke="var(--border)"
                       strokeWidth={1} strokeDasharray="4 4"/>
                <line x1="20" y1="70" x2="540" y2="70" stroke="var(--border)" 
                       strokeWidth={1} strokeDasharray="4 4"/>

                {/* y축 라벨 */}
                <text x={8} y={24} fontSize={9} fill="var(--text-3)"
                      fontFamily="Inter" textAnchor="end">4.5</text>
                <text x={8} y={49} fontSize={9} fill="var(--text-3)" 
                      fontFamily="Inter" textAnchor="end">4.0</text>
                <text x={8} y={74} fontSize={9} fill="var(--text-3)" 
                      fontFamily="Inter" textAnchor="end">3.5</text>

                {/* 목표 GPA 기준선 (임시 하드코딩 4.2) */}
                <line x1="20" y1="35" x2="540" y2="35" stroke="#818CF8" 
                      strokeWidth={1.5} strokeDasharray="5 3" opacity={0.75}/>
                <text x={543} y={39} fontSize={8} fill="#818CF8" 
                      fontFamily="Inter" fontWeight={700}>목표</text>

                {/* fill + line */}
                <polygon points={fillPath} fill="url(#chartfill)"/>
                <polyline points={linePath} fill="none" stroke="var(--accent)" 
                          strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/>

                {/* 점 + 라벨 */}
                {chartData.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={i === chartData.length - 1 ? 5 : 4}
                      fill={i === chartData.length - 1 
                            ? 'var(--accent)' : 'var(--surface)'}
                      stroke="var(--accent)" 
                      strokeWidth={i === chartData.length - 1 ? 0 : 2}/>

                    <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize={9}
                      fill={p.gpa === maxGPA ? 'var(--accent)' : 'var(--text-2)'}
                      fontWeight={p.gpa === maxGPA ? 700 : 400}
                      fontFamily="Inter">{p.gpa.toFixed(1)}</text>

                    <text x={p.x} y={89} textAnchor="middle" fontSize={10}
                      fill={i === chartData.length - 1 ? 'var(--accent)' : 'var(--text-3)'}
                      fontFamily="Inter" fontWeight={i === chartData.length - 1 ? 700 : 400}>
                      {i === chartData.length - 1 ? '현재' : semLabel(i)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* 성적 분포 / 전체 이수 과목 차트 (임시, 하드코딩) */}
            <div className="px-4.5 py-2.5 border-b border-(--border)">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-(--text-3) 
                      flex items-center gap-1">성적 분포 · 전체 이수 과목</span>
                <span className="text-[10px] text-(--text-3)">
                    완료 <b className="text-(--text-2) tabular-nums"> 18 </b> 과목 </span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden">
                <div className="w-[28%] bg-(--accent)"/>
                <div className="w-[34%] ml-px" 
                     style={{ background: 'var(--accent)', opacity: .55 }}/>
                <div className="w-[24%] ml-px" 
                     style={{ background: 'var(--accent)', opacity: .28 }}/>
                <div className="flex-1 bg-(--bar-track) ml-px"/>
              </div>
              <div className="flex gap-3.5 mt-1.5 text-[10px]">
                <span className="text-(--accent) font-bold">A+ 
                  <span className="tabular-nums">28%</span>
                </span>
                <span className="text-(--text-2)">A0 
                  <span className="tabular-nums">34%</span>
                </span>
                <span className="text-(--text-3)">B 
                  <span className="tabular-nums">24%</span>
                </span>
                <span className="text-(--text-3) opacity-60">C이하
                  <span className="tabular-nums">14%</span>
                </span>
              </div>
            </div>

            {/* 학기별 성적 - alert 블럭 (임시, 하드코딩) */}
            <div className="px-4.5 py-2 border-b border-(--border) bg-(--accent-bg)
                            flex items-center gap-2 text-[11px] text-(--text-2)">
              <Clock size={12} className="text-(--accent) shrink-0" />
              <span> <b className="text-(--text-1)">자료구조 A+, 알고리즘 A0
                    </b> 이상이면 이번 학기 목표 GPA 4.2 달성 가능. </span>
              <span className="ml-auto px-1.5 py-0.5 rounded-full text-[8px] font-semibold
                              bg-[#DBEAFE] text-[#1E40AF] 
                               whitespace-nowrap shrink-0">달성 가능 ✓</span>
            </div>


            {/* 학기 블럭 : mock.ts 데이터 형식 맞춰 활용 */}
            {mockSemesters.map((sem, i) => {
              const isCurrent = sem.gpa === null; // 현재 학기인지 여부 검사 (성적입력여부로..)
              const isOpen = expandedSems.includes(sem.id); // 열려있는지 확인 (expandedSems search)
              const semCourses = mockCourses.filter(c => c.semester_id === sem.id
                                                          &&  c.grade !== null);
                                // 각 강의들 중 현재 탐색중인 학기의 과목들 catch ..
              const label = semLabel(i); // 인덱스 → "1-1", "1-2" ... 형식 변환

              // 교양/전공 GPA 계산 (학기 헤더 우측 표시용)
              const libCourses = mockCourses.filter(c => 
                c.semester_id === sem.id && c.division === '교양' && c.grade_points);
              const libCr = libCourses.reduce((s, c) => 
                s + c.credit, 0);
              const libGPA = libCr > 0 ? (libCourses.reduce((s, c) => 
                s + c.grade_points! * c.credit, 0) / libCr).toFixed(1) : '-';

              const majorCourses = mockCourses.filter(c => 
                c.semester_id === sem.id && c.division === '전공' && c.grade_points);
              const majorCr = majorCourses.reduce((s, c) =>
                 s + c.credit, 0);
              const majorGPA = majorCr > 0 ? (majorCourses.reduce((s, c) => 
                s + c.grade_points! * c.credit, 0) / majorCr).toFixed(1) : '-';

              return (
                <div key={sem.id} className="border-b border-(--border) last:border-none">
                  {/* key 인 semester id로 div 구분! */}
                  <button
                    onClick={() => toggle(sem.id)}
                    className={`w-full px-4 py-2.5 flex items-center 
                                justify-between transition-colors
                                ${isCurrent ? 'bg-(--accent-bg) hover:bg-(--surface-2)'
                                            : 'hover:bg-(--surface-2)'}`} >

                    <div className="flex items-center gap-3.5">
                      {isCurrent 
                      ? (
                        <>
                          <span className="w-6.5 text-[11px] font-bold text-(--accent)">{label}</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                                          bg-(--badge-neutral-bg) text-(--badge-neutral-text)">현재 학기</span>
                          <span className="text-[10px] text-(--text-3)">5과목 · 13학점 · 성적 발표 전</span>
                        </>
                      ) 
                      : (
                        <>
                          <span className="w-6.5 text-[11px] font-bold text-(--text-3)">{label}</span>
                          <span className="text-lg font-bold tabular-nums text-(--text-1) leading-none"
                                style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                            {sem.gpa?.toFixed(1)} {/* toFixed : 소수점 n자리까지 보여줌. */}
                          </span>
                          <span className="text-[10px] text-(--text-3)">/4.5</span>
                        </>
                      )}

                    </div>


                    {!isCurrent && (
                      <div className="flex items-center gap-3.5 text-[11px] text-(--text-2)">
                        <span>교양 <b>{libGPA}</b></span>
                        <span>전공 <b>{majorGPA}</b></span>
                      </div>
                    )}

                    <svg
                      className={`w-3 h-3 text-(--text-3) transition-transform 
                                  ${isOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 9l-7 7-7-7"/>
                    </svg>

                  </button>
                  
                  {/* 토글 내용물 구성 */}
                  
                  {isOpen && (
                    <div className="overflow-hidden">
                      {isCurrent ? (
                        // 강의 데이터 있고, 현재 학기이면(isCurrent) 
                        <div className="px-4 pb-3">
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {/* 현재 학기 목표.. - (임시, 하드코딩) */}
                            {[
                              { label: '자료구조 목표', val: 'A+', note: '이상 필요' },
                              { label: '알고리즘 목표', val: 'A0', note: '이상 필요' },
                              { label: '달성 시 GPA',  val: '4.2↑', note: '목표 달성' },
                            ].map(box => (
                              <div key={box.label} className="bg-(--inner-bg) rounded-lg p-2 text-center">
                                <p className="text-[9px] text-(--text-3) mb-0.5">{box.label}</p>
                                <p className="text-sm font-bold text-(--text-1)">{box.val}</p>
                                <p className="text-[9px] text-(--accent)">{box.note}</p>
                              </div>
                            ))}
                          </div>

                          <p className="text-[10px] text-(--text-3) font-semibold mb-1.5">과목별 성적 입력</p>
                          
                          <div className="flex flex-col gap-1">
                            {currentCourses.map(c => (
                              // notion 필기 참조!
                              <div key={c.id}
                                  className="grid items-center gap-1.5 px-2 py-1 
                                             bg-(--inner-bg) rounded-lg"
                                  style={{ gridTemplateColumns: '1fr 36px 70px' }}>

                                <span className="text-[11px] font-medium text-(--text-1)">{c.name}</span>
                                <span className="text-[10px] text-(--text-3) text-right">{c.credit}cr</span>
                                
                                <select
                                  value={grades[c.id] ?? ''}
                                  onChange={e => setGrades(prev => ({
                                     ...prev, 
                                     [c.id]: e.target.value 
                                  }))}

                                  className="text-[11px] bg-(--surface) border border-(--border)
                                             rounded px-1 py-0.5
                                            text-(--text-1) cursor-pointer focus:outline-none" >

                                  <option value="">-</option>

                                  {Object.keys(GRADE_SCALE).map(g => (
                                    <option key={g}>{g}</option>
                                    ))}

                                </select>

                              </div>
                            ))}
                          </div>

                          <div className="mt-2 px-2.5 py-2 bg-(--accent-bg) rounded-lg 
                                          flex justify-between items-center
                                          border border-(--badge-neutral-bg)">
                            <span className="text-[11px] text-(--text-2)">예상 GPA</span>
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-[17px] font-bold text-(--accent) tabular-nums"
                                    style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                                {expectedGPA !== null ? expectedGPA.toFixed(2) : '-.-'}
                              </span>
                              <span className="text-[10px] text-(--text-3)">/ 4.5</span>
                            </div>
                          </div>
                        </div>
                      ) : semCourses.length > 0 ? (
                        // 현재 학기가 아니지만, 데이터 있으면 :
                        <div className="grid grid-cols-2 gap-2 px-4 pb-3">
                          {['전공', '교양'].map(div => {
                            const divCourses = semCourses.filter(c => c.division === div);
                            return divCourses.length > 0 ? (
                              <div key={div} className="bg-(--inner-bg) rounded-lg p-2.5">
                                <p className="text-[9px] font-bold text-(--text-3) 
                                              uppercase tracking-widest mb-1.5">{div}</p>
                                <div className="flex flex-col gap-1 text-[11px]">
                                  {divCourses.map(c => (

                                    <div key={c.id} className="flex justify-between">
                                      <span className="text-(--text-2)">{c.name}</span>
                                      {c.grade && <span className={gradeStyle(c.grade)}>{c.grade}</span>}
                                    </div>
                                    
                                  ))}
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <div className="mx-4 mb-3 bg-(--inner-bg) rounded-lg 
                                        text-center text-[11px]
                                        text-(--text-3) py-2.5">
                          강의 데이터 없음
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 학기별 성적 - */}
            <div className="px-4.5 py-3 bg-(--surface-2) flex items-center gap-2.5
                            text-[10px] text-(--text-3) whitespace-nowrap ">
              <span>완료 <b className="text-(--text-2)">4학기</b></span>
              <span>·</span>
              <span>평균 GPA <b className="text-(--text-1) tabular-nums">3.95</b></span>
              <span>·</span>
              <span>최고 <b className="text-(--accent) tabular-nums">4.3</b><span className="text-[9px] ml-0.5">(2-2)</span></span>
              <span>·</span>
              <span>A등급 이상 <b className="text-(--text-1) tabular-nums">62%</b></span>
            </div>
         </div>

        {/* #2열+3열 wrapper: md에서 2열, lg에서 투명(contents)해져서 부모 3열에 참여 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:contents gap-3.5">

          {/* #2열 : 목표 성적 | 커뮤니티 */}
          <div className="flex flex-col gap-3.5 h-full">

            {/* 목표 성적 블럭 */}
            <div className="bg-(--surface) rounded-xl border 
                            border-(--border) overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-3.5 py-3 border-b border-(--border) 
                              flex justify-between items-center">
                <span className="font-bold text-sm">목표 성적</span>
                { /* 수정 버튼 @ */ }
                <button className="text-[10px] font-medium text-(--text-2) 
                                  border border-(--border) rounded-lg
                                  px-2 py-0.5 hover:bg-(--surface-2) transition-colors">
                  수정
                </button>
              </div>
              <div className="px-3.5 py-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] text-(--text-3)">목표 GPA</span>
                  <span className="text-xl font-bold text-(--accent) tabular-nums"
                        style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif", letterSpacing: '-.02em' }}>
                    4.2
                  </span>
                </div>

                <div className="flex justify-between text-[10px] text-(--text-2) mb-1">
                  <span>현재 <b className="text-(--text-1) tabular-nums">4.0</b></span>
                  <span>목표 <b className="text-(--accent) tabular-nums">4.2</b></span>
                </div>

                <div className="h-3 rounded-full bg-(--bar-track) overflow-hidden">
                  <div className="h-full rounded-full bg-(--bar)" style={{ width: '89%' }} />
                </div>

              </div>
              <div className="h-px bg-(--border)" />

              <div className="px-3.5 py-3">
                <p className="text-[10px] text-(--text-3) mb-2">이번 학기 과목별 목표</p>
                <div className="flex flex-col gap-1.5">
                  {/* 목표 성적 블럭 - 이번 학기 과목별.. (임시, 하드코딩) */}
                  {[
                    { name: '자료구조', badge: 'A+', type: 'must' },
                    { name: '알고리즘', badge: 'A0', type: 'must' },
                    { name: '이산수학', badge: 'A0', type: 'rec' },
                    { name: '영어회화', badge: 'B+', type: 'easy' },
                    { name: '인성과윤리', badge: 'B+', type: 'easy' },
                  ].map(row => (
                    <div key={row.name} className="flex items-center justify-between">
                      <span className={`text-[11px] font-medium ${row.type === 'must' 
                                        ? 'text-(--text-1)' : 'text-(--text-2)'}`}>
                        {row.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-px rounded-full text-[9px] font-semibold
                            ${row.type === 'must'
                            ? 'bg-(--warn-bg) text-(--warn-text)'
                            : row.type === 'rec'
                              ? 'bg-(--badge-neutral-bg) text-(--badge-neutral-text)'
                              : 'bg-(--surface-2) text-(--text-2) border border-(--border)'
                          }`}>
                          {row.badge}
                        </span>
                        <span className={`text-[9px] font-semibold
                          ${row.type === 'must' ? 'text-(--warn-text)'
                            : row.type === 'rec' ? 'text-(--text-3)' : 'text-(--text-3)'}`}>
                          {row.type === 'must' ? '필수' : row.type === 'rec' ? '권장' : '여유'}
                          {/* type 의 경우 user가 직접 수정 가능하게 변경하는 등 수정이 필요함 !! */}
                          {/* type: (임시, 하드코딩) */}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* 목표 성적 - alert (임시, 하드코딩) */}
                <div className="mt-2.5 px-2.5 py-1.5 bg-(--accent-bg) rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-(--accent) shrink-0" />
                  <span className="text-[10px] text-(--text-2)">
                    핵심 <b className="text-(--text-1)">2과목</b> 
                    &nbsp; A이상 &nbsp; → &nbsp; <b className="text-(--accent)">4.2 달성 가능</b>
                  </span>
                </div>
              </div>
              
            </div>

            {/* 커뮤니티 미리보기 블럭 */}
            <div className="bg-(--surface) rounded-xl border border-(--border) 
                            overflow-hidden flex flex-col flex-1"
                style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-3.5 py-3 border-b border-(--border) 
                              flex justify-between items-center shrink-0">
                <span className="font-bold text-sm">커뮤니티</span>

                { /* 더보기 버튼 @ */ }
                <button className="text-[10px] font-medium text-(--text-2)
                                  border border-(--border) rounded-lg
                                  px-2 py-0.5 hover:bg-(--surface-2) transition-colors">
                  더보기
                </button>
              </div>

              {/* 확인 - mock 데이터와 연결해둠 */}
              <div className="flex flex-col flex-1">
                {mockPosts.slice(0, 4).map((post, i) => (
                  <div key={post.id}
                      className={`flex items-center justify-between px-3.5 
                                  py-2.5 cursor-pointer
                                  hover:bg-(--surface-2) transition-colors
                                  ${i < 3 ? 'border-b border-(--border)' : ''}`}>
                                    {/* db key : id 로 div 구분해주고
                                        3개만 아래선 적용해서 layout 심플하게 구성 */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="px-1.5 py-px rounded-full text-[9px]
                                        font-semibold shrink-0
                                        bg-(--badge-neutral-bg) 
                                        text-(--badge-neutral-text)">
                          {POST_TAG[post.category] ?? post.category}

                          {/* const POST_TAG: Record<string, string> = {
                            GRADUATION: '졸업', JOB_HUNT: '취준',
                            DAILY: '자유', NOTICE: '공지',}; */}
                        </span>

                        <span className="text-[11px] font-medium text-(--text-1) truncate">
                          {post.title}
                        </span>
                      </div>

                      <p className="text-[10px] text-(--text-3)">
                        {post.author_name} · {timeAgo(post.enroll_date)}
                      </p>

                    </div>
                    <span className="text-[10px] text-(--text-3) shrink-0 ml-2">
                      댓글 {post.comment_count}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* #3열 : 이번 학기 수강 | 시간표 */}
          <div className="flex flex-col gap-3.5 h-full">

            {/* 이번 학기 수강 블럭 */}
            <div className="bg-(--surface) rounded-xl border 
                            border-(--border) overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-4 py-3 border-b border-(--border) flex 
                              justify-between items-center">
                <div>
                  <span className="font-bold text-[13px]">이번 학기 수강</span>
                  <span className="text-[11px] text-(--text-3) ml-2">3-1학기</span>
                </div>

                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                                bg-(--badge-neutral-bg) text-(--badge-neutral-text)">
                  13학점
                </span>
              </div>

              <div className="py-1.5">
                <div className="grid items-center px-4 py-2 text-[11px] 
                                text-(--text-3) font-semibold
                                border-b border-(--border) mb-0.5"
                    style={{ gridTemplateColumns: '9px 1fr auto auto', gap: '6px 10px' }}>
                  <span/>
                  <span>과목명</span> <span>구분</span>
                  <span className="text-right">학점</span>
                </div>
                {currentCourses.map(c => (
                  <div key={c.id}
                      className="grid items-center px-4 py-1.75 cursor-pointer
                                  hover:bg-(--surface-2) transition-colors"
                      style={{ gridTemplateColumns: '9px 1fr auto auto', gap: '4px 10px' }}>
                    <span className={`w-2 h-2 rounded-full 
                                      inline-block ${dotColor(c.category ?? '')}`} />

                    <span className="text-[12px] font-medium text-(--text-1)">{c.name}</span>
                    <span className="text-[10px] text-(--text-3)">{c.category}</span>
                    <span className="text-[12px] font-semibold text-(--text-1)
                                    text-right tabular-nums">{c.credit}</span>
                  </div>
                ))}
                <div className="px-4 py-2 border-t border-(--border) 
                                flex justify-between items-center mt-0.5">
                  <span className="text-[11px] text-(--text-3)">
                      {currentCourses.length}과목 
                  </span>

                  <span className="text-[11px] font-bold text-(--text-1)">
                    총 <span className="tabular-nums">
                      {currentCourses.reduce((s,c)=>s+c.credit,0)}</span>학점
                  </span>
                </div>
              </div>
            </div>

            {/* 시간표 블럭 */}
            <div className="bg-(--surface) rounded-xl border border-(--border)
                            overflow-hidden flex flex-col flex-1"
                style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-3.5 py-3 border-b border-(--border) flex
                            justify-between items-center shrink-0">
                <span className="font-bold text-[13px]">시간표</span>

                { /* 전체보기 버튼 @ */ }
                <button className="text-[10px] font-medium text-(--text-2) 
                                  border border-(--border) rounded-lg
                                  px-2 py-0.5 hover:bg-(--surface-2) transition-colors">
                  전체보기
                </button>
              </div>
              <div className="p-3 flex flex-col flex-1 min-h-0">
                <div className="grid grid-cols-5 gap-0.5 text-center text-[9px] font-bold
                                text-(--text-3) mb-1 shrink-0">
                  {['월','화','수','목','금'].map(d => <div key={d}>{d}</div>)}
                </div>

                {/* 시간표 데이터 - (임시, 하드코딩) */}
                <div className="grid gap-0.5 flex-1 min-h-45"
                    style={{ gridTemplateColumns: 'repeat(5,1fr)', 
                              gridTemplateRows: 'repeat(8,1fr)' }}>
                  {[
                    { col:1, row:'1/3', name:'자료구조', time:'09:00', type:'b' },
                    { col:1, row:'5/7', name:'영어회화', time:'13:00', type:'c' },
                    { col:2, row:'3/5', name:'알고리즘', time:'11:00', type:'p' },
                    { col:3, row:'1/3', name:'자료구조', time:'09:00', type:'b' },
                    { col:3, row:'4/6', name:'이산수학', time:'12:00', type:'p' },
                    { col:4, row:'3/5', name:'알고리즘', time:'11:00', type:'p' },
                    { col:4, row:'6/8', name:'인성과윤리', time:'14:00', type:'g' },
                    { col:5, row:'5/7', name:'영어회화', time:'13:00', type:'c' },
                  ].map((b, i) => (
                    <div key={i}
                        className="rounded text-[10px] whitespace-nowrap 
                                   leading-tight px-1.5 py-1"
                        style={{
                          gridColumn: b.col,
                          gridRow: b.row,
                          background: `var(--timetable-${b.type}-bg)`,
                          border: `1px solid var(--timetable-${b.type}-bd)`,
                          color: `var(--timetable-${b.type}-text)`,
                        }}>
                      <b>{b.name}</b><br/>
                      <span style={{ opacity: .7 }}>{b.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div> {/* #2열+3열 wrapper 닫기 */}

      </div>

      {/* ## 학점 이수 현황 (임시, 하드코딩) */}
      <div className="bg-(--surface) rounded-xl border 
                      border-(--border) overflow-hidden mt-3.5"
           style={{ boxShadow: 'var(--shadow-card)' }}>

        {/* 학점 이수 현황 상단 바 */}
        <div className="px-4.5 py-3 border-b border-(--border) 
                        flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[13px]">학점 이수 현황</span>
            <span className="text-[11px] text-(--text-2)">총 이수</span>
            <span className="text-xl font-bold tabular-nums text-(--text-1)"
                  style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif", 
                           letterSpacing: '-.01em' }}>80</span>
            <span className="text-[11px] text-(--text-3)">/ 140 학점</span>
            <div className="w-20 h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
              <div className="h-full rounded-full bg-(--bar)"
                   style={{ width: '57%' }}/>
            </div>
          </div>

          { /* 편집 버튼 @ */ }
          <button className="text-[10px] font-medium text-(--text-2) 
                            border border-(--border) px-2.5 py-1 
                            rounded-lg hover:bg-(--surface-2) transition-colors">
            편집
          </button>
        </div>

        <div className="p-4.5 flex flex-col gap-5">

          {/* ##1 전공학점 */}
          <div>

            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-(--text-1) inline-block"/>
                <span className="text-[12px] font-bold">전공학점</span>
                <span className="text-lg font-bold tabular-nums text-(--text-1)"
                      style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                          36
                </span>
                <span className="text-[10px] text-(--text-3)">/ 85 학점</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold
                               bg-(--warn-bg) text-(--warn-text) border border-(--border)">
                49학점 잔여
              </span>
            </div>
              
            {/* ##1-1, ##1-2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { label: '전공선택', earned: 20, required: 54, pct: 37 },
                { label: '전공필수', earned: 16, required: 31, pct: 52 },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between text-[10px] 
                                  text-(--text-2) mb-1.5">
                    <span>{row.label}</span>
                    <span>{row.earned}/{row.required} 학점</span>
                  </div>
                  <div className="h-6 rounded-full bg-(--bar-track) overflow-hidden">
                    <div className="h-full rounded-full bg-(--bar)" 
                         style={{ width: `${row.pct}%` }}/>
                  </div>
                  <p className="text-[9px] text-(--text-3) mt-1">
                    잔여 {row.required - row.earned}학점
                  </p>
                </div>
              ))}
            </div>

          </div>

          {/* ##2 교양학점 Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">

              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-(--text-2) inline-block"/>
                <span className="text-[12px] font-bold">교양학점</span>
                <span className="text-lg font-bold tabular-nums text-(--text-1)"
                      style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                      &nbsp; 40
                </span>
                <span className="text-[10px] text-(--text-3)">/ 42 학점</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold
                               bg-(--badge-neutral-bg) text-(--badge-neutral-text)
                               border border-(--border)">
                3학점 잔여
              </span>

            </div>

            {/* 교양학점 table (임시, 하드코딩) */}
            <div className="rounded-lg border border-(--border) overflow-hidden">
              <div className="grid text-[10px] font-semibold text-(--text-3)
                              px-3.5 py-2 bg-(--surface-2)"
                   style={{ gridTemplateColumns: '1fr 56px 56px 64px' }}>
                <span>영역</span>
                <span className="text-right">이수</span>
                <span className="text-right">기준</span>
                <span className="text-center">상태</span>
              </div>

              {[
                { name: '개신기초교양', earned: 4,  required: 4,  done: true  },
                { name: '사고와표현',   earned: 3,  required: 3,  done: true  },
                { name: '외국어',       earned: 4,  required: 4,  done: true  },
                { name: '사회문화이해', earned: 6,  required: 6,  done: true  },
                { name: '자연과학이해', earned: 2,  required: 3,  done: false },
                { name: '예술체육',     earned: 3,  required: 2,  done: true  },
                { name: '자유교양',     earned: 18, required: 20, done: false },
               ].map(area => (
                <div key={area.name}
                     className="grid items-center px-3.5 py-2 border-t 
                                border-(--border) text-[11px]"
                     style={{ gridTemplateColumns: '1fr 56px 56px 64px' }}>
                  <span className="text-(--text-1)">{area.name}</span>
                  <span className="text-right font-bold tabular-nums text-(--text-1)">
                    {area.earned}
                  </span>
                  <span className="text-right text-(--text-3)">{area.required}학점</span>
                  <span className="text-center">
                    {area.done
                      ? <span className="px-1.5 py-px rounded-full text-[9px] font-semibold
                              bg-(--badge-neutral-bg) text-(--badge-neutral-text)">완료</span>
                      : <span className="px-1.5 py-px rounded-full text-[9px] font-semibold
                                         bg-(--warn-bg) text-(--warn-text)">
                          {area.required - area.earned}학점↓
                        </span>
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Dashboard;

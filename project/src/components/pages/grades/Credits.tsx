
import { mockCourses, mockGradReqs } from '../../../data/mock';


// 졸업 인증 항목 (임시, 하드코딩)
const GRAD_CERTS = [
  { label: '영어 공인 성적', req: '토익 700+',      done: false },
  { label: '한국사 인증',    req: '한국사 4급 이상', done: true  },
  { label: 'SW 코딩 인증',  req: '코딩테스트 2급',  done: false },
  { label: '봉사 활동',     req: '30시간 이상',     done: false },
];

// 교양 영역별 현황 
//  (임시, 하드코딩 : mock데이터 부족 => 엑셀파싱 데이터와 나중에 연결!)
const LIBERAL_AREAS = [
  { name: '개신기초교양', earned: 4,  required: 4  },
  { name: '사고와표현',   earned: 3,  required: 3  },
  { name: '외국어',       earned: 4,  required: 4  },
  { name: '사회문화이해', earned: 6,  required: 6  },
  { name: '자연과학이해', earned: 2,  required: 3  },
  { name: '예술체육',     earned: 3,  required: 2  },
  { name: '자유교양',     earned: 18, required: 20 },
];

const TOTAL_GRAD_CR = 140; // 졸업 필요 총학점 (임시, 하드코딩)


function Credits() {

  // mock 데이터 계산 (임시)
  const doneCourses  = mockCourses.filter(c => c.grade_points !== null); // 0 수강한 강의
  const earnedCr     = doneCourses.reduce((s, c) => s + c.credit, 0);    // 현재 학점 누적
  const gradPct      = Math.round((earnedCr / TOTAL_GRAD_CR) * 100);     // 현재학점 / 졸업기준학점 (%)

  const majorDone    = doneCourses.filter(c => c.division === '전공');    // #1 수강한 강의-전공
  const majorEarned  = majorDone.reduce((s, c) => s + c.credit, 0);       // #a 총 전공학점 누적

  const majorMustEarned = doneCourses.filter(
c => c.category === '전공필수'
  ).reduce((s,c) => s+c.credit, 0); // #a 이수 전공<필수> 학점 누적
  const majorMustReq = mockGradReqs.find(r => r.area === '전공필수')!.required; // #b 전공<필수> 기준학점
  const majorElecEarned = doneCourses.filter(
    c => c.category === '전공선택'
  ).reduce((s,c) => s+c.credit, 0); // #a 이수 전공<선택> 학점 누적 
  const majorElecReq = mockGradReqs.find(r => r.area === '전공선택')!.required; // #b 전공<선택> 기준학점
  const majorReq = majorElecReq + majorMustReq; // #b 전공 졸업기준학점

  const liberalDone  = doneCourses.filter(c => c.division === '교양');  // #1 수강한 강의-교양
  const liberalEarned = liberalDone.reduce((s, c) => s + c.credit, 0);  // #a 총 교양학점 누적
  const liberalReq = mockGradReqs.find(r => r.area === '교양필수')!.required  // #b 교양필수 졸업기준학점
                   + mockGradReqs.find(r => r.area === '교양선택')!.required; // #c 교양선택 졸업기준학점


  // SVG 도넛 차트 계산 (임시.. 연결할때 다시 보기. 애니메이션 추가하고 svg 그대로 감.)
  const r   = 44;
  const circ = Math.round(2 * Math.PI * r);
  const offset = Math.round(circ * (1 - gradPct / 100));

  const incompleteCerts = GRAD_CERTS.filter(c => !c.done).length; // 임시: 미충족 졸업요건


  return (
    <>
    <div className="p-3.5 pb-15 w-full">

      {/* # alert 섹션 (임시, 하드코딩) */}
      <div className="flex items-center justify-between flex-wrap gap-2
                      px-3.5 py-2.5 rounded-xl mb-3 text-xs"
           style={{ background: 'var(--alert-warn-bg)',
                    border: '1px solid var(--alert-border)', 
                    opacity: .9 }}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold" 
                style={{ color: 'var(--alert-warn)' }}>
            이수 잔여 항목
          </span>
          <span className="text-(--text-2)">
            전공필수 {majorMustReq - majorMustEarned}
            학점 · 전공선택 {majorElecReq - majorElecEarned}학점
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
              style={{ background: 'var(--alert-warn-bg)', 
                       color: 'var(--alert-warn)', 
                       borderColor: 'var(--alert-warn)' }}>
          총 {TOTAL_GRAD_CR - earnedCr}학점 잔여
        </span>
      </div>

      {/* #1 상단 블럭 집합 */}
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 mb-4">

          {/* #1-1 졸업 달성률 블럭 */}
          <div className="bg-(--surface) rounded-xl border border-(--border) 
                          p-5 flex flex-col items-center"
              style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-[11px] font-semibold text-(--text-3) mb-3">졸업 달성률</p>

            {/* 도넛 그래프 */}
            <svg viewBox="0 0 110 110" style={{ width: 110 }}>
              <circle cx="55" cy="55" r={r} fill="none" stroke="var(--bar-track)" strokeWidth="10"/>
              <circle cx="55" cy="55" r={r} fill="none" stroke="var(--bar)" strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={circ} strokeDashoffset={offset}
                      transform="rotate(-90 55 55)"/>
              <text x="55" y="51" textAnchor="middle" fontSize={22} fontWeight={700}
                    fill="var(--accent)" fontFamily="Bricolage Grotesque, Inter">
                {gradPct}%
              </text>
              <text x="55" y="64" textAnchor="middle" fontSize={9}
                    fill="var(--text-3)" fontFamily="Inter">
                {earnedCr} / {TOTAL_GRAD_CR}학점
              </text>
            </svg>

              
             {/* 도넛 그래프 밑 세부정보 섹션 */}
            <div className="mt-3.5 w-full flex flex-col gap-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-(--text-3)">이수</span>
                <b className="tabular-nums text-(--text-1)">{earnedCr}학점</b>
              </div>

              <div className="h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
                <div className="h-full rounded-full bg-(--bar)" style={{ width: `${gradPct}%` }}/>
              </div> {/* 간단한 div 그래프 */}

              <div className="flex justify-between text-[11px]">
                <span className="text-(--text-3)">잔여</span>
                <b className="tabular-nums text-(--accent)">
                  {TOTAL_GRAD_CR - earnedCr}학점
                </b>
              </div>

              
              <div className="h-px bg-(--border) my-0.5"/>
                <div className="flex justify-between text-[11px]">
                  <span className="text-(--text-3)">전공</span>
                  <span className="tabular-nums">
                    <b className="text-(--text-1)">{majorEarned}</b>
                    <span className="text-(--text-3)">/{majorReq}</span>
                  </span>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span className="text-(--text-3)">교양</span>
                  <span className="tabular-nums">
                    <b className="text-(--text-1)">{liberalEarned}</b>
                    <span className="text-(--text-3)">/{liberalReq}</span>
                  </span>
                </div>

                <div className="flex justify-between text-[11px] items-center">
                  <span className="text-(--text-3)">졸업인증</span>
                  <span className="px-1.5 py-px rounded-full text-[9px] font-semibold
                                  bg-(--warn-bg) text-(--warn-text) border border-(--border)">
                    미완료
                  </span>
                </div>

            </div>
          </div>

          {/* #1-2 전공/교양 학점분석 블럭 */}
          <div className="flex flex-col gap-3.5">

            {/* #1-2A 전공 카드 */}
            <div className="bg-(--surface) rounded-xl border 
                            border-(--border) overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}>
               
              {/* 전공 블럭 헤더 */}
              <div className="px-4.5 py-3 border-b border-(--border) 
                              flex justify-between items-center">
                                
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[13px]">전공</span>
                  <span className="text-xl font-bold tabular-nums text-(--text-1)"
                        style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                    {majorEarned}
                  </span>
                  <span className="text-[11px] text-(--text-3)">/ {majorReq} 학점</span>
                  <div className="w-20 h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
                    <div className="h-full rounded-full bg-(--bar)"
                        style={{ width: `${Math.min(100, (majorEarned / majorReq) * 100)}%` }}
                     />
                    </div>
                </div> 
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold
                                bg-(--warn-bg) text-(--warn-text) border border-(--border)">
                    {majorReq - majorEarned}학점 잔여
                </span>
                
              </div>
              
              {/* 전공 table 헤더 */}
              <div className="grid px-4.5 py-2 text-[10px] font-semibold text-(--text-3)
                              border-b border-(--border)"
                  style={{ gridTemplateColumns: '10px 1fr 80px 80px 1fr', gap: '0 8px' }}>
                <span/><span>영역</span>
                <span className="text-right">이수</span>
                <span className="text-right">기준</span>
                <span className="pl-3">진행률</span>
              </div>

              {/* 전공 table 내용 (mock data 형식에 따라 처리) */}
                {[
                  { label: '전공필수', earned: majorMustEarned, required: majorMustReq },
                  { label: '전공선택', earned: majorElecEarned, required: majorElecReq },
                ].map(row => (
                  <div key={row.label}
                      className="grid px-4.5 py-2.5 items-center 
                                border-b border-(--border) last:border-none"
                      style={{ gridTemplateColumns: '10px 1fr 80px 80px 1fr', gap: '0 8px' }}>

                    <span className="w-1.5 h-1.5 rounded-full bg-(--text-2) inline-block"/>

                    <span className="text-[12px]">{row.label}</span>
                    <span className="text-right text-[12px] font-bold tabular-nums text-(--text-1)">
                      {row.earned}
                    </span>

                    <span className="text-right text-[11px] text-(--text-3)">
                      {row.required}학점
                    </span>

                    <div className="pl-3">
                      <div className="h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
                        <div className="h-full rounded-full bg-(--bar)"
                             style={{ width: `${Math.min(100, (row.earned/row.required)*100)}%` }}
                         />
                      </div>
                    </div>

                  </div>
                ))}
            </div>

            {/* #1-2B 교양 카드 */}
            <div className="bg-(--surface) rounded-xl border 
                            border-(--border) overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}>

              {/* 교양 블럭 헤더 */}
              <div className="px-4.5 py-3 border-b border-(--border) 
                              flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[13px]">교양</span>
                  <span className="text-xl font-bold tabular-nums text-(--text-1)"
                        style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                    {liberalEarned}
                  </span>
                  <span className="text-[11px] text-(--text-3)">/ {liberalReq} 학점</span>

                  <div className="w-20 h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
                    <div className="h-full rounded-full bg-(--bar)"
                        style={{ width: `${Math.min(100, (liberalEarned/liberalReq)*100)}%` }}
                     />
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold
                                bg-(--badge-neutral-bg) text-(--badge-neutral-text) 
                                border border-(--border)">
                  거의 완료
                </span>
              </div>

              {/* 교양 table 헤더 */}
              <div className="grid px-4.5 py-2 text-[10px] font-semibold 
                              text-(--text-3) border-b border-(--border)"
                  style={{ gridTemplateColumns: '1fr 60px 60px 70px', gap: '0 4px' }}>
                <span>영역</span>
                <span className="text-right">이수</span>
                <span className="text-right">기준</span>
                <span className="text-center">상태</span>
              </div>

              {/* 교양 영역별 행 (임시, 하드코딩) */}
              {LIBERAL_AREAS.map(area => {
                const done = area.earned >= area.required;
                const diff = area.required - area.earned;

                return (
                  <div key={area.name}
                      className="grid px-4.5 py-2.5 items-center border-b 
                                 border-(--border) last:border-none text-[12px]"
                      style={{ gridTemplateColumns: '1fr 60px 60px 70px', gap: '0 4px' }}>
                    <span className="text-(--text-1)">{area.name}</span>
                    <span className="text-right font-bold tabular-nums text-(--text-1)">
                        {area.earned}
                    </span>
                    <span className="text-right text-(--text-3)">{area.required}학점</span>
                    <span className="text-center">
                      {done
                        ? <span className="px-1.5 py-px rounded-full text-[9px] font-semibold
                                          bg-(--badge-neutral-bg) text-(--badge-neutral-text)">
                           완료 {diff < 0 && (<>&nbsp; +{-1*diff}학점</>)}
                          </span>
                        : <span className="px-1.5 py-px rounded-full text-[9px] font-semibold
                                          bg-(--warn-bg) text-(--warn-text)">
                          {diff}학점↓
                          </span>
                      }
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
          
      </div>

      {/* #2 졸업요건현황 */}
      <div className="grid gap-4 mb-4">

        {/* 졸업 인증 현황 */}
        <div className="bg-(--surface) rounded-xl border
                        border-(--border) overflow-hidden"
            style={{ boxShadow: 'var(--shadow-card)' }}>
          
          {/* 블럭 헤더 */}
          <div className="flex px-4.5 py-3 border-b border-(--border) 
                          justify-between items-center">
            <span className="font-bold text-[13px]">졸업 요건 현황</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold
                            bg-(--warn-bg) text-(--warn-text) border border-(--border)">
              {incompleteCerts}개 미완료
            </span>
          </div>

          {/* 졸업 요건들 (임시, 하드코딩) => 연결: 버튼 클릭하면 졸업요건 done true<=>false 전환 @*/}
          <div className="grid grid-cols-4 gap-2 mb-3 px-4">
            {GRAD_CERTS.map((cert) => (
              <div key={cert.label} 
                   className="mt-4 bg-(--inner-bg-2) rounded-xl p-3 cursor-pointer hover:shadow-md
                                transition-shadow border border-(--border)">
                <p className="text-[10px] font-semibold text-(--text-3) mb-1.5">
                  {cert.label}
                </p>
                <p className={`text-[12px] font-bold mb-2 
                              ${cert.done ? 'text-(--text-1)' : 'text-(--text-2)'}`}>
                  {cert.req}
                </p>

                {cert.done
                  ? <span className="px-1.5 rounded-full text-[9px] font-semibold
                                    bg-(--badge-neutral-bg) text-(--badge-neutral-text)">
                                      완료
                    </span>
                  : <span className="px-1.5 rounded-full text-[9px] font-semibold
                                    bg-(--warn-bg) text-(--warn-text)">
                                      미완료
                    </span>
                }
              </div>
            ))}
          </div>
        </div>
      </div> 
    </div>

    </>
  );
}

export default Credits;

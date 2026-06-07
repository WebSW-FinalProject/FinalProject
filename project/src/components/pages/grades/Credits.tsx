import { useGradeData } from '../../../hooks/useGradeData';


// 졸업 인증 항목 (임시, 하드코딩)
const GRAD_CERTS = [
  { label: '영어 공인 성적', req: '토익 700+',      done: false },
  { label: '한국사 인증',    req: '한국사 4급 이상', done: true  },
  { label: 'SW 코딩 인증',  req: '코딩테스트 2급',  done: false },
  { label: '봉사 활동',     req: '30시간 이상',     done: false },
];

const TOTAL_GRAD_CR = 140;

function Credits() {
  const { courses, gradReqs, loading, error } = useGradeData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-(--text-3) text-sm">
        불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-(--alert-warn) text-sm">
        {error}
      </div>
    );
  }

  // 성적 있는 과목만 (F 제외)
  const doneCourses = courses.filter(c => c.grade && c.grade !== 'F');
  const earnedCr    = doneCourses.reduce((s, c) => s + c.credit, 0);
  const gradPct     = Math.round((earnedCr / TOTAL_GRAD_CR) * 100);

  // 전공
  const majorMustEarned = doneCourses.filter(c => c.category === '전공필수').reduce((s,c)=>s+c.credit,0);
  const majorElecEarned = doneCourses.filter(c => c.category === '전공선택').reduce((s,c)=>s+c.credit,0);
  const majorEarned     = majorMustEarned + majorElecEarned;
  const majorMustReq    = gradReqs.find(r => r.area === '전공필수')?.required ?? 60;
  const majorElecReq    = gradReqs.find(r => r.area === '전공선택')?.required ?? 30;
  const majorReq        = majorMustReq + majorElecReq;

  // 교양 4분야
  const LIBERAL_AREAS = ['개신기초교양', '자연이공계기초과학', '일반교양', '확대교양'];
  const liberalAreaRows = LIBERAL_AREAS.map(name => ({
    name,
    earned: doneCourses.filter(c => c.area === name).reduce((s,c) => s+c.credit, 0),
    required: gradReqs.find(r => r.area === name)?.required ?? 0,
  }));

  // 교양
  const liberalEarned = liberalAreaRows.reduce((s,r) => s+r.earned, 0);
  const liberalMustReq = gradReqs.find(r => r.area === '교양필수')?.required ?? 18;
  const liberalElecReq = gradReqs.find(r => r.area === '교양선택')?.required ?? 12;
  const liberalReq     = liberalMustReq + liberalElecReq;

  // SVG 도넛
  const r     = 44;
  const circ  = Math.round(2 * Math.PI * r);
  const offset = Math.round(circ * (1 - gradPct / 100));

  const incompleteCerts = GRAD_CERTS.filter(c => !c.done).length;

  return (
    <>
    <div className="p-3.5 pb-15 w-full">

      {/* alert */}
      <div className="flex items-center justify-between flex-wrap gap-2
                      px-3.5 py-2.5 rounded-xl mb-3 text-xs"
           style={{ background: 'var(--alert-warn-bg)',
                    border: '1px solid var(--alert-border)',
                    opacity: .9 }}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold" style={{ color: 'var(--alert-warn)' }}>
            이수 잔여 항목
          </span>
          <span className="text-(--text-2)">
            전공필수 {Math.max(0, majorMustReq - majorMustEarned)}학점
            · 전공선택 {Math.max(0, majorElecReq - majorElecEarned)}학점
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
              style={{ background: 'var(--alert-warn-bg)',
                       color: 'var(--alert-warn)',
                       borderColor: 'var(--alert-warn)' }}>
          총 {Math.max(0, TOTAL_GRAD_CR - earnedCr)}학점 잔여
        </span>
      </div>

      {/* 상단 블럭 집합 */}
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 mb-4">

        {/* 졸업 달성률 */}
        <div className="bg-(--surface) rounded-xl border border-(--border) p-5 flex flex-col items-center"
             style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-[11px] font-semibold text-(--text-3) mb-3">졸업 달성률</p>
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

          <div className="mt-3.5 w-full flex flex-col gap-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-(--text-3)">이수</span>
              <b className="tabular-nums text-(--text-1)">{earnedCr}학점</b>
            </div>
            <div className="h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
              <div className="h-full rounded-full bg-(--bar)" style={{ width: `${gradPct}%` }}/>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-(--text-3)">잔여</span>
              <b className="tabular-nums text-(--accent)">{Math.max(0, TOTAL_GRAD_CR - earnedCr)}학점</b>
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

        {/* 전공/교양 학점분석 */}
        <div className="flex flex-col gap-3.5">

          {/* 전공 카드 */}
          <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="px-4.5 py-3 border-b border-(--border) flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-[13px]">전공</span>
                <span className="text-xl font-bold tabular-nums text-(--text-1)"
                      style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                  {majorEarned}
                </span>
                <span className="text-[11px] text-(--text-3)">/ {majorReq} 학점</span>
                <div className="w-20 h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
                  <div className="h-full rounded-full bg-(--bar)"
                       style={{ width: `${Math.min(100, (majorEarned/majorReq)*100)}%` }}/>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border
                ${majorEarned >= majorReq
                  ? 'bg-(--badge-neutral-bg) text-(--badge-neutral-text) border-(--border)'
                  : 'bg-(--warn-bg) text-(--warn-text) border-(--border)'}`}>
                {majorEarned >= majorReq ? '완료' : `${majorReq - majorEarned}학점 잔여`}
              </span>
            </div>

            <div className="grid px-4.5 py-2 text-[10px] font-semibold text-(--text-3)
                            border-b border-(--border)"
                 style={{ gridTemplateColumns: '10px 1fr 80px 80px 1fr', gap: '0 8px' }}>
              <span/><span>영역</span>
              <span className="text-right">이수</span>
              <span className="text-right">기준</span>
              <span className="pl-3">진행률</span>
            </div>

            {[
              { label: '전공필수', earned: majorMustEarned, required: majorMustReq },
              { label: '전공선택', earned: majorElecEarned, required: majorElecReq },
            ].map(row => (
              <div key={row.label}
                   className="grid px-4.5 py-2.5 items-center border-b border-(--border) last:border-none"
                   style={{ gridTemplateColumns: '10px 1fr 80px 80px 1fr', gap: '0 8px' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-(--text-2) inline-block"/>
                <span className="text-[12px]">{row.label}</span>
                <span className="text-right text-[12px] font-bold tabular-nums text-(--text-1)">{row.earned}</span>
                <span className="text-right text-[11px] text-(--text-3)">{row.required}학점</span>
                <div className="pl-3">
                  <div className="h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
                    <div className="h-full rounded-full bg-(--bar)"
                         style={{ width: `${Math.min(100, (row.earned/row.required)*100)}%` }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 교양 카드 */}
          <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="px-4.5 py-3 border-b border-(--border) flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-[13px]">교양</span>
                <span className="text-xl font-bold tabular-nums text-(--text-1)"
                      style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                  {liberalEarned}
                </span>
                <span className="text-[11px] text-(--text-3)">/ {liberalReq} 학점</span>
                <div className="w-20 h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
                  <div className="h-full rounded-full bg-(--bar)"
                       style={{ width: `${Math.min(100, (liberalEarned/liberalReq)*100)}%` }}/>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border
                ${liberalEarned >= liberalReq
                  ? 'bg-(--badge-neutral-bg) text-(--badge-neutral-text) border-(--border)'
                  : 'bg-(--warn-bg) text-(--warn-text) border-(--border)'}`}>
                {liberalEarned >= liberalReq ? '완료' : `${liberalReq - liberalEarned}학점 잔여`}
              </span>
            </div>

            <div className="grid px-4.5 py-2 text-[10px] font-semibold text-(--text-3)
                            border-b border-(--border)"
                 style={{ gridTemplateColumns: '10px 1fr 80px 80px 1fr', gap: '0 8px' }}>
              <span/><span>영역</span>
              <span className="text-right">이수</span>
              <span className="text-right">기준</span>
              <span className="pl-3">진행률</span>
            </div>

            {liberalAreaRows.map(row => (
              <div key={row.name}
                   className="grid px-4.5 py-2.5 items-center border-b border-(--border) last:border-none"
                   style={{ gridTemplateColumns: '10px 1fr 80px 80px 1fr', gap: '0 8px' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-(--text-2) inline-block"/>
                <span className="text-[12px]">{row.name}</span>
                <span className="text-right text-[12px] font-bold tabular-nums text-(--text-1)">{row.earned}</span>
                <span className="text-right text-[11px] text-(--text-3)">
                  {row.required > 0 ? `${row.required}학점` : '-'}
                </span>
                <div className="pl-3">
                  <div className="h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
                    <div className="h-full rounded-full bg-(--bar)"
                         style={{ width: `${row.required > 0 ? Math.min(100, (row.earned/row.required)*100) : 0}%` }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* 졸업요건현황 */}
      <div className="grid gap-4 mb-4">
        <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
             style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex px-4.5 py-3 border-b border-(--border) justify-between items-center">
            <span className="font-bold text-[13px]">졸업 요건 현황</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold
                            bg-(--warn-bg) text-(--warn-text) border border-(--border)">
              {incompleteCerts}개 미완료
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3 px-4">
            {GRAD_CERTS.map((cert) => (
              <div key={cert.label}
                   className="mt-4 bg-(--inner-bg-2) rounded-xl p-3 cursor-pointer
                              hover:shadow-md transition-shadow border border-(--border)">
                <p className="text-[10px] font-semibold text-(--text-3) mb-1.5">{cert.label}</p>
                <p className={`text-[12px] font-bold mb-2 ${cert.done ? 'text-(--text-1)' : 'text-(--text-2)'}`}>
                  {cert.req}
                </p>
                {cert.done
                  ? <span className="px-1.5 rounded-full text-[9px] font-semibold
                                    bg-(--badge-neutral-bg) text-(--badge-neutral-text)">완료</span>
                  : <span className="px-1.5 rounded-full text-[9px] font-semibold
                                    bg-(--warn-bg) text-(--warn-text)">미완료</span>
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

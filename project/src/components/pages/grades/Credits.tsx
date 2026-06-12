import { API_BASE } from '../../../api';
import { useState, useEffect, useRef } from 'react';
import { useGradeData } from '../../../hooks/useGradeData';
import { useLang } from '../../../LangContext';


// graduation_status 항목 타입 (졸업 요건 현황 — 유저 직접 추가로 한정.)
interface CertItem {
  id: number;
  todo_type: string;    // 항목명 (예: '토익 기준 성적')
  todo_detail: string;  // 기준 내용 (예: '토익 700+')
  note: string | null;  // 'done' = 완료 | null = 미완료
}


function Credits() {
  const { courses, gradReqs, loading, error } = useGradeData();
  const { t } = useLang();

  // 졸업 요건 현황 (graduation_status 테이블)
  const [certItems, setCertItems]     = useState<CertItem[]>([]);
  const [certLoading, setCertLoading] = useState(true);
  const [addOpen, setAddOpen]         = useState(false);
  const [newType, setNewType]         = useState('');
  const [newDetail, setNewDetail]     = useState('');

  // 졸업 요건 현황 로드 (api/grad/status)
  async function loadCerts() {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`${API_BASE}/api/graduation/status`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) setCertItems(await res.json());
    } catch (e) {
      console.error('졸업 요건 현황 로드 실패:', e);
    } finally {
      setCertLoading(false);
    }
  }

  useEffect(() => { loadCerts(); }, []);

  // 프로그레스바 · 도넛  애니메이션(수업내용 외 내용: AI 도움)
  const [barReady, setBarReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBarReady(false); // 데이터 바뀔 때마다 초기화
    timerRef.current = setTimeout(() => setBarReady(true), 60);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [courses, gradReqs]);

  // 전체 항목 저장 (replace-all — 토글/추가/삭제 모두 이 함수로 처리)
  async function saveCerts(items: CertItem[]) {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`${API_BASE}/api/graduation/status`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            todo_type: i.todo_type,
            todo_detail: i.todo_detail,
            note: i.note ?? null,
          })),
        }),
      });
      if (res.ok) setCertItems(await res.json());
    } catch (e) {
      console.error('졸업 요건 현황 저장 실패:', e);
    }
  }

  // 완료/미완료 토글 (note === 'done' 이면 완료)
  async function toggleDone(item: CertItem) {
    const updated = certItems.map(c =>
      c.id === item.id ? { ...c, note: c.note === 'done' ? null : 'done' } : c
    );
    await saveCerts(updated);
  }

  // 항목 삭제
  async function deleteItem(item: CertItem) {
    const updated = certItems.filter(c => c.id !== item.id);
    await saveCerts(updated);
  }

  // 항목 추가
  async function addItem() {
    if (!newType.trim() || !newDetail.trim()) return;
    const updated = [
      ...certItems,
      { id: 0, todo_type: newType.trim(), todo_detail: newDetail.trim(), note: null },
    ];
    await saveCerts(updated);
    setNewType('');
    setNewDetail('');
    setAddOpen(false);
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-(--text-3) text-sm">
        {t('loading')}
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

  // 성적 있는 과목만 (F 제외, grade_points는 DB에 null이므로 grade 문자열로 판단)
  const doneCourses = courses.filter(c => c.grade && c.grade !== 'F');
  const earnedCr    = doneCourses.reduce((s, c) => s + c.credit, 0);
  const gradTotal   = gradReqs.find(r => r.area === '총졸업')?.required ?? 0;
  const gradPct     = gradTotal > 0 ? Math.round((earnedCr / gradTotal) * 100) : 0;

  // 전공
  const majorMustEarned = doneCourses.filter(c => c.category === '전공필수').reduce((s,c)=>s+c.credit,0);
  const majorElecEarned = doneCourses.filter(c => c.category === '전공선택').reduce((s,c)=>s+c.credit,0);
  const majorEarned     = majorMustEarned + majorElecEarned;
  const majorMustReq    = gradReqs.find(r => r.area === '전공필수')?.required ?? 0;
  const majorElecReq    = gradReqs.find(r => r.area === '전공선택')?.required ?? 0;
  const majorReq        = majorMustReq + majorElecReq;

  // 교양 4분야
  const LIBERAL_AREAS = ['개신기초교양', '자연이공계기초과학', '일반교양', '확대교양'];
  const liberalAreaRows = LIBERAL_AREAS.map(name => ({
    name,
    earned: doneCourses.filter(c => c.area === name).reduce((s,c) => s+c.credit, 0),
    required: gradReqs.find(r => r.area === name)?.required ?? 0,
  }));

  // 교양 — 4분야 합산 (Credits.tsx 팀원 코드 수정: '교양필수'/'교양선택' key는 DB에 없음)
  const liberalEarned   = liberalAreaRows.reduce((s,r) => s+r.earned, 0);
  const liberalReq      = liberalAreaRows.reduce((s,r) => s+r.required, 0);
  // 완료: 각 분야 모두 기준 달성했을 때만
  const liberalComplete = liberalAreaRows.every(r => !r.required || r.earned >= r.required);

  // SVG 도넛
  const r     = 44;
  const circ  = Math.round(2 * Math.PI * r);
  const offset = Math.round(circ * (1 - gradPct / 100));

  // 미완료 항목 수 (note !== 'done')
  const incompleteCerts = certItems.filter(c => c.note !== 'done').length;

  // alert용 잔여학점 항목 — gradReqs 전체에서 동적으로 계산 (총졸업 제외)
  const alertItems = gradReqs
    .filter(r => r.area !== '총졸업' && r.required > 0)
    .map(r => {
      let earned = 0;
      if (r.area === '전공필수')      earned = majorMustEarned;
      else if (r.area === '전공선택') earned = majorElecEarned;
      else earned = doneCourses.filter(c => c.area === r.area).reduce((s, c) => s + c.credit, 0);
      return { area: r.area, remaining: Math.max(0, r.required - earned) };
    })
    .filter(r => r.remaining > 0);

  // 바 너비 계산
  function barW(earned: number, required: number) {
    if (!required) return '0%';
    return barReady ? `${Math.min(100, (earned / required) * 100)}%` : '0%';
  }

  return (
    <>
    <div className="p-3.5 pb-15 w-full">

      {/* alert — 잔여 항목 있을 때만 표시 */}
      {alertItems.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2 card-enter
                        px-3.5 py-2.5 rounded-xl mb-3 text-xs"
             style={{ background: 'var(--alert-warn-bg)',
                      border: '1px solid var(--alert-border)',
                      opacity: .9 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-semibold" style={{ color: 'var(--alert-warn)' }}>
              {t('credRemaining')}
            </span>
            <span className="text-(--text-2)">
              {alertItems.map((item, i) => (
                <span key={item.area}>
                  {i > 0 && ' · '}
                  {item.area} {item.remaining}{t('credCrUnit')}
                </span>
              ))}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                style={{ background: 'var(--alert-warn-bg)',
                         color: 'var(--alert-warn)',
                         borderColor: 'var(--alert-warn)' }}>
            {Math.max(0, gradTotal - earnedCr)}{t('credCrLeft')}
          </span>
        </div>
      )}

      {/* 상단 블럭 집합 */}
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 mb-4">

        {/* 졸업 달성률 */}
        <div className="bg-(--surface) rounded-xl border border-(--border) p-5 
                        flex flex-col items-center card-enter stagger-1"
             style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-[11px] font-semibold text-(--text-3) mb-3">{t('credGradProgress')}</p>
          <svg viewBox="0 0 110 110" style={{ width: 110 }}>
            <circle cx="55" cy="55" r={r} fill="none" stroke="var(--bar-track)" strokeWidth="10"/>
            <circle cx="55" cy="55" r={r} fill="none" stroke="var(--bar)" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={barReady ? offset : circ}
                    style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)' }}
                    transform="rotate(-90 55 55)"/>
            <text x="55" y="51" textAnchor="middle" fontSize={22} fontWeight={700}
                  fill="var(--accent)" fontFamily="Bricolage Grotesque, Inter">
              {gradPct}%
            </text>
            <text x="55" y="64" textAnchor="middle" fontSize={9}
                  fill="var(--text-3)" fontFamily="Inter">
              {earnedCr} / {gradTotal}{t('credCrUnit')}
            </text>
          </svg>

          <div className="mt-3.5 w-full flex flex-col gap-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-(--text-3)">{t('credEarned')}</span>
              <b className="tabular-nums text-(--text-1)">{earnedCr}{t('credCrUnit')}</b>
            </div>
            <div className="h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
              <div className="h-full rounded-full bg-(--bar)"
                   style={{ width: barW(earnedCr, gradTotal),
                            transition: 'width 1.1s cubic-bezier(.4,0,.2,1)' }}/>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-(--text-3)">{t('credLeft')}</span>
              <b className="tabular-nums text-(--accent)">{Math.max(0, gradTotal - earnedCr)}{t('credCrUnit')}</b>
            </div>
            <div className="h-px bg-(--border) my-0.5"/>
            <div className="flex justify-between text-[11px]">
              <span className="text-(--text-3)">{t('credMajor')}</span>
              <span className="tabular-nums">
                <b className="text-(--text-1)">{majorEarned}</b>
                <span className="text-(--text-3)">/{majorReq}</span>
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-(--text-3)">{t('credLiberal')}</span>
              <span className="tabular-nums">
                <b className="text-(--text-1)">{liberalEarned}</b>
                <span className="text-(--text-3)">/{liberalReq}</span>
              </span>
            </div>
            <div className="flex justify-between text-[11px] items-center">
              <span className="text-(--text-3)">{t('credGradCert')}</span>
              <span className={`px-1.5 py-px rounded-full text-[9px] font-semibold border border-(--border)
                ${incompleteCerts === 0
                  ? 'bg-(--badge-neutral-bg) text-(--badge-neutral-text)'
                  : 'bg-(--warn-bg) text-(--warn-text)'}`}>
                {incompleteCerts === 0 ? t('credDone') : t('credIncomplete')}
              </span>
            </div>
          </div>
        </div>

        {/* 전공/교양 학점분석 */}
        <div className="flex flex-col gap-3.5 card-enter stagger-2">

          {/* 전공 카드 */}
          <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="px-4.5 py-3 border-b border-(--border) flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-[13px]">{t('credMajorSection')}</span>
                <span className="text-xl font-bold tabular-nums text-(--text-1)"
                      style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                  {majorEarned}
                </span>
                <span className="text-[11px] text-(--text-3)">/ {majorReq} {t('credCrUnit')}</span>
                <div className="w-20 h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
                  <div className="h-full rounded-full bg-(--bar)"
                       style={{ width: barW(majorEarned, majorReq),
                                transition: 'width 1.1s cubic-bezier(.4,0,.2,1)' }}/>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border
                ${majorEarned >= majorReq
                  ? 'bg-(--badge-neutral-bg) text-(--badge-neutral-text) border-(--border)'
                  : 'bg-(--warn-bg) text-(--warn-text) border-(--border)'}`}>
                {majorEarned >= majorReq ? t('credDone') : `${majorReq - majorEarned}${t('credCrLeft')}`}
              </span>
            </div>

            <div className="grid px-4.5 py-2 text-[10px] font-semibold text-(--text-3)
                            border-b border-(--border)"
                 style={{ gridTemplateColumns: '10px 1fr 80px 80px 1fr', gap: '0 8px' }}>
              <span/><span>{t('credArea')}</span>
              <span className="text-right">{t('credEarnedCol')}</span>
              <span className="text-right">{t('credReqCol')}</span>
              <span className="pl-3">{t('credProgressCol')}</span>
            </div>

            {[
              { key: '전공필수', label: t('catReqMajor'),   earned: majorMustEarned, required: majorMustReq },
              { key: '전공선택', label: t('catElectMajor'), earned: majorElecEarned, required: majorElecReq },
            ].map(row => (
              <div key={row.key}
                   className="grid px-4.5 py-2.5 items-center border-b border-(--border) last:border-none"
                   style={{ gridTemplateColumns: '10px 1fr 80px 80px 1fr', gap: '0 8px' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-(--text-2) inline-block"/>
                <span className="text-[12px]">{row.label}</span>
                <span className="text-right text-[12px] font-bold tabular-nums text-(--text-1)">{row.earned}</span>
                <span className="text-right text-[11px] text-(--text-3)">{row.required}{t('credCrUnit')}</span>
                <div className="pl-3">
                  <div className="h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
                    <div className="h-full rounded-full bg-(--bar)"
                         style={{ width: barW(row.earned, row.required),
                                  transition: 'width 1.1s cubic-bezier(.4,0,.2,1)' }}/>
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
                <span className="font-bold text-[13px]">{t('credLibSection')}</span>
                {/* 필수 교양 분야에 대해서만 표기하도록 함 */}
                <span className="text-xl font-bold tabular-nums text-(--text-1)"
                      style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                  {liberalEarned}
                </span>
                <span className="text-[11px] text-(--text-3)">/ {liberalReq} {t('credCrUnit')}</span>
                <div className="w-20 h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
                  <div className="h-full rounded-full bg-(--bar)"
                       style={{ width: barW(liberalEarned, liberalReq),
                                transition: 'width 1.1s cubic-bezier(.4,0,.2,1)' }}/>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border
                ${liberalComplete
                  ? 'bg-(--badge-neutral-bg) text-(--badge-neutral-text) border-(--border)'
                  : 'bg-(--warn-bg) text-(--warn-text) border-(--border)'}`}>
                {liberalComplete ? t('credDone') : `${liberalReq - liberalEarned}${t('credCrLeft')}`}
              </span>
            </div>

            <div className="grid px-4.5 py-2 text-[10px] font-semibold text-(--text-3)
                            border-b border-(--border)"
                 style={{ gridTemplateColumns: '10px 1fr 80px 80px 1fr', gap: '0 8px' }}>
              <span/><span>{t('credArea')}</span>
              <span className="text-right">{t('credEarnedCol')}</span>
              <span className="text-right">{t('credReqCol')}</span>
              <span className="pl-3">{t('credProgressCol')}</span>
            </div>

            {liberalAreaRows.map(row => (
              <div key={row.name}
                   className="grid px-4.5 py-2.5 items-center border-b border-(--border) last:border-none"
                   style={{ gridTemplateColumns: '10px 1fr 80px 80px 1fr', gap: '0 8px' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-(--text-2) inline-block"/>
                <span className="text-[12px]">{row.name}</span>
                <span className="text-right text-[12px] font-bold tabular-nums text-(--text-1)">{row.earned}</span>
                <span className="text-right text-[11px] text-(--text-3)">
                  {row.required > 0 ? `${row.required}${t('credCrUnit')}` : '-'}
                </span>
                <div className="pl-3">
                  <div className="h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
                    <div className="h-full rounded-full bg-(--bar)"
                         style={{ width: barW(row.earned, row.required),
                                  transition: 'width 1.1s cubic-bezier(.4,0,.2,1)' }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* 졸업요건현황 */}
      <div className="grid gap-4 mb-4 card-enter stagger-3">
        <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
             style={{ boxShadow: 'var(--shadow-card)' }}>

          {/* 헤더 */}
          <div className="flex px-4.5 py-3 border-b border-(--border) justify-between items-center">
            <span className="font-bold text-[13px]">{t('credReqStatus')}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setAddOpen(!addOpen); setNewType(''); setNewDetail(''); }}
                className="text-[11px] font-medium text-(--text-2) border border-(--border)
                           rounded-lg px-2.5 py-1 hover:bg-(--surface-2) transition-colors">
                {t('credAddItem')}
              </button>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border border-(--border)
                ${incompleteCerts === 0
                  ? 'bg-(--badge-neutral-bg) text-(--badge-neutral-text)'
                  : 'bg-(--warn-bg) text-(--warn-text)'}`}>
                {incompleteCerts}{t('credIncompleteN')}
              </span>
            </div>
          </div>

          {/* 항목 추가 폼 (항목추가 버튼) */}
          {addOpen && (
            <div className="px-4.5 py-3 border-b border-(--border) flex flex-col gap-2
                            bg-(--surface-2)">
              <input
                value={newType}
                onChange={e => setNewType(e.target.value)}
                placeholder={t('credItemName')}
                className="px-3 py-1.5 text-[12px] rounded-lg bg-(--surface) border border-(--border)
                           text-(--text-1) focus:outline-none focus:border-(--text-2) transition-colors"
              />
              <input
                value={newDetail}
                onChange={e => setNewDetail(e.target.value)}
                placeholder={t('credItemReq')}
                className="px-3 py-1.5 text-[12px] rounded-lg bg-(--surface) border border-(--border)
                           text-(--text-1) focus:outline-none focus:border-(--text-2) transition-colors"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setAddOpen(false); setNewType(''); setNewDetail(''); }}
                  className="px-3 py-1 text-[11px] border border-(--border) rounded-lg
                             text-(--text-2) hover:bg-(--surface-2) transition-colors">
                  {t('cancel')}
                </button>
                <button
                  onClick={addItem}
                  className="px-3 py-1 text-[11px] font-semibold rounded-lg
                             bg-(--text-1) text-(--surface) hover:opacity-85 transition-opacity">
                  {t('credAddBtn')}
                </button>
              </div>
            </div>
          )}

          {/* 항목 추가 => */}
          {certLoading ? (
            <div className="px-4.5 py-6 text-center text-[11px] text-(--text-3)">{t('loading')}</div>
          ) : certItems.length === 0 ? (
            <div className="px-4.5 py-6 text-center text-[11px] text-(--text-3)">
              {t('credNoItems')}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 pb-4">
              {certItems.map(item => (
                <div key={item.id}
                     className="mt-3 bg-(--inner-bg-2) rounded-xl p-3
                                border border-(--border)">

                  {/* 항목명 + 삭제 버튼 */}
                  <div className="flex justify-between items-start mb-1.5">
                    <p className="text-[10px] font-semibold text-(--text-3) leading-snug">
                      {item.todo_type}
                    </p>
                    <button
                      onClick={() => deleteItem(item)}
                      className="text-(--text-3) hover:text-red-400 transition-colors
                                 text-[14px] leading-none ml-1 shrink-0">
                      ×
                    </button>
                  </div>

                  {/* 기준 내용 */}
                  <p className={`text-[12px] font-bold mb-2 leading-snug
                    ${item.note === 'done' ? 'text-(--text-1)' : 'text-(--text-2)'}`}>
                    {item.todo_detail}
                  </p>

                  {/* 완료/미완료 토글 버튼 */}
                  <button
                    onClick={() => toggleDone(item)}
                    className={`px-1.5 py-px rounded-full text-[9px] font-semibold
                                cursor-pointer transition-colors
                      ${item.note === 'done'
                        ? 'bg-(--badge-neutral-bg) text-(--badge-neutral-text)'
                        : 'bg-(--warn-bg) text-(--warn-text)'}`}>
                    {item.note === 'done' ? t('credDoneMark') : t('credIncomplete')}
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

    </div>
    </>
  );
}

export default Credits;




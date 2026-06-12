import { useState, useRef } from 'react';
import { LayoutGrid, StickyNote, ListChecks, GripVertical,
         BarChart2, ChevronRight, X, Upload } from 'lucide-react';
import Popup, { PopupHeader } from '../ui/Popup';
import { useGradeData }    from '../../hooks/useGradeData';
import { useCoursesData }  from '../../hooks/useCoursesData';
import type { PlanItem }   from '../../hooks/useCoursesData';

// 전공: 전공필수/전공선택
// 교양: 교양필수(개신기초교양+자연이공계기초과학+확대교양) / 교양선택(일반교양) 두 그룹으로 집계
const MAJOR_CATEGORIES = [
  { label: '전공필수', color: 'var(--accent)'             },
  { label: '전공선택', color: 'var(--badge-neutral-text)' },
];

const LIBERAL_AREA_MAP: Record<string, { label: string; color: string }> = {

  '개신기초교양':       { label: '교양필수', color: 'var(--rec-neutral-text)' },
  '자연이공계기초과학':  { label: '교양필수', color: 'var(--rec-neutral-text)' },
  '확대교양':           { label: '교양필수', color: 'var(--rec-neutral-text)' },
 
  '일반교양':           { label: '교양선택', color: 'var(--amber, #d97706)'   },
 
  '개신기초': { label: '교양필수', color: 'var(--rec-neutral-text)' },
  '자연':     { label: '교양필수', color: 'var(--rec-neutral-text)' },
  '확대':     { label: '교양필수', color: 'var(--rec-neutral-text)' },
  '일반':     { label: '교양선택', color: 'var(--amber, #d97706)'   },
};

function Courses() {

  const { semesters, courses: doneCourses, gradReqs, loading: gradeLoading }
    = useGradeData();

  const {
    currentSemester, planItems, meta,
    loading: planLoading, error,
    addPlanItem, deletePlanItem, toggleEnroll,
    reorderItems, saveMemo, uploadImage,
  } = useCoursesData(semesters);

  const loading = gradeLoading || planLoading;

  const semLabel = currentSemester
    ? `${currentSemester.semester_year}-${currentSemester.term}`
    : '–';

  const [dragIndex, setDragIndex] = useState(-1);
  const [overIndex, setOverIndex] = useState(-1);

  function handleDrop(dropIndex: number) {
    if (dragIndex === -1 || dragIndex === dropIndex) return;
    const list = [...planItems];
    const [moved] = list.splice(dragIndex, 1);
    list.splice(dropIndex, 0, moved);
    reorderItems(list);
  }

  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '', category: '전공필수', professor: '', credit: '3',
  });

  async function handleAddCourse() {
    if (!newCourse.name.trim()) return;
    await addPlanItem({
      name:      newCourse.name.trim(),
      category:  newCourse.category,
      professor: newCourse.professor || null,
      credit:    Number(newCourse.credit),
    });
    setNewCourse({ name: '', category: '전공필수', professor: '', credit: '3' });
    setShowAddForm(false);
  }

  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgDragOver, setImgDragOver] = useState(false);

  async function handleImageFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    await uploadImage(file);
  }

  
  const enrolledItems = planItems.filter(c => Number(c.is_enrolled) === 1);
  const totalCredit   = enrolledItems.reduce((s, c) => s + Number(c.credit), 0);

  const earnedTotal = doneCourses
    .filter(c => c.grade !== null && c.grade !== 'F')
    .reduce((s, c) => s + Number(c.credit), 0);

  
  const earnedByMajor: Record<string, number> = {};
  for (const c of doneCourses) {
    if (!c.grade || c.grade === 'F') continue;
    if (c.category === '전공필수' || c.category === '전공선택') {
      earnedByMajor[c.category] = (earnedByMajor[c.category] || 0) + Number(c.credit);
    }
  }

  
  const earnedByArea: Record<string, number> = {};
  for (const c of doneCourses) {
    if (!c.grade || c.grade === 'F') continue;
    if (c.division === '교양' && c.area) {
      earnedByArea[c.area] = (earnedByArea[c.area] || 0) + Number(c.credit);
    }
  }

  
  const majorRequired: Record<string, number> = { '전공필수': 0, '전공선택': 0 };
  const liberalRequiredMap: Record<string, { color: string; required: number }> = {};

  for (const r of gradReqs) {
    if (r.area === '전공필수')      majorRequired['전공필수'] = Number(r.required);
    else if (r.area === '전공선택') majorRequired['전공선택'] = Number(r.required);
    else if (LIBERAL_AREA_MAP[r.area]) {
      const { label, color } = LIBERAL_AREA_MAP[r.area];
      if (!liberalRequiredMap[label]) liberalRequiredMap[label] = { color, required: 0 };
      liberalRequiredMap[label].required += Number(r.required);
    }
  }

  const liberalReqs: { label: string; color: string; required: number }[] = [];
  for (const lbl of ['교양필수', '교양선택']) {
    if (liberalRequiredMap[lbl]) liberalReqs.push({ label: lbl, ...liberalRequiredMap[lbl] });
  }

  const liberalRequiredTotal = liberalReqs.reduce((s, r) => s + r.required, 0) || 1;

  const majorStats = MAJOR_CATEGORIES.map(cat => {
    const current  = earnedByMajor[cat.label] || 0;
    const required = majorRequired[cat.label] || 0;
    const adding   = enrolledItems
      .filter(c => c.category === cat.label)
      .reduce((s, c) => s + Number(c.credit), 0);
    return { label: cat.label, color: cat.color, current, required,
             afterCr: current + adding, addedCr: adding };
  });

  const liberalStats = liberalReqs.map(req => {
    // 교양필수: 개신기초교양+자연이공계기초과학+확대교양 / 교양선택: 일반교양
    const matchedAreas = Object.entries(LIBERAL_AREA_MAP)
      .filter(([, v]) => v.label === req.label)
      .map(([k]) => k);
    let current = 0;
    for (const areaKey of matchedAreas) {
      current += earnedByArea[areaKey] || 0;
    }

    const adding = enrolledItems
      .filter(c => c.category === req.label)
      .reduce((s, c) => s + Number(c.credit), 0);
    return { label: req.label, color: req.color, current, required: req.required,
             afterCr: current + adding, addedCr: adding };
  });

  const creditStats = [...majorStats, ...liberalStats];
  const maxAfterCr  = Math.max(...creditStats.map(d => d.afterCr), 1);

  const totalCurrentPie = creditStats.reduce((s, d) => s + d.current,  0) || 1;
  const totalAfterPie   = creditStats.reduce((s, d) => s + d.afterCr,  0) || 1;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-(--text-3) text-[13px]">
        불러오는 중...
      </div>
    );
  }

  return (
    <>
    <div className="p-3.5 px-8 pt-4 w-full">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[16px] font-extrabold text-(--text-1)"
           style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
          수강신청 계획
        </p>
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold
                         bg-(--badge-neutral-bg) text-(--badge-neutral-text)">
          이번 학기 {semLabel}
        </span>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-(--warn-bg) text-(--warn-text) text-[11px]">
          {error}
        </div>
      )}

      {/* #A 표준이수모형 | 오른쪽 섹션들 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">

        {/* ##A-1 표준이수모형 이미지 업로드 */}
        <div className="flex-1 bg-(--surface) rounded-xl border card-enter
                        border-(--border) overflow-hidden flex flex-col">
          <div className="px-3.5 py-2 border-b border-(--border) flex items-center justify-between">
            <span className="font-bold text-[13px] flex items-center gap-1.5">
              <LayoutGrid size={14} className="text-(--accent)" /> 표준이수모형
            </span>
            <span className="text-[11px] text-(--accent) font-semibold">
              소프트웨어학부 {semLabel}
            </span>
          </div>

          {/* 이미지 영역 */}
          <div className="p-3 flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
                e.target.value = ''; 
              }}
            />

            {meta.image_path ? (
              /* 이미지가 있으면 표시 */
              <div className="relative w-full h-full group">
                <img
                  src={`http://localhost:3000${meta.image_path}`}
                  alt="표준이수모형"
                  className="w-full h-full object-contain rounded-lg"
                />
                {/* 호버 시 재업로드 버튼 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center
                             rounded-lg opacity-0 group-hover:opacity-100 transition-opacity
                             bg-black/40 text-white text-[11px] gap-1">
                  <Upload size={20}/>
                  이미지 교체
                </button>
              </div>
            ) : (
              /* 이미지 없으면 업로드 영역 */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setImgDragOver(true); }}
                onDragLeave={() => setImgDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setImgDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleImageFile(file);
                }}
                className={`w-full h-full min-h-40 rounded-lg border border-dashed
                            flex flex-col items-center justify-center gap-2 cursor-pointer
                            transition-colors
                  ${imgDragOver
                    ? 'border-(--accent) bg-(--accent-bg)'
                    : 'border-(--border) bg-(--inner-bg) hover:border-(--accent)'}`}>
                <LayoutGrid size={28} className="text-(--text-3)" strokeWidth={1.5} />
                <p className="text-[11px] text-(--text-3)">이수모형 이미지</p>
                <p className="text-[10px] text-(--text-3)">클릭하거나 파일을 드래그하세요</p>
              </div>
            )}
          </div>
        </div>

        {/* #B 메모 | 수강신청 목록 | 수강 후 학점 */}
        <div className="grid grid-cols-1 gap-3">

          {/* ##B-1 메모 */}
          <div className="bg-(--surface) rounded-xl border border-(--border) card-enter stagger-1
                          overflow-hidden flex flex-col"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="px-4 py-3 border-b border-(--border)">
              <span className="font-bold text-[12px] flex items-center gap-1.5">
                <StickyNote size={13} className="text-(--accent)" /> 수강신청 계획
              </span>
            </div>
            <textarea
              value={meta.memo}
              onChange={e => saveMemo(e.target.value)}
              placeholder="수강신청 계획을 세워보세요..."
              className="flex-1 min-h-10 px-3 py-2 text-[11px] resize-none bg-(--surface)
                         border-none text-(--text-2) placeholder:text-(--text-3)
                         focus:outline-none leading-relaxed"
            />
          </div>

          {/* ##B-2 수강신청 목록 */}
          <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden card-enter stagger-2"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="px-4 py-3 border-b border-(--border)
                            flex items-center justify-between">
              <span className="font-bold text-[13px] flex items-center gap-1.5">
                <ListChecks size={14} className="text-(--accent)" /> 이번 학기 수강신청 목록
              </span>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg
                           bg-(--text-1) text-(--surface) hover:opacity-85 transition-opacity">
                + 추가
              </button>
            </div>

            <div className="p-2.5 flex flex-col gap-0.5">
              {planItems.length === 0 && (
                <p className="text-[11px] text-(--text-3) text-center py-4">
                  과목을 추가해보세요
                </p>
              )}

              {planItems.map((c, i) => (
                <div key={c.id}
                     draggable
                     onDragStart={() => setDragIndex(i)}
                     onDragOver={e => { e.preventDefault(); setOverIndex(i); }}
                     onDrop={() => handleDrop(i)}
                     onDragEnd={() => { setDragIndex(-1); setOverIndex(-1); }}
                     className={`rounded-lg px-2.5 py-1 grid items-center gap-2
                                 cursor-grab active:cursor-grabbing transition-colors
                       ${(overIndex === i) && (dragIndex !== i)
                         ? 'bg-(--accent-bg) border-2 border-(--accent) border-dashed'
                         : 'bg-(--inner-bg) border-2 border-transparent'}`}
                     style={{ gridTemplateColumns: 'auto auto 1fr auto auto auto' }}>

                  <span className="text-[10px] font-bold text-(--text-3) w-4 text-center tabular-nums">
                    {i + 1}
                  </span>
                  <GripVertical size={13} className="text-(--text-3)"/>
                  <div>
                    <p className="text-[12px] font-semibold text-(--text-1)">{c.name}</p>
                    <p className="text-[10px] text-(--text-3) mt-0.5">
                      {c.category}{c.professor ? ` · ${c.professor}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-(--text-2) whitespace-nowrap">
                    {c.credit}학점
                  </span>
                  <button
                    onClick={() => toggleEnroll(c.id, c.is_enrolled)}
                    className={`text-[10px] font-semibold px-2.5 py-1
                                rounded-lg transition-colors
                      ${c.is_enrolled
                        ? 'bg-(--accent) text-(--surface)'
                        : 'border border-(--border) text-(--text-2) hover:bg-(--surface-2)'}`}>
                    {c.is_enrolled ? '담김' : '담기'}
                  </button>
                  <button
                    onClick={() => deletePlanItem(c.id)}
                    className="text-(--text-3) hover:text-(--warn-text) rounded-lg
                               hover:bg-(--inner-bg-2) transition-colors p-1">
                    <X size={13}/>
                  </button>
                </div>
              ))}

              {/* footer */}
              <div className="border-t border-(--border) pt-2 mt-1 flex justify-between items-center">
                <span className="text-[11px] text-(--text-2)">학점계</span>
                <b className="text-[13px] text-(--text-1)">{totalCredit} 학점</b>
                <span className="text-[11px] text-(--text-3)">
                  총 {earnedTotal + totalCredit}학점 예정
                </span>
              </div>
            </div>
          </div>

          {/* ##B-3 수강 후 학점 변화 */}
          <div className="bg-(--surface) rounded-xl border border-(--border) 
                          overflow-hidden card-enter stagger-3"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="px-3.5 py-2 border-b border-(--border)">
              <span className="font-bold text-[13px] flex items-center gap-1.5">
                <BarChart2 size={14} className="text-(--accent)" /> 수강 후 학점
              </span>
            </div>

            <div className="px-3 py-2.5 grid grid-cols-[1.6fr_1fr] grid-rows-[auto_auto]">

              {/* 게이지바
                   - required > 0 이면 required 기준 비율
                   - required = 0 이면 maxAfterCr 기준 상대 비율 */}
              <div className="row-span-2 flex flex-col justify-between">
                {creditStats.map(field => {
                  const pct = field.required > 0
                    ? Math.min(100, Math.round((field.afterCr / field.required) * 100))
                    : Math.round((field.afterCr / maxAfterCr) * 100);
                  return (
                    <div key={field.label}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-(--text-3)">{field.label}</span>
                        <div className="flex items-center gap-1 m-1">
                          <span className="text-[10px] font-semibold text-(--accent) tabular-nums">
                            {field.afterCr}{field.required > 0 ? ` / ${field.required}` : '학점'}
                            {field.addedCr > 0 && (
                              <span className="text-[9px] font-bold px-1 ml-1 py-0.5 rounded"
                                    style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                                +{field.addedCr}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-(--bar-track) overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                             style={{ width: `${pct}%`, background: field.color }}/>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 범례 */}
              <div className="ml-auto flex flex-col mt-1 mb-1">
                {creditStats.map(field => (
                  <div key={field.label} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full shrink-0"
                          style={{ background: field.color }}/>
                    <span className="text-[8px] text-(--text-2)">{field.label}</span>
                  </div>
                ))}
              </div>

              {/* 파이차트 현재 → 수강 후 */}
              <div className="ml-auto border-t border-(--border) pt-1.5 flex items-center gap-1">
                {/* 현재 */}
                <div className="text-center">
                  <svg width="48" height="48" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none"
                            stroke="var(--bar-track)" strokeWidth="3.2"/>
                    {(() => {
                      let cum = 0;
                      return creditStats.map(d => {
                        const pct    = (d.current / totalCurrentPie) * 100;
                        const offset = 25 - cum;
                        cum += pct;
                        return (
                          <circle key={d.label} cx="18" cy="18" r="15.9" fill="none"
                                  stroke={d.color} strokeWidth="3.2"
                                  strokeDasharray={`${pct.toFixed(1)} ${(100 - pct).toFixed(1)}`}
                                  strokeDashoffset={offset.toFixed(1)}
                                  transform="rotate(-90 18 18)"/>
                        );
                      });
                    })()}
                  </svg>
                  <p className="text-[8px] text-(--text-3)">현재</p>
                </div>

                <ChevronRight size={9} className="text-(--text-3) shrink-0"/>

                {/* 수강 후 */}
                <div className="text-center">
                  <svg width="48" height="48" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none"
                            stroke="var(--bar-track)" strokeWidth="3.2"/>
                    {(() => {
                      let cum = 0;
                      return creditStats.map(d => {
                        const pct    = (d.afterCr / totalAfterPie) * 100;
                        const offset = 25 - cum;
                        cum += pct;
                        return (
                          <circle key={d.label} cx="18" cy="18" r="15.9" fill="none"
                                  stroke={d.color} strokeWidth="3.2"
                                  strokeDasharray={`${pct.toFixed(1)} ${(100 - pct).toFixed(1)}`}
                                  strokeDashoffset={offset.toFixed(1)}
                                  transform="rotate(-90 18 18)"/>
                        );
                      });
                    })()}
                  </svg>
                  <p className="text-[8px] text-(--text-3)">수강 후</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>

    {/* 과목 추가 팝업 */}
    {showAddForm && (
      <Popup open={true} onClose={() => setShowAddForm(false)} width="420px">
        <PopupHeader title="과목 추가" onClose={() => setShowAddForm(false)}/>
        <div className="p-5 flex flex-col gap-3.5">

          <div>
            <p className="text-[11px] font-bold text-(--text-2) mb-1.5">과목명 *</p>
            <input
              value={newCourse.name}
              onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCourse(); }}
              placeholder="예: 기초 컴퓨터 프로그래밍"
              className="w-full px-3 py-2 text-[12px] rounded-lg bg-(--surface)
                         border border-(--border) text-(--text-1) placeholder:text-(--text-3)
                         focus:outline-none focus:border-(--text-2) transition-colors"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-bold text-(--text-2) mb-1.5">구분</p>
              <select
                value={newCourse.category}
                onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}
                className="w-full px-3 py-2 text-[12px] rounded-lg bg-(--surface)
                           border border-(--border) text-(--text-1) focus:outline-none
                           focus:border-(--text-2) cursor-pointer transition-colors">
                {['전공필수','전공선택','교양필수','교양선택'].map(cat => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[11px] font-bold text-(--text-2) mb-1.5">학점</p>
              <select
                value={newCourse.credit}
                onChange={e => setNewCourse({ ...newCourse, credit: e.target.value })}
                className="w-full px-3 py-2 text-[12px] rounded-lg bg-(--surface)
                           border border-(--border) text-(--text-1) focus:outline-none
                           focus:border-(--text-2) cursor-pointer transition-colors">
                {['1','2','3'].map(cr => (
                  <option key={cr} value={cr}>{cr} 학점</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-(--text-2) mb-1.5">교수명</p>
            <input
              value={newCourse.professor}
              onChange={e => setNewCourse({ ...newCourse, professor: e.target.value })}
              placeholder="예: 홍길동"
              className="w-full px-3 py-2 text-[12px] rounded-lg bg-(--surface)
                         border border-(--border) text-(--text-1) placeholder:text-(--text-3)
                         focus:outline-none focus:border-(--text-2) transition-colors"/>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAddCourse}
              className="flex-1 py-2.5 rounded-lg text-[12px] font-bold
                         bg-(--text-1) text-(--surface) hover:opacity-85 transition-opacity">
              추가하기
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2.5 rounded-lg text-[12px] border border-(--border)
                         text-(--text-2) hover:bg-(--surface-2) transition-colors">
              취소
            </button>
          </div>

        </div>
      </Popup>
    )}
    </>
  );
}

export default Courses;

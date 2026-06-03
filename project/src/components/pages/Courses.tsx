import { useState } from 'react';
import { LayoutGrid, StickyNote, ListChecks, GripVertical,
         BarChart2, ChevronRight, X } from 'lucide-react';
import { mockCourses, mockSemesters } from '../../data/mock';
import Popup, { PopupHeader } from '../ui/Popup';

// 초기 과목 목록 (하드코딩) => 웹 내에서만. 따로 데이터 연결 X 
// (나중에 지울거임. 100% 유저 입력 데이터로 구성되는 페이지임 수강신청 관리는)
const INIT_COURSES = [  
  { id: 1, name: '자료구조',    category: '전공필수', professor: '김교수', credit: 3 },
  { id: 2, name: '알고리즘',    category: '전공필수', professor: '박교수', credit: 3 },
  { id: 3, name: '영어회화',    category: '교양필수', professor: '이교수', credit: 2 },
  { id: 4, name: '캡스톤디자인', category: '전공필수', professor: '최교수', credit: 3 },
];

// 수강 후 학점 현황 (임시, 하드코딩)
// 이건 이미 수강한 과목들에 의한 통계로 대체될 것
const CREDIT_AFTER = [
  { label: '전공필수', current: 40, required: 60, color: 'var(--accent)'          },
  { label: '전공선택', current: 24, required: 30, color: 'var(--badge-neutral-text)'   },
  { label: '교양필수', current: 3,  required: 18, color: 'var(--rec-neutral-text)' },
  { label: '교양선택', current: 24, required: 34, color: 'var(--text-3)'   },
]; 

function Courses() {

  const [courses, setCourses] = useState(INIT_COURSES); // 수강신청 과목 리스트

  const [enrolled, setEnrolled] = useState(INIT_COURSES.map(c => c.id)); 
  // 수강신청 목록 담김/담기 상태관리 :  추가한 시점에서는 담김으로 처리

  const [memo, setMemo] = useState('');

  
  // 현재 학기 라벨 — Dashboard.tsx ref.
  let semIndex = 0;
  for (let i = 0; i < mockSemesters.length; i++) {
    if (mockSemesters[i].gpa === null) { semIndex = i; break; }
  }
  const thisSemester = `${Math.floor(semIndex / 2) + 1}-${(semIndex % 2) + 1}`;


  const [dragIndex, setDragIndex] = useState(-1); // Dragstart(A) 과목의 index 상태 
  const [overIndex, setOverIndex] = useState(-1); // Dragover(B) 과목의 index 상태
  // -1 는 grab 안했거나 없다는거임.

  const [showAddForm, setShowAddForm] = useState(false); 
  // 수강신청 목록 - 추가버튼(과목추가팝업)
  const [newCourse, setNewCourse] = useState(
    { name: '', category: '전공필수', professor: '', credit: '3' }
  ); // 과목명, 구분, 학점, 교수명 포함 => 추가버튼 new강의 객체 관리


  // onDrop = 드롭 했을때 이뤄져야할 로직 : A 랑 B swap 
  function handleDrop(dropIndex: number) {
    // 제자리거나 옮길 수 없는 위치면(Draggable 아닌 경우) 동작 X
    if (dragIndex === -1 || dragIndex === dropIndex) return; 
    
    const list = [...courses];

    // A B Swap 
    const temp      = list[dragIndex];
    list[dragIndex] = list[dropIndex];
    list[dropIndex] = temp;

    setCourses(list); // update
  }


  // 담김/담기 관리 
  function toggleEnroll(id: number) {
    if (enrolled.includes(id)) {
      setEnrolled(enrolled.filter(x => x !== id));
    } // 담김=>담기
    else {
      setEnrolled([...enrolled, id]);
    } // 담기=>담김
  }

  
  // 과목 삭제
  function handleDeleteCourse(id: number) {
    setCourses(prev => prev.filter(c => c.id !== id));
    setEnrolled(prev => prev.filter(x => x !== id));
  }



  // ==== 수강 후 학점 계산 계산 ====
  const enrolledCourses = courses.filter(c => enrolled.includes(c.id)); // 담김 강의 목록

  // 담긴 과목 학점 합산
  let totalCredit = 0;
  for (const c of enrolledCourses) totalCredit += c.credit;

  // 이미 이수한 학점 합산
  const doneCourses = mockCourses.filter(c => c.grade_points !== null);
  let earnedCr = 0;
  for (const c of doneCourses) earnedCr += c.credit;


  // SVG 파이차트용 데이터 (현재 / 수강후)
  const creditStats = CREDIT_AFTER.map(field => { 
    // 각 객체의 afterCr 갱신해둔 것. (카테고리별)
    const matched = enrolledCourses.filter(
      c => c.category.includes(field.label)
    );

    let addedCr = 0;
    for (const c of matched) addedCr += c.credit;
    return { ...field, afterCr: field.current + addedCr };
  });
  const totalCurrentPie = creditStats.reduce((s, d) => s + d.current, 0) || 1; // 현재 학점
  const totalAfterPie   = creditStats.reduce((s, d) => s + d.afterCr,  0) || 1; // 수강후 학점


  // 과목 추가 (수강신청 목록 - + 추가)
  function handleAddCourse() {
    if (!newCourse.name.trim()) return;
    const id = Math.random(); // 임시 id => DB에 새로 추가해야함 @@

    const credit = Number(newCourse.credit); // 문자열 '3' → 숫자 3
    const course = {
      id,
      name:      newCourse.name,
      category:  newCourse.category,
      professor: newCourse.professor,
      credit,
    };
    setCourses(prev => [...prev, course]);

    setEnrolled(prev => [...prev, id]); // 추가하면 자동으로 담김
    setNewCourse({ name: '', category: '전공필수', professor: '', credit: '3' });
    setShowAddForm(false);
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
          이번 학기 {thisSemester}
        </span>
      </div>

      {/* #A 표준이수모형 | 수강신청 계획 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">

        {/* ##A-1 표준이수모형 사진 업로드 (기능 구현 필요 @) */}
        <div className="flex-1 bg-(--surface) rounded-xl border 
                        border-(--border) overflow-hidden flex flex-col">
          {/* 헤더 */}
          <div className="px-3.5 py-2 border-b border-(--border) flex items-center justify-between">
            <span className="font-bold text-[13px] flex items-center gap-1.5">
              <LayoutGrid size={14} className="text-(--accent)" /> 표준이수모형
            </span>
            <span className="text-[11px] text-(--accent) font-semibold cursor-pointer">
              소프트웨어학부 {thisSemester}
            </span>
          </div>

          <div className="p-3 flex-1">
            <div className="w-full h-full rounded-lg border border-dashed border-(--border) bg-(--inner-bg)
                            flex flex-col items-center justify-center gap-2 cursor-pointer
                            hover:border-(--accent) transition-colors">
              <LayoutGrid size={28} className="text-(--text-3)" strokeWidth={1.5} />
              <p className="text-[11px] text-(--text-3)">이수모형 이미지</p>
              <p className="text-[10px] text-(--text-3)">클릭하거나 파일을 드래그하세요</p>
            </div>
          </div>
        </div>

        {/* #B 수강신청 목록 | 수강 후 학점 */}
        <div className="grid grid-cols-1 gap-3">

          {/* ##B-1 메모 */}
          <div className="bg-(--surface) rounded-xl border border-(--border) 
                          overflow-hidden flex flex-col"
              style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="px-4 py-3 border-b border-(--border)">
              <span className="font-bold text-[12px] flex items-center gap-1.5">
                <StickyNote size={13} className="text-(--accent)" /> 수강신청 계획
              </span>
            </div>

            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="수강신청 계획을 세워보세요..."
              className="flex-1 min-h-10 px-3 py-2 text-[11px] resize-none bg-(--surface)
                        border-none text-(--text-2) placeholder:text-(--text-3)
                        focus:outline-none leading-relaxed"
            />
          </div>

          {/* ##B-2 수강신청 목록 */}
          <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
              style={{ boxShadow: 'var(--shadow-card)' }}>
            {/* 헤더 */}
            <div className="px-4 py-3 border-b border-(--border) 
                            flex items-center justify-between">
              <span className="font-bold text-[13px] flex items-center gap-1.5">
                <ListChecks size={14} className="text-(--accent)" /> 이번 학기 수강신청 목록
              </span>

              <button onClick={() => setShowAddForm(true)}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-lg
                                bg-(--text-1) text-(--surface) hover:opacity-85 transition-opacity">
                + 추가
              </button>
            </div>

            {/* 수강신청 강의 목록 */}
            <div className="p-2.5 flex flex-col gap-0.5">
              {courses.map((c, i) => (
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
                      {c.category} · {c.professor}
                    </p>
                  </div>

                  <span className="text-[10px] text-(--text-2) whitespace-nowrap">
                    {c.credit}학점
                  </span>

                  <button onClick={() => toggleEnroll(c.id)}
                          className={`text-[10px] font-semibold px-2.5 py-1 
                                      rounded-lg transition-colors
                            ${enrolled.includes(c.id)
                              ? 'bg-(--accent) text-(--surface)'
                              : 'border border-(--border) text-(--text-2) hover:bg-(--surface-2)'
                            }`}>
                    {enrolled.includes(c.id) ? '담김' : '담기'}
                  </button>

                  <button onClick={() => handleDeleteCourse(c.id)}
                          className="text-(--text-3) hover:text-(--warn-text) rounded-lg
                                     hover:bg-(--inner-bg-2) transition-colors p-1">
                    <X size={13}/>
                  </button>
                </div>
              ))}

            {/* footer */}
            <div className="border-t border-(--border) pt-2 mt-1 flex justify-between items-center">
              <span className="text-[11px] text-(--text-2)"> 학점계 </span>
              <b className="text-[13px] text-(--text-1)"> {totalCredit} 학점 </b>
              <span className="text-[11px] text-(--text-3)">
                총 {earnedCr + totalCredit}학점 예정
              </span> {/* DB랑 연결된 earnedCr + total(프론트, 아직 연산) */}
            </div>
            </div>
          </div>

          {/* ##B-3 수강 후 학점 변화 */}
          <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
               style={{ boxShadow: 'var(--shadow-card)' }}>

            {/* 헤더 */}
            <div className="px-3.5 py-2 border-b border-(--border)">
              <span className="font-bold text-[13px] flex items-center gap-1.5">
                <BarChart2 size={14} className="text-(--accent)" /> 수강 후 학점
              </span>
            </div>

            {/* 본문 */}
            <div className="px-3 py-2.5 grid grid-cols-[1.6fr_1fr] 
                            grid-rows-[auto_auto]">

              {/* 필드별 게이지바 (div) */}
              <div className="row-span-2 flex flex-col justify-between">
                {CREDIT_AFTER.map(field => {
                  const matched = enrolledCourses.filter(
                    c => (c.category === field.label)
                  ); // // INIT_COURSES.category === CREDIT_AFTER.label

                  let addedCr = 0;
                  for (const c of matched) addedCr += c.credit;
                  const afterCr = field.current + addedCr;
                  const pct = Math.min(100, (afterCr / field.required) * 100);

                  return (
                    <div key={field.label}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-(--text-3)">{field.label}</span>
                        <div className="flex items-center gap-1 m-1">
                          <span className="text-[10px] font-semibold text-(--accent) tabular-nums">
                            {afterCr} / {field.required}

                            {addedCr > 0 && (
                              <span className="text-[9px] font-semibold px-1 ml-1 py-0.5 rounded"
                                    style={{ background:'var(--accent-bg)', color:'var(--accent)' }}>
                                +{addedCr}
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

              {/* 필드 circledot + 이름 */}
              <div className="ml-auto flex flex-col mt-1 mb-1">
                {CREDIT_AFTER.map(field => (
                  <div key={field.label} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full shrink-0" 
                          style={{ background: field.color }}/>
                    <span className="text-[8px] text-(--text-2)">{field.label}</span>
                  </div>
                ))}
              </div>

              {/* SVG 현재 > 수강후 */}
              <div className="ml-auto border-t border-(--border) pt-1.5 flex items-center gap-1">

                {/* 현재 파이 */}
                <div className="text-center">
                  <svg width="48" height="48" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" 
                            stroke="var(--bar-track)" strokeWidth="3.2"/>
                    {(() => {
                      let cum = 0;
                      return creditStats.map(d => {
                        const pct = (d.current / totalCurrentPie) * 100; // 비율
                        const offset = 25 - cum;  // 25 = 4개 분야니까 100/4 - cum 
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

                {/* 수강 후 파이 */}
                <div className="text-center">
                  <svg width="48" height="48" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bar-track)" strokeWidth="3.2"/>
                    {(() => {
                      let cum = 0;
                      return creditStats.map(d => {
                        const pct = (d.afterCr / totalAfterPie) * 100;
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

          <div> {/* 과목명 */}
            <p className="text-[11px] font-bold text-(--text-2) mb-1.5">과목명 *</p>
            <input value={newCourse.name}
                   onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                   placeholder="예:  기초 컴퓨터 프로그래밍"
                   className="w-full px-3 py-2 text-[12px] rounded-lg bg-(--surface) 
                              border border-(--border) text-(--text-1) placeholder:text-(--text-3)
                              focus:outline-none focus:border-(--text-2) transition-colors"/>
          </div>

          {/* 구분 | 학점 */}
          <div className="grid grid-cols-2 gap-3">
            <div> {/* 구분 (필드) */}
              <p className="text-[11px] font-bold text-(--text-2) mb-1.5">구분</p>
              <select value={newCourse.category}
                      onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}
                      className="w-full px-3 py-2 text-[12px] rounded-lg bg-(--surface) 
                                 border border-(--border) text-(--text-1) focus:outline-none 
                                 focus:border-(--text-2) cursor-pointer transition-colors">
                {['전공필수','전공선택','교양필수','교양선택'].map(cat => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div> {/* 학점 (일단 1~3 => F/P 등도 고려해줘야함) */}
              <p className="text-[11px] font-bold text-(--text-2) mb-1.5">학점</p>
              <select value={newCourse.credit}
                      onChange={e => setNewCourse({ ...newCourse, credit: e.target.value })}
                      className="w-full px-3 py-2 text-[12px] rounded-lg bg-(--surface) 
                                 border border-(--border) text-(--text-1) focus:outline-none 
                                 focus:border-(--text-2) cursor-pointer transition-colors">
                {['1','2','3'].map(cr => (
                  <option key={cr}> {cr} 학점 </option>
                ))}
              </select>
            </div>
          </div>

          <div> {/* 교수명 */}
            <p className="text-[11px] font-bold text-(--text-2) mb-1.5">교수명 </p>
            <input value={newCourse.professor}
                   onChange={e => setNewCourse({ ...newCourse, professor: e.target.value })}
                   placeholder="예: 홍길동"
                   className="w-full px-3 py-2 text-[12px] rounded-lg bg-(--surface) 
                              border border-(--border)  text-(--text-1) placeholder:text-(--text-3)
                              focus:outline-none focus:border-(--text-2) transition-colors"/>
          </div>

          {/* 추가 및 취소 버튼 */}
          <div className="flex gap-2 pt-1">
            <button onClick={handleAddCourse}
                    className="flex-1 py-2.5 rounded-lg text-[12px] font-bold 
                              bg-(--text-1) text-(--surface) hover:opacity-85 transition-opacity">
              추가하기
            </button>
            
            <button onClick={() => setShowAddForm(false)}
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

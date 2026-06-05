
import { useState } from 'react';
import { LayoutGrid, PlusCircle, Trash2 } from 'lucide-react';
import { mockSemesters, mockCourses } from '../../../data/mock';
import Popup, { PopupHeader, PopupFooter } from '../../ui/Popup';

const tabs = [
  { id: 'timetable',   name: '시간표',   icon: <LayoutGrid size={13}/>  },
  { id: 'addSchedule', name: '일정 추가', icon: <PlusCircle size={13}/>  },
]; // 시간표 | 일정추가

const DAY_COLS   = ['월','화','수','목','금']; // 시간표 - 수업 추가 팝업 - 요일
const TYPE_OPTS  = [
  { value:'b', label:'전공필수' }, { value:'p', label:'전공선택' },
  { value:'c', label:'교양' },     { value:'g', label:'기타' },
]; // 시간표 - 수업 추가 팝업 - 구분 

type Block = { id:number; col:number; row:string; name:string; time:string; type:string };

// 초기 시간표 데이터 (임시, 하드코딩)
const INIT_BLOCKS: Block[] = [
  { id:1, col:2, row:'1/3', name:'자료구조',  time:'09:00~11:00', type:'b' },
  { id:2, col:3, row:'3/5', name:'알고리즘',  time:'11:00~13:00', type:'p' },
  { id:3, col:4, row:'1/3', name:'자료구조',  time:'09:00~11:00', type:'b' },
  { id:4, col:4, row:'3/5', name:'알고리즘',  time:'11:00~13:00', type:'p' },
  { id:5, col:2, row:'5/7', name:'영어회화',  time:'13:00~15:00', type:'c' },
  { id:6, col:6, row:'5/7', name:'영어회화',  time:'13:00~15:00', type:'c' },
  { id:7, col:5, row:'6/8', name:'인성과윤리', time:'14:00~16:00', type:'g' },
];

let nextId = INIT_BLOCKS.length + 1;

// 수강 과목 상세 (임시, 하드코딩 - Main Dash + 시간정보)
const COURSE_DETAIL = [
  { name:'자료구조',  days:'월·수', time:'09:00~11:00', credit:3, type:'b' },
  { name:'알고리즘',  days:'화·목', time:'11:00~13:00', credit:3, type:'p' },
  { name:'영어회화',  days:'월·금', time:'13:00~15:00', credit:2, type:'c' },
  { name:'이산수학',  days:'수',    time:'12:00~14:00', credit:3, type:'p' },
  { name:'인성과윤리', days:'목',   time:'14:00~16:00', credit:2, type:'g' },
];

// 다가오는 일정 (임시, 하드코딩)
const SCHEDULE_LIST = [
  { label: '자료구조 중간고사',  date: '5월 28일 (수) 09:00', dday: 3,  warn: true  },
  { label: '알고리즘 과제 제출', date: '6월 1일 (일) 23:59',  dday: 7,  warn: false },
  { label: '영어회화 발표',      date: '6월 8일 (일) 수업 중', dday: 14, warn: false },
  { label: '기말고사 시작',      date: '6월 15일 (일) 수업 중', dday: 21, warn: false },
];

function Timetable() {

  const [tab, setTab] = useState('timetable'); // 시간표 | 일정추가 탭 관리
  const isTable = (tab === tabs[0].id);


  const [evForm, setEvForm] = useState(
    { title:'', date:'', time:'', type:'과제', memo:'' }
  ); // evForm = 일정 data 구조 명시 + 추가할 객체 상태 관리


  const [addOpen, setAddOpen] = useState(false); // 수업 추가 팝업 관리
  const [editBlock, setEditBlock] = useState<Block | null>(null);
  // 수업 추가 폼 상태 (요일col, 시작시간 row인덱스, 수업길이, 과목명, 타입)

  // 시간표 블럭 관리
  const [blocks, setBlocks] = useState<Block[]>(INIT_BLOCKS);
  const [bForm, setBForm] = useState(
    { name:'', col:2, startTime:'09:00', endTime:'11:00', type:'b' }
  ); // 시간표 블럭 추가 초기형식


  function addBlock() { // 시간표 블럭 추가 로직
    // 시작/종료 시간으로 교시로 변경, grid 배치!
    const startRow = parseInt(bForm.startTime.split(':')[0]) - 8;
    const endRow   = parseInt(bForm.endTime.split(':')[0])   - 8;
      // 09:00 =(split)=> 09 =parseInt=> 9 => 1(교시)

    // 일단 범위 외인 시간은 막아둠. 추가 예정.. (야간 시간)
    if (endRow <= startRow || startRow < 1 || endRow > 8) return;

    setBlocks([...blocks, {
      id: nextId++, col: bForm.col,
      row: `${startRow}/${endRow}`,
      name: bForm.name || '새 수업',
      time: `${bForm.startTime}~${bForm.endTime}`,
      type: bForm.type,
    }]); // 누적 객체에 추가해주기

    setAddOpen(false); // 팝업 자동 닫기
    setBForm({ name:'', col:2, startTime:'09:00', endTime:'11:00', type:'b' });
  }

  function deleteBlock(id: number) { // 시간표 블럭 삭제 로직
    setBlocks(blocks.filter(b => b.id !== id));
    setEditBlock(null);
  }

  // Dash Data 그대로 들고온것
  const currentSem = mockSemesters.find(s => s.gpa === null)!;
  const currentCourses = mockCourses.filter(c => c.semester_id === currentSem.id);

  return (
    <>
    <div className="p-3.5 pb-10 w-full">

      {/* Tab : A 시간표 | B 일정추가 */}
      <div className="flex flex-row mb-4 gap-1.5 mx-4">
        {tabs.map(({ id, name, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg
                        text-[12px] font-medium transition-colors whitespace-nowrap
              ${tab === id
                ? 'bg-(--accent) text-(--surface) font-bold'
                : 'text-(--text-2) hover:bg-(--surface-2) hover:text-(--text-1)'
              }`}>
            {icon} {name}
          </button>
        ))}
      </div>

      <div className="mx-3">
        {/* #A 시간표 */}
        {isTable && (
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-3.5">

            {/* ##A1 이번 학기 시간표 */}
            <div className="bg-(--surface) rounded-xl border 
                            border-(--border) overflow-hidden pr-2"
                style={{ boxShadow: 'var(--shadow-card)' }}>
              {/* 시간표 헤더 */}
              <div className="px-4 py-3 border-b border-(--border) 
                              flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[13px]"> 이번학기 시간표 </span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                                  bg-(--badge-neutral-bg) text-(--badge-neutral-text)">
                    2025년 1학기
                  </span>
                </div>

                <button
                  onClick={() => setAddOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-lg
                             bg-(--text-1) text-(--surface) hover:opacity-85 transition-opacity">
                  <PlusCircle size={12}/> 수업 추가
                </button>
              </div>

              {/* 시간표 */}
              <div className="p-3">
                {/* #1 요일 (주말 추가할 가능성 있음) */}
                <div className="grid mb-1 text-center text-[10px] 
                                font-bold text-(--text-2) gap-1 pb-2"
                    style={{ gridTemplateColumns: '32px repeat(5,1fr)' }}>
                  <div/>
                  {['월요일','화요일','수요일','목요일','금요일'].map(
                     d => <div key={d}> {d} </div>)}
                </div>

                {/* #2 시간대 */}
                <div className="grid"
                    style={{ gridTemplateColumns: '32px repeat(5,1fr)',
                              gridTemplateRows: 'repeat(8, 46px)',
                              gap: 2 }}>

                  {/* ## 시간대 표기 
                      @ 데이터에 따라 추가할 예정 (임시, 하드코딩) */}
                  {[
                    { row: 1, label: '9:00'   },
                    { row: 2, label: '10:00'  },
                    { row: 3, label: '11:00'  },
                    { row: 4, label: '12:00'  },
                    { row: 5, label: '13:00'  },
                    { row: 6, label: '14:00'  },
                    { row: 7, label: '15:00'  },
                    { row: 8, label: '16:00' },
                  ].map(t => (
                    <div key={t.label}
                        className="text-[8px] text-(--text-3) flex 
                                    items-start justify-end mr-2.5 pt-0.5"
                        style={{ gridRow: t.row }}>
                      {t.label}
                    </div>
                  ))}

                  {/* 수업 블록 — 클릭하면 삭제 팝업(setEditBlock) */}
                  {blocks.map(b => (
                    <div key={b.id}
                        className="rounded-xl text-[10px] leading-tight m-px
                                   px-1.5 py-1 cursor-pointer z-10 relative
                                   hover:brightness-95 transition-all"
                        style={{
                          gridColumn: b.col,
                          gridRow: b.row,
                          background: `var(--timetable-${b.type}-bg)`,
                          border: `1px solid var(--timetable-${b.type}-bd)`,
                          color: `var(--timetable-${b.type}-text)`,
                        }}
                        onClick={e => { e.stopPropagation(); setEditBlock(b); }}>
                      <b>{b.name}</b><br/>
                      <span style={{ opacity:.7, fontSize:9 }}>{b.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ##A2 수강 과목 | 일정 */}
            <div className="flex flex-col gap-2.5 h-full">

              {/* ##A2-1 수강 과목 (main dash 참조) */}
              <div className="bg-(--surface) rounded-xl border 
                              border-(--border) overflow-hidden flex-none"
                  style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="px-3.5 py-2.5 border-b border-(--border)">
                  <span className="font-bold text-[12px]">수강 과목</span>
                </div>

                <div className="px-3 py-2 flex flex-col gap-1">
                  {COURSE_DETAIL.map(c => (
                    <div key={c.name} className="flex items-center gap-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: `var(--timetable-${c.type}-bd)` }} />
                      <div className="min-w-0 flex items-baseline gap-2 flex-1">
                        <p className="text-[12px] font-semibold text-(--text-1)">{c.name}</p>
                        <p className="text-[10px] text-(--text-3) truncate">
                          {c.days} {c.time} · {c.credit}학점
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="h-px bg-(--border) my-0.5"/>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-(--text-3)">총 수강 학점</span>
                    <b className="text-(--text-1)">
                      {currentCourses.reduce((s,c) => s+c.credit, 0)} 학점
                    </b>
                  </div>
                </div>
              </div>

              {/* ##A2-2 다가오는 일정 (side bar 참조) */}
              <div className="bg-(--surface) rounded-xl border border-(--border) 
                              overflow-hidden flex-1"
                  style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="px-3.5 py-2.5 border-b border-(--border)">
                  <span className="font-bold text-[12px]">다가오는 일정</span>
                </div>
                <div className="flex flex-col divide-y divide-(--border)">
                  {SCHEDULE_LIST.map(c => (
                    <div key={c.label}
                        className="flex items-center gap-2.5 px-3.5 py-2
                                    hover:bg-(--surface-2) 
                                    transition-colors cursor-pointer">
                      <span className={`px-1.5 py-0.5 rounded-full 
                                        text-[9px] font-bold shrink-0
                        bg-(--surface-2) text-(--text-2) border border-(--border)`}>
                        D-{c.dday}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-(--text-1)">
                          {c.label}
                        </p>
                        <p className="text-[10px] text-(--text-3)">
                          {c.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* #B 일정추가 */}
        {!isTable && (
          <div className="grid grid-cols-1 
                          md:grid-cols-[1.3fr_1fr] gap-6 m-4 items-start">

            {/* ##B1 새 일정 추가 폼(좌측 블럭) */}
            <div className="bg-(--surface) rounded-xl border
                            border-(--border) overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-4.5 py-3 border-b border-(--border)">
                <span className="font-bold text-[13px]">새 일정 추가</span>
              </div>
              <div className="p-4.5 flex flex-col gap-3">
                <div>
                  {/* 제목 */}
                  <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">제목</p>
                  <input
                    type="text"
                    value={evForm.title}
                    onChange={e => setEvForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="일정 제목을 입력하세요."
                    className="w-full px-3 py-2 text-[12px] rounded-lg
                              bg-(--surface) border border-(--border) text-(--text-1)
                              placeholder:text-(--text-3) focus:outline-none
                              focus:border-(--text-2) transition-colors"/>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    {/* 날짜 */}
                    <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">날짜</p>
                    <input
                      type="date"
                      value={evForm.date}
                      onChange={e => setEvForm(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-3 py-2 text-[12px] rounded-lg
                                bg-(--inner-bg) border border-(--border) text-(--text-1)
                                focus:outline-none focus:border-(--accent) transition-colors"/>
                  </div>

                  <div>
                    {/* 시간 */}
                    <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">시간</p>
                    <input
                      type="time"
                      value={evForm.time}
                      onChange={e => setEvForm(p => ({ ...p, time: e.target.value }))}
                      className="w-full px-3 py-2 text-[12px] rounded-lg
                                bg-(--inner-bg) border border-(--border) text-(--text-1)
                                focus:outline-none focus:border-(--accent) transition-colors"/>
                  </div>

                </div>

                <div>
                  {/* 분류 */}
                  <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">분류</p>
                  <select
                    value={evForm.type}
                    onChange={e => setEvForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2 text-[12px] rounded-lg
                              bg-(--surface) border border-(--border) text-(--text-1)
                              focus:outline-none focus:border-(--text-2) transition-colors">
                    {['과제','시험','발표','프로젝트','기타'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  {/* 메모 */}
                  <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">
                    메모 <span className="font-normal text-(--text-3)">(선택)</span>
                  </p>
                  <textarea
                    value={evForm.memo}
                    onChange={e => setEvForm(p => ({ ...p, memo: e.target.value }))}
                    placeholder="메모를 입력하세요..."
                    className="w-full h-18 px-3 py-2 text-[12px] rounded-lg resize-none
                              bg-(--surface) border border-(--border) text-(--text-1)
                              placeholder:text-(--text-3) focus:outline-none
                              focus:border-(--text-2) transition-colors"/>
                </div>

                {/* 일정 저장 버튼 추가 @ */}
                <button className="px-4 py-2 rounded-lg text-[12px] font-semibold w-full
                                  bg-(--text-1) text-(--surface) hover:opacity-85 transition-opacity">
                  일정 저장
                </button>
              </div>
            </div>

            {/* ##B2 내 일정 목록 */}
            <div className="bg-(--surface) rounded-xl border 
                            border-(--border) overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-4.5 py-3 border-b border-(--border) 
                              flex justify-between items-center">
                <span className="font-bold text-[13px]">내 일정 목록</span>
                <span className="text-[11px] text-(--text-3)">
                  {SCHEDULE_LIST.length}개
                </span>
              </div>
              <div className="flex flex-col divide-y divide-(--border)">
                {SCHEDULE_LIST.map(ev => (
                  <div key={ev.label}
                      className="flex items-center gap-3 px-4.5 py-3
                                  hover:bg-(--surface-2) 
                                  transition-colors cursor-pointer">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] 
                                      font-bold shrink-0
                      ${ev.warn
                        ? 'bg-(--warn-bg) text-(--warn-text)'
                        : 'bg-(--badge-neutral-bg) text-(--badge-neutral-text)'
                      }`}>
                      D-{ev.dday}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-(--text-1)">{ev.label}</p>
                      <p className="text-[10px] text-(--text-3)">{ev.date}</p>
                    </div>

                    {/* 삭제 기능 추가 @  */}
                    <button className="text-[10px] text-(--text-3) 
                                       hover:text-(--warn-text)  transition-colors">
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>

    {/* #팝업1 : 시간표 - 수업 추가 팝업 */}
    <Popup open={addOpen} onClose={() => setAddOpen(false)} width="360px">
      <PopupHeader title={<><PlusCircle size={14} className="text-(--accent)"/>수업 추가</>}
                   onClose={() => setAddOpen(false)} /> {/* 부모에게 창닫기 소유권 위탁 */}

      
      <div className="p-4.5 flex flex-col gap-3">

        {/* 과목명 */}
        <div>
          <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">과목명</p>
          <input value={bForm.name} 
                 onChange={e => setBForm(p => ({ ...p, name:e.target.value }))}
                 placeholder="예: 자료구조"
                 className="w-full px-3 py-2 text-[12px] rounded-lg bg-(--surface) 
                            border border-(--border) text-(--text-1) 
                            placeholder:text-(--text-3) focus:outline-none 
                            focus:border-(--text-2) transition-colors" />
        </div>

        {/* 요일 */}
        <div>
          <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">요일</p>
          <div className="flex gap-1.5">
            {/* 1열은 시간 라벨이므로.. i+1+1 => i+2 로 매핑 */}
            {DAY_COLS.map((d, i) => (
              <button key={d} 
                      onClick={() => setBForm(p => ({ ...p, col:i+2 }))}
                      className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium 
                                  border transition-colors
                        ${bForm.col === i+2 
                            ? 'bg-(--accent) text-(--surface) border-(--accent)' 
                            : 'border-(--border) text-(--text-2) hover:bg-(--surface-2)'}`}>
                {d}
              </button> 
            ))}
          </div>
        </div>

        {/* 시작-종료 시간 입력 */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div>
            <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">시작 시간</p>
            <input type="time" value={bForm.startTime}
                   onChange={e => setBForm(p => ({ ...p, startTime:e.target.value }))}
                   className="w-full px-3 py-2 text-[12px] rounded-lg 
                              bg-(--surface) border border-(--border)
                              text-(--text-1) focus:outline-none
                              focus:border-(--text-2) transition-colors" />
          </div>

          <span className="text-(--text-3) pb-2">~</span>
          <div>
            <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">종료 시간</p>
            <input type="time" value={bForm.endTime}
                   onChange={e => setBForm(p => ({ ...p, endTime:e.target.value }))}
                   className="w-full px-3 py-2 text-[12px] rounded-lg 
                              bg-(--surface) border border-(--border)
                              text-(--text-1) focus:outline-none 
                              focus:border-(--text-2) transition-colors" />
          </div>
        </div>

        {/* 영역 구분 */}
        <div>
          <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">구분</p>
          <div className="flex gap-1.5">
            {TYPE_OPTS.map(t => (
              <button key={t.value} onClick={() => setBForm(p => ({ ...p, type:t.value }))}
                      className="flex-1 py-1.5 rounded-lg text-[10px] 
                                font-medium transition-colors border"
                      style={bForm.type === t.value
                        ? { background:`var(--timetable-${t.value}-bg)`, 
                            border:`1px solid var(--timetable-${t.value}-bd)`, 
                            color:`var(--timetable-${t.value}-text)` }
                        : { borderColor:'var(--border)', color:'var(--text-2)' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

      </div>

        {/* 취소|추가 버튼 */}
      <PopupFooter>
        <button onClick={() => setAddOpen(false)} 
                className="px-4 py-1.5 rounded-lg text-[12px] border 
                          border-(--border) text-(--text-2) 
                          hover:bg-(--surface-2) transition-colors">
                취소
        </button>
        <button onClick={addBlock} 
                className="px-4 py-1.5 rounded-lg text-[12px] font-semibold 
                            bg-(--text-1) text-(--surface) hover:opacity-85 
                            transition-opacity">
                추가
        </button>
      </PopupFooter>
      
    </Popup>

    {/* # 팝업2 시간표 블록 삭제 팝업 */}
    {editBlock && (
      <Popup open={true} onClose={() => setEditBlock(null)} width="260px">
        <PopupHeader title={editBlock.name} onClose={() => setEditBlock(null)} />

        <div className="p-4 flex flex-col gap-2">
          
          <div className="px-3 py-2 rounded-lg text-center text-[12px]"
               style={{ background:`var(--timetable-${editBlock.type}-bg)`, 
                        border:`1px solid var(--timetable-${editBlock.type}-bd)`, 
                        color:`var(--timetable-${editBlock.type}-text)` }}>
            {editBlock.time} &nbsp; · 
            &nbsp; {TYPE_OPTS.find(t => t.value === editBlock.type)?.label}
          </div>

          <button onClick={() => deleteBlock(editBlock.id)}
                  className="flex items-center justify-center gap-2 w-full py-2
                             rounded-lg text-[12px] border transition-colors
                             text-(--alert-warn) border-(--alert-border)
                             hover:bg-(--alert-warn-bg)">
            <Trash2 size={13}/> 삭제
          </button>
        </div>
      </Popup>
    )}
    </>
  );
}

export default Timetable;

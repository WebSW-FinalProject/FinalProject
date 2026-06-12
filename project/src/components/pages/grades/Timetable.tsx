
import { API_BASE } from '../../../api';
import { useState, useEffect } from 'react';
import { LayoutGrid, PlusCircle, Trash2 } from 'lucide-react';
import Popup, { PopupHeader, PopupFooter } from '../../ui/Popup';
import { useLang } from '../../../LangContext';

const TAB_IDS = [
  { id: 'timetable',   labelKey: 'ttTimetableTab',   icon: <LayoutGrid size={13}/>  },
  { id: 'addSchedule', labelKey: 'ttAddScheduleTab',  icon: <PlusCircle size={13}/>  },
]; // 시간표 | 일정추가

const DAY_COL_KEYS = ['ttMon','ttTue','ttWed','ttThu','ttFri']; // 번역 키
const TYPE_VALS  = ['b','p','c','g']; // 구분 값 (DB 저장용)
const TYPE_KEYS  = ['ttTypeReqMajor','ttTypeElectMajor','ttTypeLib','ttTypeOther']; // 번역 키


type Block   = { id:number; col:number; grid_row:string;
                 name:string; time:string; type:string };
                 // db 구조대로 가져옴. (sql schema 참조)

type DayTime = { col:number; startTime:string; endTime:string };
               // 요일별 시간대 (수업 추가 팝업 - 요일 선택 시 생성)


const COL_TO_DAY: Record<number, string> = {
   2:'월', 3:'화', 4:'수', 5:'목', 6:'금'
  }; // col 번호 => 요일 (1열은 시간 라벨이므로 2부터 시작)


  
// 과목 순서대로 색 배정 (추가된 순서 기준, 같은 과목명 = 같은 색)
const COLOR_KEYS = ['b', 'p', 'c', 'g', 'v', 'i', 'l', 'n'];

function buildColorMap(blocks: Block[]) {
  const map: Record<string, string> = {};
  let count = 0;

  for (const b of blocks) {
    if (!map[b.name]) {
      map[b.name] = COLOR_KEYS[count % COLOR_KEYS.length];
      count++;
    }
  }
  
  return map;
}




// 과목 목록 추출 (같은 이름 = 같은 과목으로 취급)
function getCoursesFromBlocks(blocks: Block[]) {
  const courses: any[] = [];

  for (const b of blocks) {
    const found = courses.find(c => c.name === b.name);
    // 이미 추가된 과목인지 확인

    if (!found) {
      courses.push({
        name: b.name, type: b.type,
        cols:  [b.col],
        times: [{ col: b.col, time: b.time }],
      });
    }
    else if (!found.cols.includes(b.col)) { // 같은 과목 추가인 경우
      found.cols.push(b.col);
      found.times.push({ col: b.col, time: b.time }); 
      // 요일정보 + 시간정보 push 
    }
  }

  // cols/times 정렬 후 표시용 문자열 생성
  for (const c of courses) {
    c.cols.sort((a: number, z: number) => a - z);
    c.times.sort((a: any, z: any) => a.col - z.col);

    // ex) "월 10:00~12:00 · 수 10:00~12:00"
    const timeLabels: string[] = [];
    for (const t of c.times) {
      timeLabels.push(`${COL_TO_DAY[t.col]} ${t.time}`);
    }
    c.timeStr = timeLabels.join(' · ');
  }

  return courses;
}

// D-day 계산 : 오늘 기준 남은 일수 (Date 활용 AI 도움)
function calcDday(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

// "년도(4)-달(2)-일(2)", "시간(2):분(2):초"
// =>  "N월 M일 (요일) 시간(2):분(2)" 형식으로 변환
function formatEventDate(dateStr: string, timeStr: string | null) {
  const dayNames = ['일','월','화','수','목','금','토'];
  const d = new Date(dateStr + 'T00:00:00');
  const base = `${d.getMonth()+1}월 ${d.getDate()}일 (${dayNames[d.getDay()]})`;
  if (timeStr) return base + ' ' + timeStr.slice(0, 5); // "09:00:00" => "09:00"
  return base;
}




function Timetable() {

  const { t } = useLang();

  // 번역된 배열 (렌더 시점에 생성)
  const DAY_COLS  = DAY_COL_KEYS.map(k => t(k));  // ['월','화','수','목','금'] or translated
  const TYPE_OPTS = TYPE_VALS.map((v, i) => ({ value: v, label: t(TYPE_KEYS[i]) }));

  // 일정 이벤트 타입: DB 값(한국어) → 번역 표시 레이블
  const EV_TYPE_LABEL: Record<string, string> = {
    '과제': t('ttEvAssignment'), '시험': t('ttEvExam'),
    '발표': t('ttEvPresentation'), '프로젝트': t('ttEvProject'), '기타': t('ttEvOther'),
  };
  const EV_TYPE_VALS = ['과제','시험','발표','프로젝트','기타'] as const;

  const [tab, setTab] = useState('timetable'); // 시간표 | 일정추가 탭 관리
  const isTable = (tab === TAB_IDS[0].id);


  const [evForm, setEvForm] = useState(
    { title:'', date:'', time:'', type:'과제', memo:'' }
  ); // evForm = 일정 data 구조 명시 + 추가할 객체 상태 관리


  const [addOpen, setAddOpen] = useState(false); // 수업 추가 팝업 관리
  const [editBlock, setEditBlock] = useState<Block | null>(null);
  // 수업 추가 폼 상태 (요일col, 시작시간 row인덱스, 수업길이, 과목명, 타입)

  
  // 시간표 블럭 (DB 연결)
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [bForm, setBForm] = useState({
    name: '', type: 'b',
    dayTimes: [{ col:2, startTime:'09:00', endTime:'11:00' }] as DayTime[],
  }); // 시간표 블럭 추가폼 초기형식 (dayTimes: 요일별 강의시간 배열)

  // 내 일정 목록 (DB 연결)
  const [events, setEvents] = useState<any[]>([]); 
  const dDayWarn = 3; // 3일 전부터 warning
  const colorMap = buildColorMap(blocks); // 과목명 => 색 키 매핑 

  // 수업 추가 - 요일별 시작~종료시간 관리
  function updateDayTime(
    col: number, field: 'startTime' | 'endTime', val: string) {
    const next: DayTime[] = [];

    for (const d of bForm.dayTimes) {
      if (d.col !== col) { next.push(d); } 
      else if (field === 'startTime') {
        next.push({ col: d.col, startTime: val, endTime: d.endTime });
      } 
      else {
        next.push({ col: d.col, startTime: d.startTime, endTime: val });
      }
    }

    setBForm(p => ({ ...p, dayTimes: next }));
  }




  // #### 백엔드 연결 코드 - 시간표 블럭 DB 저장
  //      ( back api 추가 (6.11 명세 갱신) )

    // 시간표 블럭 불러오기 (GET /api/timetable)
    async function loadBlocks() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`${API_BASE}/api/timetable`, {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (!res.ok) return; 
        const data = await res.json();
        setBlocks(data);
      }
      catch (e) { console.error('블럭 로드 실패:', e); }
    }

    // 시간표 블럭 추가 로직 (back 연결을 위해 async 추가)
    async function addBlock() {
      if (bForm.dayTimes.length === 0) return;
         // 요일 미선택 : 동작 X

      try {
        const token = localStorage.getItem('token') || '';
        const newBlocks: Block[] = [];
        const overlapDays: string[] = []; // 겹친요일 넣음 (len: alert용)

        // 선택한 요일마다 각각 DB에 저장 (요일별로 시간대 다름)
        for (const dt of bForm.dayTimes) {
          const startRow = parseInt(dt.startTime.split(':')[0]) - 8;
          const endRow   = parseInt(dt.endTime.split(':')[0])   - 8;
            // 09:00 =(split)=> 09 =parseInt=> 9 => 1(교시)
            // 로직은 기존 mock 처리때와 동일함

          // 범위 외 시간이면 처리 안하고 넘김 (처리가능한애만 처리)
          if (endRow <= startRow || startRow < 1 || endRow > 9) continue;

          // 겹치는 블럭 : 해당 요일 스킵 + 수집 (alert용)
          let hasOverlap = false;
          for (const b of blocks) {
            if (b.col !== dt.col) continue;
            
            const parts  = b.grid_row.split('/');
            const bStart = parseInt(parts[0]);
            const bEnd   = parseInt(parts[1]);
            if (startRow < bEnd && bStart < endRow) {
              hasOverlap = true;
              break;
            }
          }
          if (hasOverlap) {
            overlapDays.push(COL_TO_DAY[dt.col]);
            continue;
          }

          const res = await fetch(`${API_BASE}/api/timetable`, {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + token,
                      'Content-Type': 'application/json' },
            body: JSON.stringify({
              col:      dt.col,
              grid_row: `${startRow}/${endRow}`,
              name:     bForm.name || t('ttNewClass'),
              time:     `${dt.startTime}~${dt.endTime}`,
              type:     bForm.type,
            }),
          });
          const data = await res.json();
          if (!data.ok) continue;

          // DB에서 발급된 id로 블럭 추가
          newBlocks.push({
            id: data.id, col: dt.col,
            grid_row: `${startRow}/${endRow}`,
            name: bForm.name || t('ttNewClass'),
            time: `${dt.startTime}~${dt.endTime}`,
            type: bForm.type,
          });
        }

        setBlocks([...blocks, ...newBlocks]);

        // 겹친 요일이 있으면 알림
        if (overlapDays.length > 0) {
          alert(`[${overlapDays.join(', ')}] 시간대가 기존 수업과 겹칩니다.
                 \n기존 수업을 먼저 삭제한 후 다시 추가해 주세요.`);
        }
      }
      catch (e) { console.error('블럭 저장 실패:', e); }

      setAddOpen(false); // 팝업 자동 닫기
      setBForm({ name:'', type:'b', 
         dayTimes:[{ col:2, startTime:'09:00', endTime:'11:00' }] 
      }); // 폼 초기화
    }

    // 시간표 블럭 삭제 로직 (back 연결을 위해 async 추가)
    async function deleteBlock(id: number) {
      try {
        const token = localStorage.getItem('token') || '';
        await fetch(`${API_BASE}/api/timetable/${id}`, {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + token },
        });

        setBlocks(blocks.filter(b => b.id !== id));
        setEditBlock(null);
      }
      catch (e) { console.error('블럭 삭제 실패:', e); }
    }



  // #### 백엔드 연결 코드 - 일정 DB저장
  //      ( back api 추가 (6.10 명세 갱신) )

    // 일정 불러오기 (GET /api/schedule)
    async function loadEvents() {
      try {
        const token = localStorage.getItem('token') || '';
      
        const res = await fetch(`${API_BASE}/api/schedule`, {
          headers: { Authorization: 'Bearer ' + token },
        });
        const data = await res.json();
        // DB에서 event_date가 ISO 문자열로 오면 "YYYY-MM-DD"만 잘라냄
        setEvents(data.map((ev: any) => ({
          ...ev,
          event_date: ev.event_date ? String(ev.event_date).slice(0, 10) : ev.event_date,
        })));
      } 
      catch (e) {
        console.error('일정 로드 실패:', e); 
        }
    }

    // 일정 저장 (POST /api/schedule)
    async function saveEvent() {
      if (!evForm.title || !evForm.date) return;
      try {
        const token = localStorage.getItem('token') || '';
        await fetch(`${API_BASE}/api/schedule`, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 
                    'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: evForm.title,
            event_date: evForm.date,
            event_time: evForm.time || null,
            type: evForm.type,
            memo: evForm.memo || null,
          }),
        });

        setEvForm(
          { title:'', date:'', time:'', type:'과제', memo:'' }
        ); // 폼 초기화
        loadEvents(); // 변경했으면 다시 불러오기 해서 display
      } 
      catch (e) { 
        console.error('일정 저장 실패:', e);
      }
    }

    // 일정 삭제 (DELETE /api/schedule/:id)
    async function deleteEvent(id: number) {
      try {
        const token = localStorage.getItem('token') || '';
        await fetch(`${API_BASE}/api/schedule/${id}`, {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + token },
        });
        loadEvents();
      } 
      catch (e) {
        console.error('일정 삭제 실패:', e); 
        }
    }

  useEffect(() => { loadBlocks(); loadEvents(); }, []); 
  // 마운트 시 시간표+일정 불러오기



  return (
    <>
    <div className="p-3.5 pb-10 w-full">

      {/* Tab : A 시간표 | B 일정추가 */}
      <div className="flex flex-row mb-4 gap-1.5 mx-4">
        {TAB_IDS.map(({ id, labelKey, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg
                        text-[12px] font-medium transition-colors whitespace-nowrap
              ${tab === id
                ? 'bg-(--accent) text-(--surface) font-bold'
                : 'text-(--text-2) hover:bg-(--surface-2) hover:text-(--text-1)'
              }`}>
            {icon} {t(labelKey)}
          </button>
        ))}
      </div>

      <div className="mx-3">
        {/* #A 시간표 */}
        {isTable && (
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-3.5">

            {/* ##A1 이번 학기 시간표 */}
            <div className="bg-(--surface) rounded-xl border card-enter
                            border-(--border) overflow-hidden pr-2"
                style={{ boxShadow: 'var(--shadow-card)' }}>
              {/* 시간표 헤더 */}
              <div className="px-4 py-3 border-b border-(--border) 
                              flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[13px]"> {t('ttMyTimetable')} </span>
                </div>

                <button
                  onClick={() => setAddOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-lg
                             bg-(--text-1) text-(--surface) hover:opacity-85 transition-opacity">
                  <PlusCircle size={12}/> {t('ttAddClass')}
                </button>
              </div>

              {/* 시간표 */}
              <div className="p-3">
                {/* #1 요일 (주말 추가할 가능성 있음) */}
                <div className="grid mb-1 text-center text-[10px] 
                                font-bold text-(--text-2) gap-1 pb-2"
                    style={{ gridTemplateColumns: '32px repeat(5,1fr)' }}>
                  <div/>
                  {[t('ttMonFull'),t('ttTueFull'),t('ttWedFull'),t('ttThuFull'),t('ttFriFull')].map(
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
                          gridRow: b.grid_row,
                          background: `var(--timetable-${colorMap[b.name]}-bg)`,
                          border: `1px solid var(--timetable-${colorMap[b.name]}-bd)`,
                          color: `var(--timetable-${colorMap[b.name]}-text)`,
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
            <div className="flex flex-col gap-2.5 h-full card-enter stagger-1">

              {/* ##A2-1 수강 과목 (main dash 참조) */}
              <div className="bg-(--surface) rounded-xl border 
                              border-(--border) overflow-hidden flex-none"
                  style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="px-3.5 py-2.5 border-b border-(--border)">
                  <span className="font-bold text-[12px]">{t('ttCourses')}</span>
                </div>

                <div className="px-3 py-2 flex flex-col gap-1">
                  {getCoursesFromBlocks(blocks).map(c => (
                    <div key={c.name} className="flex items-center gap-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: `var(--timetable-${colorMap[c.name]}-bd)` }} />
                      <div className="min-w-0 flex items-baseline gap-2 flex-1">
                        <p className="text-[12px] font-semibold text-(--text-1)">{c.name}</p>
                        <p className="text-[10px] text-(--text-3) truncate">
                          {c.timeStr}
                        </p>
                      </div>
                    </div>
                  ))}
                  {blocks.length === 0 && (
                    <p className="text-[11px] text-(--text-3) py-1">{t('ttNoClasses')}</p>
                  )}
                </div>
              </div>

              {/* ##A2-2 다가오는 일정 (side bar 참조) */}
              <div className="bg-(--surface) rounded-xl border border-(--border)
                              overflow-hidden flex-1"
                  style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="px-3.5 py-2.5 border-b border-(--border)">
                  <span className="font-bold text-[12px]">{t('ttUpcoming')}</span>
                </div>
                <div className="flex flex-col divide-y divide-(--border)">
                  {events.slice(0, 5).map(ev => {
                    const dDay = calcDday(ev.event_date);
                    const warn = dDay <= dDayWarn;
                    return (
                      <div key={ev.id}
                          className="flex items-center gap-2.5 px-3.5 py-2
                                      hover:bg-(--surface-2)
                                      transition-colors cursor-pointer">
                        <span className={`px-1.5 py-0.5 rounded-full
                                          text-[9px] font-bold shrink-0
                          ${warn
                            ? 'bg-(--warn-bg) text-(--warn-text)'
                            : 'bg-(--surface-2) text-(--text-2) border border-(--border)'
                          }`}>
                          D-{dDay}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-(--text-1)">
                            {ev.title}
                          </p>
                          <p className="text-[10px] text-(--text-3)">
                            {formatEventDate(ev.event_date, ev.event_time)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {events.length === 0 && (
                    <div className="flex items-center justify-center py-6
                                    text-[11px] text-(--text-3)">
                      {t('ttNoEvents')}
                    </div>
                  )}
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
            <div className="bg-(--surface) rounded-xl border card-enter
                            border-(--border) overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-4.5 py-3 border-b border-(--border)">
                <span className="font-bold text-[13px]">{t('ttAddEvent')}</span>
              </div>
              <div className="p-4.5 flex flex-col gap-3">
                <div>
                  {/* 제목 */}
                  <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">{t('ttTitle')}</p>
                  <input
                    type="text"
                    value={evForm.title}
                    onChange={e => setEvForm(p => ({ ...p, title: e.target.value }))}
                    placeholder={t('ttTitlePh')}
                    className="w-full px-3 py-2 text-[12px] rounded-lg
                              bg-(--surface) border border-(--border) text-(--text-1)
                              placeholder:text-(--text-3) focus:outline-none
                              focus:border-(--text-2) transition-colors"/>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    {/* 날짜 */}
                    <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">{t('ttDate')}</p>
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
                    <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">{t('ttTime')}</p>
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
                  <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">{t('ttCategory')}</p>
                  <select
                    value={evForm.type}
                    onChange={e => setEvForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2 text-[12px] rounded-lg
                              bg-(--surface) border border-(--border) text-(--text-1)
                              focus:outline-none focus:border-(--text-2) transition-colors">
                    {EV_TYPE_VALS.map(ev => (
                      <option key={ev} value={ev}>{EV_TYPE_LABEL[ev]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  {/* 메모 */}
                  <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">
                    {t('ttMemo')} <span className="font-normal text-(--text-3)">{t('ttOptional')}</span>
                  </p>
                  <textarea
                    value={evForm.memo}
                    onChange={e => setEvForm(p => ({ ...p, memo: e.target.value }))}
                    placeholder={t('ttMemoPh')}
                    className="w-full h-18 px-3 py-2 text-[12px] rounded-lg resize-none
                              bg-(--surface) border border-(--border) text-(--text-1)
                              placeholder:text-(--text-3) focus:outline-none
                              focus:border-(--text-2) transition-colors"/>
                </div>

                {/* 일정 저장 버튼 추가 @ */}
                <button
                  onClick={saveEvent}
                  disabled={!evForm.title || !evForm.date}
                  className="px-4 py-2 rounded-lg text-[12px] font-semibold w-full
                             bg-(--text-1) text-(--surface) hover:opacity-85
                             transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                  {t('ttSaveEvent')}
                </button>
              </div>
            </div>

            {/* ##B2 내 일정 목록 */}
            <div className="bg-(--surface) rounded-xl border card-enter stagger-1
                            border-(--border) overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-4.5 py-3 border-b border-(--border) 
                              flex justify-between items-center">
                <span className="font-bold text-[13px]">{t('ttMyEvents')}</span>
                <span className="text-[11px] text-(--text-3)">
                  {events.length}개
                </span>
              </div>
              <div className="flex flex-col divide-y divide-(--border)">
                {events.map(ev => {
                  const dDay = calcDday(ev.event_date);
                  const warn = dDay <= dDayWarn;
                  return (
                    <div key={ev.id}
                        className="flex items-center gap-3 px-4.5 py-3
                                    hover:bg-(--surface-2)
                                    transition-colors cursor-pointer">
                      <span className={`px-2 py-0.5 rounded-full text-[9px]
                                        font-bold shrink-0
                        ${warn
                          ? 'bg-(--warn-bg) text-(--warn-text)'
                          : 'bg-(--badge-neutral-bg) text-(--badge-neutral-text)'
                        }`}>
                        D-{dDay}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-(--text-1)">{ev.title}</p>
                        <p className="text-[10px] text-(--text-3)">
                          {formatEventDate(ev.event_date, ev.event_time)}
                          {ev.type !== '기타' && ` · ${EV_TYPE_LABEL[ev.type] ?? ev.type}`}
                        </p>
                      </div>

                      {/* 삭제 기능 추가 @ */}
                      <button
                        onClick={() => deleteEvent(ev.id)}
                        className="text-[10px] text-(--text-3)
                                   hover:text-(--warn-text) transition-colors">
                        {t('delete')}
                      </button>
                    </div>
                  );
                })}
                {events.length === 0 && (
                  <div className="flex items-center justify-center py-8
                                  text-[11px] text-(--text-3)">
                    {t('ttNoEvents')}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>

    {/* #팝업1 : 시간표 - 수업 추가 팝업 */}
    <Popup open={addOpen} onClose={() => setAddOpen(false)} width="360px">
      <PopupHeader title={<><PlusCircle size={14} className="text-(--accent)"/>{t('ttAddClassTitle')}</>}
                   onClose={() => setAddOpen(false)} /> {/* 부모에게 창닫기 소유권 위탁 */}


      <div className="p-4.5 flex flex-col gap-3">

        {/* 과목명 */}
        <div>
          <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">{t('ttCourseName')}</p>
          <input value={bForm.name} 
                 onChange={e => setBForm(p => ({ ...p, name:e.target.value }))}
                 placeholder={t('ttCourseNamePh')}
                 className="w-full px-3 py-2 text-[12px] rounded-lg bg-(--surface) 
                            border border-(--border) text-(--text-1) 
                            placeholder:text-(--text-3) focus:outline-none 
                            focus:border-(--text-2) transition-colors" />
        </div>

        {/* 요일 */}
        <div>
          <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">{t('ttDay')}</p>
          <div className="flex gap-1.5">
            {/* 1열은 시간 라벨이므로 i+2 로 매핑 */}
            {DAY_COLS.map((d, i) => {
              const colNum  = i + 2;
              const selected = bForm.dayTimes.find(dt => dt.col === colNum);
              return (
                <button key={d}
                        onClick={() => {
                          if (selected) {
                            // 이미 선택된 요일 => 해제
                            setBForm(p => ({ ...p, dayTimes: p.dayTimes.filter(dt => dt.col !== colNum) }));
                          } else {
                            // 새로 선택 => 기본 시간으로 추가
                            setBForm(p => ({ ...p, dayTimes: [...p.dayTimes, { col:colNum, startTime:'09:00', endTime:'11:00' }] }));
                          }
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium
                                    border transition-colors
                          ${selected
                              ? 'bg-(--accent) text-(--surface) border-(--accent)'
                              : 'border-(--border) text-(--text-2) hover:bg-(--surface-2)'}`}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택된 요일별 시간 입력 (요일마다 다른 시간대 설정 가능) */}
        {[...bForm.dayTimes]
         .sort((a, z) => a.col - z.col)
         .map(dt => (
          <div key={dt.col} className="grid grid-cols-[28px_1fr_auto_1fr] items-end gap-2">

            {/* 요일 라벨 */}
            <span className="text-[12px] font-bold pb-2 text-center"
                  style={{ color:'var(--accent)' }}>
              {COL_TO_DAY[dt.col]}
            </span>

            <div>
              <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">{t('ttStart')}</p>
              <input type="time" value={dt.startTime}
                     onChange={e => updateDayTime(dt.col, 'startTime', e.target.value)}
                     className="w-full px-3 py-2 text-[12px] rounded-lg
                                bg-(--surface) border border-(--border)
                                text-(--text-1) focus:outline-none
                                focus:border-(--text-2) transition-colors" />
            </div>

            <span className="text-(--text-3) pb-2">~</span>

            <div>
              <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">{t('ttEnd')}</p>
              <input type="time" value={dt.endTime}
                     onChange={e => updateDayTime(dt.col, 'endTime', e.target.value)}
                     className="w-full px-3 py-2 text-[12px] rounded-lg
                                bg-(--surface) border border-(--border)
                                text-(--text-1) focus:outline-none
                                focus:border-(--text-2) transition-colors" />
            </div>

          </div>
        ))}

        {/* 영역 구분 */}
        <div>
          <p className="text-[11px] font-semibold text-(--text-2) mb-1.5">{t('ttType')}</p>
          <div className="flex gap-1.5">
            {TYPE_OPTS.map(opt => (
              <button key={opt.value} onClick={() => setBForm(p => ({ ...p, type:opt.value }))}
                      className="flex-1 py-1.5 rounded-lg text-[10px]
                                font-medium transition-colors border"
                      style={bForm.type === opt.value
                        ? { background:`var(--timetable-${opt.value}-bg)`,
                            border:`1px solid var(--timetable-${opt.value}-bd)`,
                            color:`var(--timetable-${opt.value}-text)` }
                        : { borderColor:'var(--border)', color:'var(--text-2)' }}>
                {opt.label}
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
                {t('cancel')}
        </button>
        <button onClick={addBlock}
                className="px-4 py-1.5 rounded-lg text-[12px] font-semibold
                            bg-(--text-1) text-(--surface) hover:opacity-85
                            transition-opacity">
                {t('add')}
        </button>
      </PopupFooter>
      
    </Popup>

    {/* # 팝업2 시간표 블록 삭제 팝업 */}
    {editBlock && (
      <Popup open={true} onClose={() => setEditBlock(null)} width="260px">
        <PopupHeader title={editBlock.name} onClose={() => setEditBlock(null)} />

        <div className="p-4 flex flex-col gap-2">
          
          <div className="px-3 py-2 rounded-lg text-center text-[12px]"
               style={{ background:`var(--timetable-${colorMap[editBlock.name]}-bg)`,
                        border:`1px solid var(--timetable-${colorMap[editBlock.name]}-bd)`,
                        color:`var(--timetable-${colorMap[editBlock.name]}-text)` }}>
            {editBlock.time} &nbsp; ·
            &nbsp; {TYPE_OPTS.find(opt => opt.value === editBlock.type)?.label}
          </div>

          <button onClick={() => deleteBlock(editBlock.id)}
                  className="flex items-center justify-center gap-2 w-full py-2
                             rounded-lg text-[12px] border transition-colors
                             text-(--alert-warn) border-(--alert-border)
                             hover:bg-(--alert-warn-bg)">
            <Trash2 size={13}/> {t('delete')}
          </button>
        </div>
      </Popup>
    )}
    </>
  );
}

export default Timetable;




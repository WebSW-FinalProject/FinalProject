
import { useState, useEffect } from 'react';
import type { Section, Page } from '../../hooks/useNavigation';
import type { GradesSummary } from '../pages/grades/Dashboard';

import {
  LayoutGrid, Activity, Calendar, HelpCircle,
  MessageSquare, ClipboardList, ChevronsLeft,
} from 'lucide-react';


interface SidebarProps {
  section: Section;
  page: Page;
  goTo: (s: Section, p?: Page) => void;
  setPage: (p: Page) => void;
  username: string;
  deptLabel: string;
  gradesSummary?: GradesSummary | null; 
  // Dash 정보 Sidebar 전달 (props로 전파:App.tsx)
}


// PageNav 요소들 
const gradeNav = [
  { id: 'dashboard' as Page, label: '대시보드',    Icon: LayoutGrid  },
  { id: 'credits'   as Page, label: '학점현황',    Icon: Activity    },
  { id: 'timetable' as Page, label: '시간표',      Icon: Calendar    },
  { id: 'ai'        as Page, label: 'AI 성적분석', Icon: HelpCircle  },
];

// D-day 계산 (Timetable.tsx 참조)
function calcDday(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

// D-day 값에 따라 색상 결정
function getDdayColor(dday: number) {
  if (dday <= 3)  return 'var(--alert-warn)';
  if (dday <= 7)  return 'var(--accent)';
  return 'var(--bar-track)';
}



function Sidebar({ section, page, goTo, setPage, 
                   username, deptLabel, gradesSummary }: SidebarProps) {
  
  const [collapsed, setCollapsed] = useState(false);

  // 다가오는 일정 — /api/schedule 연결 (Timetable.tsx ref)
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    async function loadEvents() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('http://localhost:3000/api/schedule', {
          headers: { Authorization: 'Bearer ' + token },
        });
        const data = await res.json();
        setEvents(data.map((ev: any) => ({
          ...ev,
          event_date: ev.event_date ? String(ev.event_date).slice(0, 10) : ev.event_date,
        })));
      } 
      catch (e) { console.error('일정 로드 실패:', e); }
    }
    loadEvents();
  }, []);
  const isActive = (p: Page) => section === 'grades' && page === p;
  // 

  // md~lg: 항상 아이콘만 / lg+: collapsed 상태에 따라
  // text는 collapsed 이거나 lg 미만이면 숨김 
  //  => 미니 사이드바! (프로필아이콘+각 아이콘+border (span))
  // lg:block (<p>, <div>)  lg:inline (<span> .. )
  const txt   = collapsed ? 'hidden' : 'hidden lg:block';  
  const inTxt = collapsed ? 'hidden' : 'hidden lg:inline'; 

  
  return (
    <aside
      className={`max-md:hidden flex flex-col shrink-0
                  bg-(--surface) border-r border-(--border)
                  py-2 px-1 transition-all duration-200
                  sticky top-12.5 h-[calc(100vh-50px)] overflow-y-auto
                  w-12 ${!collapsed ? 'lg:w-48 lg:px-1.5' : ''}`}>
      {/* 사이드바는 접혔을 때 넓이 없애서 화면 키워도 미니 바로 유지! */}

      {/* 프로필 연결 @ (header.tsx 동일) */}
      <div className={`flex items-center gap-2 px-1 py-3 mb-1
                       ${!collapsed ? 'lg:justify-start' : ''} justify-center`}>
        <div className="w-8 h-8 rounded-lg bg-(--navy) text-white
                        flex items-center justify-center text-xs font-bold shrink-0">
          {username.charAt(0)}
        </div>
        <div className={`min-w-0 ${txt}`}> {/* txt로 숨겨짐! */}
          <p className="text-[12px] font-bold text-(--text-1) truncate">{username}</p>
          <p className="text-[9px] text-(--text-3) truncate">{deptLabel}</p>
        </div>
      </div>

      {/* 학점관리 */}
      <p className={`px-2.5 pt-1 pb-1 text-[9px] font-bold 
                     text-(--text-3) uppercase tracking-widest ${txt}`}>
        학점관리
      </p>
      {gradeNav.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => { goTo('grades'); setPage(id); }}
          title={label}
          className={`flex items-center gap-2 w-full rounded-[7px]
                      text-[11px] font-medium transition-colors
                      justify-center mb-1 cursor-pointer
                      ${!collapsed ? 'lg:justify-start lg:px-2 lg:py-1.5' : ''}
                      ${isActive(id)
                        ? 'bg-(--accent-bg) text-(--accent) font-bold'
                        : 'text-(--text-2) hover:bg-(--surface-2)'
                      }`} >
          <Icon size={13} strokeWidth={isActive(id) ? 2.5 : 2} />
          <span className={inTxt}>{label}</span>
        </button>
      ))}

      <div className="h-px bg-(--border) my-2 mx-1" />

      {/* 게시판 */}
      <p className={`px-2.5 pb-1 text-[9px] font-bold text-(--text-3) 
                     uppercase tracking-widest ${txt}`}>
        게시판
      </p>
      <button
        onClick={() => goTo('board')}
        title="게시판"
        className={`flex items-center gap-2 w-full rounded-[7px]
                    text-[12px] font-medium transition-colors
                    justify-center px-0 py-2.5 cursor-pointer
                    ${!collapsed ? 'lg:justify-start lg:px-2.5 lg:py-2' : ''}
                    ${section === 'board'
                      ? 'bg-(--accent-bg) text-(--accent) font-bold'
                      : 'text-(--text-2) hover:bg-(--surface-2)'
                    }`}>
        <MessageSquare size={13} strokeWidth={2} />
        <span className={inTxt}>게시판</span>
      </button>

      <div className="h-px bg-(--border) my-2 mx-1" />

      {/* 수강신청 */}
      <p className={`px-2.5 pb-1 text-[9px] font-bold text-(--text-3)
                     uppercase tracking-widest ${txt}`}>
        수강신청 관리
      </p>
      <button
        onClick={() => goTo('courses')}
        title="수강신청"
        className={`flex items-center gap-2 w-full rounded-[7px]
                    text-[12px] font-medium transition-colors
                    justify-center px-0 py-2.5 cursor-pointer
                    ${!collapsed ? 'lg:justify-start lg:px-2.5 lg:py-2' : ''}
                    ${section === 'courses'
                      ? 'bg-(--accent-bg) text-(--accent) font-bold'
                      : 'text-(--text-2) hover:bg-(--surface-2)'
                    }`} >
        <ClipboardList size={13} strokeWidth={2} />
        <span className={inTxt}>수강신청</span>
      </button>

      {/* 이번 학기 요약 | 다가오는 일정 (일정: 임시, 하드코딩..)*/}
      <div className={txt}>
        <div className="h-px bg-(--border) my-2 mx-1" />
        <p className="px-2.5 pb-1 text-[9px] font-bold text-(--text-3) 
                      uppercase tracking-widest">
          이번 학기 요약
        </p>
        <div className="px-2.5 flex flex-col gap-1 mb-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-(--text-3)">누적 GPA</span>
            <b className="text-(--text-1)">
              {gradesSummary ? gradesSummary.avgGPA.toFixed(2) : '-'}
            </b>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-(--text-3)">이번 학기</span>
            <b className="text-(--text-1)">
              {gradesSummary ? gradesSummary.currentCredits + ' cr' : '-'}
            </b>
          </div>
          <div className="h-1 rounded-full bg-(--bar-track) my-1 overflow-hidden">
            <div className="h-full rounded-full bg-(--bar)"
                 style={{ width: (gradesSummary?.gradPct ?? 0) + '%' }} />
          </div>
          <p className="text-[9px] text-(--text-3)">
            졸업학점 {gradesSummary ? `${gradesSummary.earnedTotal} / ${gradesSummary.gradTotal || 140} (${gradesSummary.gradPct}%)` : '- / -'}
          </p>
        </div>


        <div className="h-px bg-(--border) my-2 mx-1" />
        <p className="px-2.5 pb-1 text-[9px] font-bold text-(--text-3)  
                      uppercase tracking-widest">
          다가오는 일정
        </p>
        <div className="flex flex-col gap-0.5 mb-2">
          {events.slice(0, 4).map(ev => { 
            // 시간표 탭 일정 정보 연결 (같은 로직)
            const dday = calcDday(ev.event_date);
            const color = getDdayColor(dday);
            const d = new Date(ev.event_date + 'T00:00:00');
            const dateLabel = `${d.getMonth()+1}/${d.getDate()} · D-${dday}`;
            return (
              <div key={ev.id}
                   className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg m-0.5
                              cursor-pointer hover:bg-(--surface-2) transition-colors">
                <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                      style={{
                        background: color,
                        border: dday > 7 ? '1px solid var(--border)' : 'none'
                        // 7일 초과면 색 구분 어려우니 boarder 추가 ..
                      }} />
                <div>
                  <p className="text-[11px] font-semibold text-(--text-1)">{ev.title}</p>
                  <p className="text-[10px] text-(--text-3)">{dateLabel}</p>
                </div>
              </div>
            );
          })}
          {events.length === 0 && (
            <p className="text-[10px] text-(--text-3) px-2.5 py-1">일정 없음</p>
          )}
        </div>
      </div>

      {/*접기 버튼 */}
      <div className="mt-auto pt-2 border-t border-(--border) hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-1.5 w-full px-2.5 py-2 rounded-[7px]
                      text-[11px] text-(--text-3) hover:bg-(--surface-2) 
                      transition-colors cursor-pointer
                      ${collapsed ? 'justify-center' : ''}`}>
          <ChevronsLeft
            size={14}
            className={`transition-transform duration-200 
                        ${collapsed ? 'rotate-180' : ''}`}
          />
          {!collapsed && '접기'}
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;

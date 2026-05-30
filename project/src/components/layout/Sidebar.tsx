
import { useState } from 'react';
import type { Section, Page } from '../../hooks/useNavigation';

import {
  LayoutGrid, Activity, Calendar, HelpCircle,
  MessageSquare, ClipboardList, ChevronsLeft,
} from 'lucide-react';


interface SidebarProps {
  section: Section;
  page: Page;
  goTo: (s: Section, p?: Page) => void;
  setPage: (p: Page) => void;
}


// PageNav 요소들 
const gradeNav = [
  { id: 'dashboard' as Page, label: '대시보드',    Icon: LayoutGrid  },
  { id: 'credits'   as Page, label: '학점현황',    Icon: Activity    },
  { id: 'timetable' as Page, label: '시간표',      Icon: Calendar    },
  { id: 'ai'        as Page, label: 'AI 성적분석', Icon: HelpCircle  },
];

// 일정 추가와 연동.. (임시, 하드코딩)
const EVENTS = [
  { label: '자료구조 중간고사', date: '5/28 · D-3', color: '#EF4444'          },
  { label: '알고리즘 과제',     date: '6/1 · D-7',  color: 'var(--accent)'    },
  { label: '영어회화 발표',     date: '6/8 · D-14', color: 'var(--bar-track)' },
];



function Sidebar({ section, page, goTo, setPage }: SidebarProps) {
  
  const [collapsed, setCollapsed] = useState(false);
  const isActive = (p: Page) => section === 'grades' && page === p;

  // md~lg: 항상 아이콘만 / lg+: collapsed 상태에 따라
  // text는 collapsed 이거나 lg 미만이면 숨김 
  //  => 미니 사이드바! (프로필아이콘+각 아이콘+border (span))
  // lg:block (<p>, <div>)  lg:inline (<span> .. )
  const txt   = collapsed ? 'hidden' : 'hidden lg:block';  
  const inTxt = collapsed ? 'hidden' : 'hidden lg:inline'; 

  
  return (
    <aside
      className={`max-sm:hidden flex flex-col shrink-0
                  bg-(--surface) border-r border-(--border)
                  py-2 px-1 transition-all duration-200
                  sticky top-14.5 h-[calc(100vh-58px)] overflow-y-auto
                  w-12 ${!collapsed ? 'lg:w-48 lg:px-1.5' : ''}`}>
      {/* 사이드바는 접혔을 때 넓이 없애서 화면 키워도 미니 바로 유지! */}

      {/* 프로필 (임시, 하드코딩) */}
      <div className={`flex items-center gap-2 px-1 py-3 mb-1
                       ${!collapsed ? 'lg:justify-start' : ''} justify-center`}>
        <div className="w-8 h-8 rounded-lg bg-(--navy) text-white
                        flex items-center justify-center text-xs font-bold shrink-0">
          이
        </div>
        <div className={`min-w-0 ${txt}`}> {/* txt로 숨겨짐! */}
          <p className="text-[12px] font-bold text-(--text-1) truncate">이문세</p>
          <p className="text-[9px] text-(--text-3) truncate">소프트웨어학부 3학년</p>
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
                      justify-center px-0 py-2
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
                    justify-center px-0 py-2.5
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
                    justify-center px-0 py-2.5
                    ${!collapsed ? 'lg:justify-start lg:px-2.5 lg:py-2' : ''}
                    ${section === 'courses'
                      ? 'bg-(--accent-bg) text-(--accent) font-bold'
                      : 'text-(--text-2) hover:bg-(--surface-2)'
                    }`} >
        <ClipboardList size={13} strokeWidth={2} />
        <span className={inTxt}>수강신청</span>
      </button>

      {/* 이번 학기 요약 | 다가오는 일정*/}
      <div className={txt}>
        <div className="h-px bg-(--border) my-2 mx-1" />
        <p className="px-2.5 pb-1 text-[9px] font-bold text-(--text-3) 
                      uppercase tracking-widest">
          이번 학기 요약
        </p>
        <div className="px-2.5 flex flex-col gap-1 mb-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-(--text-3)">누적 GPA</span>
            <b className="text-(--text-1)">4.0</b>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-(--text-3)">이번 학기</span>
            <b className="text-(--text-1)">13 cr</b>
          </div>
          <div className="h-1 rounded-full bg-(--bar-track) my-1 overflow-hidden">
            <div className="h-full rounded-full bg-(--bar)" style={{ width: '57%' }} />
          </div>
          <p className="text-[9px] text-(--text-3)">졸업학점 80 / 140 (57%)</p>
        </div>


        <div className="h-px bg-(--border) my-2 mx-1" />
        <p className="px-2.5 pb-1 text-[9px] font-bold text-(--text-3)  
                      uppercase tracking-widest">
          다가오는 일정
        </p>
        <div className="flex flex-col gap-0.5 mb-2">
          {EVENTS.map(ev => (
            <div key={ev.label}
                 className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg
                            cursor-pointer hover:bg-(--surface-2) transition-colors">
              <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                    style={{
                      background: ev.color,
                      border: ev.color === 'var(--bar-track)' 
                              ? '1px solid var(--border)' 
                              : 'none'
                    }} />
              <div>
                <p className="text-[11px] font-semibold text-(--text-1)">{ev.label}</p>
                <p className="text-[10px] text-(--text-3)">{ev.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/*접기 버튼 */}
      <div className="mt-auto pt-2 border-t border-(--border) hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-1.5 w-full px-2.5 py-2 rounded-[7px]
                      text-[11px] text-(--text-3) hover:bg-(--surface-2) 
                      transition-colors
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

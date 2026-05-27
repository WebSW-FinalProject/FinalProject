import type { Section, Page } from '../../hooks/useNavigation';

interface SidebarProps {
  section: Section;
  page: Page;
  goTo: (s: Section, p?: Page) => void;
  setPage: (p: Page) => void;
}

const gradePages: { id: Page; label: string }[] = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'credits',   label: '학점현황' },
  { id: 'timetable', label: '시간표' },
  { id: 'ai',        label: 'AI 성적분석' },
];

function Sidebar({ section, page, goTo, setPage }: SidebarProps) {
  return (
    <aside className="w-55 shrink-0 bg-(--surface) 
                      border-r border-(--border)
                      flex flex-col py-3 px-2
                      sticky top-14.5 h-[calc(100vh-58px)] overflow-y-auto">

      {/* 프로필 => 프로필 이미지는 임시.. */}
      <div className="flex items-center gap-2 px-2 py-3 mb-1">
        <div className="w-9 h-9 rounded-[10px] bg-(--navy) text-white
                        flex items-center justify-center text-sm font-bold shrink-0">
          이
        </div>
        <div>
          <p className="text-sm font-bold text-(--text-1)">이문세</p>
          <p className="text-[10px] text-(--text-3)">소프트웨어학부 3학년</p>
        </div>
      </div>

      {/* 학점관리 */}
      <hr className="border-b border-gray-200" />
      <p className="px-2 pt-2 pb-1 text-[9px] font-bold text-(--text-3) 
                    uppercase tracking-widest">
        학점관리
      </p>
      {gradePages.map(item => (
        <button
          key={item.id}
          onClick={() => { goTo('grades'); setPage(item.id); }}
          className={`flex items-center w-full px-2.25 py-1.75 rounded-[7px]
                      text-xs font-medium transition-colors text-left
                      ${section === 'grades' && page === item.id
                        ? 'bg-(--accent-bg) text-(--accent) font-bold'
                        : 'text-(--text-2) hover:bg-(--accent-bg) hover:text-(--accent)'
                      }`}
        >
          {item.label}
        </button>
      ))}

      {/* 게시판 */}
      <hr className="border-b border-gray-200 mt-2" />
      <p className="px-2 pt-4 pb-1 text-[9px] font-bold 
                    text-(--text-3) uppercase tracking-widest">
        게시판
      </p>
      <button
        onClick={() => goTo('board')}
        className={`flex items-center w-full px-2.25 py-1.75 rounded-[7px]
                    text-xs font-medium transition-colors text-left
                    ${section === 'board'
                      ? 'bg-(--accent-bg) text-(--accent) font-bold'
                      : 'text-(--text-2) hover:bg-(--accent-bg) hover:text-(--accent)'
                    }`}
      >
        게시판
      </button>

      {/* 수강신청 관리 */}
      <hr className="border-b border-gray-200 mt-2" />
      <p className="px-2 pt-4 pb-1 text-[9px] font-bold text-(--text-3) uppercase tracking-widest">
        수강신청 관리
      </p>
      <button
        onClick={() => goTo('courses')}
        className={`flex items-center w-full px-2.25 py-1.75 rounded-[7px]
                    text-xs font-medium transition-colors text-left
                    ${section === 'courses'
                      ? 'bg-(--accent-bg) text-(--accent) font-bold'
                      : 'text-(--text-2) hover:bg-(--accent-bg) hover:text-(--accent)'
                    }`}
      >
        수강신청
      </button>
      <hr className="border-b border-gray-200 mt-2" />
    </aside>
  );
}

export default Sidebar;

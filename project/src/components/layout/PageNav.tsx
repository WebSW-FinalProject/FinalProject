import { LayoutGrid, Activity, Calendar, HelpCircle } from 'lucide-react';
import type { Page } from '../../hooks/useNavigation';

interface PageNavProps {
  page: Page;
  setPage: (p: Page) => void;
}

const tabs = [
  { id: 'dashboard' as Page, label: '대시보드',    icon: <LayoutGrid size={12} /> },
  { id: 'credits'   as Page, label: '학점현황',    icon: <Activity   size={12} /> },
  { id: 'timetable' as Page, label: '시간표',      icon: <Calendar   size={12} /> },
  { id: 'ai'        as Page, label: 'AI 성적분석', icon: <HelpCircle size={12} /> },
];

function PageNav({ page, setPage }: PageNavProps) {
  return (
    <nav className="flex items-center gap-0.5 px-11 h-11.5
                    bg-(--surface) border-b border-(--border)
                    sticky top-12.5 z-90 overflow-x-auto">
                      
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => setPage(t.id)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md cursor-pointer
                      text-[13px] font-medium transition-colors whitespace-nowrap
            ${page === t.id
              ? 'bg-(--surface-2) text-(--text-1) font-bold'
              : 'text-(--text-2) hover:bg-(--surface-2) hover:text-(--text-1)'
            }`}
         >
          {t.icon}
          <div className="cursor-pointer"> {t.label} </div>
        </button>
      ))}
    </nav>
  );
}

export default PageNav;

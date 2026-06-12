import { LayoutGrid, Activity, Calendar, HelpCircle } from 'lucide-react';
import type { Page } from '../../hooks/useNavigation';
import { useLang } from '../../LangContext';

interface PageNavProps {
  page: Page;
  setPage: (p: Page) => void;
}

const tabs = [
  { id: 'dashboard' as Page, labelKey: 'tabDashboard', icon: <LayoutGrid size={12} /> },
  { id: 'credits'   as Page, labelKey: 'tabCredits',   icon: <Activity   size={12} /> },
  { id: 'timetable' as Page, labelKey: 'tabTimetable', icon: <Calendar   size={12} /> },
  { id: 'ai'        as Page, labelKey: 'tabAI',        icon: <HelpCircle size={12} /> },
];

function PageNav({ page, setPage }: PageNavProps) {
  const { t } = useLang();

  return (
    <nav className="flex items-center gap-0.5 px-11 h-11.5
                    bg-(--surface) border-b border-(--border)
                    sticky top-12.5 z-90 overflow-x-auto">

      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setPage(tab.id)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md cursor-pointer
                      text-[13px] font-medium transition-colors whitespace-nowrap
            ${page === tab.id
              ? 'bg-(--surface-2) text-(--text-1) font-bold'
              : 'text-(--text-2) hover:bg-(--surface-2) hover:text-(--text-1)'
            }`}
         >
          {tab.icon}
          <div className="cursor-pointer"> {t(tab.labelKey)} </div>
        </button>
      ))}
    </nav>
  );
}

export default PageNav;

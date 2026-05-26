import type { Page } from '../../hooks/useNavigation';

interface PageNavProps {
  page: Page;
  setPage: (p: Page) => void;
}

const tabs: { id: Page; label: string }[] = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'credits',   label: '학점현황' },
  { id: 'timetable', label: '시간표' },
  { id: 'ai',        label: 'AI 성적분석' },
];

function PageNav({ page, setPage }: PageNavProps) {
  return (
    <nav className="flex items-center gap-1 px-4 h-[46px]
                    bg-[var(--surface)] border-b border-[var(--border)]">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => setPage(t.id)}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors
            ${page === t.id
              ? 'bg-[var(--surface-2)] text-[var(--text-1)] font-bold'
              : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'
            }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

export default PageNav;

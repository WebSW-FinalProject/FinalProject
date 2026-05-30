import Logo from '../logo.tsx';
import { useState } from 'react';
import type { Section } from '../../hooks/useNavigation';
import { Moon, Sun, Bell, Settings, User } from 'lucide-react';

interface HeaderProps {
  section: Section;
  goTo: (s: Section) => void;
  isDark: boolean;
  setDark: (s: boolean) => void;
}

const menu: { id: Section; label: string }[] = [
  { id: 'grades',  label: '학점관리' },
  { id: 'board',   label: '게시판' },
  { id: 'courses', label: '수강신청 관리' },
];



function Header({ section, goTo, isDark, setDark}: HeaderProps) {
  const [currentLang, setLang] = useState<'KOR' | 'ENG'>('KOR');

  return (
    <header className="h-14.5 bg-(--surface) border-b border-(--border)
                       flex items-center justify-start px-11 gap-10
                       sticky top-0 z-100 shadow-(--shadow)">

      {/* 로고 */}
      <button
        onClick={() => goTo('grades')}
        className="flex items-center gap-1 shrink-0">
        <Logo />
        <span className="text-3xl tracking-tight font-black text-(--accent)" 
              style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
          UNIGUIDE
        </span>
      </button>

      {/* 메인 탭 */}
      {/* text-1 : 활성화 | test-2 : 비활성화 */}
      <nav className="flex items-center h-full">
        {menu.map(item => (
          <button
            key={item.id}
            onClick={() => goTo(item.id)}
            className={`h-full px-3.5 text-sm font-medium
                        border-b-2 transition-colors
              ${section === item.id
                ? 'border-(--text-1) text-(--text-1) font-bold'
                : 'border-transparent text-(--text-2) hover:text-(--text-1)'
              }`} >
            <div className="whitespace-nowrap">{item.label}</div>
          </button>
        ))}
      </nav>

      {/* 아이콘 영역 */}
      <div className="flex items-center gap-4 ml-auto shrink-0">
        {/* KOR | ENG */}
        <div className="flex items-center text-xs 
                        font-medium text-(--text-2) mr-2">
          {(['KOR', 'ENG'] as const).map((lang, i) => (
            <span key={lang}>
              {i > 0 && <span className="mx-1 text-(--border)">|</span>}
              <button
                onClick={() => setLang(lang)}
                className={currentLang === lang 
                  ? 'text-(--text-1) font-bold' 
                  : 'hover:text-(--text-1)'}>
                {lang}
              </button>
            </span>
          ))}
        </div>



        {/* ICON SECTION */}
        <button
            key='Notice'
            className="w-8.5 h-8.5 rounded-lg flex items-center justify-center
                       text-sm text-(--text-2) hover:bg-(--surface-2) 
                       transition-colors">
            <Bell size={16}/>
        </button>

        <button
          onClick={() => setDark(!isDark)}
          className="w-8.5 h-8.5 rounded-lg flex items-center justify-center
                    text-sm text-(--text-2) hover:bg-(--surface-2) transition-colors">
          {isDark ? <Sun size={16}/> : <Moon size={16}/>}
        </button>

        <button
            key='Settings'
            className="w-8.5 h-8.5 rounded-lg flex items-center justify-center
                       text-sm text-(--text-2) hover:bg-(--surface-2) 
                       transition-colors">
             <Settings size={16}/>
        </button>




        {/* 프로필 버튼 */}
        <button className="w-7.5 h-7.5 rounded-lg bg-(--navy) text-white
                           text-[11px] font-bold flex items-center justify-center ml-1">
          이
        </button>

      </div>
    </header>
  );
}

export default Header;

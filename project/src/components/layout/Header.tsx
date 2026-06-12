
import { API_BASE } from '../../api';
import Logo from '../logo.tsx';
import { useState } from 'react';
import type { Section } from '../../hooks/useNavigation';
import { Moon, Sun, Settings, LogOut, Trash2, Upload } from 'lucide-react';
import Popup, { PopupHeader, PopupFooter } from '../ui/Popup';
import { useLang } from '../../LangContext';

interface HeaderProps {
  section: Section;
  goTo: (s: Section) => void;
  isDark: boolean;
  setDark: (s: boolean) => void;
  onLogout?: () => void; // 프로필 팝업 - 로그아웃 연결
  username?: string;       // 프로필 정보 - 유저명 연결 추가
  deptLabel?: string;      // 프로필 정보 - NN학부 N학년 형태 (엑셀 업로드 후 채워짐)
  onReupload?: () => void; // 프로필 목록(드롭다운) - 엑셀 재업로드 버튼 추가
}


function Header({ section, goTo, isDark, setDark,
                  onLogout, username, deptLabel, onReupload }: HeaderProps) {

  // 언어 설정 — LangContext에서 가져옴 (KOR|ENG 토글)
  const { lang, setLang, t } = useLang();
  // lang = 현재값, setLang = lang set함수 , t = 텍스트 래퍼 (동적표기)

  const [profileOpen, setProfile]   = useState(false);  // 프로필 정보
  const [settingsOpen, setSettings] = useState(false);  // 설정 팝업

  // 메인 탭 메뉴 (번역 적용)
  const menu: { id: Section; labelKey: string } [] = [
    { id: 'grades',  labelKey: 'navGrades'  },
    { id: 'board',   labelKey: 'navBoard'   },
    { id: 'courses', labelKey: 'navCourses' },
  ];

  return (
    <>
      <header className="h-12.5 bg-(--surface) border-b border-(--border)
                         flex items-center justify-start px-11 gap-6
                         sticky top-0 z-100 shadow-(--shadow)">

        {/* 로고 */}
        <button onClick={() => goTo('grades')}
                className="cursor-pointer flex items-center gap-1 shrink-0 text-(--accent)">
          <Logo/>
          <span className="text-2xl tracking-tight font-black text-(--accent)"
                style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
            UNIGUIDE
          </span>
        </button>

        {/* 메인 탭 */}
        <nav className="flex items-center h-full">
          {menu.map(item => (
            <button
              key={item.id}
              onClick={() => goTo(item.id)}
              className={`h-full px-3.5 text-sm font-medium border-b-2 transition-colors
                ${section === item.id
                  ? 'border-(--text-1) text-(--text-1) font-bold'
                  : 'border-transparent text-(--text-2) hover:text-(--text-1)'
                }`}>
              <div className="whitespace-nowrap cursor-pointer">{t(item.labelKey)}</div>
            </button>
          ))}
        </nav>

        {/* 아이콘 영역 */}
        <div className="flex items-center gap-1 ml-auto">
          {/* KOR | ENG */}
          <div className="hidden md:flex items-center text-xs
                          font-medium text-(--text-2) mr-2">
            <button onClick={() => setLang('ko')}
                    className={lang === 'ko'
                    ? 'cursor-pointer text-(--text-1) font-bold'
                    : 'cursor-pointer hover:text-(--text-1)'}>
              KOR
            </button>
            <span className="mx-1 text-(--border)">|</span>
            <button onClick={() => setLang('en')}
                    className={lang === 'en'
                    ? 'cursor-pointer text-(--text-1) font-bold'
                    : 'cursor-pointer hover:text-(--text-1)'}>
              ENG
            </button>
          </div>

            {/* 알림은 제거함 (필요성 + 시간) */}
            {/* 다크모드 토글 */}
            <button
              onClick={() => setDark(!isDark)}
              className="w-8.5 h-8.5 rounded-lg flex items-center justify-center cursor-pointer
                        text-(--text-2) hover:bg-(--surface-2) transition-colors">
              {isDark ? <Sun size={16}/> : <Moon size={16}/>}
            </button>

            {/* 설정 */}
            <button
              onClick={() => setSettings(true)}
              className="w-8.5 h-8.5 rounded-lg flex items-center justify-center cursor-pointer
                        text-(--text-2) hover:bg-(--surface-2) transition-colors">
              <Settings size={16}/>
            </button>

            {/* 프로필 & 프로필 드롭다운 */}
            <div className="relative ml-1">
              {/* 바깥 클릭 시 닫기 */}
              {profileOpen && (
                <div className="fixed inset-0 z-150 cursor-pointer" onClick={() => setProfile(false)}/>
              )}

              <button
                onClick={() => setProfile(!profileOpen)}
                className="w-7.5 h-7.5 rounded-lg bg-(--navy) text-white cursor-pointer
                          text-[11px] font-bold flex items-center justify-center">
                {username?.charAt(0) || 'G'}
              </button> {/* 실제 username 첫글자 가져오기(없으면 Guest) */}

              {/* 드롭다운 @ */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-200
                                border border-(--border) bg-(--surface)"
                    style={{ boxShadow: '0 8px 24px rgba(0,0,0,.15)' }}>
                  {/* 유저 정보 */}
                  <div className="flex items-center gap-2.5 px-3 py-3">
                    <div className="w-9 h-9 rounded-lg bg-(--navy) text-white
                                    flex items-center justify-center text-[13px] font-bold shrink-0">
                      {username?.charAt(0) || '?'}
                    </div>

                    <div>
                      <p className="text-[13px] font-bold text-(--text-1)">
                        {username || 'Guest'}
                      </p>
                      <p className="text-[10px] text-(--text-3)">{deptLabel || t('noDeptInfo')}</p>
                    </div>
                    {/* 프로필 정보 연결 완료 @ */}

                  </div>
                  <div className="h-px bg-(--border) mx-1 mb-1"/>
                  {/* 엑셀 파일 재업로드 목록 추가, 도움말 제거 */}
                  {[
                    { icon: <Settings size={13}/>,   labelKey: 'menuSettings',
                      action: () => { setProfile(false); setSettings(true); } },
                    { icon: <Upload size={13}/>,     labelKey: 'menuReupload',
                      action: () => { setProfile(false); onReupload?.(); } },
                  ].map(item => (
                    <button key={item.labelKey}
                            onClick={item.action}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] cursor-pointer
                                      text-(--text-2) hover:bg-(--surface-2) transition-colors">
                      {item.icon} {t(item.labelKey)}
                    </button>
                  ))}
                  <div className="h-px bg-(--border) mx-1 my-1"/>
                  <button onClick={onLogout}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] cursor-pointer
                                    text-(--alert-warn)  hover:bg-(--surface-2) transition-colors">
                    <LogOut size={13}/> {t('menuLogout')}
                  </button> {/* 로그아웃 연결 */}
                  <button
                    onClick={async () => {
                      if (!window.confirm(t('withdrawConfirm'))) return;
                      const token = localStorage.getItem('token') || '';
                      await fetch(`${API_BASE}/api/users`, {
                        method: 'DELETE',
                        headers: { Authorization: 'Bearer ' + token },
                      });
                      onLogout?.();
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] cursor-pointer
                               text-red-500 hover:bg-(--surface-2) transition-colors">
                    <Trash2 size={13}/> {t('menuWithdraw')}
                  </button>
                </div>
              )}
            </div>
        </div>
      </header>

      {/* 설정 팝업 */}
      <Popup open={settingsOpen} onClose={() => setSettings(false)} width="360px">
        <PopupHeader
          title={<><Settings size={14} className="text-(--accent)"/> {t('settingsTitle')}</>}
          onClose={() => setSettings(false)}
        />
        <div className="px-5 py-4.5 flex flex-col gap-5">
          {/* 다크모드 */}
          <div className="flex items-center justify-between
                          px-3 py-2.5 bg-(--surface-2) rounded-lg">
            <div className="flex items-center gap-2">
              <Moon size={14} className="text-(--text-2)"/>
              <span className="text-[12px] font-medium text-(--text-1)">{t('darkMode')}</span>
            </div>

            {/* 토글 스위치 */}
            <button
              onClick={() => setDark(!isDark)}
              className="relative w-10 h-5.5 rounded-full transition-all"
              style={{ background: isDark ? 'var(--accent)' : 'var(--bar-track)' }}>
              <span className="absolute top-0.5 h-4.5 w-4.5 rounded-full
                             bg-white transition-transform"
                    style={{ left: isDark ? '50%' : '2px', transform: isDark
                    ? 'translateX(-2px)' : 'none' }}/>
            </button>
          </div>
        </div>

        <PopupFooter>
          <button onClick={() => setSettings(false)}
                  className="px-4 py-1.5 rounded-lg text-[12px] font-semibold
                             bg-(--text-1) text-(--surface) hover:opacity-85
                             transition-opacity">
            {t('close')}
          </button>
        </PopupFooter>
      </Popup>
    </>
  );
}

export default Header;




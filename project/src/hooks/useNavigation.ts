
import { useState } from 'react';

// 앱 전체 페이지 전환 상태 관리 (+ 타입관리 : TS)
// section: 상단 메인 탭 (grades | board | courses)
// page: section 내 서브 탭 (dashboard | credits | timetable | ai)

export type Section = 'grades' | 'board' | 'courses';
export type Page    = 'dashboard' | 'credits' | 'timetable' | 'ai';

export function useNavigation() {

  // 새로고침 후에도 페이지 유지 (localStorage)
  const [section, setSection] = useState<Section>(
    () => (localStorage.getItem('nav_section') as Section) ?? 'grades'
  );
  const [page, setPage] = useState<Page>(
    () => (localStorage.getItem('nav_page') as Page) ?? 'dashboard'
  );

  function goTo(s: Section, p?: Page) { // goTo (s메인탭, p서브탭) 꼴로 사용.
    const nextPage = p ?? (s === 'grades' ? 'dashboard' : page);
    setSection(s);
    setPage(nextPage);
    localStorage.setItem('nav_section', s);
    localStorage.setItem('nav_page', nextPage);
  }

  // setPage 직접 호출 시에도 localStorage 저장 (새로고침 유지)
  function setPageWithSave(p: Page) {
    setPage(p);
    localStorage.setItem('nav_page', p);
  }

  return { section, page, goTo, setPage: setPageWithSave };
  // 이름은 그냥 그대로 export (수정최소화..)
}

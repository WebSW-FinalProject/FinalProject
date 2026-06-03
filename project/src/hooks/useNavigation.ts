
import { useState } from 'react';

// 앱 전체 페이지 전환 상태 관리 (+ 타입관리 : TS)
// section: 상단 메인 탭 (grades | board | courses)
// page: section 내 서브 탭 (dashboard | credits | timetable | ai)

export type Section = 'grades' | 'board' | 'courses';
export type Page    = 'dashboard' | 'credits' | 'timetable' | 'ai';

export function useNavigation() {
  const [section, setSection] = useState<Section>('grades');
  const [page, setPage] = useState<Page>('dashboard');

  function goTo(s: Section, p?: Page) { // goTo (s메인탭, p서브탭) 꼴로 사용.
    setSection(s); 
    if (p) setPage(p); // page 는 null 일 수 있음. (p?)
    else if (s === 'grades') setPage('dashboard');
  }

  return { section, page, goTo, setPage };
}

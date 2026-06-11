
import { useState } from 'react';
import type { Section, Page } from '../../hooks/useNavigation';

import Dashboard from '../pages/grades/Dashboard';
import Credits   from '../pages/grades/Credits';
import Timetable from '../pages/grades/Timetable';
import AiAnalysis from '../pages/grades/AiAnalysis';
import Board    from '../pages/Board';
import Courses  from '../pages/Courses';


interface MainProps {
  section: Section;
  page: Page;
  goTo: (section: Section, page?: Page) => void;
  reuploadOpen?: boolean;      // 엑셀 재업로드 (헤더)
  onReuploadDone?: () => void; // 팝업 닫힘 => 초기화
}

// 
function Main({ section, page, goTo,
                reuploadOpen, onReuploadDone }: MainProps) {

  // 커뮤니티 미리보기 게시글 클릭 시 board로 이동하면서 해당 글 팝업 열기
  const [boardOpenPostId, setBoardOpenPostId] = useState<number | null>(null);

  if (section === 'grades') {
    if (page === 'dashboard')
      return <Dashboard
        onGoTimetable={() => goTo('grades', 'timetable')}
        onGoToBoard={(postId) => { setBoardOpenPostId(postId ?? null); goTo('board'); }}
        reuploadOpen={reuploadOpen}
        onReuploadDone={onReuploadDone}
      />;
    if (page === 'credits')   return <Credits />;
    if (page === 'timetable') return <Timetable />;
    if (page === 'ai')        return <AiAnalysis />;
  }

  if (section === 'board')   return <Board initialPostId={boardOpenPostId} />;
  if (section === 'courses') return <Courses />;


  return null;
}

export default Main;
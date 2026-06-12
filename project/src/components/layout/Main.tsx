
import React, { useState } from 'react';
import type { Section, Page } from '../../hooks/useNavigation';

import Dashboard, { type GradesSummary } from '../pages/grades/Dashboard';
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
  onSummaryChange?: (s: GradesSummary) => void; // Sidebar 요약 갱신
}

//
function Main({ section, page, goTo,
                reuploadOpen, onReuploadDone, onSummaryChange }: MainProps) {

  // 커뮤니티 미리보기 게시글 클릭 시 board로 이동하면서 해당 글 팝업 열기
  const [boardOpenPostId, setBoardOpenPostId] = useState<number | null>(null);

  // 페이지 전환 시 컨텐츠 결정 (애니메이션 추가)
  let content: React.ReactNode = null;

  if (section === 'grades') {
    if (page === 'dashboard')
      content = <Dashboard
        onGoTimetable={() => goTo('grades', 'timetable')}
        onGoToBoard={(postId) => { setBoardOpenPostId(postId ?? null); goTo('board'); }}
        reuploadOpen={reuploadOpen}
        onReuploadDone={onReuploadDone}
        onSummaryChange={onSummaryChange}
      />;
    else if (page === 'credits')   content = <Credits />;
    else if (page === 'timetable') content = <Timetable />;
    else if (page === 'ai')        content = <AiAnalysis />;
  }
  else if (section === 'board')   content = <Board initialPostId={boardOpenPostId} />;
  else if (section === 'courses') content = <Courses />;

  // key 가 바뀌면 div 리마운트 => page-enter 애니메이션 재실행 (AI)
  return (
    <div key={section + '-' + page} className="page-enter w-full">
      {content}
    </div>
  );
}

export default Main;
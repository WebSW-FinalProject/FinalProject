
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
}

function Main({ section, page }: MainProps) {

  // 하위 탭 분리 로직 (page)

  if (section === 'grades') {
    if (page === 'dashboard') return <Dashboard />;
    if (page === 'credits')   return <Credits />;
    if (page === 'timetable') return <Timetable />;
    if (page === 'ai')        return <AiAnalysis />;
  }

  if (section === 'board')   return <Board />;
  if (section === 'courses') return <Courses />;


  return null;
}

export default Main;

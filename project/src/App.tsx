
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import PageNav from './components/layout/PageNav';
import Main from './components/layout/Main';
import Footer from './components/layout/Footer';
import LandingPage from './components/pages/LandingPage';

import './App.css';

import { useNavigation } from './hooks/useNavigation';
import { useState, useEffect } from 'react';
import type { GradesSummary } from './components/pages/grades/Dashboard';
import { getCurrentSem } from './components/pages/grades/dashConnectAPI';


function App() {

  // # state 유지를 위해 localStorage 사용
  // token 사용 : 웹로컬저장소에 넣고setItem / 꺼냄getItem

  const [Logged, setLogged] = useState(
    () => (localStorage.getItem('token') ? true : false)
  ); // 이미 로그인된 상태인지 (로그아웃 전 == 토큰이 남아있는지 (1H))

  const [username, setUsername] = useState(''); // 프로필 info - 유저명
  const [deptLabel, setDeptLabel] = useState(''); // 프로필 info - NN학부 N학년
  const [reuploadOpen, setReuploadOpen] = useState(false);
  const [gradesSummary, setGradesSummary] = useState<GradesSummary | null>(null); // Sidebar 요약용
    // 헤더 - 엑셀 재업로드 여부 관리 (엑셀 업로드 팝업으로 연결, 재업로드 false면 강제.)


  function handleLogin(token: string) {
    localStorage.setItem('token', token);
    setLogged(true);
  } // 현재 login 된 상태인지 아닌지 확인

  function handleLogout() {
    localStorage.removeItem('token');
    setLogged(false);
    setUsername('');
    setDeptLabel('');
  } // 로그인 handle 함수에도 이름,(학과 학년) 정보 추가

  // 로그인 시 Sidebar 요약 미리 로드 — Dashboard 진입 전에도 표시되도록
  // (Dashboard 의 onSummaryChange 는 수정 이후 실시간 갱신용)
  async function loadGradesSummary() {
    try {
      const token = localStorage.getItem('token') || '';
      const hdr = { Authorization: 'Bearer ' + token };

      const semsRes = await fetch('http://localhost:3000/api/semesters', { headers: hdr });
      if (!semsRes.ok) return;
      const sems: any[] = await semsRes.json();
      if (!sems.length) return;

      // 모든 학기 과목 fetch
      const allCourses: any[] = [];
      for (const s of sems) {
        const r = await fetch(`http://localhost:3000/api/semesters/${s.id}/courses`, { headers: hdr });
        if (r.ok) allCourses.push(...(await r.json()));
      }

      // 졸업요건 fetch
      const gradRes = await fetch('http://localhost:3000/api/graduation', { headers: hdr });
      const gradReqs: any[] = gradRes.ok ? await gradRes.json() : [];

      // avgGPA: 완료 학기(gpa not null) 평균
      const doneSems = sems.filter(s => s.gpa != null);
      const avgGPA = doneSems.length
        ? doneSems.reduce((a, s) => a + parseFloat(s.gpa), 0) / doneSems.length
        : 0;

      // 현재 학기 과목 (Dashboard 와 동일 로직)
      const { year: cy, term: ct } = getCurrentSem();
      let cur = sems.find(s => s.semester_year === cy && s.term === ct);
      if (!cur) cur = [...sems].reverse().find(s => s.gpa == null);
      if (!cur) cur = sems[sems.length - 1];

      const curCourses  = cur ? allCourses.filter(c => c.semester_id === cur.id) : [];
      const doneCourses = allCourses.filter(c => c.grade && c.grade !== 'F');

      const earnedTotal    = doneCourses.reduce((a, c) => a + (c.credit || 0), 0);
      const currentCredits = curCourses.reduce((a, c)  => a + (c.credit || 0), 0);
      const gradTotal      = gradReqs.find(r => r.area === '총졸업')?.required ?? 0;
      const gradPct        = gradTotal > 0 ? Math.round(earnedTotal / gradTotal * 100) : 0;

      setGradesSummary({ avgGPA, currentCredits, earnedTotal, gradTotal, gradPct });
    } catch (e) { console.error('요약 로드 실패:', e); }
  }

  // mypage(username 정보 GET으로 주는 API) 에서 username 가져옴
  async function loadUser() {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('http://localhost:3000/api/users/mypage', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) return;
      const data = await res.json();
      setUsername(data.username || '');

      // department + grade_year => "소프트웨어학부 3학년" 형태로 조합
      const dept = data.department || '';
      const yr   = data.grade_year ? `${data.grade_year}학년` : '';

      setDeptLabel([dept, yr].filter(Boolean).join(' '));
    } 
    catch (e) {
      console.log("Server error: ", e);
    }
  }

  // 로그인 상태이면 유저 정보 + 사이드바 요약 로드
  useEffect(() => {
    if (!Logged) return;
    loadUser();
    loadGradesSummary();
  }, [Logged]);


  // 새로고침 후에도 다크모드 유지 (localStorage)
  const [isDark, setDark] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : '';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const { section, page, goTo, setPage } = useNavigation();

  // 로그인 X => 랜딩 페이지 보여줌
  if (!Logged) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-(--bg)">
      <Header section={section} goTo={goTo} isDark={isDark} setDark={setDark}
              onLogout={handleLogout} username={username} deptLabel={deptLabel}
              onReupload={() => { goTo('grades', 'dashboard'); setReuploadOpen(true); }} /> 
              {/* 헤더 - 로그아웃, 엑셀 재업로드 기능 연결 */}
              {/* 헤더 - 엑셀 재업로드 기능 클릭시 : 현재 어느 페이지에 있든 dash이동+팝업띄우기 */}

      <div className="flex flex-1">
        <Sidebar section={section} page={page} goTo={goTo} setPage={setPage}
                 username={username} deptLabel={deptLabel}
                 gradesSummary={gradesSummary} />
        <div className="flex flex-col flex-1 min-w-0">
          {section === 'grades' && <PageNav page={page} setPage={setPage} />}
          <Main section={section} page={page} goTo={goTo}
                reuploadOpen={reuploadOpen}
                onReuploadDone={() => setReuploadOpen(false)}
                onSummaryChange={setGradesSummary} />
              {/* 메인에다 재업로드 여부 전달 추가*/}
        </div>
      </div>

      <Footer/>
    </div>
  );

}

export default App;
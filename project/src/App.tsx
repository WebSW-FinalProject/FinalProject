
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import PageNav from './components/layout/PageNav';
import Main from './components/layout/Main';
import Footer from './components/layout/Footer';
import LandingPage from './components/pages/LandingPage';

import './App.css';

import { useNavigation } from './hooks/useNavigation'; 
import { useState, useEffect } from 'react';


function App() {

  // # state 유지를 위해 localStorage 사용
  // token 사용 : 웹로컬저장소에 넣고setItem / 꺼냄getItem

  const [Logged, setLogged] = useState(
    () => (localStorage.getItem('token') ? true : false)
  ); // 이미 로그인된 상태인지 (로그아웃 전 == 토큰이 남아있는지 (1H))

  const [username, setUsername] = useState(''); // 프로필 info - 유저명
  const [deptLabel, setDeptLabel] = useState(''); // 프로필 info - NN학부 N학년
  const [reuploadOpen, setReuploadOpen] = useState(false); 
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

  // 로그인 상태이면  loadUser(정보가져오기)
  useEffect(() => {
    if (!Logged) return;
    loadUser();
  }, [Logged]);


  const [isDark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : '';
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
        <Sidebar section={section} page={page} goTo={goTo} setPage={setPage} />
        <div className="flex flex-col flex-1 min-w-0">
          {section === 'grades' && <PageNav page={page} setPage={setPage} />}
          <Main section={section} page={page} goTo={goTo}
                reuploadOpen={reuploadOpen} 
                onReuploadDone={() => setReuploadOpen(false)} />
              {/* 메인에다 재업로드 여부 전달 추가*/}
        </div>
      </div>

      <Footer/>
    </div>
  );

}

export default App;
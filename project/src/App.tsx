
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

  function handleLogin(token: string) {
    localStorage.setItem('token', token);
    setLogged(true);
  } // 현재 login 된 상태인지 아닌지 확인

  function handleLogout() {
    localStorage.removeItem('token');
    setLogged(false);
  }

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
              onLogout={handleLogout} /> {/* 헤더-프로필-팝업: 로그아웃 매핑 */}

      <div className="flex flex-1">
        <Sidebar section={section} page={page} goTo={goTo} setPage={setPage} />
        <div className="flex flex-col flex-1 min-w-0">
          {section === 'grades' && <PageNav page={page} setPage={setPage} />}
          <Main section={section} page={page} goTo={goTo} />
        </div>
      </div>

      <Footer/>
    </div>
  );

}

export default App;
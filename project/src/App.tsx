
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import PageNav from './components/layout/PageNav';
import Main from './components/layout/Main';
import Footer from './components/layout/Footer';

import './App.css';  //css 

import { useNavigation } from './hooks/useNavigation';
import { useEffect } from 'react';


function App() {

  useEffect(() => {
    fetch('http://localhost:3000/api/health')
      .then(res => res.json())
      .then(data => console.log(data));
  }, []); // connect test는 최초 1번만 실행

  
  const { section, page, goTo, setPage } = useNavigation();
  // section = 계층1 탭(학점관리, 게시판, 수강신청 관리..) => goTo로 전환
  // page = 하위 탭 (서브탭: 대시보드, 학점현황 ..) => setPage로 전환


  return (
    <div className="flex flex-col min-h-screen bg-(--bg)">
      <Header section={section} goTo={goTo} />
      {section === 'grades' && <PageNav page={page} setPage={setPage} />}

      <div className="flex flex-1">
        <Sidebar section={section} page={page} goTo={goTo} setPage={setPage} />
        <Main section={section} page={page} />
      </div>

      <Footer/>
    </div>
  );

}

export default App;
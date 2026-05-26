
import Logo from '../logo.tsx';

import { useState } from 'react';
import type { Section } from '../../hooks/useNavigation';


interface HeaderProps {
  section: Section;
  goTo: (s: Section) => void;
  // return 안하고 문자열만 바꿈 (void)
}

function Header({ section, goTo }: HeaderProps) {

  const menu = [
    { id: "grades",  label: "학점관리" },
    { id: "board",   label: "게시판" },
    { id: "courses", label: "수강신청 관리" },
  ];

  const Lang = [
    { id: "korean", label: "KOR"},
    { id: "English", label: "ENG"},
  ];

  const [currentLang, setLang] = useState("ENG");

  return (
    <>
      <nav className="border-2 border-black p-4"> 
        <div className="flex justify-between md:flex-row items-center gap-6 w-full p-1"> 
          <div className="border-2 border-white p-4">
            < button onClick={() => goTo("grades")}>
                <div className="flex md:flex-row cursor-pointer">
                  <Logo /> 
                  <p className="px-1 text-2xl text-[#6CA9E8] font-bold">UNIGUIDE</p>
                </div>  
            </button>
          </div>

          {/* 메뉴 Section */}
          <div className=" flex md:flex-row flex-wrap justify-center">
              {menu.map((menu) => (
                // 반복되는 메뉴 부분은 map으로 menu 배열 순회
                  < div 
                    key={menu.id} 
                    className={`h-12 w-32 flex m-4
                      items-center justify-center 
                      rounded-2xl border-2 transition-all
                      ${section  === menu.id ? "border-[#6CA9E8] bg-blue-50"
                         : "border-gray-500 hover:bg-gray-100"}`  }  >
                    < button 
                      onClick={() => goTo(menu.id as Section)}
                      className={`w-full h-full font-semibold 
                        ${section  === menu.id ? 
                          "text-blue-500" :
                          "text-gray-500"}`}
                    >
                      {menu.label} {/* 내용물 setting */}
                    </button>
                  </div>
                ))}
          </div>
          

          {/* 영/한 번역 및 ICON Section */}
          <div className="flex flex-wrap md:flex-row gap-2 overflow-hidden">
            <div className="flex border-2 border-white p-4">
                {Lang.map((Lang) => (
                  < div 
                    key = {Lang.id} >
                     < button
                       onClick={() => setLang(Lang.id)}
                       className = {`text-black
                          ${currentLang === Lang.id ? 
                          "text-blue-400" : "text-black" }`}
                       >
                    &nbsp; {Lang.label} &nbsp;
                    </button>
                  </div>
                ))}
            </div>

            <div className=" border-2 border-white p-4">
                    <p> ICON (2개) </p>
            </div>
          </div>
          
        </div>
      </nav>
    </>
  );
}

export default Header;


import Logo from '../logo.tsx';
import { useState } from 'react';

function Header() {

  const menu = [
    { id: "Grade", label: "학점 관리" },
    { id: "Graduate", label: "수강신청 계획" },
    { id: "Board", label: "게시판" },
  ];

  const Lang = [
    { id: "korean", label: "KOR"},
    { id: "English", label: "ENG"},
  ];

  const [selected, setSelected] = useState("Home");
  const [currentLang, setLang] = useState("ENG");

   // 모든 border-white 는 레이아웃 확정 후 제거할 예정
  return (
    <>
      <nav className="border-2 border-black p-4"> 
        <div className="flex justify-between md:flex-row items-center gap-6 w-full p-1"> 
          <div className="border-2 border-white p-4">
            < button onClick={() => setSelected("Home")}>
                <div className="flex md:flex-row">
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
                      ${selected === menu.id ? "border-[#6CA9E8] bg-blue-50"
                         : "border-gray-500 hover:bg-gray-100"}`  }  >
                    < button 
                      onClick={() => setSelected(menu.id)}
                      className={`w-full h-full font-semibold 
                        ${selected === menu.id ? 
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
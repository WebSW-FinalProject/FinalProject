
import type { Section, Page } from '../../hooks/useNavigation';

interface SidebarProps {
  section: Section;
  page: Page;
  setPage: (p: Page) => void;
}

function Sidebar({ section, page, setPage }: SidebarProps) {

  const sidemenu = [
    { id: "dashboard",  label: "대시보드" },
    { id: "credits",   label: "학점현황" },
    { id: "timetable", label: "시간표" },
    { id: "ai", label: "AI 성적분석" },
  ];

    return (
      <div className= "flex">
        <aside className="justify-start border-2 border-blue-500 p-4 ">
          <div className=" flex md:flex-col flex-wrap justify-center">
                {sidemenu.map((sidemenu) => (
                    < div 
                      key={sidemenu.id} 
                      className={`h-12 w-32 flex m-4
                        items-center justify-center 
                        rounded-2xl border-2 transition-all
                        ${ page === sidemenu.id ? "border-[#6CA9E8] bg-blue-50"
                          : "border-gray-500 hover:bg-gray-100"}`  }  >
                      < button 
                        onClick={() => setPage(sidemenu.id as Page)}
                        className={`w-full h-full font-semibold 
                          ${page  === sidemenu.id ? 
                            "text-blue-500" :
                            "text-gray-500"}`}
                      >
                        {sidemenu.label} 
                      </button>
                    </div>
                  ))}
            
          </div>
        </aside>
      </div>
    );

}


export default Sidebar;


import GradeDash from '../grade/GradeDash';
import GradeTotalDash from '../grade/GradeTotalDash';

function Main() { // props 예제 
  

  return (
    <div className="p-1"> 
        <div className="flex flex-col md:flex-row gap-6 w-full p-4"> 
           <GradeDash />

           {/* 시간표 위젯: gradeDash 이후 구현 => 차선책으로 대체가능 */}
            <div className="md:w-1/3 border-2 border-blue-500 p-4 py-30 ">
                <p> 시간표 위젯 (혹은 메모 위젯) </p>
            </div>
        </div>


       <GradeTotalDash />
        
    </div>
  );
}

export default Main;

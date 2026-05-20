
import SemesterGradeBox from './SemesterGradeBox'

function GradeDash() {

   const averageGPA = "3.5"; // 임시 데이터
    

  return (
     <div className="md:w-2/3 border-2 border-blue-500 p-8">

      <h1 className="text-xl font-semibold"> 평균학점 {averageGPA}/4.5 </h1>

      <SemesterGradeBox />
      <br /><br />

     </div>
  );
}

export default GradeDash;


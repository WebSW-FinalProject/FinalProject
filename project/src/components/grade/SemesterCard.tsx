
import { useState } from 'react';

 // 데이터 형식 지정
  interface Course {
    id: string;    
    type: string;  
    name: string;
    grade: string;
    credit: number;
  }

  interface SemesterData {
    semester: string;
    totalGpa: number;
    generalGpa: number;
    majorGpa: number; 
    courses: Course[];
  }


  interface SemesterCardProps {
    data: SemesterData;
  }

const SemesterCard = ({data}: SemesterCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [year, term] = data.semester.split("-");

  return (
    <div>
      <br/>
        <article key={data.semester} className="semester-card">
            <div style={{
              overflow: 'hidden',
              transition: 'max-height 0.3s ease-in-out',
              background: '#fafafa', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => setIsOpen(!isOpen)} 
            >
              {year}학년 {term}학기 {isOpen ? '▲' : '▼'}
            </div>

            <div style={{
              overflow: 'hidden',
              maxHeight: isOpen ? '500px' : '0px',
              transition: 'max-height 0.3s ease-in-out',
              background: '#fafafa'
              }}>
              <p style={{ padding: '10px' }}> 평균: {data.totalGpa} </p>
              
              <ul>
                {data.courses.map((course) => (
                  <li key={course.id}>
                    {course.name} | {course.grade} | {course.credit}학점
                  </li>
                ))}
              </ul>
            </div>
         </article>
    </div>
  );
};

export default SemesterCard;
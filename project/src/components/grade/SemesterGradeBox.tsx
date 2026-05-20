
import testData from '../../testdata.json'; 
import SemesterCard from './SemesterCard';
import {useState} from 'react';

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


const SemesterGradeBox = () => {
  const [semesters, setSemesters] =
     useState<SemesterData[]>(testData as SemesterData[]);

  const [newSemester, setNewSemester] = useState('');
  const [newGpa, setNewGpa] = useState(0);

  const addSemester = (e: React.FormEvent) => {
    e.preventDefault(); // 페이지 새로고침 방지

    const newItem: SemesterData = {
      semester: newSemester, // 예: "2-1"
      totalGpa: newGpa,
      generalGpa: 0,
      majorGpa: 0,
      courses: []
    };
    setSemesters([...semesters, newItem]);
    setNewSemester('');
    setNewGpa(0);
  };

  return (
    <section id="semester-list">
      {semesters.map((data) => (
        <SemesterCard key={data.semester} data={data} />
      ))}

      {/* 제풀하면 addSemester 함수기능 수행되는 form */}
      <form onSubmit={addSemester} style={{  
        background: '#f9f9f9', padding: '20px', margin: '20px',
        borderRadius: '8px', border: '1px dashed #ccc' 
        }}>
        <h3>새 학기 추가</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label>학기 (예: 1-1) : </label>
          <input 
            type="text" value={newSemester} 
            onChange={(e) => setNewSemester(e.target.value)}
            placeholder="학년-학기 입력"
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>평균 평점: </label>
          <input 
            type="number" value={newGpa} 
            onChange={(e) => setNewGpa(parseFloat(e.target.value))}
            required
          />
        </div>
        <button type="submit" style={{
          padding: '10px 20px', background: '#007bff', 
          color: 'white', border: 'none', 
          borderRadius: '4px', cursor: 'pointer'
        }}>
          학기 추가하기
        </button>
      </form>

    </section>
  );
};

export default SemesterGradeBox;
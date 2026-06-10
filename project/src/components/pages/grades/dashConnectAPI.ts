import { useState, useEffect } from 'react';
import type { Semester, Course } from '../../../types';
import { calcGpa } from './dashHelper';
import type { GradReq } from './dashHelper';

const BASE = 'http://localhost:3000/api'; // 백엔드 공통 경로

// JSON body 요청 공통 헤더
function authHdr(token: string) {
  return { Authorization: 'Bearer ' + token, 
          'Content-Type': 'application/json' };
}

// 오늘 날짜 → 현재 학기 계산 
// (1~2월=전년도동계, 3~6월=1학기, 7~8월=하계, 9~12월=2학기)
export function getCurrentSem() {
  const now = new Date(); // 현재 날짜 가져오기
  const y = now.getFullYear(); // 년도
  const m = now.getMonth() + 1; // 월 (getMonth는 0부터 시작이라 +1 필요)

  let year = y;
  let term: string;
  if      (m >= 3 && m <= 6)  { term = '1'; }
  else if (m >= 7 && m <= 8)  { term = 'summer'; }
  else if (m >= 9 && m <= 12) { term = '2'; }
  else                        { term = 'winter'; year = y - 1; }
  return { year, term };
}

// data state + API 호출 전담 hook
// UI state(팝업, 폼 입력값..) : Dashboard.tsx에서 관리
export function useDashConnect() {
  const [semesters, setSemesters]     = useState<Semester[]>([]);
  const [allCourses, setAllCourses]   = useState<Course[]>([]);
  const [gradReqs, setGradReqs]       = useState<GradReq[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [targetGpa, setTargetGpa]     = useState(4.2);


  // 학기 + 과목 전체 로드 (마운트 시, 업로드 완료 후 재호출)
  async function loadData() {
    const token = localStorage.getItem('token') || ''; // 브라우저 저장소 token
    setDataLoading(true);

    try {
      // #1 목표 GPA (target_gpa)
      const mypageData = await fetch(`${BASE}/users/mypage`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (mypageData.ok) {
        const mp = await mypageData.json();
        const val = parseFloat(mp.target_gpa);
        setTargetGpa(isNaN(val) ? 4.2 : val); 
        // MySQL에서 string으로 오므로 Float 로 파싱 필요함!
      }


      // #2 학기 목록 요청 (semesterData = fetch 응답, sems = 파싱된 배열)
      const semesterData = await fetch(`${BASE}/semesters`, {
        headers: { Authorization: 'Bearer ' + token },
      }); // fetch 결과 : .ok(200대역이면 true 외 false) .status
      if (semesterData.status === 401) {
        // 토큰 만료 시 자동 로그아웃 : window.location.reload(); 사용
        localStorage.removeItem('token');
        window.location.reload();
        return;
      }
      if (!semesterData.ok) {
        console.error('학기 불러오기 실패:', semesterData.status);
        return;  // finally: setDataLoading(false) 처리
      }
      const sems: any[] = await semesterData.json(); // {{}} => {}x*
      setSemesters(sems);
      if (sems.length === 0) return; // 엑셀 파싱 전이면 업로드 팝업 강제 표시


      // #3 모든 학기 과목 조회 (전체 과목 정보)
      const allCoursesArr: Course[] = [];
      for (const s of sems) { // 학기마다 과목 개별 조회 (학기 id 기준)
        const res = await fetch(`${BASE}/semesters/${s.id}/courses`, {
          headers: { Authorization: 'Bearer ' + token },
        });
        const data = await res.json();
        allCoursesArr.push(...data); // 배열 펼쳐서 합치기 (spread)
      }
      setAllCourses(allCoursesArr);

      // #4 졸업요건 조회 
      const gradReqData = await fetch(`${BASE}/graduation`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      const reqData = await gradReqData.json();
      setGradReqs(reqData);
    } 
    catch (e) {
      console.error('데이터 로드 실패:', e);
    } 
    finally {
      setDataLoading(false);
    }
  }


  // #1 목표 GPA 저장 (PUT /api/users/target-gpa)
  async function saveTargetGpa(val: number): Promise<boolean> {
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(`${BASE}/users/target-gpa`, {
        method: 'PUT', headers: authHdr(token),
        body: JSON.stringify({ target_gpa: val }),
      });
      if (res.ok) { setTargetGpa(val); return true; }
      return false; // true = 저장성공 (팝업닫힘), false = 실패 (팝업유지)
    } catch (e) {
      console.error('목표 GPA 저장 실패:', e);
      return false;
    }
  }

  // #2 학기 추가 (POST /api/semesters → 과목 순차 등록)
  async function saveSemester(
    year: number,
    term: string,
    newCourses: { name: string; category: string; credit: string; grade: string }[],
    existingSemesters: Semester[],
  ): Promise<boolean> {
    const { year: todayYear, term: todayTerm } = getCurrentSem();

    const termOrd: Record<string, number> = {
       '1': 1, 'summer': 2, '2': 3, 'winter': 4 
      };

    // 현재 학기 이후의 학기는 추가 방지
    if (year > todayYear 
        || (year === todayYear && termOrd[term] > termOrd[todayTerm])
        ) {
      alert('현재 학기 이후의 학기는 추가할 수 없습니다.');
      return false;
    }

    const token = localStorage.getItem('token') || '';
    try {
      // 1) 학기 만들기 (POST)
      const semRes = await fetch(`${BASE}/semesters`, {
        method: 'POST',
        headers: authHdr(token),
        body: JSON.stringify({ semester_year: year, term }),
      });

      let semData;
      if (!semRes.ok) {
        const errData = await semRes.json();
        // 이미 존재하는 학기 => 덮어쓰기 확인
        if (errData.message !== '이미 존재하는 학기입니다.') return false;
        if (!window.confirm(`${year}년 ${term}학기가 이미 존재합니다.
             \n덮어쓰겠습니까? (기존 과목 전체 삭제)`)) return false;
              // alert() 랑 비슷한것. window.confirm = 확인/취소 2개

        // 기존 학기 삭제 ( 과목도 전부 삭제)
        const existing = existingSemesters.find(
          s => s.semester_year === year && s.term === term
        );
        if (!existing) return false;
        await fetch(`${BASE}/semesters/${existing.id}`, {
          method: 'DELETE', headers: { Authorization: 'Bearer ' + token },
        });

        // 재생성
        const reRes = await fetch(`${BASE}/semesters`, {
          method: 'POST', headers: authHdr(token),
          body: JSON.stringify({ semester_year: year, term }),
        });
        if (!reRes.ok) return false;
        semData = await reRes.json();
      } 
      else {
        semData = await semRes.json();
        // 새로 추가하는 경우 그냥 넣으면 됨
      }

      // 2) 과목 등록 (category : division 자동매핑)
      for (const c of newCourses) {
        if (!c.name.trim()) continue;
        const div = c.category.includes('전공') ? '전공' : '교양'; 
        // DB division 칼럼용 (전공필수/선택 => 전공 *주의: 필드랑 다름)
        await fetch(`${BASE}/semesters/${semData.id}/courses`, {
          method: 'POST', headers: authHdr(token),
          body: JSON.stringify({
            name: c.name.trim(), credit: parseInt(c.credit) || 3,
            division: div, category: c.category,
            code: null, area: null, sub_area: null, 
            grade: c.grade || null, grade_points: null,
          }),
        });
      }
      loadData();
      return true;
    } 
    catch (e) {
      console.error('학기 추가 실패:', e);
      return false; // true = 추가성공 (팝업/폼 닫힘), false = 실패
    }
  }

  // #2 학기 삭제 (DELETE /api/semesters/:id)
  async function deleteSemester(semId: number, label: string) {
    if (!window.confirm(`${label} 학기를 삭제하겠습니까?
        \n과목 및 성적 데이터가 전부 삭제됩니다.`)) return;
    const token = localStorage.getItem('token') || '';
    
    try {
      const res = await fetch(`${BASE}/semesters/${semId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) { console.error(
        '학기 삭제 실패 - 서버 응답:', res.status
      ); return; }
      loadData();
    } 
    catch (e) {
      console.error('학기 삭제 실패:', e);
    }
  }

  // #2 기존 학기에 과목 추가 (POST /api/semesters/:id/courses)
  // 성공 시 true : Dashboard에서 폼 초기화
  async function addCourseToSemester(
    semId: number,
    course: { name: string; category: string; credit: string; grade: string },
  ): Promise<boolean> {
    if (!course.name.trim()) return false;
    const token = localStorage.getItem('token') || '';
    const div = course.category.includes('전공') ? '전공' : '교양';
    
    try {
      const res = await fetch(`${BASE}/semesters/${semId}/courses`, {
        method: 'POST', headers: authHdr(token),
        body: JSON.stringify({
          name: course.name.trim(), credit: parseInt(course.credit) || 3,
          division: div, category: course.category,
          code: null, area: null, sub_area: null, 
          grade: course.grade || null, grade_points: null,
        }),
      });
      if (!res.ok) return false;
      loadData();
      return true;
    } catch (e) {
      console.error('과목 추가 실패:', e);
      return false; // true = 추가성공 (폼 초기화), false = 실패
    }
  }

  // #3 기존 과목 수정 (PUT /api/semesters/:id/courses/:courseId)
  // 성공 시 true : Dashboard에서 editCourseId 초기화
  async function saveCourseEdit(
    semId: number,
    courseId: number,
    data: { name: string; category: string; credit: string; grade: string },
  ): Promise<boolean> {
    if (!data.name.trim()) return false;
    const token = localStorage.getItem('token') || '';
    const div = data.category.includes('전공') ? '전공' : '교양';
    try {
      const res = await fetch(`${BASE}/semesters/${semId}/courses/${courseId}`, {
        method: 'PUT', headers: authHdr(token),
        body: JSON.stringify({
          name: data.name.trim(), credit: parseInt(data.credit) || 3,
          division: div, category: data.category,
          code: null, area: null, sub_area: null, grade: data.grade || null, grade_points: null,
        }),
      });

      if (!res.ok) return false;
      loadData();

      return true;
    } 
    catch (e) {
      console.error('과목 수정 실패:', e);
      return false; // true = 수정성공 (수정폼 닫힘), false = 실패
    }
  }

  // 학기 완료 버튼 처리 (DB 저장 : 학기 GPA 계산/저장)
  // grades: Dashboard UI state (과목id => 성적 문자) 받아서 처리
  // 성공 시 true : Dashboard에서 grades 초기화
  async function completeSemester(
    semId: number,
    semCoursesList: any[],
    grades: Record<number, string>,
  ): Promise<boolean> {
    if (!semId || semCoursesList.length === 0) return false;
    const token = localStorage.getItem('token') || '';
    try {
      // 1) 과목별 성적 저장
      for (const c of semCoursesList) {
        if (!grades[c.id]) continue;
        await fetch(`${BASE}/semesters/${semId}/courses/${c.id}`, {
          method: 'PUT', headers: authHdr(token),
          body: JSON.stringify({
            name: c.name, credit: c.credit,
            code: c.code ?? null, division: c.division ?? null,
            area: c.area ?? null, sub_area: c.sub_area ?? null,
            category: c.category ?? null, grade: grades[c.id], grade_points: null,
          }),
        });
      }

      // 2) 학기 GPA 계산 및 저장 (PATCH /api/semesters/:id)
      // grades[c.id]가 있으면 새로 입력한 성적, 
      // 없으면 기존 성적 유지 (?? = null이면 우측 사용)
      const gradedCourses = semCoursesList.map(c => (
        { ...c, grade: grades[c.id] ?? c.grade }
      ));
      const semGpa = calcGpa(gradedCourses);
      if (semGpa !== null) {
        await fetch(`${BASE}/semesters/${semId}`, {
          method: 'PATCH', headers: authHdr(token),
          body: JSON.stringify({ gpa: semGpa }),
        });
      }

      loadData();
      return true;

    } 
    catch (e) {
      console.error('학기 완료 처리 실패:', e);
      return false; // true = 완료성공 (성적입력 초기화), false = 실패
    }
  }


  useEffect(() => { loadData(); }, []); // 처음 1회에만 실행 (useEffect)

  return {
    semesters, allCourses, gradReqs, dataLoading, targetGpa,
    loadData,
    deleteSemester,
    saveSemester,
    addCourseToSemester,
    saveCourseEdit,
    completeSemester,
    saveTargetGpa,
  };
}
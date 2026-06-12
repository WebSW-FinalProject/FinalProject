import { useState, useEffect } from 'react';
import type { Semester, Course, GraduationRequirement } from '../types';
import { API_BASE } from '../api';

const BASE = `${API_BASE}/api`;

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface GradeData {
  semesters: Semester[];
  courses: Course[];
  gradReqs: GraduationRequirement[];
  loading: boolean;
  error: string | null;
  addSemester: (semester_year: number, term: string) => Promise<Semester | null>;
  deleteSemester: (semesterId: number) => Promise<void>;
  addCourse: (semesterId: number, course: Omit<Course, 'id' | 'semester_id'>) => Promise<Course | null>;
  updateCourse: (semesterId: number, courseId: number, grade: string, grade_points: number) => Promise<Course | null>;
  deleteCourse: (semesterId: number, courseId: number) => Promise<void>;
  refresh: () => void;
}

export function useGradeData(): GradeData {
  const [semesters, setSemesters]   = useState<Semester[]>([]);
  const [courses, setCourses]       = useState<Course[]>([]);
  const [gradReqs, setGradReqs]     = useState<GraduationRequirement[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      // 학기 목록
      const semRes = await fetch(`${BASE}/semesters`, { headers: authHeaders() });
      if (!semRes.ok) throw new Error('학기 데이터를 불러오지 못했습니다.');
      const semRows: Semester[] = await semRes.json();
      setSemesters(semRows);

      // 각 학기별 과목
      const allCourses: Course[] = [];
      for (const sem of semRows) {
        const courseRes = await fetch(`${BASE}/semesters/${sem.id}/courses`, { headers: authHeaders() });
        if (!courseRes.ok) continue;
        const courseRows: Course[] = await courseRes.json();
        allCourses.push(...courseRows);
      }
      setCourses(allCourses);

      // 졸업 요건 기준학점 (엑셀 업로드 시 DB에 저장된 값)
      const reqRes = await fetch(`${BASE}/graduation`, { headers: authHeaders() });
      if (reqRes.ok) {
        const reqRows: GraduationRequirement[] = await reqRes.json();
        setGradReqs(reqRows);
      }

    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function refresh() { loadData(); }

  async function addSemester(semester_year: number, term: string) {
    try {
      const res = await fetch(`${BASE}/semesters`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ semester_year, term }),
      });
      if (!res.ok) throw new Error();
      const newSem: Semester = await res.json();
      setSemesters(prev => [...prev, newSem]);
      return newSem;
    } catch {
      setError('학기를 추가하지 못했습니다.');
      return null;
    }
  }

  async function deleteSemester(semesterId: number) {
    try {
      const res = await fetch(`${BASE}/semesters/${semesterId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setSemesters(prev => prev.filter(s => s.id !== semesterId));
      setCourses(prev => prev.filter(c => c.semester_id !== semesterId));
    } catch {
      setError('학기를 삭제하지 못했습니다.');
    }
  }

  async function addCourse(semesterId: number, course: Omit<Course, 'id' | 'semester_id'>) {
    try {
      const res = await fetch(`${BASE}/semesters/${semesterId}/courses`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(course),
      });
      if (!res.ok) throw new Error();
      const newCourse: Course = await res.json();
      setCourses(prev => [...prev, newCourse]);
      return newCourse;
    } catch {
      setError('과목을 추가하지 못했습니다.');
      return null;
    }
  }

  async function updateCourse(semesterId: number, courseId: number, grade: string, grade_points: number) {
    try {
      const existing = courses.find(c => c.id === courseId);
      if (!existing) throw new Error();
      const res = await fetch(`${BASE}/semesters/${semesterId}/courses/${courseId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...existing, grade, grade_points }),
      });
      if (!res.ok) throw new Error();
      const updated: Course = await res.json();
      setCourses(prev => prev.map(c => c.id === courseId ? updated : c));
      return updated;
    } catch {
      setError('성적을 수정하지 못했습니다.');
      return null;
    }
  }

  async function deleteCourse(semesterId: number, courseId: number) {
    try {
      const res = await fetch(`${BASE}/semesters/${semesterId}/courses/${courseId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch {
      setError('과목을 삭제하지 못했습니다.');
    }
  }

  return {
    semesters, courses, gradReqs,
    loading, error,
    addSemester, deleteSemester,
    addCourse, updateCourse, deleteCourse,
    refresh,
  };
}


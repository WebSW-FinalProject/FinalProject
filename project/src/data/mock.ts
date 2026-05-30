import type { User, Semester, Course, Post, Comment, GraduationRequirement } from '../types';

// ai 도움 받아 생성한 mock data => 프론트 구현 시 백엔드 연결 용이하도록 함!
// (설계해둔 MySQL DB구조-mysql_schema.sql 형식 따름)

export const mockUser: User = {
  id: 1,
  email: 'test@univ.ac.kr',
  username: '이문세',
  enroll_date: '2022-03-02T00:00:00.000Z',
};

export const mockSemesters: Semester[] = [
  { id: 1, user_id: 1, semester_year: 2023, term: '1', gpa: 3.70 },
  { id: 2, user_id: 1, semester_year: 2023, term: '2', gpa: 4.00 },
  { id: 3, user_id: 1, semester_year: 2024, term: '1', gpa: 4.10 },
  { id: 4, user_id: 1, semester_year: 2024, term: '2', gpa: 4.30 },
  { id: 5, user_id: 1, semester_year: 2025, term: '1', gpa: null }, // 현재 학기
];

export const mockCourses: Course[] = [
  // 2023-1
  { id: 1,  semester_id: 1, credit: 3, code: 'CS101', name: '프로그래밍기초', division: '전공', category: '전공필수', grade: 'A0', grade_points: 4.0, area: null, sub_area: null },
  { id: 2,  semester_id: 1, credit: 3, code: 'MA101', name: '미적분학',      division: '교양', category: '교양필수', grade: 'B+', grade_points: 3.5, area: '개신기초교양', sub_area: null },
  // 2023-2
  { id: 3,  semester_id: 2, credit: 3, code: 'CS201', name: '객체지향프로그래밍', division: '전공', category: '전공필수', grade: 'A+', grade_points: 4.5, area: null, sub_area: null },
  { id: 4,  semester_id: 2, credit: 3, code: 'CS202', name: '컴퓨터구조',    division: '전공', category: '전공선택', grade: 'A0', grade_points: 4.0, area: null, sub_area: null },
  // 현재 학기 (2025-1, grade: null = 아직 미입력)
  { id: 10, semester_id: 5, credit: 3, code: 'CS301', name: '자료구조',      division: '전공', category: '전공필수', grade: null, grade_points: null, area: null, sub_area: null },
  { id: 11, semester_id: 5, credit: 3, code: 'CS302', name: '알고리즘',      division: '전공', category: '전공선택', grade: null, grade_points: null, area: null, sub_area: null },
  { id: 12, semester_id: 5, credit: 3, code: 'MA201', name: '이산수학',      division: '전공', category: '전공선택', grade: null, grade_points: null, area: null, sub_area: null },
  { id: 13, semester_id: 5, credit: 2, code: 'EN101', name: '영어회화',      division: '교양', category: '교양선택', grade: null, grade_points: null, area: '개신기초교양', sub_area: null },
  { id: 14, semester_id: 5, credit: 2, code: 'GE102', name: '인성과윤리',    division: '교양', category: '교양필수', grade: null, grade_points: null, area: '개신기초교양', sub_area: null },
];

export const mockGradReqs: GraduationRequirement[] = [
  { id: 1, user_id: 1, area: '전공필수', required: 60 },
  { id: 2, user_id: 1, area: '전공선택', required: 30 },
  { id: 3, user_id: 1, area: '교양필수', required: 18 },
  { id: 4, user_id: 1, area: '교양선택', required: 12 },
];

export const mockPosts: Post[] = [
  { id: 1, user_id: 2, category: 'GRADUATION', title: '졸업논문 주제 추천해주세요', body: 'AI 관련 논문 쓰려고 하는데 주제 추천 부탁드려요', enroll_date: '2025-05-20T10:00:00.000Z', modify_date: '2025-05-20T10:00:00.000Z', author_name: '김민준', like_count: 12, comment_count: 5 },
  { id: 2, user_id: 3, category: 'JOB_HUNT',  title: '취업 준비 어떻게 하세요?',   body: '포트폴리오 준비 중인데 조언 구합니다',         enroll_date: '2025-05-21T14:30:00.000Z', modify_date: '2025-05-21T14:30:00.000Z', author_name: '박서연', like_count: 8,  comment_count: 3 },
  { id: 3, user_id: 1, category: 'DAILY',      title: '오늘 학식 뭐 나왔어요?',       body: '오늘 점심 메뉴 아시는 분?',                  enroll_date: '2025-05-22T11:00:00.000Z', modify_date: '2025-05-22T11:00:00.000Z', author_name: '이문세', like_count: 2,  comment_count: 1 },
  { id: 4, user_id: 2, category: 'GRADUATION', title: '4학년 2학기 수강 조언',        body: '졸업논문이랑 같이 들을 수 있는 과목 추천요', enroll_date: '2025-05-23T09:00:00.000Z', modify_date: '2025-05-23T09:00:00.000Z', author_name: '김민준', like_count: 6,  comment_count: 2 },
  { id: 5, user_id: 3, category: 'JOB_HUNT',  title: '코테 준비 얼마나 했어요?',     body: '백준 몇 문제 풀었는지 궁금합니다',           enroll_date: '2025-05-24T16:00:00.000Z', modify_date: '2025-05-24T16:00:00.000Z', author_name: '박서연', like_count: 15, comment_count: 7 },
];

export const mockComments: Comment[] = [
  { id: 1, post_id: 1, user_id: 3, body: '저도 같은 고민 중이에요!', enroll_date: '2025-05-20T11:00:00.000Z', author_name: '박서연' },
  { id: 2, post_id: 1, user_id: 1, body: 'NLP 쪽 추천드려요',        enroll_date: '2025-05-20T12:00:00.000Z', author_name: '이문세' },
];


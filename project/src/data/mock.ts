import type { User, Semester, Course, 
              Post, Comment, GraduationRequirement } from '../types';

// 참고로 types/index.ts 는 TS 를 위한 타입 명시화 장치라고 보면 됨
// 설계흐름 이해 - BackDB:.sql(저장구조) => index.ts(구조에따른 타입) => mock.ts(데이터 형식)

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
  { id: 5, user_id: 1, semester_year: 2026, term: '1', gpa: null }, // 현재 학기
];

export const mockCourses: Course[] = [
  // 2023-1
  { id: 1,  semester_id: 1, credit: 3, code: 'CS101', name: '프로그래밍기초', division: '전공', category: '전공필수', grade: 'A0', grade_points: 4.0, area: null, sub_area: null },
  { id: 2,  semester_id: 1, credit: 3, code: 'MA101', name: '미적분학',      division: '교양', category: '교양필수', grade: 'B+', grade_points: 3.5, area: '개신기초교양', sub_area: null },
  // 2023-2
  { id: 3,  semester_id: 2, credit: 3, code: 'CS201', name: '객체지향프로그래밍', division: '전공', category: '전공필수', grade: 'A+', grade_points: 4.5, area: null, sub_area: null },
  { id: 4,  semester_id: 2, credit: 3, code: 'CS202', name: '컴퓨터구조',    division: '전공', category: '전공선택', grade: 'A0', grade_points: 4.0, area: null, sub_area: null },
  
  // 현재 학기 (2026-1, grade: null = 아직 미입력)
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
  { id: 1,  user_id: 2, category: 'GRADUATION', title: '졸업논문 주제 추천해주세요',        body: 'AI 관련 논문 쓰려고 하는데 주제 추천 부탁드려요',    enroll_date: '2026-05-20T10:00:00.000Z', modify_date: '2026-05-20T10:00:00.000Z', author_name: '김민준', like_count: 12, comment_count: 5,  view_count: 142 },
  { id: 2,  user_id: 3, category: 'JOB_HUNT',   title: '취업 준비 어떻게 하세요?',          body: '포트폴리오 준비 중인데 조언 구합니다',              enroll_date: '2026-05-21T14:30:00.000Z', modify_date: '2026-05-21T14:30:00.000Z', author_name: '박서연', like_count: 8,  comment_count: 3,  view_count: 98  },
  { id: 3,  user_id: 1, category: 'DAILY',       title: '오늘 학식 뭐 나왔어요?',            body: '오늘 점심 메뉴 아시는 분?',                        enroll_date: '2026-05-22T11:00:00.000Z', modify_date: '2026-05-22T11:00:00.000Z', author_name: '이문세', like_count: 2,  comment_count: 1,  view_count: 31  },
  { id: 4,  user_id: 2, category: 'GRADUATION', title: '4학년 2학기 수강 조언',             body: '졸업논문이랑 같이 들을 수 있는 과목 추천요',        enroll_date: '2026-05-23T09:00:00.000Z', modify_date: '2026-05-23T09:00:00.000Z', author_name: '김민준', like_count: 6,  comment_count: 2,  view_count: 74  },
  { id: 5,  user_id: 3, category: 'JOB_HUNT',   title: '코테 준비 얼마나 했어요?',          body: '백준 몇 문제 풀었는지 궁금합니다',                  enroll_date: '2026-05-24T16:00:00.000Z', modify_date: '2026-05-24T16:00:00.000Z', author_name: '박서연', like_count: 15, comment_count: 7,  view_count: 210 },
  { id: 6,  user_id: 1, category: 'DAILY',       title: '도서관 자리 맡아두기 팁 있나요?',   body: '시험기간 자리 경쟁 너무 심한데 꿀팁 공유',         enroll_date: '2026-05-25T10:00:00.000Z', modify_date: '2026-05-25T10:00:00.000Z', author_name: '이문세', like_count: 9,  comment_count: 4,  view_count: 112 },
  { id: 7,  user_id: 2, category: 'GRADUATION', title: '편입 알아보시는 분 있나요?',        body: '3학년 때 편입 준비하면 늦을까요?',                  enroll_date: '2026-05-25T14:00:00.000Z', modify_date: '2026-05-25T14:00:00.000Z', author_name: '김민준', like_count: 7,  comment_count: 2,  view_count: 89  },
  { id: 8,  user_id: 3, category: 'JOB_HUNT',   title: '인턴 자소서 첨삭 같이 하실 분',    body: '스터디 구합니다. 같이 봐드려요',                   enroll_date: '2026-05-26T09:00:00.000Z', modify_date: '2026-05-26T09:00:00.000Z', author_name: '박서연', like_count: 11, comment_count: 6,  view_count: 134 },
  { id: 9,  user_id: 1, category: 'DAILY',       title: '3학년 2학기 시간표 어떻게 짜셨어요?', body: '전공이랑 교양 균형 잡기 힘드네요',               enroll_date: '2026-05-26T17:00:00.000Z', modify_date: '2026-05-26T17:00:00.000Z', author_name: '이문세', like_count: 5,  comment_count: 3,  view_count: 63  },
  { id: 10, user_id: 2, category: 'GRADUATION', title: '복수전공 신청 후기 공유합니다',     body: '경영학 복수전공 1학기 들으면서 느낀 점들',          enroll_date: '2026-05-27T11:00:00.000Z', modify_date: '2026-05-27T11:00:00.000Z', author_name: '김민준', like_count: 13, comment_count: 8,  view_count: 178 },
  { id: 11, user_id: 3, category: 'JOB_HUNT',   title: '면접 1분 자기소개 준비 팁',        body: '면접관들 눈에 띄는 자기소개는 어떻게 하나요?',     enroll_date: '2026-05-27T15:00:00.000Z', modify_date: '2026-05-27T15:00:00.000Z', author_name: '박서연', like_count: 20, comment_count: 9,  view_count: 287 },
  { id: 12, user_id: 1, category: 'DAILY',       title: '학교 앞 맛집 추천해주세요',         body: '오랜만에 친구랑 밥 먹는데 분위기 좋은 곳 있나요?', enroll_date: '2026-05-28T12:00:00.000Z', modify_date: '2026-05-28T12:00:00.000Z', author_name: '이문세', like_count: 4,  comment_count: 2,  view_count: 47  },
  { id: 13, user_id: 2, category: 'GRADUATION', title: '졸업 인증제 토익 점수',             body: '토익 800점이면 안정권인가요?',                     enroll_date: '2026-05-28T18:00:00.000Z', modify_date: '2026-05-28T18:00:00.000Z', author_name: '김민준', like_count: 3,  comment_count: 5,  view_count: 55  },
  { id: 14, user_id: 3, category: 'JOB_HUNT',   title: '직무 분석은 어떻게 하는 건가요?',  body: '첫 취업이라 직무 분석 단계부터 막히네요',           enroll_date: '2026-05-29T10:00:00.000Z', modify_date: '2026-05-29T10:00:00.000Z', author_name: '박서연', like_count: 10, comment_count: 4,  view_count: 123 },
  { id: 15, user_id: 1, category: 'DAILY', title: '갑자기 비 오는데 우산 없네요', body: '학교 안에 우산 대여 가능한 곳 있나요?', enroll_date: '2026-05-29T14:00:00.000Z', modify_date: '2026-05-29T14:00:00.000Z', author_name: '이문세', like_count: 1, comment_count: 0 },
  { id: 16, user_id: 2, category: 'GRADUATION', title: '졸업식 의상 정보', body: '남학우분들 보통 정장 빌리시나요?', enroll_date: '2026-05-30T09:00:00.000Z', modify_date: '2026-05-30T09:00:00.000Z', author_name: '김민준', like_count: 6, comment_count: 3 },
  { id: 17, user_id: 3, category: 'JOB_HUNT', title: '인적성 검사 문제집 추천', body: '여러 출판사 있는데 어디가 괜찮을까요?', enroll_date: '2026-05-30T13:00:00.000Z', modify_date: '2026-05-30T13:00:00.000Z', author_name: '박서연', like_count: 12, comment_count: 5 },
  { id: 18, user_id: 1, category: 'DAILY', title: '자취생 식단 관리', body: '맨날 배달음식만 먹는데 건강한 식단 추천요', enroll_date: '2026-05-31T11:00:00.000Z', modify_date: '2026-05-31T11:00:00.000Z', author_name: '이문세', like_count: 8, comment_count: 6 },
  { id: 19, user_id: 2, category: 'GRADUATION', title: '학점 세탁 가능할까요?', body: '졸업 직전인데 학점 복구 방법 있나요', enroll_date: '2026-06-01T10:00:00.000Z', modify_date: '2026-06-01T10:00:00.000Z', author_name: '김민준', like_count: 14, comment_count: 10 },
  { id: 20, user_id: 3, category: 'JOB_HUNT', title: '현직자 멘토링 후기', body: '오늘 다녀온 멘토링 유익해서 공유합니다', enroll_date: '2026-06-02T16:00:00.000Z', modify_date: '2026-06-02T16:00:00.000Z', author_name: '박서연', like_count: 18, comment_count: 4 },
  
];

export const mockComments: Comment[] = [
  { id: 1, post_id: 1, user_id: 3, body: '저도 같은 고민 중이에요!',                  enroll_date: '2026-05-20T11:00:00.000Z', author_name: '박서연' },
  { id: 2, post_id: 1, user_id: 1, body: 'NLP 쪽 추천드려요',                        enroll_date: '2026-05-20T12:00:00.000Z', author_name: '이문세' },
  { id: 3, post_id: 1, user_id: 2, body: '컴퓨터비전 쪽도 요즘 수요 많더라고요',         enroll_date: '2026-05-20T13:00:00.000Z', author_name: '김민준' },
  { id: 4, post_id: 1, user_id: 3, body: '교수님께 미리 여쭤보는 게 제일 좋을 것 같아요', enroll_date: '2026-05-20T14:00:00.000Z', author_name: '박서연' },
  { id: 5, post_id: 1, user_id: 1, body: '논문 검색은 Google Scholar 추천합니다',      enroll_date: '2026-05-20T15:00:00.000Z', author_name: '이문세' },
  { id: 6, post_id: 1, user_id: 2, body: '저는 강화학습으로 썼는데 꽤 흥미로웠어요',     enroll_date: '2026-05-20T16:00:00.000Z', author_name: '김민준' },
  { id: 7, post_id: 1, user_id: 3, body: '학과 선배한테 물어봐도 도움 많이 돼요!',       enroll_date: '2026-05-20T17:00:00.000Z', author_name: '박서연' },
];


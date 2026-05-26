// mysql_schema.sql 내용에 따라 TypeScript 타입화
//  (interface 사용해서 타입 통일)


// 유저
export interface User {
  id: number;
  email: string;
  username: string;
  enroll_date: string;
}

// 학기
export interface Semester {
  id: number;
  user_id: number;
  semester_year: number;
  term: '1' | '2' | 'summer' | 'winter';
  gpa: number | null;
}

// 과목
export interface Course {
  id: number;
  semester_id: number;
  credit: number;
  code: string | null;
  name: string;
  division: string | null;   
   // 교양 | 전공
  area: string | null;
  sub_area: string | null;
  category: string | null;   
   // 전필, 교선 ...
  grade: string | null;      
   // A+, B0 ...
  grade_points: number | null;
}

// 졸업요건
export interface GraduationRequirement {
  id: number;
  user_id: number;
  area: string;
  required: number;
}

// 게시글
export interface Post {
  id: number;
  user_id: number;
  category: string;
  title: string;
  body: string;
  enroll_date: string;
  modify_date: string;
  author_name?: string;  
  like_count?: number;  
  comment_count?: number;
}

// 댓글
export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  body: string;
  enroll_date: string;
  author_name?: string;
}
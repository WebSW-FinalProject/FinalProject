CREATE DATABASE IF NOT EXISTS UniguideDB
  DEFAULT CHARACTER SET utf8mb4;

USE UniguideDB;


-- users
-- id, email, pw(hash), username, enroll_date(가입일)
-- dash 연결 : target_gpa 추가 : 목표 학점(유저 직접 설정) DB연결
-- header 연결 : department(학과), grade_year(학년) 추가: 프로필정보
-- dash 연결 : percentile(백분위) 추가 : 엑셀 파싱 시 저장, 상위 % 표시용
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  username      VARCHAR(80)   NOT NULL,
  target_gpa    DECIMAL(3,2)  NOT NULL DEFAULT 4.20,
  department    VARCHAR(60)   NULL,
  grade_year    TINYINT       NULL,
  percentile    DECIMAL(5,2)  NULL,
  enroll_date   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- semesters
-- id, user_id, semester_year(2024), term(1/2/summer/winter), gpa(0.00~4.50)
-- FK: user_id => users(id), CASCADE
CREATE TABLE IF NOT EXISTS semesters (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED  NOT NULL,
  semester_year SMALLINT      NOT NULL,
  term          ENUM('1','2','summer','winter') NOT NULL,
  gpa           DECIMAL(3,2)  NULL,
  log_date      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_semesters_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- courses
-- id, semester_id, credit, code, name, grade(A+), grade_points(4.50)
-- division(교양/전공), area(개신기초교양...)
-- sub_area(의사소통...), category(교양선택/전공필수...)
-- FK: semester_id => semesters(id), CASCADE
CREATE TABLE IF NOT EXISTS courses (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  semester_id          INT UNSIGNED  NOT NULL,
  credit               SMALLINT      NOT NULL,
  code         VARCHAR(20)   NULL,
  name         VARCHAR(100)  NOT NULL,
  division     VARCHAR(10)   NULL,
  area         VARCHAR(60)   NULL,
  sub_area     VARCHAR(60)   NULL,
  category     VARCHAR(20)   NULL,
  grade        VARCHAR(5)    NULL,
  grade_points DECIMAL(3,2)  NULL,
  log_date             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_courses_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



-- graduation_requirements (유저 직접 작성 졸업 요건 기준)
-- POST /api/graduation/requirements 
-- area(개신기초교양...), required(12) = 해당 영역에서 필요한 졸업학점
-- FK: user_id => users(id), CASCADE
CREATE TABLE IF NOT EXISTS graduation_requirements (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  area        VARCHAR(60)   NOT NULL,
  required    SMALLINT      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_area (user_id, area),
  CONSTRAINT fk_gradreq_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- graduation_status (엑셀 졸업기준대비 미이수내역 파싱결과 저장)
-- todo_type(미이수 구분), todo_detail(미이수 내역), note(비고)
-- 엑셀 업로드 시 INSERT, 재업로드 시 기존 데이터 DELETE 후 재INSERT
-- FK: user_id => users(id), CASCADE
CREATE TABLE IF NOT EXISTS graduation_status (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  todo_type   VARCHAR(60)   NOT NULL,
  todo_detail TEXT          NOT NULL,
  note        VARCHAR(255)  NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_gradstatus_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- posts (게시글, category col로 게시판 구분)
-- deleted_at 없음 => 삭제 시 복구 불가
-- FK: user_id => users(id), CASCADE (탈퇴 시 글 전체 삭제)
CREATE TABLE IF NOT EXISTS posts (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  category    VARCHAR(40)   NOT NULL DEFAULT 'general',
  title       VARCHAR(120)  NOT NULL,
  body        TEXT          NOT NULL,
  view_count  INT UNSIGNED  NOT NULL DEFAULT 0,
  enroll_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modify_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- comments (댓글, 수정 불가)
-- FK: post_id => posts(id), user_id => users(id), CASCADE
CREATE TABLE IF NOT EXISTS comments (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  post_id     INT UNSIGNED  NOT NULL,
  user_id     INT UNSIGNED  NOT NULL,
  body        TEXT          NOT NULL,
  enroll_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- post_likes (좋아요, PK = post_id+user_id 복합키 => 중복 불가)
CREATE TABLE IF NOT EXISTS post_likes (
  post_id     INT UNSIGNED  NOT NULL,
  user_id     INT UNSIGNED  NOT NULL,
  enroll_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  CONSTRAINT fk_likes_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- post_bookmarks (북마크, PK = post_id+user_id 복합키 => 중복 불가)
CREATE TABLE IF NOT EXISTS post_bookmarks (
  post_id     INT UNSIGNED  NOT NULL,
  user_id     INT UNSIGNED  NOT NULL,
  enroll_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  CONSTRAINT fk_bookmarks_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- schedule_events (유저 일정 / 과제, 시험, 발표 등)
-- event_date(DATE), event_time(TIME, 선택), type(과제/시험/발표/프로젝트/기타)
-- FK: user_id => users(id), CASCADE
CREATE TABLE IF NOT EXISTS schedule_events (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  title       VARCHAR(100)  NOT NULL,
  event_date  DATE          NOT NULL,
  event_time  TIME          NULL,
  type        VARCHAR(20)   NOT NULL DEFAULT '기타',
  memo        TEXT          NULL,
  log_date    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- timetable_blocks (유저 직접 추가: 시간표 블럭)
-- col(2~6 = 월~금), gird_row("startRow/endRow": 교시), time("09:00~11:00" 표시용)
-- FK: user_id => users(id), CASCADE
CREATE TABLE IF NOT EXISTS timetable_blocks (
  id       INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id  INT UNSIGNED  NOT NULL,
  col      TINYINT       NOT NULL,
  grid_row VARCHAR(10)   NOT NULL, 
  name     VARCHAR(100)  NOT NULL,
  time     VARCHAR(20)   NOT NULL,
  type     VARCHAR(10)   NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_blocks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- course_plan_items (수강신청 계획 과목 목록)
-- courses 테이블(이미 이수한 과목)과 별개로 "이번 학기 신청 예정" 과목 관리
-- is_enrolled: 1=담김, 0=담기 / sort_order: 드래그 순서
-- FK: user_id => users(id), semester_id => semesters(id), CASCADE
CREATE TABLE IF NOT EXISTS course_plan_items (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  semester_id INT UNSIGNED  NOT NULL,
  name        VARCHAR(100)  NOT NULL,
  category    VARCHAR(20)   NOT NULL DEFAULT '전공필수',
  professor   VARCHAR(50)   NULL,
  credit      SMALLINT      NOT NULL DEFAULT 3,
  is_enrolled TINYINT(1)    NOT NULL DEFAULT 1,
  sort_order  SMALLINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_plan_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_items_sem  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- course_plan_meta (수강신청 계획 메타 - 메모 + 표준이수모형 이미지)
-- user당 학기당 1행 (UNIQUE KEY로 중복 방지)
-- FK: user_id => users(id), semester_id => semesters(id), CASCADE
CREATE TABLE IF NOT EXISTS course_plan_meta (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  semester_id INT UNSIGNED  NOT NULL,
  memo        TEXT          NULL,
  image_path  VARCHAR(255)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_plan_meta (user_id, semester_id),
  CONSTRAINT fk_plan_meta_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_meta_sem  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

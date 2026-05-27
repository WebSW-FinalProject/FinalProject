CREATE DATABASE IF NOT EXISTS UniguideDB
  DEFAULT CHARACTER SET utf8mb4;

USE UniguideDB;


-- users
-- id, email, pw(hash), username, enroll_date(가입일)
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  username      VARCHAR(80)   NOT NULL,
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

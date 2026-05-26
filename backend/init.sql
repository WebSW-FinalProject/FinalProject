-- =============================================
-- 테스트용 전체 DB 초기화 스크립트
-- (실제 팀 레포에서는 users 테이블은 회원 파트가 만듦)
-- =============================================

CREATE DATABASE IF NOT EXISTS board_db;
USE board_db;

-- 테스트용 users 테이블 (회원 파트 팀원 코드와 동일한 구조)
CREATE TABLE IF NOT EXISTS users (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(100) NOT NULL UNIQUE,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  enroll_date DATETIME DEFAULT NOW()
);

-- 게시글 테이블
CREATE TABLE IF NOT EXISTS board_post (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  author_id   BIGINT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  content     TEXT,
  category    ENUM('GRADUATION','JOB_HUNT','DAILY') DEFAULT 'DAILY',
  view_count  INT DEFAULT 0,
  like_count  INT DEFAULT 0,
  create_date DATETIME DEFAULT NOW(),
  modify_date DATETIME,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS board_comment (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id     BIGINT NOT NULL,
  author_id   BIGINT NOT NULL,
  content     TEXT NOT NULL,
  create_date DATETIME DEFAULT NOW(),
  FOREIGN KEY (post_id)   REFERENCES board_post(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 좋아요 테이블
CREATE TABLE IF NOT EXISTS board_like (
  id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  UNIQUE KEY uq_like (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES board_post(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 북마크 테이블
CREATE TABLE IF NOT EXISTS board_bookmark (
  id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  UNIQUE KEY uq_bookmark (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES board_post(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- 테스트용 더미 데이터
-- =============================================

-- 테스트 유저 2명 (비밀번호: "1234" bcrypt 해시)
INSERT IGNORE INTO users (username, email, password) VALUES
  ('테스터1', 'test1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
  ('테스터2', 'test2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

-- 테스트 게시글
INSERT IGNORE INTO board_post (author_id, title, content, category) VALUES
  (1, '졸업논문 주제 추천해주세요', 'AI 관련 논문 쓰려고 하는데 주제 추천 부탁드려요', 'GRADUATION'),
  (2, '취업 준비 어떻게 하세요?', '포트폴리오 준비 중인데 조언 구합니다', 'JOB_HUNT'),
  (1, '오늘 학식 뭐 나왔어요?', '오늘 점심 메뉴 아시는 분?', 'DAILY');

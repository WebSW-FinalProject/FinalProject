-- =============================================
-- 게시판 파트 DB 초기화 스크립트
-- users 테이블은 회원 파트 코드 사용 (이 파일에서 생성 안 함)
-- =============================================

USE board_db;

-- 게시글 테이블 (ERD: posts)
CREATE TABLE IF NOT EXISTS posts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  category    VARCHAR(40),
  title       VARCHAR(120) NOT NULL,
  body        TEXT NOT NULL,
  enroll_date DATETIME DEFAULT NOW(),
  modify_date DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 댓글 테이블 (ERD: comments)
CREATE TABLE IF NOT EXISTS comments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  post_id     INT NOT NULL,
  user_id     INT NOT NULL,
  body        TEXT NOT NULL,
  enroll_date DATETIME DEFAULT NOW(),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 좋아요 테이블 (ERD: post_likes)
CREATE TABLE IF NOT EXISTS post_likes (
  post_id     INT NOT NULL,
  user_id     INT NOT NULL,
  enroll_date DATETIME DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 북마크 테이블 (ERD: post_bookmarks)
CREATE TABLE IF NOT EXISTS post_bookmarks (
  post_id     INT NOT NULL,
  user_id     INT NOT NULL,
  enroll_date DATETIME DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- 테스트용 더미 데이터 (users는 회원 파트 데이터 사용)
-- users 테이블에 id=1, id=2 인 유저가 있다고 가정
-- =============================================

INSERT IGNORE INTO posts (user_id, title, body, category) VALUES
  (1, '졸업논문 주제 추천해주세요', 'AI 관련 논문 쓰려고 하는데 주제 추천 부탁드려요', 'GRADUATION'),
  (2, '취업 준비 어떻게 하세요?', '포트폴리오 준비 중인데 조언 구합니다', 'JOB_HUNT'),
  (1, '오늘 학식 뭐 나왔어요?', '오늘 점심 메뉴 아시는 분?', 'DAILY');

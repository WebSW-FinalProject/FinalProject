const db = require('../../db/connection');

function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// ERD에 view_count가 없으므로 정렬은 likes(좋아요 수), latest(최신순)만 지원
const VALID_SORTS = {
  likes:  '(SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) DESC, p.id DESC',
  latest: 'p.enroll_date DESC',
};

const VALID_CATEGORIES = ['GRADUATION', 'JOB_HUNT', 'DAILY'];

async function findPosts({ page = 0, sort = 'latest', searchType, keyword }) {
  const offset  = page * 10;
  const orderBy = VALID_SORTS[sort] || VALID_SORTS.latest;

  let where  = '1=1';
  const params = [];

  if (keyword && keyword.trim() !== '') {
    switch (searchType) {
      case 'title':
        where += ' AND p.title LIKE ?';
        params.push(`%${keyword}%`);
        break;
      case 'content':
        where += ' AND p.body LIKE ?';
        params.push(`%${keyword}%`);
        break;
      case 'user':
        where += ' AND u.username = ?';
        params.push(keyword);
        break;
      case 'category': {
        const cat = keyword.toUpperCase();
        if (!VALID_CATEGORIES.includes(cat)) {
          throw createError(400, `카테고리는 ${VALID_CATEGORIES.join(', ')} 중 하나여야 합니다.`);
        }
        where += ' AND p.category = ?';
        params.push(cat);
        break;
      }
    }
  }

  const [rows] = await db.query(
    `SELECT p.id, p.title, p.body AS content, p.category,
            p.enroll_date AS create_date, p.modify_date,
            p.user_id AS author_id, u.username AS author_username,
            (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT 10 OFFSET ?`,
    [...params, offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE ${where}`,
    params
  );

  return { content: rows, totalElements: total, totalPages: Math.ceil(total / 10), page };
}

async function findPostById(id) {
  const [rows] = await db.query(
    `SELECT p.id, p.title, p.body AS content, p.category,
            p.enroll_date AS create_date, p.modify_date,
            p.user_id AS author_id, u.username AS author_username,
            (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function insertPost({ authorId, title, content, category }) {
  const [result] = await db.query(
    `INSERT INTO posts (user_id, title, body, category, enroll_date)
     VALUES (?, ?, ?, ?, NOW())`,
    [authorId, title, content, category || 'DAILY']
  );
  return findPostById(result.insertId);
}

async function updatePost({ id, title, content, category }) {
  await db.query(
    `UPDATE posts SET title=?, body=?, category=?, modify_date=NOW() WHERE id=?`,
    [title, content, category, id]
  );
  return findPostById(id);
}

async function deletePost(id) {
  await db.query('DELETE FROM posts WHERE id=?', [id]);
}

// ERD에 view_count 컬럼 없음
// async function incrementViewCount(id) {
//   await db.query('UPDATE posts SET view_count = view_count + 1 WHERE id=?', [id]);
// }
async function incrementViewCount(id) {
  // TODO: posts 테이블에 view_count 컬럼 추가 필요
  // 현재는 ERD에 해당 컬럼이 없으므로 동작하지 않음
}

async function toggleLike(postId, userId) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[existing]] = await conn.query(
      'SELECT post_id FROM post_likes WHERE post_id=? AND user_id=?',
      [postId, userId]
    );

    let liked;
    if (existing) {
      await conn.query('DELETE FROM post_likes WHERE post_id=? AND user_id=?', [postId, userId]);
      liked = false;
    } else {
      await conn.query('INSERT INTO post_likes (post_id, user_id, enroll_date) VALUES (?, ?, NOW())', [postId, userId]);
      liked = true;
    }

    const [[{ like_count }]] = await conn.query(
      'SELECT COUNT(*) AS like_count FROM post_likes WHERE post_id=?', [postId]
    );

    await conn.commit();
    return { liked, likeCount: like_count };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function toggleBookmark(postId, userId) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[existing]] = await conn.query(
      'SELECT post_id FROM post_bookmarks WHERE post_id=? AND user_id=?',
      [postId, userId]
    );

    let bookmarked;
    if (existing) {
      await conn.query('DELETE FROM post_bookmarks WHERE post_id=? AND user_id=?', [postId, userId]);
      bookmarked = false;
    } else {
      await conn.query('INSERT INTO post_bookmarks (post_id, user_id, enroll_date) VALUES (?, ?, NOW())', [postId, userId]);
      bookmarked = true;
    }

    await conn.commit();
    return { bookmarked };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function findCommentsByPostId(postId) {
  const [rows] = await db.query(
    `SELECT c.id, c.post_id, c.body AS content, c.enroll_date AS create_date,
            c.user_id AS author_id, u.username AS author_username
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.post_id = ?
     ORDER BY c.enroll_date ASC`,
    [postId]
  );
  return rows;
}

async function findCommentById(id) {
  const [rows] = await db.query(
    `SELECT c.id, c.post_id, c.body AS content, c.enroll_date AS create_date,
            c.user_id AS author_id, u.username AS author_username
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function insertComment({ postId, authorId, content }) {
  const [result] = await db.query(
    `INSERT INTO comments (post_id, user_id, body, enroll_date)
     VALUES (?, ?, ?, NOW())`,
    [postId, authorId, content]
  );
  return findCommentById(result.insertId);
}

async function deleteComment(id) {
  await db.query('DELETE FROM comments WHERE id=?', [id]);
}

async function findPostsByAuthor(userId, page = 0) {
  const offset = page * 10;
  const [rows] = await db.query(
    `SELECT p.id, p.title, p.category,
            p.enroll_date AS create_date,
            p.user_id AS author_id, u.username AS author_username,
            (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.user_id = ?
     ORDER BY p.enroll_date DESC
     LIMIT 10 OFFSET ?`,
    [userId, offset]
  );
  return rows;
}

async function findPostsLikedByUser(userId) {
  const [rows] = await db.query(
    `SELECT p.id, p.title, p.category,
            p.enroll_date AS create_date,
            p.user_id AS author_id, u.username AS author_username,
            (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count
     FROM post_likes pl
     JOIN posts p ON pl.post_id = p.id
     JOIN users u ON p.user_id = u.id
     WHERE pl.user_id = ?
     ORDER BY p.enroll_date DESC`,
    [userId]
  );
  return rows;
}

async function findPostsBookmarkedByUser(userId) {
  const [rows] = await db.query(
    `SELECT p.id, p.title, p.category,
            p.enroll_date AS create_date,
            p.user_id AS author_id, u.username AS author_username,
            (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count
     FROM post_bookmarks pb
     JOIN posts p ON pb.post_id = p.id
     JOIN users u ON p.user_id = u.id
     WHERE pb.user_id = ?
     ORDER BY p.enroll_date DESC`,
    [userId]
  );
  return rows;
}

async function findCommentsByUser(userId) {
  const [rows] = await db.query(
    `SELECT c.id, c.post_id, c.body AS content, c.enroll_date AS create_date,
            c.user_id AS author_id, u.username AS author_username
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.user_id = ?
     ORDER BY c.enroll_date DESC`,
    [userId]
  );
  return rows;
}

module.exports = {
  findPosts, findPostById, insertPost, updatePost, deletePost, incrementViewCount,
  toggleLike, toggleBookmark,
  findCommentsByPostId, findCommentById, insertComment, deleteComment,
  findPostsByAuthor, findPostsLikedByUser, findPostsBookmarkedByUser, findCommentsByUser,
};

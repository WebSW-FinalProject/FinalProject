const db = require('../db/connection');

function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const VALID_SORTS = {
  likes:  'p.like_count DESC, p.id DESC',
  views:  'p.view_count DESC, p.id DESC',
  latest: 'p.create_date DESC',
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
        where += ' AND p.content LIKE ?';
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
    `SELECT p.id, p.title, p.content, p.category,
            p.view_count, p.like_count, p.create_date, p.modify_date,
            p.author_id, u.username AS author_username
     FROM board_post p
     JOIN users u ON p.author_id = u.id
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT 10 OFFSET ?`,
    [...params, offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM board_post p
     JOIN users u ON p.author_id = u.id
     WHERE ${where}`,
    params
  );

  return { content: rows, totalElements: total, totalPages: Math.ceil(total / 10), page };
}

async function findPostById(id) {
  const [rows] = await db.query(
    `SELECT p.id, p.title, p.content, p.category,
            p.view_count, p.like_count, p.create_date, p.modify_date,
            p.author_id, u.username AS author_username
     FROM board_post p
     JOIN users u ON p.author_id = u.id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function insertPost({ authorId, title, content, category }) {
  const [result] = await db.query(
    `INSERT INTO board_post (author_id, title, content, category, view_count, like_count, create_date)
     VALUES (?, ?, ?, ?, 0, 0, NOW())`,
    [authorId, title, content, category || 'DAILY']
  );
  return findPostById(result.insertId);
}

async function updatePost({ id, title, content, category }) {
  await db.query(
    `UPDATE board_post SET title=?, content=?, category=?, modify_date=NOW() WHERE id=?`,
    [title, content, category, id]
  );
  return findPostById(id);
}

async function deletePost(id) {
  await db.query('DELETE FROM board_post WHERE id=?', [id]);
}

async function incrementViewCount(id) {
  await db.query('UPDATE board_post SET view_count = view_count + 1 WHERE id=?', [id]);
}

async function toggleLike(postId, userId) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[existing]] = await conn.query(
      'SELECT id FROM board_like WHERE post_id=? AND user_id=?',
      [postId, userId]
    );

    let liked;
    if (existing) {
      await conn.query('DELETE FROM board_like WHERE post_id=? AND user_id=?', [postId, userId]);
      await conn.query('UPDATE board_post SET like_count = like_count - 1 WHERE id=?', [postId]);
      liked = false;
    } else {
      await conn.query('INSERT INTO board_like (post_id, user_id) VALUES (?, ?)', [postId, userId]);
      await conn.query('UPDATE board_post SET like_count = like_count + 1 WHERE id=?', [postId]);
      liked = true;
    }

    const [[{ like_count }]] = await conn.query(
      'SELECT like_count FROM board_post WHERE id=?', [postId]
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
      'SELECT id FROM board_bookmark WHERE post_id=? AND user_id=?',
      [postId, userId]
    );

    let bookmarked;
    if (existing) {
      await conn.query('DELETE FROM board_bookmark WHERE post_id=? AND user_id=?', [postId, userId]);
      bookmarked = false;
    } else {
      await conn.query('INSERT INTO board_bookmark (post_id, user_id) VALUES (?, ?)', [postId, userId]);
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
    `SELECT c.id, c.post_id, c.content, c.create_date, c.author_id,
            u.username AS author_username
     FROM board_comment c
     JOIN users u ON c.author_id = u.id
     WHERE c.post_id = ?
     ORDER BY c.create_date ASC`,
    [postId]
  );
  return rows;
}

async function findCommentById(id) {
  const [rows] = await db.query(
    `SELECT c.id, c.post_id, c.content, c.create_date, c.author_id,
            u.username AS author_username
     FROM board_comment c
     JOIN users u ON c.author_id = u.id
     WHERE c.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function insertComment({ postId, authorId, content }) {
  const [result] = await db.query(
    `INSERT INTO board_comment (post_id, author_id, content, create_date)
     VALUES (?, ?, ?, NOW())`,
    [postId, authorId, content]
  );
  return findCommentById(result.insertId);
}

async function deleteComment(id) {
  await db.query('DELETE FROM board_comment WHERE id=?', [id]);
}

async function findPostsByAuthor(userId, page = 0) {
  const offset = page * 10;
  const [rows] = await db.query(
    `SELECT p.id, p.title, p.category, p.view_count, p.like_count,
            p.create_date, p.author_id, u.username AS author_username
     FROM board_post p
     JOIN users u ON p.author_id = u.id
     WHERE p.author_id = ?
     ORDER BY p.create_date DESC
     LIMIT 10 OFFSET ?`,
    [userId, offset]
  );
  return rows;
}

async function findPostsLikedByUser(userId) {
  const [rows] = await db.query(
    `SELECT p.id, p.title, p.category, p.view_count, p.like_count,
            p.create_date, p.author_id, u.username AS author_username
     FROM board_like l
     JOIN board_post p ON l.post_id = p.id
     JOIN users u ON p.author_id = u.id
     WHERE l.user_id = ?
     ORDER BY p.create_date DESC`,
    [userId]
  );
  return rows;
}

async function findPostsBookmarkedByUser(userId) {
  const [rows] = await db.query(
    `SELECT p.id, p.title, p.category, p.view_count, p.like_count,
            p.create_date, p.author_id, u.username AS author_username
     FROM board_bookmark bm
     JOIN board_post p ON bm.post_id = p.id
     JOIN users u ON p.author_id = u.id
     WHERE bm.user_id = ?
     ORDER BY p.create_date DESC`,
    [userId]
  );
  return rows;
}

async function findCommentsByUser(userId) {
  const [rows] = await db.query(
    `SELECT c.id, c.post_id, c.content, c.create_date, c.author_id,
            u.username AS author_username
     FROM board_comment c
     JOIN users u ON c.author_id = u.id
     WHERE c.author_id = ?
     ORDER BY c.create_date DESC`,
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

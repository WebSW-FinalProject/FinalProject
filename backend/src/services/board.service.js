const repo = require('../repositories/board.repository');

function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function getFeed({ page, sort, searchType, keyword }) {
  return repo.findPosts({ page, sort, searchType, keyword });
}

async function getPost(id, userId = null) {
  const post = await repo.findPostById(id, userId);
  if (!post) throw createError(404, '게시글을 찾을 수 없습니다.');
  return post;
}

async function createPost({ authorId, title, content, category }) {
  return repo.insertPost({ authorId, title, content, category });
}

async function modifyPost({ id, title, content, category, requesterId }) {
  const post = await getPost(id);
  if (post.author_id !== requesterId) {
    throw createError(403, '수정 권한이 없습니다.');
  }
  return repo.updatePost({ id, title, content, category });
}

async function deletePost({ id, requesterId }) {
  const post = await getPost(id);
  if (post.author_id !== requesterId) {
    throw createError(403, '삭제 권한이 없습니다.');
  }
  await repo.deletePost(id);
}

async function increaseViewCount(id) {
  await repo.incrementViewCount(id);
}

async function toggleLike(postId, userId) {
  await getPost(postId);
  return repo.toggleLike(postId, userId);
}

async function toggleBookmark(postId, userId) {
  await getPost(postId);
  return repo.toggleBookmark(postId, userId);
}

async function getComments(postId) {
  await getPost(postId);
  return repo.findCommentsByPostId(postId);
}

async function addComment({ postId, authorId, content }) {
  await getPost(postId);
  return repo.insertComment({ postId, authorId, content });
}

async function deleteComment({ commentId, requesterId }) {
  const comment = await repo.findCommentById(commentId);
  if (!comment) throw createError(404, '댓글을 찾을 수 없습니다.');
  if (comment.author_id !== requesterId) {
    throw createError(403, '삭제 권한이 없습니다.');
  }
  await repo.deleteComment(commentId);
}

async function getMyData(userId) {
  const [written, liked, bookmarked, commented] = await Promise.all([
    repo.findPostsByAuthor(userId, 0),
    repo.findPostsLikedByUser(userId),
    repo.findPostsBookmarkedByUser(userId),
    repo.findPostsCommentedByUser(userId), // 댓글 내용 단순표시=>블록 변경
  ]);
  return { written, liked, bookmarked, commented };
}

module.exports = {
  getFeed, getPost, createPost, modifyPost, deletePost, increaseViewCount,
  toggleLike, toggleBookmark,
  getComments, addComment, deleteComment,
  getMyData,
};

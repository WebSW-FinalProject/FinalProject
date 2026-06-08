const router  = require('express').Router();
const auth    = require('../../authMiddleware');
const service = require('../services/board.service');

// async 에러를 next로 전달하는 헬퍼
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

// 게시글 목록 조회 (정렬, 검색, 페이징)
router.get('/', wrap(async (req, res) => {
  const { page = 0, sort = 'latest', type = 'all', keyword } = req.query;
  const result = await service.getFeed({
    page: Number(page),
    sort,
    searchType: type,
    keyword,
  });
  res.json(result);
}));

// 마이페이지
router.get('/me/data', auth, wrap(async (req, res) => {
  const data = await service.getMyData(req.user.id);
  res.json(data);
}));

// optional auth: 로그인 여부와 상관없이 글 조회 가능, 로그인 시 liked/bookmarked 반영
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next();
  auth(req, res, next);
}

// 게시글 상세 조회 (조회수 증가 포함)
router.get('/:post_id', optionalAuth, wrap(async (req, res) => {
  const post = await service.getPost(Number(req.params.post_id), req.user?.id ?? null);
  await service.increaseViewCount(post.id);
  res.json(post);
}));

// 게시글 작성
router.post('/', auth, wrap(async (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
  }
  const post = await service.createPost({
    authorId: req.user.id,
    title,
    content,
    category,
  });
  res.status(201).json(post);
}));

// 게시글 수정
router.put('/:post_id', auth, wrap(async (req, res) => {
  const { title, content, category } = req.body;
  const post = await service.modifyPost({
    id:          Number(req.params.post_id),
    title,
    content,
    category,
    requesterId: req.user.id,
  });
  res.json(post);
}));

// 게시글 삭제
router.delete('/:post_id', auth, wrap(async (req, res) => {
  await service.deletePost({
    id:          Number(req.params.post_id),
    requesterId: req.user.id,
  });
  res.status(204).send();
}));

// 댓글 목록 조회
router.get('/:post_id/comments', wrap(async (req, res) => {
  const comments = await service.getComments(Number(req.params.post_id));
  res.json(comments);
}));

// 댓글 작성
router.post('/:post_id/comments', auth, wrap(async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ message: '댓글 내용은 필수입니다.' });
  const comment = await service.addComment({
    postId:   Number(req.params.post_id),
    authorId: req.user.id,
    content,
  });
  res.status(201).json(comment);
}));

// 댓글 삭제
router.delete('/:post_id/comments/:id', auth, wrap(async (req, res) => {
  await service.deleteComment({
    commentId:   Number(req.params.id),
    requesterId: req.user.id,
  });
  res.status(204).send();
}));

// 좋아요 토글
router.post('/:post_id/like', auth, wrap(async (req, res) => {
  const result = await service.toggleLike(
    Number(req.params.post_id),
    req.user.id
  );
  res.json(result);
}));

// 북마크 토글
router.post('/:post_id/bookmark', auth, wrap(async (req, res) => {
  const result = await service.toggleBookmark(
    Number(req.params.post_id),
    req.user.id
  );
  res.json(result);
}));

module.exports = router;

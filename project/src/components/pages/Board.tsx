import { useState, useEffect, useCallback } from 'react';
import { Edit3, Heart, MessageCircle, Eye, Zap, Bookmark, Search, ArrowUp, ArrowDown, 
         ThumbsUp, FileText, BookOpen, Briefcase, TrendingUp } from 'lucide-react';
import Popup, { PopupHeader } from '../ui/Popup';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko'; 

dayjs.extend(relativeTime);
dayjs.locale('ko');

// 타입
interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  view_count: number;
  create_date: string;
  modify_date: string;
  author_id: number;
  author_username: string;
  like_count: number;
}

interface Comment {
  id: number;
  post_id: number;
  content: string;
  create_date: string;
  author_id: number;
  author_username: string;
}

// 카테고리
const CATEGORIES = {
  GRADUATION: { label: 'Graduation',  icon: <BookOpen size={12} className="text-(--accent)"/>,
                bg: 'var(--accent-bg)', color: 'var(--accent)' },
  JOB_HUNT:   { label: 'Job Hunt',    icon: <Briefcase size={12} className="text-(--text-3)"/>,
                bg: 'var(--rec-neutral-bg)', color: 'var(--rec-neutral-text)' },
  DAILY:      { label: 'Daily',       icon: <MessageCircle size={12} className="text-(--accent)"/>,
                bg: 'var(--badge-neutral-bg)', color: 'var(--badge-neutral-text)' },
};

const FILTERS = [
  { id: 'all',        label: '전체'       },
  { id: 'GRADUATION', label: 'Graduation' },
  { id: 'JOB_HUNT',   label: 'Job Hunt'  },
  { id: 'DAILY',      label: 'Daily'     },
];

function getCat(category: string) {
  if (category === 'GRADUATION') return CATEGORIES.GRADUATION;
  if (category === 'JOB_HUNT')   return CATEGORIES.JOB_HUNT;
  return CATEGORIES.DAILY;
}

const BASE = '/api/board';

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '오류가 발생했습니다.' }));
    throw new Error(err.message);
  }
  if (res.status === 204) return null;
  return res.json();
}


// 컴포넌트
function Board({ initialPostId }: { initialPostId?: number | null }) {
  // 피드 상태
  const [posts, setPosts]           = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage]             = useState(0);
  const [feedLoading, setFeedLoading] = useState(false);

  // 필터/정렬/검색
  const [latestFilter, setLatestFilter] = useState('all');
  const [sortOrder, setSortOrder]       = useState('latest');
  const [search, setSearch]             = useState('');
  const [searchInput, setSearchInput]   = useState(''); // 입력 중 값

  // 화제글 (views 기준 상위)
  const [trendPosts, setTrendPosts] = useState<Post[]>([]);

  // 카테고리 대표글 (카테고리당 1개)
  const [repPosts, setRepPosts] = useState<Post[]>([]);

  // 선택 게시글 + 댓글
  const [selectedPost, setSelectedPost]   = useState<Post | null>(null);
  const [comments, setComments]           = useState<Comment[]>([]);
  const [commentInput, setCommentInput]   = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [likedByMe, setLikedByMe]         = useState(false);
  const [bookmarkedByMe, setBookmarkedByMe] = useState(false);

  // 글쓰기
  const [writing, setWriting]   = useState(false);
  const [writeForm, setWriteForm] = useState({ title: '', content: '', category: 'DAILY' });
  const [submitting, setSubmitting] = useState(false);

  // Quick Access 팝업
  const [popupTab, setPopupTab]   = useState('');
  const [myData, setMyData]       = useState<{ written: Post[]; liked: Post[]; bookmarked: Post[]; comments: Comment[] } | null>(null);

  // 피드 불러오기
  const fetchFeed = useCallback(async (p = 0) => {
    setFeedLoading(true);
    try {
      const params = new URLSearchParams({
        page:    String(p),
        sort:    sortOrder,
        ...(latestFilter !== 'all' && { type: 'category', keyword: latestFilter }),
        ...(search && { type: 'title', keyword: search }),
      });
      const data = await apiFetch(`${BASE}?${params}`);
      if (p === 0) setPosts(data.content);
      else setPosts(prev => [...prev, ...data.content]);
      setTotalPages(data.totalPages);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setFeedLoading(false);
    }
  }, [sortOrder, latestFilter, search]);

  useEffect(() => { fetchFeed(0); }, [fetchFeed]);

  // 화제글 + 카테고리 대표글 초기 1회
  useEffect(() => {
    (async () => {
      try {
        // 화제글: 조회수 기준
        const trend = await apiFetch(`${BASE}?sort=views&page=0`);
        setTrendPosts(trend.content.slice(0, 14));

        // 카테고리 대표글
        const cats = ['GRADUATION', 'JOB_HUNT', 'DAILY'];
        const results = await Promise.all(
          cats.map(c => apiFetch(`${BASE}?type=category&keyword=${c}&page=0`))
        );
        setRepPosts(results.map((r: { content: Post[] }) => r.content[0]).filter(Boolean));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // 게시글 상세 열기 
  async function openPost(id: number) {
    try {
      const post: Post & { liked_by_me: boolean; bookmarked_by_me: boolean }
        = await apiFetch(`${BASE}/${id}`);
      setSelectedPost(post);
      setShowAllComments(false);
      setLikedByMe(post.liked_by_me);
      setBookmarkedByMe(post.bookmarked_by_me);

      const cmts: Comment[] = await apiFetch(`${BASE}/${id}/comments`);
      setComments(cmts);
    } catch (e) {
      console.error(e);
    }
  }

  // 커뮤니티 미리보기에서 게시글 클릭 시 해당 글 팝업 바로 열기
  useEffect(() => { if (initialPostId) openPost(initialPostId); }, [initialPostId]);

  function closePost() {
    setSelectedPost(null);
    setComments([]);
    setCommentInput('');
  }

  //  좋아요
  async function handleLike() {
    if (!selectedPost) return;
    try {
      const res = await apiFetch(`${BASE}/${selectedPost.id}/like`, { method: 'POST' });
      setLikedByMe(res.liked);
      setSelectedPost(prev => prev ? { ...prev, like_count: res.likeCount } : prev);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  // 북마크
  async function handleBookmark() {
    if (!selectedPost) return;
    try {
      const res = await apiFetch(`${BASE}/${selectedPost.id}/bookmark`, { method: 'POST' });
      setBookmarkedByMe(res.bookmarked);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  // 댓글 등록
  async function handleAddComment() {
    if (!commentInput.trim() || !selectedPost) return;
    try {
      const newComment: Comment = await apiFetch(`${BASE}/${selectedPost.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentInput }),
      });
      setComments(prev => [...prev, newComment]);
      setCommentInput('');
    } catch (e) {
      alert((e as Error).message);
    }
  }

  // 게시글 작성 
  async function handleSubmitPost() {
    if (!writeForm.title.trim() || !writeForm.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(BASE, {
        method: 'POST',
        body: JSON.stringify(writeForm),
      });
      setWriting(false);
      setWriteForm({ title: '', content: '', category: 'DAILY' });
      fetchFeed(0); // 목록 갱신
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // Quick Access 데이터 
  async function openPopup(tab: string) {
    setPopupTab(tab);
    if (!myData) {
      try {
        const data = await apiFetch(`${BASE}/me/data`);
        setMyData(data);
      } catch (e) {
        console.error(e);
      }
    }
  }

  function getPopupPosts(): Post[] {
    if (!myData) return [];
    if (popupTab === 'mine')      return myData.written;
    if (popupTab === 'liked')     return myData.liked;
    if (popupTab === 'saved')     return myData.bookmarked;
    return [];
  }

  // 검색 엔터
  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') setSearch(searchInput);
  }

  // 더보기
  const hasMore = page + 1 < totalPages;

  // 댓글 더보기
  const COMMENT_LIMIT = 5;
  const visibleComments = showAllComments ? comments : comments.slice(0, COMMENT_LIMIT);

  const mostTrend = trendPosts[0];

  // 렌더
  return (
    <>
    <div className="py-4.5 px-8 pb-15 w-full">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[16px] font-extrabold text-(--text-1)"
            style={{ fontFamily:"'Bricolage Grotesque', Inter, sans-serif" }}>
          게시판
        </h2>
        <button onClick={() => setWriting(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px]
                           font-semibold bg-(--text-1) text-(--surface) 
                           hover:opacity-85 transition-opacity">
          <Edit3 size={12}/> 글쓰기
        </button>
      </div>

      {/* #A 메인 2열 */}
      <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] gap-6">

        {/* ## A-1 게시글 */}
        <div>
          {/* 이번 주 화제글 */}
          <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden mb-2.5 p-2"
               style={{ boxShadow:'var(--shadow-card)' }}>
            <div className="px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-(--text-1)">
                <Zap size={12} className="text-(--accent)"/> 이번 주 화제글
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2.5">
              {trendPosts.map((post, i) => (
                <div key={post.id} onClick={() => openPost(post.id)}
                     className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-(--border)
                                cursor-pointer hover:bg-(--surface-2) transition-colors bg-(--inner-bg-2)">
                  <span className="text-[10px] font-bold w-3.5 text-center text-(--text-3)">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[11px] font-medium text-(--text-1) truncate flex-1">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] text-(--text-3) sm:block hidden">
                          {getCat(post.category).label}
                        </span>
                        <span className="flex items-center gap-0.5 text-[9px] text-(--text-3)">
                          <Heart size={8}/>{post.like_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 카테고리별 대표 글 */}
          {repPosts.map(post => {
            const tag = getCat(post.category);
            return (
              <div key={post.id} onClick={() => openPost(post.id)}
                   className="bg-(--surface) rounded-xl border border-(--border) p-2 mb-2
                              cursor-pointer transition-shadow hover:shadow-md"
                   style={{ boxShadow:'var(--shadow-card)' }}>
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-lg bg-(--inner-bg) flex items-center justify-center shrink-0">
                    {getCat(post.category).icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background:tag.bg, color:tag.color }}>
                        {tag.label}
                      </span>
                      <span className="text-[9px] text-(--text-3)">
                        {dayjs(post.create_date).fromNow()}
                      </span>
                    </div>
                    <p className="text-[12px] font-bold text-(--text-1) truncate">{post.title}</p>
                    <div className="flex items-center gap-2 text-[9px] text-(--text-3) mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Heart size={10}/> {post.like_count}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Eye size={10}/> {post.view_count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ## A-2 Quick Access | Trending */}
        <div className="flex flex-col gap-3.5">

          {/* Quick Access */}
          <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
               style={{ boxShadow:'var(--shadow-card)' }}>
            <div className="px-3.5 py-2.5 border-b border-(--border)">
              <span className="text-[11px] font-bold text-(--text-1) uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={12} className="text-(--accent)"/> Quick Access
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-(--border)">
              {[
                { id:'mine',  icon:<FileText size={16}/>,      label:'내 글',     sub:'내가 작성한 글' },
                { id:'saved', icon:<Bookmark size={16}/>,      label:'저장글',    sub:'북마크한 글'   },
                { id:'liked', icon:<Heart size={16}/>,         label:'좋아요글',  sub:'좋아요한 글'   },
                { id:'commented', icon:<MessageCircle size={16}/>, label:'댓글단 글', sub:'댓글 단 글' },
              ].map(item => (
                <div key={item.id} onClick={() => openPopup(item.id)}
                     className="flex flex-col items-center gap-1 py-3.5 cursor-pointer hover:bg-(--surface-2) transition-colors">
                  <span className="text-(--accent)">{item.icon}</span>
                  <span className="text-[11px] font-semibold text-(--text-1)">{item.label}</span>
                  <span className="text-[9px] text-(--text-3)">{item.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
               style={{ boxShadow:'var(--shadow-card)' }}>
            <div className="px-4 pt-3 border-b border-(--border)">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-bold text-(--text-1) uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-(--accent)"/> Trending
                </p>
                <span className="text-[9px] font-bold text-white bg-(--accent) px-1.5 py-0.5 rounded">HOT ↑</span>
              </div>
            </div>
            <div className="p-2">
              {mostTrend && (
                <div className="bg-(--accent-bg) rounded-lg p-3 mb-2 cursor-pointer border border-(--badge-neutral-bg) hover:shadow-md transition-shadow"
                     onClick={() => openPost(mostTrend.id)}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-4.5 h-4.5 rounded bg-(--accent) flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">1</span>
                    </div>
                    <span className="text-[9px] font-bold text-(--accent) bg-(--accent-bg) px-1.5 py-px rounded">
                      {getCat(mostTrend.category).label}
                    </span>
                  </div>
                  <p className="text-[12px] font-bold text-(--text-1) leading-tight mb-1.5">{mostTrend.title}</p>
                  <div className="flex items-center gap-3 text-[10px] text-(--text-3)">
                    <span className="flex items-center gap-1"><Heart size={10}/> {mostTrend.like_count}</span>
                    <span className="flex items-center gap-1"><Eye size={10}/> {mostTrend.view_count}</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {trendPosts.slice(1, 5).map((post, i) => (
                  <div key={post.id} onClick={() => openPost(post.id)}
                       className="flex items-center gap-2 py-1.5 border-t border-(--border) cursor-pointer rounded px-1 hover:bg-(--surface-2) transition-colors">
                    <span className="text-[10px] font-bold w-3.5 text-center text-(--text-3)">{i + 2}</span>
                    <div className="flex-1 py-1.5">
                      <p className="text-[11px] font-medium text-(--text-1) truncate mb-0.5">{post.title}</p>
                      <span className="flex items-center gap-0.5 text-[9px] text-(--text-3)">
                        {getCat(post.category).label} &nbsp;·&nbsp; <Heart size={10}/> {post.like_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* #B 전체 글 */}
      <div className="mt-6 pt-5 border-t border-(--border)">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-bold text-(--text-1)">전체 글</span>
            <div className="flex gap-1 flex-wrap">
              {FILTERS.map(f => (
                <button key={f.id}
                        onClick={() => { setLatestFilter(f.id); setPage(0); }}
                        className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors
                          ${latestFilter === f.id
                            ? 'bg-(--rec-neutral-text)/70 text-white font-bold'
                            : 'border border-(--border) text-(--text-2) hover:bg-(--surface-2)'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {(['latest', 'likes'] as const).map(s => (
                <div key={s} className="flex border border-(--border) rounded-sm overflow-hidden">
                  <button onClick={() => setSortOrder(s)}
                          className={`px-2.5 py-1 text-[10px] font-medium transition-colors
                            ${sortOrder === s ? 'bg-(--rec-neutral-text)/70 text-white' : 'text-(--text-2) hover:bg-(--surface-2)'}`}>
                    {s === 'latest' ? '최신순' : '좋아요순'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Search size={12} className="absolute left-2.5 text-(--accent)"/>
              <input placeholder="검색..."
                     value={searchInput}
                     onChange={e => setSearchInput(e.target.value)}
                     onKeyDown={handleSearchKey}
                     className="pl-7 pr-3 py-1.5 w-52 text-[11px] rounded-lg bg-(--surface) border border-(--border)
                                text-(--text-1) placeholder:text-(--text-3) focus:outline-none focus:border-(--text-2) transition-colors" />
            </div>
          </div>

        </div>

        {/* 글 목록 */}
        <div className="bg-(--surface) rounded-xl border min-h-120 border-(--border) overflow-hidden"
             style={{ boxShadow:'var(--shadow-card)' }}>
          {posts.length === 0 && !feedLoading ? (
            <div className="p-8 text-center">
              <p className="text-[13px] text-(--text-2) mt-45">검색 결과가 없습니다.</p>
              <p className="text-[10px] text-(--text-3) mt-2">검색어를 다시 한 번 확인해 주세요</p>
            </div>
          ) : (
            posts.map(post => {
              const tag = getCat(post.category);
              return (
                <div key={post.id} onClick={() => openPost(post.id)}
                     className="flex items-center gap-3 px-4 cursor-pointer pb-3.5 pt-3
                                hover:bg-(--surface-2) transition-colors border-b border-(--border)">
                  <div className="w-8 h-8 rounded-lg bg-(--inner-bg) flex items-center justify-center shrink-0">
                    {getCat(post.category).icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold px-1.5 py-px rounded"
                            style={{ background:tag.bg, color:tag.color }}>{tag.label}</span>
                      <span className="text-[10px] text-(--text-3)">{dayjs(post.create_date).fromNow()}</span>
                    </div>
                    <p className="text-[13px] font-semibold text-(--text-1) truncate">{post.title}</p>
                  </div>
                  <div className="flex gap-3 text-[10px] text-(--text-3) shrink-0">
                    <span className="flex items-center gap-1"><Heart size={11}/> {post.like_count}</span>
                    <span className="flex items-center gap-1"><Eye size={11}/> {post.view_count}</span>
                  </div>
                </div>
              );
            })
          )}

          {/* 더 보기 */}
          {hasMore && (
            <button onClick={() => fetchFeed(page + 1)} disabled={feedLoading}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 text-[12px] text-(--text-2)
                               hover:bg-(--surface-2) transition-all border-t border-(--border) disabled:opacity-50">
              {feedLoading ? '불러오는 중...' : <><ArrowDown size={12}/> 더 보기</>}
            </button>
          )}
        </div>
      </div>
    </div>


    {/* Quick Access 팝업 */}
    {popupTab !== '' && (
      <Popup open={true} onClose={() => setPopupTab('')} width="560px">
        <PopupHeader
          title={
            popupTab === 'mine'      ? '내가 쓴 글'  :
            popupTab === 'saved'     ? '저장한 글'   :
            popupTab === 'liked'     ? '좋아요한 글' :
            popupTab === 'commented' ? '댓글단 글'   : ''
          }
          onClose={() => setPopupTab('')}
        />
        <div className="max-h-[60vh] overflow-y-auto popup-scroll min-h-70">
          {popupTab === 'commented' ? (
            // 댓글 탭: 댓글 목록 표시
            !myData ? (
              <p className="py-8 text-center text-[12px] text-(--text-3)">불러오는 중...</p>
            ) : myData.comments.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-(--text-3)">게시글이 없습니다.</p>
            ) : (
              myData.comments.map(c => (
                <div key={c.id} className="flex items-start gap-3 px-5 py-4 border-b border-(--border)">
                  <p className="text-[12px] text-(--text-2) flex-1">{c.content}</p>
                  <span className="text-[10px] text-(--text-3) shrink-0">{dayjs(c.create_date).fromNow()}</span>
                </div>
              ))
            )
          ) : (
            getPopupPosts().length === 0 ? (
              <p className="py-8 text-center text-[12px] text-(--text-3)">
                {!myData ? '불러오는 중...' : '게시글이 없습니다.'}
              </p>
            ) : (
              getPopupPosts().map(post => {
                const tag = getCat(post.category);
                return (
                  <div key={post.id}
                       onClick={() => { setPopupTab(''); openPost(post.id); }}
                       className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-(--surface-2) transition-colors border-b border-(--border)">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                          style={{ background:tag.bg, color:tag.color }}>{tag.label}</span>
                    <p className="text-[13px] font-medium text-(--text-1) truncate flex-1">{post.title}</p>
                    <span className="text-[10px] text-(--text-3) shrink-0">{dayjs(post.create_date).fromNow()}</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-(--text-3)">
                      <Heart size={10}/>{post.like_count}
                    </span>
                  </div>
                );
              })
            )
          )}
        </div>
      </Popup>
    )}

    {/* 글쓰기 팝업 */}
    {writing && (
      <Popup open={true} onClose={() => setWriting(false)} width="560px">
        <PopupHeader
          title={<><Edit3 size={14} className="text-(--accent)"/> 게시글 작성</>}
          onClose={() => setWriting(false)}
        />
        <div className="p-5 flex flex-col gap-3.5">
          <div className="flex gap-2">
            {FILTERS.filter(f => f.id !== 'all').map(filter => {
              const isSelected  = writeForm.category === filter.id;
              const categoryInfo = CATEGORIES[filter.id as keyof typeof CATEGORIES];
              return (
                <button key={filter.id}
                        onClick={() => setWriteForm(p => ({ ...p, category: filter.id }))}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors flex items-center gap-1.5
                          ${isSelected
                            ? 'border-(--text-2) bg-(--surface-2) text-(--text-1)'
                            : 'border-(--border) text-(--text-3) hover:bg-(--surface-2)'}`}>
                  {categoryInfo?.icon} {filter.label}
                </button>
              );
            })}
          </div>

          <input value={writeForm.title}
                 onChange={e => setWriteForm(p => ({ ...p, title: e.target.value }))}
                 placeholder="제목을 입력하세요"
                 className="w-full px-3 py-2 text-[13px] font-semibold rounded-lg bg-(--surface) border border-(--border)
                            text-(--text-1) placeholder:text-(--text-3) focus:outline-none focus:border-(--text-2) transition-colors" />

          <textarea value={writeForm.content}
                    onChange={e => setWriteForm(p => ({ ...p, content: e.target.value }))}
                    placeholder="내용을 입력하세요"
                    className="w-full h-32 px-3 py-2 text-[12px] rounded-lg resize-none bg-(--surface) border border-(--border)
                               text-(--text-1) placeholder:text-(--text-3) focus:outline-none focus:border-(--text-2) transition-colors" />

          <div className="flex gap-2 justify-end">
            <button onClick={() => setWriting(false)}
                    className="px-4 py-1.5 rounded-lg text-[12px] border border-(--border) text-(--text-2) hover:bg-(--surface-2) transition-colors">
              취소
            </button>
            <button onClick={handleSubmitPost} disabled={submitting}
                    className="px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-(--text-1) text-(--surface) hover:opacity-85 transition-opacity disabled:opacity-50">
              {submitting ? '게시 중...' : '게시'}
            </button>
          </div>
        </div>
      </Popup>
    )}

    {/* 게시글 상세 팝업 */}
    {selectedPost && (
      <Popup open={true} onClose={closePost} width="600px">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-(--border)">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{ background:getCat(selectedPost.category).bg, color:getCat(selectedPost.category).color }}>
            {getCat(selectedPost.category).label}
          </span>
          <span className="text-[11px] text-(--text-3)">{selectedPost.author_username}</span>
          <span className="text-[10px] text-(--text-3)">·</span>
          <span className="text-[10px] text-(--text-3)">{dayjs(selectedPost.create_date).fromNow()}</span>
          <span className="text-[10px] text-(--text-3) ml-auto flex items-center gap-1">
            <Eye size={11}/> {selectedPost.view_count}
          </span>
          <button onClick={closePost}
                  className="text-[22px] leading-none text-(--text-3) hover:text-(--text-1) transition-colors px-1 ml-1">
            ×
          </button>
        </div>

        <div className="px-5 pt-4 max-h-[72vh] overflow-y-auto popup-scroll">
          <h2 className="text-[18px] font-bold text-(--text-1) mb-3 leading-tight">{selectedPost.title}</h2>
          <p className="text-[13px] text-(--text-2) leading-relaxed mb-4">{selectedPost.content}</p>

          <div className="flex items-center gap-3 pb-4 border-b border-(--border)">
            <button onClick={handleLike}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border border-(--border) transition-colors
                      ${likedByMe ? 'bg-(--accent) text-white' : 'text-(--text-2) hover:bg-(--surface-2)'}`}>
              <ThumbsUp size={13}/> {selectedPost.like_count}
            </button>
            <button onClick={handleBookmark}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border border-(--border) transition-colors
                      ${bookmarkedByMe ? 'bg-(--accent) text-white' : 'text-(--text-2) hover:bg-(--surface-2)'}`}>
              <Bookmark size={13}/> 북마크
            </button>
          </div>

          {/* 댓글 섹션 */}
          <div className="py-4">
            <p className="text-[13px] font-bold text-(--text-1) mb-3">
              댓글 <span className="text-(--accent)">{comments.length}</span>
            </p>

            <div className="flex flex-col gap-0">
              {comments.length === 0 ? (
                <p className="text-[12px] text-(--text-3) text-center py-4">첫 번째 댓글을 남겨보세요.</p>
              ) : (
                visibleComments.map(c => (
                  <div key={c.id} className="flex items-start gap-2.5 py-3 border-b border-(--border)">
                    <div className="w-7 h-7 rounded-lg bg-(--navy) text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      {c.author_username?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-semibold text-(--text-1)">{c.author_username}</span>
                        <span className="text-[10px] text-(--text-3)">{dayjs(c.create_date).fromNow()}</span>
                      </div>
                      <p className="text-[12px] text-(--text-2) leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))
              )}

              {comments.length > COMMENT_LIMIT && (
                <button onClick={() => setShowAllComments(!showAllComments)}
                        className="flex items-center justify-center gap-1.5 w-full py-2.5 text-[12px] text-(--text-2)
                                   hover:bg-(--surface-2) transition-all border-t border-(--border)">
                  {showAllComments
                    ? <><ArrowUp size={12}/> 접기</>
                    : <><ArrowDown size={12}/> 더 보기 ({comments.length - COMMENT_LIMIT}개)</>}
                </button>
              )}
            </div>

            {/* 댓글 입력 */}
            <div className="flex items-start gap-2.5 mt-3 pt-3 border-t border-(--border)">
              <div className="w-7 h-7 rounded-lg bg-(--navy) text-white flex items-center justify-center text-[11px] font-bold">
                나
              </div>
              <div className="flex-1">
                <textarea value={commentInput}
                          onChange={e => setCommentInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                          placeholder="댓글을 입력하세요 ..."
                          className="w-full px-3 py-2 text-[12px] rounded-lg h-16 bg-(--surface) border border-(--border)
                                     text-(--text-1) placeholder:text-(--text-3) focus:outline-none focus:border-(--text-2) transition-colors" />
                <div className="flex justify-end mt-1.5">
                  <button onClick={handleAddComment}
                          className="px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-(--text-1) text-(--surface) hover:opacity-85 transition-opacity">
                    등록
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Popup>
    )}
    </>
  );
}

export default Board;

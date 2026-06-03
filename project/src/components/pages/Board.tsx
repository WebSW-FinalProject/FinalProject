import { useState } from 'react';
import { Edit3, Heart, MessageCircle, Eye, Zap, Bookmark, Search, ArrowUp, ArrowDown, 
         ThumbsUp, FileText,  BookOpen, Briefcase, TrendingUp } from 'lucide-react';
import { mockPosts, mockComments } from '../../data/mock';
import Popup, { PopupHeader } from '../ui/Popup';


// 게시글 작성일 n일 전.. 등 변환 lib : dayjs lib
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko'; 

dayjs.extend(relativeTime);
dayjs.locale('ko'); // ko, en 바꾸기 매우 쉬움! 



// 카테고리 
const CATEGORIES = {
  GRADUATION: { label: 'Graduation',    icon: <BookOpen size={12} className="text-(--accent)"/>,     
                bg: 'var(--accent-bg)', color: 'var(--accent)' },
  JOB_HUNT:   { label: 'Job Hunt',           icon: <Briefcase size={12} className="text-(--text-3)"/>,     
                bg: 'var(--rec-neutral-bg)', color: 'var(--rec-neutral-text)'},
  DAILY:      { label: 'Daily',                icon: <MessageCircle size={12} className="text-(--accent)"/>, 
                bg: 'var(--badge-neutral-bg)', color: 'var(--badge-neutral-text)' },
};

// 카테고리 구분 버튼 ( 위에서 그냥 전체만 추가한거 )
const FILTERS = [
  { id: 'all',        label: '전체'      },
  { id: 'GRADUATION', label: 'Graduation' },
  { id: 'JOB_HUNT',   label: 'Job Hunt'  },
  { id: 'DAILY',      label: 'Daily'     },
];

// 카테고리 받아서 객체반환
function getCat(category: string) {
  if (category === 'GRADUATION') return CATEGORIES.GRADUATION;
  if (category === 'JOB_HUNT')   return CATEGORIES.JOB_HUNT;
  return CATEGORIES.DAILY; 
}


function Board() {
  const [search, setSearch] = useState(''); // 검색 (filter)

  const [latestFilter, setLatestFilter] = useState('all'); // 카테고리
  const [showLatestAll, setShowLatestAll] = useState(false); // 더보기, 접기 (전체 글 섹션)
                                                             // true    false

  const [postId, setPostId] = useState(0);  // 글 팝업 (게시글 내용 팝업)
  const [writing, setWriting] = useState(false); // 글쓰기 팝업 

  const [sortOrder, setSortOrder] = useState('latest');  // 최신순, 좋아요순 정렬 (백 연결예정 + 추가 가능)


  const [comment, setComment] = useState(''); //
  const [showAllComments, setShowAllComments] = useState(false); // 댓글 더보기,접기

  // 댓글 등록 (현재는 그냥 상태정의만 해둠.. API/DB 연결 필요 @)
  function handleAddComment() {
    if (!comment.trim() || !selectedPost) return;
    setComment('');
  }
  const [writeForm, setWriteForm] = useState({ title: '', body: '', category: 'DAILY' }); 
  // 글쓰기 data 상태관리 

  
  const [popupTab, setPopupTab]   = useState('');  // QuickAccess 4개를 한꺼번에 관리 (형식 공유함.)

  // 상세 게시글 보기
  const selectedPost = mockPosts.find(post => (post.id === postId));

  // mock 댓글 필터링
  let postComments: typeof mockComments = [];
  if (selectedPost) {
    for (const c of mockComments) {
      if (c.post_id === selectedPost.id) postComments.push(c);
    }
  }
                                          
 // 카테고리별 최신글 (카테고리당 1개씩)
  const Posts = []; 
  for (const c of ['GRADUATION', 'JOB_HUNT', 'DAILY']) {
    const post = mockPosts.find(p => (p.category === c));
    if (post)  Posts.push(post);
  } 

  // 화제글 — 나중에 Back API 로 교체 예정 (정렬=백엔드)
  // 지금은 그냥 mockdata 에서 차례대로 뽑아옴
  const weekTrend = mockPosts.slice(0, 14);
  const liveTrend = mockPosts.slice(0, 5); 
  // weekTrend != liveTrend : 후자는 주간이 아니라, 하루 기준. 하루동안 얼마나 조회수가 '늘었는가'
  const mostTrendFeature = liveTrend[0];

  // QUICKaccess 임시, 하드코딩 목록들
  // return : ( Back DB, API 연결 필요 @ ) => 개수 연산은 아마도 프론트(간단)
  function getPopupPosts() {
    if (popupTab === 'mine')      return mockPosts.filter(p => p.author_name === '이문세');
    if (popupTab === 'saved')     return mockPosts.slice(0, 0); // 없으면 게시글이 없습니다.
    if (popupTab === 'liked')     return mockPosts.slice(2, 12);
    if (popupTab === 'commented') return mockPosts.slice(0, 2);
    return [];
  }
  const popupPosts = getPopupPosts();


  // 전체 글 => API연결 시에 교체 예정 @ (최신순, 좋아요순 등 정렬 '예정')
  // 백에서 정렬할 예정이지만 프론트에서 할 가능성도 있긴 함
  const allLatest = mockPosts.filter(p => 
    (latestFilter === 'all' || p.category === latestFilter) 
    &&  p.title.includes(search)
  );

  const LASTEST_COUNT = 8; // 몇개부터 접을건지
  const latestPosts = showLatestAll 
                    ? allLatest : allLatest.slice(0, LASTEST_COUNT);
        // lastestPosts => 접혔을때와 안접혔을때 구분 개수(_COUNT)만큼 가짐 (slice)

    // 댓글 더보기 접기 관리 (위와 동일한로직)
  const COMMENT_LIMIT = 5;
  const visibleComments = showAllComments ? postComments 
                                          : postComments.slice(0, COMMENT_LIMIT);
  
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
        {/* ## A-1  게시글 : 화제글 | 카테고리별 최신글*/}
        <div>
          {/* ## A-1(1) 이번 주 화제글 */}
          <div className="bg-(--surface) rounded-xl border 
                          border-(--border) overflow-hidden mb-2.5 p-2"
               style={{ boxShadow:'var(--shadow-card)' }}>
            
            {/* 헤더 */}
            <div className="px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-(--text-1)">
                <Zap size={12} className="text-(--accent)"/> 이번 주 화제글
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2.5">
              {weekTrend.map((post, i) => (
                <div key={post.id} onClick={() => setPostId(post.id)}
                     className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-(--border)
                                cursor-pointer hover:bg-(--surface-2) 
                                transition-colors bg-(--inner-bg-2)">

                  <span className="text-[10px] font-bold w-3.5 
                                   text-center text-(--text-3)">
                    {i + 1} {/* 화제글 정렬 기준은 조회수순 (동일하면 좋아요순) */}
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

          {/* ## A-1(2) 카테고리별 대표 글 */}
          {Posts.map(post => {
            const tag = getCat(post.category);
            return (
              <div key={post.id} onClick={() => setPostId(post.id)}
                   className="bg-(--surface) rounded-xl border border-(--border) p-2 mb-2
                              cursor-pointer transition-shadow hover:shadow-md"
                   style={{ boxShadow:'var(--shadow-card)' }}>
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-lg bg-(--inner-bg) flex 
                                  items-center justify-center shrink-0">
                    {getCat(post.category).icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background:tag.bg, color:tag.color }}>
                              {tag.label}
                      </span>
                      <span className="text-[9px] text-(--text-3)">
                              {dayjs(post.enroll_date).fromNow()}
                      </span>
                    </div>

                    <p className="text-[12px] font-bold text-(--text-1) truncate">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-2 text-[9px] text-(--text-3) mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Heart size={10}/>   {post.like_count}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageCircle size={10}/>   {post.comment_count}
                      </span>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}

        </div>

        {/* ## A-2 Quick Access | Trending(실시간 트렌드:하루 tracking 예정..) */}
        <div className="flex flex-col gap-3.5">

          {/* ## A-2(1) Quick Access */}
          <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
               style={{ boxShadow:'var(--shadow-card)' }}>
            <div className="px-3.5 py-2.5 border-b border-(--border)">
              <span className="text-[11px] font-bold text-(--text-1) uppercase 
                              tracking-wider flex items-center gap-1.5">
                <Zap size={12} className="text-(--accent)"/> Quick Access
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-(--border)">
              {[
                { id:'mine',      icon:<FileText size={16}/>,     label:'내 글',    sub:'3개 작성'    },
                { id:'saved',     icon:<Bookmark size={16}/>,     label:'저장글',   sub:'12개 저장됨' },
                { id:'liked',     icon:<Heart size={16}/>,        label:'좋아요글', sub:'5개'         },
                { id:'commented', icon:<MessageCircle size={16}/>,label:'댓글단 글',sub:'8개'         },
              ].map(item => (
                <div key={item.id} onClick={() => setPopupTab(item.id)}
                     className="flex flex-col items-center gap-1 py-3.5 
                                cursor-pointer hover:bg-(--surface-2) transition-colors">
                  <span className="text-(--accent)"> {item.icon} </span>
                  <span className="text-[11px] font-semibold text-(--text-1)"> {item.label} </span>
                  <span className="text-[9px] text-(--text-3)"> {item.sub} </span>
                </div>
              ))}
            </div>
          </div>

          {/* ## A-2(2) Trending */}
          <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
               style={{ boxShadow:'var(--shadow-card)' }}>
            <div className="px-4 pt-3 border-b border-(--border)">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-bold text-(--text-1) uppercase 
                              tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-(--accent)"/> Trending
                </p>

                <span className="text-[9px] font-bold text-white 
                                 bg-(--accent) px-1.5 py-0.5 rounded">HOT ↑</span>
              </div>
            </div>
            <div className="p-2">
              {/* Trending 1위는 highlight CSS */}
              {mostTrendFeature && ( 
                <div className="bg-(--accent-bg) rounded-lg p-3 mb-2 cursor-pointer 
                                border border-(--badge-neutral-bg) hover:shadow-md 
                                transition-shadow" onClick={() => setPostId(mostTrendFeature.id)}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-4.5 h-4.5 rounded bg-(--accent) flex items-center 
                                    justify-center">
                      <span className="text-[9px] font-bold text-white">1</span>
                    </div>
                    <span className="text-[9px] font-bold text-(--accent) 
                          bg-(--accent-bg) px-1.5 py-px rounded">
                      {getCat(mostTrendFeature.category).label}
                    </span>
                  </div>

                  <p className="text-[12px] font-bold text-(--text-1) leading-tight mb-1.5">
                      {mostTrendFeature.title}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-(--text-3)">
                    <span className="flex items-center gap-1">
                      <Heart size={10}/> {mostTrendFeature.like_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={10}/> {mostTrendFeature.comment_count ?? 0}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {liveTrend.slice(1).map((post, i) => (
                  <div key={post.id} onClick={() => setPostId(post.id)}
                        className="flex items-center gap-2 
                        py-1.5 border-t border-(--border) cursor-pointer 
                        rounded px-1 hover:bg-(--surface-2) transition-colors">
                    <span className="text-[10px] font-bold w-3.5 text-center text-(--text-3)">
                      {i + 2}
                    </span>
                    <div className="flex-1 py-1.5 ">
                      <p className="text-[11px] font-medium text-(--text-1) truncate mb-0.5">
                        {post.title}
                      </p>
                      <span className="flex items-center gap-0.5 text-[9px] text-(--text-3)">
                        {getCat(post.category).label} &nbsp; · &nbsp; 
                        <Heart size={10}/> {post.like_count}</span>
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
        {/* ## B-1 헤더 */}
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">

          {/* ## B-1(1) 카테고리 | 정렬 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-bold text-(--text-1)">전체 글</span>

             {/* 카테고리 */}
            <div className="flex gap-1 flex-wrap">
              {FILTERS.map(f => (
                <button key={f.id} 
                        onClick={() => { setLatestFilter(f.id); setShowLatestAll(false); }}
                        className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors
                          ${latestFilter === f.id
                            ? 'bg-(--rec-neutral-text)/70 text-white font-bold'
                            : 'border border-(--border) text-(--text-2) hover:bg-(--surface-2)'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* 정렬 탭: 구현 후 연결 필요 @ */}
            <div className="flex gap-1">
              <div className="flex ml-3 border border-(--border) rounded-sm overflow-hidden">
                <button onClick={() => setSortOrder('latest')}
                        className={`px-2.5 py-1 text-[10px] font-medium transition-colors
                          ${sortOrder === 'latest' 
                            ? 'bg-(--rec-neutral-text)/70 text-white' 
                            : 'text-(--text-2) hover:bg-(--surface-2)'}`}>
                  최신순
                </button>
              </div>
              <div className="flex border border-(--border) rounded-sm overflow-hidden">
                <button onClick={() => setSortOrder('likes')}
                        className={`px-2.5 py-1 text-[10px] font-medium transition-colors
                          ${sortOrder === 'likes' 
                            ? 'bg-(--rec-neutral-text)/70 text-white' 
                            : 'text-(--text-2) hover:bg-(--surface-2)'}`}>
                  좋아요순
                </button>
              </div>
            </div>
          </div>

          {/* ## B-1(2) 검색 */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Search size={12} className="absolute left-2.5 text-(--accent)"/>

              <input placeholder="검색..."
                     value={search}
                     onChange={e => setSearch(e.target.value)}
                     className="pl-7 pr-3 py-1.5 w-52 text-[11px] rounded-lg 
                                bg-(--surface) border border-(--border)
                                text-(--text-1) placeholder:text-(--text-3) focus:outline-none 
                                focus:border-(--text-2) transition-colors" />
            </div>
          </div>

        </div>

        {/* ## B-2 글 목록 */}
        <div className="bg-(--surface) rounded-xl border min-h-120
                        border-(--border) overflow-hidden"
             style={{ boxShadow:'var(--shadow-card)' }}>
          
          { latestPosts.length === 0 ? 
            (
              <div className="p-8 text-center"> 
                 <p className="text-[13px] text-(--text-2) mt-45"> 검색 결과가 없습니다. </p>
                 <p className="text-[10px] text-(--text-3) mt-2"> 검색어를 다시 한 번 확인해 주세요</p>
              </div>
            )
            : ( latestPosts.map((post) => { 
              const tag = getCat(post.category); // A-1(2) ref.

              return (
                <div key={post.id}  onClick={() => setPostId(post.id)}
                    className="flex items-center gap-3 px-4 cursor-pointer pb-3.5 pt-3
                                hover:bg-(--surface-2) transition-colors border-b border-(--border)">
                  <div className="w-8 h-8 rounded-lg bg-(--inner-bg) flex 
                                  items-center justify-center shrink-0">
                    {getCat(post.category).icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold px-1.5 py-px rounded"
                            style={{ background:tag.bg, color:tag.color }}>
                        {tag.label}
                      </span>

                      <span className="text-[10px] text-(--text-3)">
                        {dayjs(post.enroll_date).fromNow()}
                      </span>
                    </div>

                    <p className="text-[13px] font-semibold text-(--text-1) truncate">
                        {post.title}
                    </p>
                  </div>

                  <div className="flex gap-3 text-[10px] text-(--text-3) shrink-0">
                    <span className="flex items-center gap-1">
                      <Heart size={11}/> {post.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={11}/> {post.comment_count}
                    </span>
                  </div>
                </div>
              );
            }))
          }

          {/* 더 보기 / 접기 버튼 */}
          {allLatest.length > 10 && (
              <button onClick={() => setShowLatestAll(!showLatestAll)}
                      className="flex items-center justify-center gap-1.5 w-full py-2.5 
                                text-[12px] text-(--text-2) 
                                hover:bg-(--surface-2) transition-all border-t border-(--border)">
                 {showLatestAll 
                  ? ( <> <ArrowUp size={12} /> 접기 </>) 
                  : (  <> <ArrowDown size={12} /> 더 보기 ({allLatest.length - LASTEST_COUNT}개) </>)
                 }
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
            popupTab === 'mine'      ? '내가 쓴 글' :
            popupTab === 'saved'     ? '저장한 글'  :
            popupTab === 'liked'     ? '좋아요한 글' :
            popupTab === 'commented'   ? '댓글단 글' : ''
          }
          onClose={() => setPopupTab('')}
        />

        <div className="max-h-[60vh] overflow-y-auto popup-scroll min-h-70">
          {popupPosts.length === 0 
            ? (
              <p className="py-8 text-center text-[12px] text-(--text-3)">
                게시글이 없습니다.
              </p>
              ) 
            : (popupPosts.map((post) => {
                const tag = getCat(post.category);

                return (
                  <div key={post.id}
                      onClick={() => { setPopupTab(''); setPostId(post.id); }}
                      className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-(--surface-2) 
                                transition-colors border-b border-(--border)">

                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                          style={{ background:tag.bg, color:tag.color }}>
                      {tag.label}
                    </span>

                    <p className="text-[13px] font-medium text-(--text-1) truncate flex-1">
                       {post.title}
                    </p>

                    <span className="text-[10px] text-(--text-3) shrink-0">
                      {dayjs(post.enroll_date).fromNow()}
                    </span>

                    <span className="flex items-center gap-0.5 text-[10px] text-(--text-3)">
                      <Heart size={10}/>{post.like_count}
                    </span>
                  </div>
                );
              })
              )}
        </div>
      </Popup>
    )}

    {/* 글쓰기 팝업 */}
    {writing && (
      <Popup open={true} onClose={() => setWriting(false)} width="560px">
        <PopupHeader 
          title={ <> <Edit3 size={14} className="text-(--accent)"/> 게시글 작성 </> }
          onClose={() => setWriting(false)}
         />
         
        <div className="p-5 flex flex-col gap-3.5">
          <div className="flex gap-2">
            {FILTERS.map((filter) => {
              const isSelected = writeForm.category === filter.id; // 카테고리 상태가 어디건지확인
              const categoryInfo = CATEGORIES[filter.id as keyof typeof CATEGORIES];  
              // TS 라서 타입 명시해주어야함.. typeof 는 아니까 생략하고
              // keyof => CATEGORIES 라는 타입=구조 구성하는 모든 key 나열 ; GARD, JOB, DAILY 중 하나다. 
              return ( 
                <button
                  key={filter.id}
                  onClick={() => setWriteForm(p => ({ ...p, category: filter.id }))} 
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors flex items-center gap-1.5
                    ${isSelected 
                      ? 'border-(--text-2) bg-(--surface-2) text-(--text-1)' 
                      : 'border-(--border) text-(--text-3) hover:bg-(--surface-2)'
                    }`}>
               
                  {categoryInfo?.icon}  {filter.label}
                </button>
              ); 
              {/* @ 카테고리 상태매핑은 해뒀으나 글쓰기 완전구현은 X => DB연결 필요. DB 인서트임      */}
              {/*   어차피 연결 때 손봐야 하니 우선 프론트부터 완성하고, 게시 버튼은 나중에 한번에연결 */}
            })}
          </div>

          <input value={writeForm.title} 
                 onChange={e => setWriteForm(p => ({ ...p, title:e.target.value }))}
                 placeholder="제목을 입력하세요"
                 className="w-full px-3 py-2 text-[13px] font-semibold rounded-lg 
                            bg-(--surface) border border-(--border)
                            text-(--text-1) placeholder:text-(--text-3) focus:outline-none 
                            focus:border-(--text-2) transition-colors" />
          
          <textarea value={writeForm.body} 
                    onChange={e => setWriteForm(p => ({ ...p, body:e.target.value }))}
                    placeholder="내용을 입력하세요"
                    className="w-full h-32 px-3 py-2 text-[12px] rounded-lg resize-none 
                               bg-(--surface) border border-(--border)
                               text-(--text-1) placeholder:text-(--text-3) focus:outline-none 
                               focus:border-(--text-2) transition-colors" />
          
          <div className="flex gap-2 justify-end">
            <button onClick={() => setWriting(false)}
                    className="px-4 py-1.5 rounded-lg text-[12px] border border-(--border) 
                    text-(--text-2) hover:bg-(--surface-2) transition-colors">
              취소
            </button>
            <button className="px-4 py-1.5 rounded-lg text-[12px] font-semibold 
                    bg-(--text-1) text-(--surface) hover:opacity-85 transition-opacity">
              게시
            </button> {/* 구현,연결 필요 @ */}
          
          </div>
        </div>
      </Popup>
    )}

    {/* 게시글 상세 팝업 */}
    {selectedPost && (
      <Popup open={true} onClose={() => setPostId(0)} width="600px">
        {/* 헤더 커스텀 (카테고리, 이름 등 정보 추가포함됨) */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-(--border)">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{ background:getCat(selectedPost.category).bg,
                         color:getCat(selectedPost.category).color }}>
            {getCat(selectedPost.category).label}
          </span>

          <span className="text-[11px] text-(--text-3)">
            {selectedPost.author_name}
          </span>
          <span className="text-[10px] text-(--text-3)">·</span>
          <span className="text-[10px] text-(--text-3)">
            {dayjs(selectedPost.enroll_date).fromNow()} 
          </span> 

          <span className="text-[10px] text-(--text-3) ml-auto flex items-center gap-1">
            <Eye size={11}/> {(selectedPost.like_count ?? 0) * 10}
          </span>

          <button onClick={() => setPostId(0)}
                  className="text-[22px] leading-none text-(--text-3) 
                             hover:text-(--text-1) transition-colors px-1 ml-1">
            ×
          </button>
        </div>

        <div className="px-5 pt-4 max-h-[72vh] overflow-y-auto popup-scroll">      
          <h2 className="text-[18px] font-bold text-(--text-1) mb-3 leading-tight">
            {selectedPost.title}
          </h2>
          <p className="text-[13px] text-(--text-2) leading-relaxed mb-4">
            {selectedPost.body}
          </p>

          {/* 좋아요, 북마크, 조회수 
              => onClick = state 추가 아직 안함: DB 연결떄 할듯 (연결 필요 @) */}
          <div className="flex items-center gap-3 pb-4 border-b border-(--border)">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] 
                                border border-(--border)
                               text-(--text-2) hover:bg-(--surface-2) transition-colors">
              <ThumbsUp size={13}/> {selectedPost.like_count}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]
                                border border-(--border)
                               text-(--text-2) hover:bg-(--surface-2) transition-colors">
              <Bookmark size={13}/> 북마크 
            </button>

            <span className="ml-auto text-[11px] text-(--text-3) flex items-center gap-1">
              <Eye size={12}/> {selectedPost.view_count}
            </span>
          </div>

          {/* 댓글 섹션 */}
          <div className="py-4">
            <p className="text-[13px] font-bold text-(--text-1) mb-3">
              댓글 <span className="text-(--accent)">{postComments.length}</span>
            </p>

            <div className="flex flex-col gap-0">
              {postComments.length === 0 ? (
                <p className="text-[12px] text-(--text-3) text-center py-4">
                  첫 번째 댓글을 남겨보세요.
                </p>
              ) : (
                visibleComments.map((c) => (
                  <div key={c.id}
                       className="flex items-start gap-2.5 py-3 border-b border-(--border)">
                    <div className="w-7 h-7 rounded-lg bg-(--navy) text-white flex items-center
                                    justify-center text-[11px] font-bold shrink-0">
                      {c.author_name?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-semibold text-(--text-1)">
                          {c.author_name}
                        </span>

                        <span className="text-[10px] text-(--text-3)">
                          {dayjs(c.enroll_date).fromNow()}
                        </span>
                      </div>

                      <p className="text-[12px] text-(--text-2) leading-relaxed">{c.body}</p>
                    </div>
                  </div>
                ))
              )}

              {/* 더보기/접기 (전체 글 섹션 ref) */}
              { (postComments.length > COMMENT_LIMIT) && (
                <button onClick={() => setShowAllComments(!showAllComments)}
                        className="flex items-center justify-center gap-1.5 w-full py-2.5 
                                   text-[12px] text-(--text-2) 
                                   hover:bg-(--surface-2) transition-all border-t border-(--border)">
                  {showAllComments 
                  ? ( <> <ArrowUp size={12} /> 접기 </>) 
                  : (  <> <ArrowDown size={12} /> 더 보기 ({postComments.length - COMMENT_LIMIT}개) </>)
                 }
                </button>
              )}

            </div>

            {/* 댓글 입력 */}
            <div className="flex items-start gap-2.5 mt-3 pt-3 border-t border-(--border)">
              <div className="w-7 h-7 rounded-lg bg-(--navy) text-white 
                              flex items-center justify-center text-[11px] font-bold">
                나
              </div>
              <div className="flex-1">
                <textarea value={comment}
                          onChange={e => setComment(e.target.value)}
                          onKeyDown={e => { 
                            if (e.key === 'Enter' && !e.shiftKey) 
                              { e.preventDefault(); handleAddComment(); } 
                          }}
                          placeholder="댓글을 입력하세요 ..."
                          className="w-full px-3 py-2 text-[12px] rounded-lg h-16 bg-(--surface)
                                     border border-(--border) text-(--text-1) placeholder:text-(--text-3)
                                     focus:outline-none focus:border-(--text-2) transition-colors" />
                <div className="flex justify-end mt-1.5">
                  <button onClick={handleAddComment}
                          className="px-4 py-1.5 rounded-lg text-[12px] 
                          font-semibold bg-(--text-1) text-(--surface) 
                          hover:opacity-85 transition-opacity">
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

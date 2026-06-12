import { API_BASE } from '../../../api';
import { useState, useEffect } from 'react';
import { Eye, Heart } from 'lucide-react';
import { timeAgo } from './dashHelper';
import type { BoardPost } from './dashHelper';
import { useLang } from '../../../LangContext';

// 카테고리별 배지 색 (Board.tsx 의 CATEGORIES 와 동일한 UI)
const CAT_STYLE: Record<string, { bg: string; color: string }> = {
  GRADUATION: { bg: 'var(--accent-bg)',        color: 'var(--accent)'             },
  JOB_HUNT:   { bg: 'var(--rec-neutral-bg)',   color: 'var(--rec-neutral-text)'   },
  DAILY:      { bg: 'var(--badge-neutral-bg)', color: 'var(--badge-neutral-text)' },
  NOTICE:     { bg: 'var(--warn-bg)',          color: 'var(--warn-text)'          },
};

// 커뮤니티 최신 게시글 미리보기 블럭
// onGoToBoard(postId?) : 더보기 = postId 없이, 게시글 클릭 = postId와 함께 호출
function CommunityPreview({ onGoToBoard }:
  { onGoToBoard?: (postId?: number) => void }) {
  const { t } = useLang();
  const [posts, setPosts] = useState<BoardPost[]>([]);

  // 카테고리 영문 코드 → 표시 레이블 (Board.tsx 의 CATEGORIES 와 동일한 영문 고정)
  const POST_LABEL: Record<string, string> = {
    GRADUATION: 'Graduation',
    JOB_HUNT:   'Job Hunt',
    DAILY:      'Daily',
    NOTICE:     'Notice',
  };

  async function loadPosts() {
    try {
      // 게시판 back 연결
      const res = await fetch(`${API_BASE}/api/board?page=0&sort=latest`);
      const data = await res.json();

      setPosts(data.content ?? []);
    } catch (e) {
      console.error('게시글 로드 실패:', e);
    }
  }

  useEffect(() => { loadPosts(); }, []);

  return (
    <div className="bg-(--surface) rounded-xl border border-(--border)
                    overflow-hidden flex flex-col flex-1"
        style={{ boxShadow: 'var(--shadow-card)' }}>

      <div className="px-3.5 py-3 border-b border-(--border)
                      flex justify-between items-center shrink-0">
        <span className="font-bold text-sm">{t('communityTitle')}</span>
        <button
          onClick={() => onGoToBoard?.()}
          className="text-[10px] font-medium text-(--text-2)
                     border border-(--border) rounded-lg
                     px-2 py-0.5 hover:bg-(--surface-2) transition-colors">
          {t('communityViewMore')}
        </button>
      </div>

      <div className="flex flex-col flex-1">
        {posts.slice(0, 4).map((post, i) => {
          const catStyle = CAT_STYLE[post.category] ?? CAT_STYLE.DAILY;
          return (
            <div key={post.id}
                onClick={() => onGoToBoard?.(post.id)}
                className={`flex items-center justify-between px-3.5
                            py-2.5 cursor-pointer
                            hover:bg-(--surface-2) transition-colors
                            ${i < 3 ? 'border-b border-(--border)' : ''}`}>
                              
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {/* 카테고리 UI — Board.tsx 와 동일 UI */}
                  <span className="px-1.5 py-px rounded-full text-[9px] font-semibold shrink-0"
                        style={{ background: catStyle.bg, color: catStyle.color }}>
                    {POST_LABEL[post.category] ?? post.category}
                  </span>
                  <span className="text-[11px] font-medium text-(--text-1) truncate">
                    {post.title}
                  </span>
                </div>
                <p className="text-[10px] text-(--text-3)">
                  {post.author_username} · {timeAgo(post.create_date, t)}
                </p>
              </div>

              {/* 좋아요 + 조회수 */}
              <div className="flex items-center gap-2 shrink-0 ml-2 text-[10px] text-(--text-3)">
                <span className="flex items-center gap-0.5">
                  <Heart size={9} /> {post.like_count}
                </span>
                <span className="flex items-center gap-0.5">
                  <Eye size={9} /> {post.view_count}
                </span>
              </div>

            </div>
          );
        })}
        {posts.length === 0 && (
          <div className="flex-1 flex items-center justify-center
                          text-[11px] text-(--text-3)">
            {t('communityNoPosts')}
          </div>
        )}
      </div>

    </div>
  );
}

export default CommunityPreview;



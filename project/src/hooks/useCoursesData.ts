import { useState, useEffect, useCallback, useRef } from 'react';
import type { Semester } from '../types';
import { API_BASE } from '../api';

const BASE = `${API_BASE}/api`;

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
function authHeadersFormData(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── 타입 ────────────────────────────────────────────────────────────

export interface PlanItem {
  id: number;
  name: string;
  category: string;
  professor: string | null;
  credit: number;
  is_enrolled: number;  // 1=담김, 0=담기
  sort_order: number;
}

export interface PlanMeta {
  memo: string;
  image_path: string | null;  // 서버 이미지 경로 ex) /uploads/course-plan/plan_1_xxx.jpg
}

export interface CoursesData {
  // 이번 학기 정보
  currentSemester: Semester | null;
  // 수강신청 계획 과목 목록
  planItems: PlanItem[];
  // 메모 + 이미지
  meta: PlanMeta;
  loading: boolean;
  error: string | null;
  // 과목 CRUD
  addPlanItem: (item: Omit<PlanItem, 'id' | 'sort_order' | 'is_enrolled'>) => Promise<void>;
  deletePlanItem: (id: number) => Promise<void>;
  toggleEnroll: (id: number, current: number) => Promise<void>;
  reorderItems: (reordered: PlanItem[]) => Promise<void>;
  // 메모 저장 (debounce 적용)
  saveMemo: (memo: string) => void;
  // 이미지 업로드
  uploadImage: (file: File) => Promise<void>;
}

// ─── 훅 ──────────────────────────────────────────────────────────────

export function useCoursesData(semesters: Semester[]): CoursesData {
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [meta, setMeta]           = useState<PlanMeta>({ memo: '', image_path: null });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // 현재 학기 = gpa가 null인 마지막 학기 (없으면 가장 최근 학기)
  const currentSemester: Semester | null =
    semesters.find(s => s.gpa === null) ??
    semesters[semesters.length - 1] ??
    null;

  const semId = currentSemester?.id;

  // ── 데이터 로드 ────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!semId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, metaRes] = await Promise.all([
        fetch(`${BASE}/course-plan/${semId}/items`, { headers: authHeaders() }),
        fetch(`${BASE}/course-plan/${semId}/meta`,  { headers: authHeaders() }),
      ]);
      if (!itemsRes.ok) throw new Error('과목 목록 조회 실패');
      const items: PlanItem[]  = await itemsRes.json();
      const metaData: PlanMeta = metaRes.ok ? await metaRes.json()
                                            : { memo: '', image_path: null };
      setPlanItems(items);
      setMeta(metaData);
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [semId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── 과목 추가 ──────────────────────────────────────────────────────
  async function addPlanItem(item: Omit<PlanItem, 'id' | 'sort_order' | 'is_enrolled'>) {
    if (!semId) return;
    try {
      const res = await fetch(`${BASE}/course-plan/${semId}/items`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error();
      const created: PlanItem = await res.json();
      setPlanItems(prev => [...prev, created]);
    } catch {
      setError('과목을 추가하지 못했습니다.');
    }
  }

  // ── 과목 삭제 ──────────────────────────────────────────────────────
  async function deletePlanItem(id: number) {
    if (!semId) return;
    try {
      const res = await fetch(`${BASE}/course-plan/${semId}/items/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setPlanItems(prev => prev.filter(c => c.id !== id));
    } catch {
      setError('과목을 삭제하지 못했습니다.');
    }
  }

  // ── 담김/담기 토글 ─────────────────────────────────────────────────
  async function toggleEnroll(id: number, current: number) {
    if (!semId) return;
    // 낙관적 업데이트 (UI 즉시 반영)
    setPlanItems(prev =>
      prev.map(c => c.id === id ? { ...c, is_enrolled: current ? 0 : 1 } : c)
    );
    try {
      const res = await fetch(`${BASE}/course-plan/${semId}/items/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_enrolled: !current }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // 실패 시 롤백
      setPlanItems(prev =>
        prev.map(c => c.id === id ? { ...c, is_enrolled: current } : c)
      );
      setError('상태 변경에 실패했습니다.');
    }
  }

  // ── 드래그앤드롭 순서 변경 ─────────────────────────────────────────
  async function reorderItems(reordered: PlanItem[]) {
    if (!semId) return;
    // 낙관적 업데이트
    const withOrder = reordered.map((c, i) => ({ ...c, sort_order: i }));
    setPlanItems(withOrder);
    try {
      const res = await fetch(`${BASE}/course-plan/${semId}/items/0`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          orders: withOrder.map(c => ({ id: c.id, sort_order: c.sort_order })),
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError('순서 변경에 실패했습니다.');
      loadData(); // 실패 시 서버 상태로 복원
    }
  }

  // ── 메모 저장 (1초 debounce) ───────────────────────────────────────
  const memoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function saveMemo(memo: string) {
    // UI 즉시 반영
    setMeta(prev => ({ ...prev, memo }));
    // 기존 타이머 취소 후 재설정
    if (memoTimer.current) clearTimeout(memoTimer.current);
    memoTimer.current = setTimeout(async () => {
      if (!semId) return;
      try {
        await fetch(`${BASE}/course-plan/${semId}/meta`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ memo }),
        });
      } catch {
        setError('메모 저장에 실패했습니다.');
      }
    }, 1000);
  }

  // ── 이미지 업로드 ──────────────────────────────────────────────────
  async function uploadImage(file: File) {
    if (!semId) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${BASE}/course-plan/${semId}/meta/image`, {
        method: 'POST',
        headers: authHeadersFormData(),
        body: formData,
      });
      if (!res.ok) throw new Error();
      const { image_path }: { image_path: string } = await res.json();
      setMeta(prev => ({ ...prev, image_path }));
    } catch {
      setError('이미지 업로드에 실패했습니다.');
    }
  }

  return {
    currentSemester,
    planItems,
    meta,
    loading,
    error,
    addPlanItem,
    deletePlanItem,
    toggleEnroll,
    reorderItems,
    saveMemo,
    uploadImage,
  };
}

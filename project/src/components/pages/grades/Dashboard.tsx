
import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Calendar } from 'lucide-react';
import Popup, { PopupHeader, PopupFooter } from '../../ui/Popup';
import { API_BASE } from '../../../api';
import ExcelUploadPopup from './ExcelUploadPopup';
import CommunityPreview from './CommunityPreview';
import { useDashConnect, getCurrentSem } from './dashConnectAPI';
import { useLang } from '../../../LangContext';
import {
  GRADE_SCALE, GRADES, semLabel, toChartY, getChartXs,
  gradeStyle, dotColor, sumCredits, calcGpa,
} from './dashHelper';

import gradeImg from '../../../assets/grade.png';


// 시간표 블럭 타입 + 색상 맵 (Timetable.tsx 와 동일 구조)
type TimetableBlock = { 
  id:number; col:number; grid_row:string; name:string; time:string; type:string
 };

const DASH_COLOR_KEYS = ['b', 'p', 'c', 'g', 'v', 'i', 'l', 'n'];

function buildDashColorMap(blocks: TimetableBlock[]) {
  const map: Record<string, string> = {};
  let count = 0;
  for (const b of blocks) {
    if (!map[b.name]) { 
      map[b.name] = DASH_COLOR_KEYS[count % DASH_COLOR_KEYS.length]; count++;
     }
  }
  return map;
}


// Sidebar 요약용 타입 (App.tsx에서 gradesSummary state로 관리)
export type GradesSummary = {
  avgGPA: number;
  currentCredits: number;
  earnedTotal: number;
  gradTotal: number;
  gradPct: number;
};

// 엑셀 파일 재업로드 여부 받음 + App.tsx props로 정보 dash=>sidebar 이동
function Dashboard(
  { onGoTimetable, onGoToBoard, reuploadOpen, onReuploadDone, onSummaryChange }:
  { onGoTimetable?: () => void; onGoToBoard?: (postId?: number) => void;
    reuploadOpen?: boolean; onReuploadDone?: () => void;
    onSummaryChange?: (s: GradesSummary) => void; }
  ) {

  // 서버 데이터 + API 호출 (useDashConnect hook)
  const { t } = useLang();

  // 과목 구분 한글 → 번역 맵 (드롭다운 표시용, DB value는 한국어 유지)
  const catLabel: Record<string, string> = {
    '전공필수': t('catReqMajor'), '전공선택': t('catElectMajor'),
    '교양필수': t('catReqLib'),   '교양선택': t('catElectLib'),
  };

  const {
    semesters, allCourses, gradReqs, dataLoading, targetGpa,
    loadData,
    deleteSemester,
    saveSemester:        save_Semester,
    addCourseToSemester: add_Course,
    saveCourseEdit:      save_CourseEdit,
    completeSemester:    complete_Semester,
    saveTargetGpa:       save_TargetGpa,
  } = useDashConnect();

  // 목표 GPA 팝업 UI state
  const [editTargetOpen, setEditTargetOpen] = useState(false);
  const [targetInput, setTargetInput]       = useState('');

  // 엑셀 업로드 팝업 : 로드 완료 후 학기 없으면 자동 표시(강제. X버튼 없음)
  // 헤더에서 재업로드 클릭 시 reuploadOpen=true => X버튼 있음(닫을 수 있음)
  const uploadOpen = (!dataLoading && semesters.length === 0) 
                     || reuploadOpen === true;

  // 열려있는 학기 토글 블럭 useState
  const [expandedSems, setExpandedSems] = useState<number[]>([]);
  // 현재 학기 성적 입력값 { 강의id : "A+" }
  const [grades, setGrades] = useState<Record<number, string>>({});
  // 이번 학기 과목별 목표 성적 { 강의id : "A+" } (목표 성적 섹션에서 사용)
  const [targetGrades, setTargetGrades] = useState<Record<number, string>>({});

  // 학기 추가 팝업
  //   (팝업관리, 해당학기 연도(newSemYear), 학기구분(newSemTerm), 해당학기 과목배열(newSemCourses))
  const [addSemOpen, setAddSemOpen]   = useState(false);
  const [newSemYear, setNewSemYear]   = useState(String(new Date().getFullYear()));
  const [newSemTerm, setNewSemTerm]   = useState<'1'|'2'|'summer'|'winter'>('1');
  const [newSemCourses, setNewSemCourses] = useState<{
    name: string; category: string; credit: string; grade: string
  }[]>([]);

  // 기존 학기에 과목 추가 state 관리
  const [addCourseFor, setAddCourseFor] = useState<number | null>(null); // 열린 학기 id
  const [newCourse, setNewCourse] = useState(
    { name: '', category: '전공필수', credit: '3', grade: '' }
  );

  // 기존 과목 수정 (인라인 폼) state 관리
  const [editCourseId, setEditCourseId]     = useState<number | null>(null);
  const [editCourseData, setEditCourseData] = useState(
    { name: '', category: '전공필수', credit: '3', grade: '' }
  );


  // #### 헬퍼 함수 (hook 호출:Back API connect + UI state 정리) 

  // 학기 추가 - 저장버튼 연결(백에 데이터 완전히 저장)
  async function saveSemester() {
    const year = parseInt(newSemYear, 10);
    if (isNaN(year) || year < 2000 || year > 2050) return;

    const ok = await save_Semester(
      year, newSemTerm, newSemCourses, semesters
    ); // 백엔드로 전송

    if (ok) { // 보냈으면 UI 정리하기.
      setAddSemOpen(false);
      setNewSemYear(String(new Date().getFullYear()));
      setNewSemTerm('1');
      setNewSemCourses([]);
    }
  }

  // 과목 추가(토글 최하단) - 과목 추가하고(백 연결) 인라인 폼 초기화
  async function addCourseToSemester(semId: number) {
    const ok = await add_Course(semId, newCourse);

    if (ok) {
      setNewCourse(
        { name: '', category: '전공필수', credit: '3', grade: '' }
      );
      setAddCourseFor(null);
    }
  }

  // 기존 과목 수정 - 백에 수정정보 보내고(PUT) 인라인 폼 닫기
  async function saveCourseEdit(semId: number, courseId: number) {
    const ok = await save_CourseEdit(semId, courseId, editCourseData);
    if (ok) setEditCourseId(null);
  }

  // 학기 완료 처리 버튼 : 백에 보내고(PUT) 성적 입력 초기화
  async function completeSemester(semId: number, semCoursesList: any[]) {
    const ok = await complete_Semester(semId, semCoursesList, grades);
    if (ok) setGrades({}); 
  }

  // 목표 GPA 저장 : 백에 보내고 팝업 닫기
  async function saveTargetGpa() {
    const val = parseFloat(targetInput);
    if (isNaN(val) || val < 0 || val > 4.5) return;
    const ok = await save_TargetGpa(val);
    if (ok) setEditTargetOpen(false);
  }



  // #### 데이터 처리! (백에 구현 안한 계산 로직)

  // 학기별 GPA 계산 + 학기에 맞는 과목데이터 붙이기
  const semestersWithGpa = semesters.map(s => {
    const courses = allCourses.filter(c => c.semester_id === s.id);
    const gpa = calcGpa(courses);
    return { ...s, gpa, dbGpa: s.gpa, courses }; 
  });

  // 오늘날짜
  //  => 현재 학기 계산 (getCurrentSem: dashConnectAPI.ts import)
  const { year: todayYear, term: todayTerm } = getCurrentSem();


  // 오늘날짜 기준으로 학기 찾기
  //  => 없으면 null-gpa 중 가장 최근 => 없으면 마지막
  let currentSem = semestersWithGpa.find(s => s.semester_year 
                      === todayYear && s.term === todayTerm);
  if (!currentSem) {
    currentSem = [...semestersWithGpa].reverse()
                  .find(s => s.dbGpa === null);
  }
  if (!currentSem) {
    currentSem = semestersWithGpa[semestersWithGpa.length - 1];
  }
  

  // 현학기(currentSem)의 모든 과목이 이번 학기 수강 과목
  const currentCourses = currentSem
    ? allCourses.filter(c => c.semester_id === currentSem.id)
    : [];

  // 이수 완료 과목 (F랑 null 제외, P 포함)
  const completedCourses = allCourses.filter(c => c.grade && c.grade !== 'F');

  // 목표 GPA 달성 힌트 : 이번 학기 미입력 과목 기준 필요 평균 성적 계산
  const hintNeededGrade: string | null = (() => {
    if (!currentSem) return null;
    const ungraded = currentCourses.filter(c => !c.grade);
    if (ungraded.length === 0) return null;
    // 이전 학기 성적 기반 (F 포함, null 제외)
    const past    = allCourses.filter(c => c.semester_id !== currentSem.id && c.grade && GRADE_SCALE[c.grade] != null);
    const pastPts = past.reduce((s: number, c: any) => s + GRADE_SCALE[c.grade] * c.credit, 0);
    const pastCr  = past.reduce((s: number, c: any) => s + c.credit, 0);
    const ungradedCr = ungraded.reduce((s: number, c: any) => s + c.credit, 0);
    const needed = (targetGpa * (pastCr + ungradedCr) - pastPts) / ungradedCr;
    if (needed <= 0)  return 'already';
    if (needed > 4.5) return 'impossible';
    if (needed > 4.0) return 'A+';
    if (needed > 3.5) return 'A0';
    if (needed > 3.0) return 'B+';
    if (needed > 2.5) return 'B0';
    if (needed > 2.0) return 'C+';
    if (needed > 1.5) return 'C0';
    if (needed > 1.0) return 'D+';
    return 'D0';
  })();

  // 성적이 입력된 과목만 => 이번학기 예상 GPA 계산
  const filledCourses = currentCourses.filter(c => grades[c.id]);
  let expectedGPA: number | null = null;
  if (filledCourses.length > 0) {
    let pts = 0, cr = 0;
    for (const c of filledCourses) {
       let temp = GRADE_SCALE[grades[c.id]] * c.credit; 
       cr += c.credit;
       pts += temp; 
      }
    expectedGPA = pts / cr;
  }

  // 이번학기 입력값(예측 혹은 입력완료) + 과거 완료 과목 기반
  //  => 전체/전공/교양 누적 예상 GPA 계산
  const predictedCurrent = currentCourses
    .filter(c => grades[c.id])
    .map(c => ({ ...c, grade: grades[c.id] }));


  const allWithPredicted   = [...completedCourses, ...predictedCurrent];
  const expectedTotalGpa   = filledCourses.length > 0 ? calcGpa(allWithPredicted) : null;

  const expectedMajorGpa   = filledCourses.length > 0
    ? calcGpa(allWithPredicted.filter(c => c.division === '전공')) : null;

  const expectedLiberalGpa = filledCourses.length > 0
    ? calcGpa(allWithPredicted.filter(c => c.division === '교양')) : null;



  // SVG 차트용 데이터 (AI 도움)
  const chartSems = semestersWithGpa.filter(s => s.gpa !== null);
  const chartXs   = getChartXs(chartSems.length);
  const chartData = chartSems.map((s, i) => ({ x: chartXs[i], y: toChartY(s.gpa as number), gpa: s.gpa as number }));
  const chartSemsAll  = expectedGPA !== null && currentSem
    ? [...chartSems, { ...currentSem, gpa: expectedGPA }]
    : chartSems;
  const chartXsAll    = getChartXs(chartSemsAll.length);
  const chartDataAll  = chartSemsAll.map((s, i) => ({
    x: chartXsAll[i], y: toChartY(s.gpa as number), gpa: s.gpa as number,
    isPreview: expectedGPA !== null && i === chartSemsAll.length - 1 && currentSem != null,
  }));
  const completedPts  = chartDataAll.filter(p => !p.isPreview);
  const completedLP   = completedPts.map(p => `${p.x},${p.y}`).join(' ');
  const fillLPAll = chartDataAll.length > 0
    ? `${chartDataAll.map(p => `${p.x},${p.y}`).join(' ')} ${chartDataAll.at(-1)!.x},78 ${chartDataAll[0].x},78`
    : '';
  const previewPt       = chartDataAll.find(p => p.isPreview) ?? null;
  const lastCompletedPt = completedPts[completedPts.length - 1] ?? null;

  // 실데이터 연결
  const gpaList = chartData.map(p => p.gpa);
  const maxGPA  = gpaList.length > 0 ? Math.max(...gpaList) : 0;
  const minGPA  = gpaList.length > 0 ? Math.min(...gpaList) : 0;

  let avgGPA = 0; // 평균 학점 계산
  if (gpaList.length > 0) {
    let sum = 0;
    for (const i of gpaList) sum += i;
    avgGPA = sum / gpaList.length;
  } 

  // 백분율 — mypage API: 엑셀 파싱값
  const [percentile, setPercentile] = useState<number | null>(null);
  
  useEffect(() => {
    async function loadPercentile() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`${API_BASE}/api/users/mypage`, {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.percentile != null) setPercentile(parseFloat(data.percentile));
      }
      catch (e) { console.error('백분위 로드 실패:', e); }
    }
    loadPercentile();
  }, []);

  const topPct = percentile !== null ? percentile.toFixed(1) : null;


  // 졸업요건 조회 헬퍼 (area 이름으로 required 값 찾기)
  function getReq(area: string) {
    return gradReqs.find(r => r.area === area)?.required ?? 0;
  }

  // 이수학점 계산 (Credits.tsx와 동일 로직)
  const LIBERAL_AREAS = ['개신기초교양', '자연이공계기초과학', '일반교양', '확대교양'];
  const earnedTotal    = sumCredits(completedCourses);
  const majorEarned    = sumCredits(completedCourses.filter(c => c.division === '전공'));
  const liberalEarned  = sumCredits(completedCourses.filter(c => c.area && LIBERAL_AREAS.includes(c.area)));
  const majorReqFil    = getReq('전공필수');
  const majorReqSel    = getReq('전공선택');
  const majorReqTotal  = majorReqFil + majorReqSel;
  const liberalReqTotal = LIBERAL_AREAS.reduce((s, a) => s + getReq(a), 0); // DB 저장 area와 일치
  const gradTotal      = getReq('총졸업');
  const gradPct        = gradTotal > 0 ? Math.round(earnedTotal / gradTotal * 100) : 0;

  // 데이터 로드 완료 시 Sidebar 요약 전달 (App.tsx => Sidebar)
  // allCourses/gradReqs 바뀔 때마다 실행 (초기 로드 + 학기 완료 후 갱신)
  useEffect(() => {
    if (dataLoading) return;
    onSummaryChange?.({
      avgGPA,
      currentCredits: sumCredits(currentCourses),
      earnedTotal,
      gradTotal,
      gradPct,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCourses, gradReqs, dataLoading]);

  // 잔여학기 : 4년제 기준 8학기에서 완료학기 빼기
  const completedSems  = semestersWithGpa.filter(s => s.gpa !== null);
  const remainingSems  = Math.max(0, 8 - completedSems.length);

  // 대시보드 시간표 미니뷰 — Timetable API 연결
  const [dashBlocks, setDashBlocks] = useState<TimetableBlock[]>([]);

  useEffect(() => {
    async function loadDashBlocks() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`${API_BASE}/api/timetable`, {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (!res.ok) return;
        const data = await res.json();
        setDashBlocks(data);
      } catch (e) { console.error('시간표 로드 실패:', e); }
    }
    loadDashBlocks();
  }, []);
  const dashColorMap = buildDashColorMap(dashBlocks);

  // alert 섹션용 다가오는 일정 (schedule_events API)
  type DashEvent = { id: number; title: string; event_date: string; event_time: string | null; type: string };
  const [dashEvents, setDashEvents] = useState<DashEvent[]>([]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`${API_BASE}/api/schedule`, {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (!res.ok) return;
        const data = await res.json();
        setDashEvents((data as DashEvent[]).slice(0, 3));
      } catch (e) { console.error('일정 로드 실패:', e); }
    }
    loadEvents();
  }, []);

  // D-day 계산 (event_date: "YYYY-MM-DD")
  function calcDDay(dateStr: string): string {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'D-Day';
    if (diff > 0)  return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  }

  // 학점이수현황 — 교양 area별 이수학점 (동적 계산)
  const liberalAreaMap: Record<string, number> = {};
  for (const c of completedCourses.filter(c => c.division === '교양')) {
    if (!c.area) continue;
    liberalAreaMap[c.area] = (liberalAreaMap[c.area] || 0) + c.credit;
  }

  // 전공 category별 이수학점
  const majorFilEarned = sumCredits(completedCourses.filter(c => c.category === '전공필수'));
  const majorSelEarned = sumCredits(completedCourses.filter(c => c.category === '전공선택'));

  // 해당 학기의 expandedSems 여부 파악 후 열려있으면 닫고, 닫혀있으면 열기
  function toggle(id: number) {
    if (expandedSems.includes(id)) {
      setExpandedSems(expandedSems.filter(s => s !== id));
    } else {
      setExpandedSems([...expandedSems, id]);
    }
  }

  
  // SVG 목표 GPA 기준선 Y 좌표 (DB에서 로드한 targetGpa 기반,)
  const goalLineY = toChartY(targetGpa);

  // 로딩 중 상태 UI 매핑
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-(--text-3) text-sm">
        {t('loading')}
      </div>
    );
  }


  return (
    <>
    <div className="p-3.5 pb-15 w-full">

      {/* ## alert 섹션 (schedule_events API 기반 동적 표시) */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg card-enter
                      bg-(--accent-bg) border border-(--border) whitespace-nowrap
                      mb-3 text-xs text-(--text-2) overflow-hidden">
        <Clock size={11} className="text-(--accent) shrink-0" />
        {dashEvents.length > 0 ? (
          <>
            <span className="text-[10px] font-bold text-(--accent) shrink-0">
              {calcDDay(dashEvents[0].event_date)}
            </span>
            {dashEvents.flatMap((ev, i) => [
              ...(i > 0 ? [<span key={`sep-${ev.id}`} className="text-(--text-3)">·</span>] : []),
              <span key={ev.id} className="shrink-0">
                <b>{ev.event_date.slice(5).replace('-', '.')}</b> {ev.title}
              </span>,
            ])}
          </>
        ) : (
          <span className="text-[10px] text-(--text-3)">{t('sideNoEvents')}</span>
        )}
        <span className="ml-auto text-[10px] text-(--text-3) hidden sm:block shrink-0">
          {currentSem ? `${semLabel(currentSem, t)} · ` : ''}{t('footerDept')}
        </span>
      </div>

      {/* ## TOP 2열 구조 (메인 GPA + 졸업현황 블록) */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-3.5 card-enter stagger-1">

        {/* GPA 메인 카드 */}
        <div className="flex-8 card p-3.5 min-w-0 overflow-hidden flex items-center
                        bg-(--surface) rounded-xl border border-(--border)"
             style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-4 flex-wrap w-full">

            {/* 메인 카드 좌측 섹션 : 누적 성적 */}
            <div className="flex items-center gap-3.5 flex-1 min-w-44">
              <div className="w-16 h-16 rounded-xl bg-transparent
                              flex items-center justify-center shrink-0">
                <img src={gradeImg} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-(--text-3) mb-1 flex items-center gap-1">
                  {t('dashCumGPA')}
                </p>
                <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[38px] font-bold text-(--accent) tabular-nums leading-none"
                        style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif", letterSpacing: '-.03em' }}>
                    {avgGPA > 0 ? avgGPA.toFixed(2) : '-.--'}
                  </span>
                  <span className="text-sm text-(--text-3)">/ 4.5</span>
                  {topPct !== null && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                                     bg-(--badge-neutral-bg) text-(--badge-neutral-text)">
                      {t('dashPercentile')} {topPct}%
                    </span>
                  )}
                </div>
                <div className="flex gap-3 text-[11px] text-(--text-2) flex-wrap">
                  <span>{t('dashMajor')} <b className="text-(--text-1) tabular-nums">
                    {(() => {
                      const mc = allCourses.filter(c => c.division === '전공');
                      return calcGpa(mc)?.toFixed(1) ?? '-';
                    })()}
                  </b></span>
                  <span>{t('dashLiberal')} <b className="text-(--text-1) tabular-nums">
                    {(() => {
                      const lc = allCourses.filter(c => c.division === '교양');
                      return calcGpa(lc)?.toFixed(1) ?? '-';
                    })()}
                  </b></span>
                  <span>{t('dashBest')} <b className="text-(--accent) tabular-nums">{maxGPA.toFixed(1)}</b>
                    <span className="text-[10px] text-(--text-3) ml-0.5">
                      ({chartSems[gpaList.indexOf(maxGPA)] ? semLabel(chartSems[gpaList.indexOf(maxGPA)], t) : '-'})
                    </span>
                  </span>
                  <span>{t('dashEnrolled')} <b className="text-(--text-1) tabular-nums">{semesters.length}</b> {t('dashSems')}</span>
                </div>
              </div>
            </div>

            {/* 메인 카드 우측 섹션 : 현재 상태 블럭들 */}
            <div className="flex gap-1.5 shrink flex-wrap">
              {/* 데이터 연결 필요 (임시, 하드코딩) */}
              {[
                { label: t('dashEarnedCr'),  value: String(earnedTotal),   sub: gradTotal ? '/ ' + gradTotal : '/ -',
                  barPct: null, badge: gradTotal > earnedTotal ? (gradTotal - earnedTotal) + t('dashRemainSuffix') : gradTotal ? t('dashDone') : '-' },
                { label: t('dashMajor'),     value: String(majorEarned),  sub: majorReqTotal ? '/ ' + majorReqTotal : '/ -',
                  barPct: null, badge: majorReqTotal > majorEarned ? (majorReqTotal - majorEarned) + t('dashRemainShort') : t('dashDoneSimple') },
                { label: t('dashLiberal'),   value: String(liberalEarned), sub: '/ ' + liberalReqTotal,
                  barPct: null, badge: liberalEarned >= liberalReqTotal ? t('dashDone') : (liberalReqTotal - liberalEarned) + t('dashRemainSuffix') },
                { label: t('dashTargetGPA'), value: targetGpa.toFixed(1), sub: avgGPA > 0 ? t('dashCurrentPrefix') + avgGPA.toFixed(2) : '-',
                  barPct: null,
                  badge: avgGPA >= targetGpa ? t('dashAchieved') : avgGPA >= targetGpa - 0.3
                                             ? t('dashAchievable') : (targetGpa - avgGPA).toFixed(1) + t('dashShortSuffix') },
              ].map(box => (

                <div key={box.label}
                     className="flex-1 min-w-16 max-w-24 rounded-lg
                                bg-(--inner-bg) px-3 py-2.5 text-center">
                  <p className="text-[9px] text-(--text-3) mb-1
                                whitespace-nowrap">
                                {box.label}
                  </p>

                  <p className="text-xl font-bold text-(--text-1)
                                tabular-nums leading-none"
                     style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                    {box.value}
                  </p>

                  {/* 그래프 유무(barPct)로 레이아웃 나누는 것이 합리적 */}
                  {box.barPct !== null
                  ? (
                      <>
                        {/* 임시 그래프 바 ... (임시, 하드코딩) */}
                        <div className="h-1.5 rounded-full bg-(--bar-track) mt-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-(--bar)"
                               style={{ width: `${box.barPct}%` }} />
                        </div>
                        <p className="text-[9px] text-(--text-3)
                                      mt-0.5 whitespace-nowrap">{box.sub}</p>
                      </>
                  )
                  : (
                      <>
                        <p className="text-[9px] text-(--text-3)
                                      mt-0.5 whitespace-nowrap">{box.sub}</p>
                        {box.badge && (
                          <span className="inline-block mt-1 px-1.5 py-px rounded-full text-[8px]
                                            font-semibold bg-(--surface-2) whitespace-nowrap
                                            text-(--text-2) border border-(--border)">
                            {box.badge}
                          </span>
                        )}
                      </>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* 졸업 현황 카드 (임시, 하드코딩) */}
        <div className="flex-2 min-w-32.5 bg-(--surface)
                        rounded-xl border border-(--border) p-3.5
                        flex flex-col justify-between"
             style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-[9px] font-bold text-(--text-3) uppercase tracking-widest mb-2 flex items-center gap-1">
            {t('dashGradStatus')}
          </p>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[28px] font-extrabold text-(--accent) tabular-nums leading-none"
                    style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif", letterSpacing: '-.03em' }}>
                {gradPct}%
              </span>
            </div>
            <p className="text-[9px] text-(--text-3) mt-0.5">{t('dashGradPctLabel')}</p>
            <div className="h-1 rounded-full bg-(--bar-track) mt-2 mb-2.5 overflow-hidden">
              <div className="h-full rounded-full bg-(--bar)" style={{ width: gradPct + '%' }} />
            </div>
          </div>
          <div className="border-t border-(--border) pt-2 flex flex-col gap-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-(--text-3)">{t('dashRemSems')}</span>
              <b className="text-(--text-1)">{remainingSems}{t('dashSemUnit')}</b>
            </div>
            <div className="flex justify-between text-[10px] items-center">
              <span className="text-(--text-3)">{t('dashGradCert')}</span>
              <span className="px-1.5 py-px rounded-full text-[8px] font-semibold
                               bg-(--surface-2) text-(--text-2) border border-(--border)">
                {t('dashIncomplete')}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* ## 중간 부분 3열 구조 grid 구성 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr] gap-3.5 card-enter stagger-2">

        {/* #1열 : 학기별 성적 컴포넌트
            (* 내용이 많아 실제 데이터 연결하며 구조화 메모 필요) */}
         <div className="bg-(--surface) rounded-xl
                          border border-(--border) overflow-hidden"
              style={{ boxShadow: 'var(--shadow-card)' }}>

            {/* TOP */}
            <div className="px-4.5 py-3.5 border-b border-(--border)
                            flex justify-between items-center">
              <span className="font-bold text-sm flex items-center gap-1.5">
                {t('dashSemGrades')}
              </span>
              <button
                onClick={() => setAddSemOpen(true)}
                className="text-[11px] font-medium text-(--text-2) border
                           border-(--border) rounded-lg
                           px-2.5 py-1 hover:bg-(--surface-2) transition-colors">
                {t('dashAddSem')}
              </button>
            </div>

            {/* 학기별 GPA 추이 차트 (API 연결) */}
            <div className="px-4.5 py-4 border-b border-(--border)">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[11px] text-(--text-3)">{t('dashGpaTrend')}</span>
                <div className="flex gap-4 text-[11px] text-(--text-3)">
                  <span>{t('dashBest')} <b className="text-(--accent) tabular-nums">{maxGPA.toFixed(1)}</b></span>
                  <span>{t('dashWorst')} <b className="tabular-nums">{minGPA.toFixed(1)}</b></span>
                  <span>{t('dashAvg')} <b className="text-(--text-1) tabular-nums">{avgGPA.toFixed(1)}</b></span>
                </div>
              </div>

              <svg viewBox="0 0 560 90" style={{ width: '100%', display: 'block', maxHeight: 70 }}>
                <defs>
                  <linearGradient id="chartfill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity=".18"/>
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
                  </linearGradient>
                </defs>

                {/* 그리드 선 */}
                <line x1="20" y1="20" x2="540" y2="20" stroke="var(--border)" strokeWidth={1} strokeDasharray="4 4"/>
                <line x1="20" y1="45" x2="540" y2="45" stroke="var(--border)" strokeWidth={1} strokeDasharray="4 4"/>
                <line x1="20" y1="70" x2="540" y2="70" stroke="var(--border)" strokeWidth={1} strokeDasharray="4 4"/>

                {/* y축 라벨 */}
                <text x={8} y={24} fontSize={9} fill="var(--text-3)" fontFamily="Inter" textAnchor="end">4.5</text>
                <text x={8} y={49} fontSize={9} fill="var(--text-3)" fontFamily="Inter" textAnchor="end">4.0</text>
                <text x={8} y={74} fontSize={9} fill="var(--text-3)" fontFamily="Inter" textAnchor="end">3.5</text>

                {/* 목표 GPA 기준선 (DB에서 로드한 targetGpa 기반, 수정 버튼으로 변경 가능) */}
                <line x1="20" y1={goalLineY} x2="540" y2={goalLineY}
                      stroke="var(--bar)" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.75}/>
                <text x={543} y={goalLineY + 4} fontSize={8} fill="var(--bar)" fontFamily="Inter" fontWeight={700}>{t('dashGoalLine')}</text>

                {/* fill + line (완료 구간 + 예상 포인트 점선) */}
                {chartDataAll.length > 0 && (
                  <>
                    <polygon points={fillLPAll} fill="url(#chartfill)"/>
                    {completedPts.length > 0 && (
                      <polyline points={completedLP} fill="none" stroke="var(--accent)"
                                strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/>
                    )}

                    {/* 마지막 완료 포인트 → 예상 포인트 점선 연결 */}
                    {previewPt && lastCompletedPt && (
                      <line x1={lastCompletedPt.x} y1={lastCompletedPt.y}
                            x2={previewPt.x} y2={previewPt.y}
                            stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 3" opacity={0.65}/>
                    )}
                  </>
                )}

                {/* 점 + 라벨 (완료 + 예상 포인트 포함) */}
                {chartDataAll.map((p, i) => (
                  <g key={i}>
                    {p.isPreview ? (
                      <circle cx={p.x} cy={p.y} r={4.5}
                        fill="var(--surface)" stroke="var(--accent)"
                        strokeWidth={1.5} strokeDasharray="3 2" opacity={0.75}/>
                    ) : (
                      <circle cx={p.x} cy={p.y} r={i === completedPts.length - 1 ? 5 : 4}
                        fill={i === completedPts.length - 1 ? 'var(--accent)' : 'var(--surface)'}
                        stroke="var(--accent)" strokeWidth={i === completedPts.length - 1 ? 0 : 2}/>
                    )}

                    <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize={9}
                      fill={p.isPreview ? 'var(--accent)' : p.gpa === maxGPA ? 'var(--accent)' : 'var(--text-2)'}
                      fontWeight={p.gpa === maxGPA || p.isPreview ? 700 : 400}
                      fontFamily="Inter" opacity={p.isPreview ? 0.75 : 1}>
                      {p.isPreview ? '~' + p.gpa.toFixed(1) : p.gpa.toFixed(1)}
                    </text>

                    <text x={p.x} y={89} textAnchor="middle" fontSize={10}
                      fill={p.isPreview ? 'var(--accent)' : i === completedPts.length - 1 ? 'var(--accent)' : 'var(--text-3)'}
                      fontFamily="Inter"
                      fontWeight={p.isPreview || i === completedPts.length - 1 ? 700 : 400}
                      opacity={p.isPreview ? 0.75 : 1}>
                      {p.isPreview ? t('dashExpectedChart') : i === completedPts.length - 1 ? t('dashCurrentShort') : chartSems[i] ? semLabel(chartSems[i], t) : ''}
                    </text>
                  </g>
                ))}
              </svg>

              {chartDataAll.length === 0 && (
                <div className="text-center text-[11px] text-(--text-3) py-4">
                  {t('dashNoGradeData')}
                </div>
              )}
            </div>

            {/* 성적 분포 / 전체 이수 과목 차트 (API 연결) */}
            <div className="px-4.5 py-2.5 border-b border-(--border)">
              {(() => {
                const graded = allCourses.filter(c => c.grade && GRADE_SCALE[c.grade] !== undefined);
                const total  = graded.length;
                const aPlus  = graded.filter(c => c.grade === 'A+').length;
                const aZero  = graded.filter(c => c.grade === 'A0').length;
                const bGrade = graded.filter(c => c.grade?.startsWith('B')).length;
                const others = total - aPlus - aZero - bGrade;
                const pct = (n: number) => total > 0 ? Math.round(n / total * 100) : 0;
                return (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-(--text-3)
                            flex items-center gap-1">{t('dashGradeDistrib')}</span>
                      <span className="text-[10px] text-(--text-3)">
                        {t('dashCompletedN')} <b className="text-(--text-2) tabular-nums"> {total} </b></span>
                    </div>
                    <div className="flex h-2.5 rounded-full overflow-hidden">
                      <div style={{ width: `${pct(aPlus)}%`, background: 'var(--accent)' }}/>
                      <div style={{ width: `${pct(aZero)}%`, background: 'var(--accent)', opacity: .55 }} className="ml-px"/>
                      <div style={{ width: `${pct(bGrade)}%`, background: 'var(--accent)', opacity: .28 }} className="ml-px"/>
                      <div className="flex-1 bg-(--bar-track) ml-px"/>
                    </div>
                    <div className="flex gap-3.5 mt-1.5 text-[10px]">
                      <span className="text-(--accent) font-bold">A+ <span className="tabular-nums">{pct(aPlus)}%</span></span>
                      <span className="text-(--text-2)">A0 <span className="tabular-nums">{pct(aZero)}%</span></span>
                      <span className="text-(--text-3)">B <span className="tabular-nums">{pct(bGrade)}%</span></span>
                      <span className="text-(--text-3) opacity-60">{t('dashBelowC')} <span className="tabular-nums">{pct(others)}%</span></span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* 목표 GPA 달성 힌트 (동적 계산) */}
            {hintNeededGrade && hintNeededGrade !== 'impossible' && (
              <div className="px-4.5 py-2 border-b border-(--border) bg-(--accent-bg)
                              flex items-center gap-2 text-[11px] text-(--text-2)">
                <Clock size={12} className="text-(--accent) shrink-0" />
                {hintNeededGrade === 'already' ? (
                  <span>{t('dashHintAlready')}</span>
                ) : (
                  <>
                    <span>
                      {t('dashHintAvg')}<b className="text-(--text-1)">{hintNeededGrade}</b>{t('dashHintOrAbove')}{targetGpa.toFixed(1)}{t('dashHintPossible')}
                    </span>
                    <span className="ml-auto px-1.5 py-0.5 rounded-full text-[8px] font-semibold
                                    bg-(--accent-bg) text-(--accent) whitespace-nowrap shrink-0">
                      {t('dashAchievable')} ✓
                    </span>
                  </>
                )}
              </div>
            )}


            {/* 학기 블럭 : API 데이터 */}
            {semestersWithGpa.map((sem) => {
              const isCurrent  = sem.id === currentSem?.id; // id로 비교 — gpa=null 학기 중복 방지
              const isOpen     = expandedSems.includes(sem.id); // 열려있는지 확인 (expandedSems search)
              const semCourses = sem.courses; // grade null 포함 — 신규 추가 과목도 표시
                                // 각 강의들 중 현재 탐색중인 학기의 과목들 catch ..

              // 교양/전공 GPA 계산 (학기 헤더 우측 표시용 — 완료 학기만)
              const libCourses   = sem.courses.filter((c: any) => c.division === '교양');
              const majorCourses = sem.courses.filter((c: any) => c.division === '전공');
              const libGPA   = calcGpa(libCourses)?.toFixed(1)   ?? '-';
              const majorGPA = calcGpa(majorCourses)?.toFixed(1) ?? '-';

              // 이 학기에서 입력된 성적 수 (완료 버튼 표시 조건)
              const thisFilled = semCourses.filter((c: any) => grades[c.id]);

              // 이 학기 예상 GPA (성적 입력 시 계산)
              let thisExpectedGPA: number | null = null;
              if (thisFilled.length > 0) {
                let pts = 0, cr = 0;
                for (const c of thisFilled as any[]) { 
                  pts += GRADE_SCALE[grades[c.id]] * c.credit; cr += c.credit;
                 }
                thisExpectedGPA = pts / cr;
              }

              return (
                <div key={sem.id} className="border-b border-(--border) last:border-none">
                  {/* key 인 semester id로 div 구분! */}
                  <div
                    onClick={() => toggle(sem.id)}
                    className={`w-full px-4 py-2.5 flex items-center cursor-pointer
                                justify-between transition-colors
                                ${isCurrent ? 'bg-(--accent-bg) hover:bg-(--surface-2)'
                                            : 'hover:bg-(--surface-2)'}`} >

                    <div className="flex items-center gap-3.5">
                      {isCurrent ? (
                        <>
                          <span className="w-14 text-[11px] font-bold text-(--accent)">{semLabel(sem, t)}</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                                          bg-(--badge-neutral-bg) text-(--badge-neutral-text)">{t('dashCurrentSem')}</span>
                          <span className="text-[10px] text-(--text-3)">
                            {sem.courses.length}{t('dashSubjectUnit')} · {sumCredits(sem.courses)}{t('dashCreditsUnit')} · {t('dashPending')}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="w-14 text-[11px] font-bold text-(--text-3)">{semLabel(sem, t)}</span>
                          <span className="text-lg font-bold tabular-nums text-(--text-1) leading-none"
                                style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                            {sem.gpa?.toFixed(1)} {/* toFixed : 소수점 n자리까지 보여줌. */}
                          </span>
                          <span className="text-[10px] text-(--text-3)">/4.5</span>
                        </>
                      )}
                    </div>

                    {/* 완료 학기만 교양/전공 GPA 표시 */}
                    {!isCurrent && (
                      <div className="flex items-center gap-3.5 text-[11px] text-(--text-2)">
                        <span>{t('dashLiberal')} <b>{libGPA}</b></span>
                        <span>{t('dashMajor')} <b>{majorGPA}</b></span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {/* 학기 삭제 버튼 */}
                      <button
                        onClick={e => { e.stopPropagation(); deleteSemester(sem.id, semLabel(sem, t)); }}
                        className="text-[10px] text-(--text-3) hover:text-red-400
                                   transition-colors px-1.5 py-0.5 rounded border
                                   border-(--border) hover:border-red-300">
                        {t('delete')}
                      </button>
                      <svg
                        className={`w-3 h-3 text-(--text-3) transition-transform
                                    ${isOpen ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>

                  </div>

                  {/* 토글 내용물 구성 */}
                  {isOpen && (
                    <div className="overflow-hidden">
                      {isCurrent ? (
                        // 현재 학기 — 성적 입력 UI
                        <div className="px-4 pb-3">
                          <p className="text-[10px] text-(--text-3) font-semibold mb-1.5 mt-2">{t('dashGradeInput')}</p>
                          <div className="flex flex-col gap-1">
                            {semCourses.map((c: any) => (
                              editCourseId === c.id ? (

                                // 수정 inline 폼
                                <div key={c.id} className="flex flex-col gap-1 bg-(--inner-bg) rounded-lg px-2 py-1.5">
                                  <div className="grid gap-1 items-center"
                                       style={{ gridTemplateColumns: '1fr 90px 34px 54px' }}>
                                    <input
                                      value={editCourseData.name}
                                      onChange={e => setEditCourseData(prev => ({ ...prev, name: e.target.value }))}
                                      className="px-1.5 py-0.5 text-[11px] rounded bg-(--surface) border border-(--border)
                                                 text-(--text-1) focus:outline-none focus:border-(--text-2) transition-colors" />
                                    <select
                                      value={editCourseData.category}
                                      onChange={e => setEditCourseData(prev => ({ ...prev, category: e.target.value }))}
                                      className="px-1 py-0.5 text-[10px] rounded bg-(--surface) border border-(--border)
                                                 text-(--text-1) focus:outline-none cursor-pointer">
                                      {['전공필수','전공선택','교양필수','교양선택'].map(o => <option key={o} value={o}>{catLabel[o]}</option>)}
                                    </select>
                                    <input
                                      value={editCourseData.credit}
                                      onChange={e => setEditCourseData(prev => ({ ...prev, credit: e.target.value }))}
                                      className="px-1 py-0.5 text-[10px] text-center rounded bg-(--surface) border border-(--border)
                                                 text-(--text-1) focus:outline-none" />
                                    <select
                                      value={editCourseData.grade}
                                      onChange={e => setEditCourseData(prev => ({ ...prev, grade: e.target.value }))}
                                      className="px-1 py-0.5 text-[10px] rounded bg-(--surface) border border-(--border)
                                                 text-(--text-1) focus:outline-none cursor-pointer">
                                      <option value="">-</option>
                                      {GRADES.map(g => <option key={g}>{g}</option>)}
                                    </select>
                                  </div>
                                  <div className="flex gap-1 justify-end">
                                    <button onClick={() => setEditCourseId(null)}
                                            className="text-[9px] px-2 py-0.5 rounded border border-(--border)
                                                       text-(--text-3) hover:bg-(--surface-2) transition-colors">{t('cancel')}</button>
                                    <button onClick={() => saveCourseEdit(sem.id, c.id)}
                                            className="text-[9px] px-2 py-0.5 rounded bg-(--text-1) text-(--surface)
                                                       hover:opacity-85 transition-opacity font-semibold">{t('save')}</button>
                                  </div>
                                </div>
                              ) : (
                                // notion 필기 참조!
                                <div key={c.id}
                                    className="grid items-center gap-1.5 px-2 py-1
                                               bg-(--inner-bg) rounded-lg group"
                                    style={{ gridTemplateColumns: '1fr 36px 70px 22px' }}>

                                  <span className="text-[11px] font-medium text-(--text-1)">{c.name}</span>
                                  <span className="text-[10px] text-(--text-3) text-right">{c.credit}cr</span>

                                  <select
                                    value={grades[c.id] ?? ''}
                                    onChange={e => setGrades(prev => ({
                                       ...prev,
                                       [c.id]: e.target.value
                                    }))}
                                    className="text-[11px] bg-(--surface) border border-(--border)
                                               rounded px-1 py-0.5
                                              text-(--text-1) cursor-pointer focus:outline-none" >

                                    <option value="">-</option>

                                    {GRADES.map(g => <option key={g}>{g}</option>)}

                                  </select>

                                  <button
                                    onClick={() => {
                                      setEditCourseId(c.id);
                                      setEditCourseData({ name: c.name, category: c.category || '전공필수', credit: String(c.credit), grade: c.grade || '' });
                                    }}
                                    className="text-[9px] text-(--text-3) hover:text-(--text-1)
                                               opacity-0 group-hover:opacity-100 transition-opacity">
                                    {t('edit')}
                                  </button>

                                </div>
                              )
                            ))}
                          </div>

                          {/* 예상 GPA 박스 */}
                          <div className="mt-2 px-2.5 py-2 bg-(--accent-bg) rounded-lg
                                          border border-(--badge-neutral-bg)">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-(--text-2)">{t('dashProjected')}</span>
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-[17px] font-bold text-(--accent) tabular-nums"
                                      style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                                  {thisExpectedGPA !== null ? thisExpectedGPA.toFixed(2) : '-.-'}
                                </span>
                                <span className="text-[10px] text-(--text-3)">/ 4.5</span>
                              </div>
                            </div>
                            {/* 현재 학기만 전체/전공/교양 누적 예상 표시 */}
                            {isCurrent && expectedTotalGpa !== null && (
                              <div className="border-t border-(--badge-neutral-bg) mt-1.5 pt-1.5
                                              flex gap-3.5 text-[11px] text-(--text-3)">
                                <span>{t('dashAll')} <b className="text-(--text-1) tabular-nums">{expectedTotalGpa.toFixed(2)}</b></span>
                                <span>{t('dashMajor')} <b className="text-(--text-1) tabular-nums">{expectedMajorGpa?.toFixed(2) ?? '-'}</b></span>
                                <span>{t('dashLiberal')} <b className="text-(--text-1) tabular-nums">{expectedLiberalGpa?.toFixed(2) ?? '-'}</b></span>
                              </div>
                            )}
                          </div>

                          {/* 학기 완료 버튼 — 모든 과목 성적 입력 시 표시 */}
                          {isCurrent && thisFilled.length === semCourses.length && semCourses.length > 0 && (
                            <button
                              onClick={() => completeSemester(sem.id, semCourses)}
                              className="w-full mt-2 py-2 rounded-lg text-[12px] font-semibold
                                         bg-(--accent) text-white hover:opacity-85 transition-opacity">
                              {t('dashCompleteSem')}
                            </button>
                          )}
                        </div>
                      ) : semCourses.length > 0 ? (
                        // 현재 학기가 아니지만, 데이터 있으면 :
                        <div className="grid grid-cols-2 gap-2 px-4 pb-3">
                          {[{ div: '전공', label: t('dashMajor') }, { div: '교양', label: t('dashLiberal') }].map(({ div, label }) => {
                            const divCourses = semCourses.filter((c: any) => c.division === div);
                            return divCourses.length > 0 ? (
                              <div key={div} className="bg-(--inner-bg) rounded-lg p-2.5">
                                <p className="text-[9px] font-bold text-(--text-3)
                                              uppercase tracking-widest mb-1.5">{label}</p>
                                <div className="flex flex-col gap-1 text-[11px]">

                                  {divCourses.map((c: any) => (
                                    editCourseId === c.id ? (
                                      // 수정 인라인 폼 ( 필요에 의해! 과목 추가 후 수정하는 폼 추가함. )

                                      <div key={c.id} className="flex flex-col gap-1 py-0.5">
                                        <div className="grid gap-0.5 items-center"
                                             style={{ gridTemplateColumns: '1fr 72px 26px 46px' }}>
                                          <input
                                            value={editCourseData.name}
                                            onChange={e => setEditCourseData(prev => ({ ...prev, name: e.target.value }))}
                                            className="px-1.5 py-0.5 text-[10px] rounded bg-(--surface) border border-(--border)
                                                       text-(--text-1) focus:outline-none focus:border-(--text-2) transition-colors" />
                                          <select
                                            value={editCourseData.category}
                                            onChange={e => setEditCourseData(prev => ({ ...prev, category: e.target.value }))}
                                            className="px-0.5 py-0.5 text-[9px] rounded bg-(--surface) border border-(--border)
                                                       text-(--text-1) focus:outline-none cursor-pointer">
                                            {['전공필수','전공선택','교양필수','교양선택'].map(o => <option key={o} value={o}>{catLabel[o]}</option>)}
                                          </select>
                                          <input
                                            value={editCourseData.credit}
                                            onChange={e => setEditCourseData(prev => ({ ...prev, credit: e.target.value }))}
                                            className="px-1 py-0.5 text-[9px] text-center rounded bg-(--surface) border border-(--border)
                                                       text-(--text-1) focus:outline-none" />
                                          <select
                                            value={editCourseData.grade}
                                            onChange={e => setEditCourseData(prev => ({ ...prev, grade: e.target.value }))}
                                            className="px-0.5 py-0.5 text-[9px] rounded bg-(--surface) border border-(--border)
                                                       text-(--text-1) focus:outline-none cursor-pointer">
                                            <option value="">-</option>
                                            {GRADES.map(g => <option key={g}>{g}</option>)}
                                          </select>
                                        </div>
                                        <div className="flex gap-1 justify-end">
                                          <button onClick={() => setEditCourseId(null)}
                                                  className="text-[9px] px-1.5 py-0.5 rounded border border-(--border)
                                                             text-(--text-3) hover:bg-(--surface-2) transition-colors">{t('cancel')}</button>
                                          <button onClick={() => saveCourseEdit(sem.id, c.id)}
                                                  className="text-[9px] px-1.5 py-0.5 rounded bg-(--text-1) text-(--surface)
                                                             hover:opacity-85 transition-opacity font-semibold">{t('save')}</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div key={c.id} className="flex justify-between items-center group">
                                        <span className="text-(--text-2) truncate mr-1">{c.name}</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                          {c.grade && <span className={gradeStyle(c.grade)}>{c.grade}</span>}
                                          <button
                                            onClick={() => {
                                              setEditCourseId(c.id);
                                              setEditCourseData({ name: c.name, category: c.category || '전공필수', credit: String(c.credit), grade: c.grade || '' });
                                            }}
                                            className="text-[9px] text-(--text-3) hover:text-(--text-1)
                                                       opacity-0 group-hover:opacity-100 transition-opacity">
                                            {t('edit')}
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  ))}
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <div className="mx-4 mb-3 bg-(--inner-bg) rounded-lg
                                        text-center text-[11px]
                                        text-(--text-3) py-2.5">
                          {t('dashNoCourses')}
                        </div>
                      )}

                      {/* 과목 추가 버튼 / 인라인 폼 (모든 학기 공통) */}
                      <div className="px-4 pt-2 pb-3 border-t border-(--border)">
                        {addCourseFor === sem.id ? (
                          <div className="bg-(--surface-2) rounded-xl p-3 space-y-2">
                            <div className="grid gap-1.5 items-center"
                                 style={{ gridTemplateColumns: '1fr 96px 48px 60px 22px' }}>
                              {/* 과목명 */}
                              <input
                                value={newCourse.name}
                                onChange={e => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={t('dashCourseNamePh')}
                                autoFocus
                                className="px-2.5 py-1.5 text-[11px] rounded-lg bg-(--surface) border
                                           border-(--border) text-(--text-1) focus:outline-none
                                           focus:border-(--text-2) transition-colors placeholder:text-(--text-3)"
                              />

                              {/* 구분 */}
                              <select
                                value={newCourse.category}
                                onChange={e => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
                                className="px-2 py-1 text-[11px] rounded-lg bg-(--surface) border
                                           border-(--border) text-(--text-1) focus:outline-none cursor-pointer">
                                {['전공필수','전공선택','교양필수','교양선택'].map(o => <option key={o} value={o}>{catLabel[o]}</option>)}
                              </select>

                              {/* 학점 */}
                              <input
                                value={newCourse.credit}
                                onChange={e => setNewCourse(prev => ({ ...prev, credit: e.target.value }))}
                                placeholder="3"
                                className="px-2 py-1 text-[11px] text-center rounded-lg bg-(--surface) border
                                           border-(--border) text-(--text-1) focus:outline-none
                                           focus:border-(--text-2) transition-colors"
                              />

                              {/* 성적 */}
                              <select
                                value={newCourse.grade}
                                onChange={e => setNewCourse(prev => ({ ...prev, grade: e.target.value }))}
                                className="px-2 py-1 text-[11px] rounded-lg bg-(--surface) border
                                           border-(--border) text-(--text-1) focus:outline-none cursor-pointer">
                                <option value="">-</option>
                                {GRADES.map(g => <option key={g}>{g}</option>)}
                              </select>
                              <button
                                onClick={() => {
                                  setAddCourseFor(null);
                                  setNewCourse({ name: '', category: '전공필수', credit: '3', grade: '' });
                                }}
                                className="text-(--text-3) hover:text-red-400 transition-colors text-[16px] leading-none">
                                ×
                              </button>
                            </div>
                            <button
                              onClick={() => addCourseToSemester(sem.id)}
                              className="w-full py-1.5 rounded-lg text-[11px] font-semibold
                                         bg-(--text-1) text-(--surface) hover:opacity-80 transition-opacity">
                              {t('add')}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setAddCourseFor(sem.id);
                              setNewCourse({ name: '', category: '전공필수', credit: '3', grade: '' });
                            }}
                            className="w-full py-1.5 rounded-lg border border-dashed border-(--border)
                                       text-[11px] text-(--text-3) hover:border-(--text-2)
                                       hover:text-(--text-2) transition-colors">
                            {t('addCourse')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 학기별 성적 - 하단 요약 */}
            <div className="px-4.5 py-3 bg-(--surface-2) flex items-center gap-2.5
                            text-[10px] text-(--text-3) whitespace-nowrap ">
              <span>{t('dashCompletedN')} <b className="text-(--text-2)">{chartSems.length}{t('dashSemUnit')}</b></span>
              <span>·</span>
              <span>{t('dashAvg')} GPA <b className="text-(--text-1) tabular-nums">{avgGPA.toFixed(2)}</b></span>
              <span>·</span>
              <span>{t('dashBest')} <b className="text-(--accent) tabular-nums">{maxGPA.toFixed(1)}</b>
                <span className="text-[9px] ml-0.5">
                  ({chartSems[gpaList.indexOf(maxGPA)] ? semLabel(chartSems[gpaList.indexOf(maxGPA)], t) : '-'})
                </span>
              </span>
            </div>
         </div>

        {/* #2열+3열 wrapper: md에서 2열, lg에서 투명(contents)해져서 부모 3열에 참여 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:contents gap-3.5">

          {/* #2열 : 목표 성적 | 커뮤니티 */}
          <div className="flex flex-col gap-3.5 h-full">

            {/* 목표 성적 블럭 */}
            <div className="bg-(--surface) rounded-xl border
                            border-(--border) overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-3.5 py-3 border-b border-(--border)
                              flex justify-between items-center">
                <span className="font-bold text-sm">{t('dashTargetGrades')}</span>
                { /* 수정 버튼 @ */ }
                <button
                  onClick={() => { setTargetInput(targetGpa.toFixed(2)); setEditTargetOpen(true); }}
                  className="text-[10px] font-medium text-(--text-2)
                                  border border-(--border) rounded-lg
                                  px-2 py-0.5 hover:bg-(--surface-2) transition-colors">
                  {t('edit')}
                </button>
              </div>
              <div className="px-3.5 py-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] text-(--text-3)">{t('dashTargetGPA')}</span>
                  <span className="text-xl font-bold text-(--accent) tabular-nums"
                        style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif", letterSpacing: '-.02em' }}>
                    {targetGpa.toFixed(1)}
                  </span>
                </div>

                <div className="flex justify-between text-[10px] text-(--text-2) mb-1">
                  <span>{t('dashCurrentShort')} <b className="text-(--text-1) tabular-nums">{avgGPA.toFixed(1)}</b></span>
                  <span>{t('dashTarget')} <b className="text-(--accent) tabular-nums">{targetGpa.toFixed(1)}</b></span>
                </div>

                <div className="h-3 rounded-full bg-(--bar-track) overflow-hidden">
                  <div className="h-full rounded-full bg-(--bar)"
                       style={{ width: `${Math.min(100, targetGpa > 0 ? (avgGPA / targetGpa) * 100 : 0).toFixed(0)}%` }} />
                </div>

              </div>
              <div className="h-px bg-(--border)" />

              <div className="px-3.5 py-3">
                <p className="text-[10px] text-(--text-3) mb-2">{t('dashSemTargets')}</p>

                {/* 목표 성적 블럭 @ - 현재학기 과목 기반 동적 입력 (하드코딩 제거) */}
                {currentCourses.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {currentCourses.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-(--text-1) truncate mr-2">{c.name}</span>
                        <select
                          value={targetGrades[c.id] ?? ''}
                          onChange={e => setTargetGrades(prev => ({ ...prev, [c.id]: e.target.value }))}
                          className="text-[11px] bg-(--surface) border border-(--border)
                                     rounded px-1.5 py-0.5 shrink-0
                                     text-(--text-1) cursor-pointer focus:outline-none">
                          <option value="">{t('dashNotSet')}</option>
                          {GRADES.map(g => <option key={g}>{g}</option>)}
                        </select>
                        {/* type : user가 직접 수정 가능하게 변경 — select로 대체 완료 */}
                      </div>
                    ))}
                  </div>
                ) 
                : (
                  <p className="text-[11px] text-(--text-3) text-center py-2">{t('dashNoCourseList')}</p>
                )}
                
                {/* 목표 성적 - 예상 결과 alert (목표 성적 설정 시 동적 계산) */}
                {(() => {
                  const filled = currentCourses.filter((c: any) => targetGrades[c.id]);
                  if (filled.length === 0) return null;
                  let pts = 0, cr = 0;
                  for (const c of filled as any[]) {
                    pts += GRADE_SCALE[targetGrades[c.id]] * c.credit;
                    cr  += c.credit;
                  }
                  const predicted = pts / cr;
                  return (
                    <div className="mt-2.5 px-2.5 py-1.5 bg-(--accent-bg) rounded-lg flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-(--accent) shrink-0" />
                      <span className="text-[10px] text-(--text-2)">
                        {t('dashGoalResult')}&nbsp;
                        <b className="text-(--accent)">{predicted.toFixed(2)}</b>
                        &nbsp;{predicted >= targetGpa ? t('dashGoalAchieved') : t('dashGoalMissed')}
                      </span>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* 커뮤니티(게시판) 미리보기 블럭 — CommunityPreview.tsx */}
            <CommunityPreview onGoToBoard={onGoToBoard} />
          </div>

          {/* #3열 : 이번 학기 수강 | 시간표 */}
          <div className="flex flex-col gap-3.5 h-full">

            {/* 이번 학기 수강 블럭 */}
            <div className="bg-(--surface) rounded-xl border
                            border-(--border) overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-4 py-3 border-b border-(--border) flex
                              justify-between items-center">
                <div>
                  <span className="font-bold text-[13px]">{t('dashThisSemCourses')}</span>
                  <span className="text-[11px] text-(--text-3) ml-2">
                    {currentSem ? semLabel(currentSem, t) : '-'}
                  </span>
                </div>

                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                                bg-(--badge-neutral-bg) text-(--badge-neutral-text)">
                  {sumCredits(currentCourses)}{t('dashCreditsUnit')}
                </span>
              </div>

              <div className="py-1.5">
                <div className="grid items-center px-4 py-2 text-[11px]
                                text-(--text-3) font-semibold
                                border-b border-(--border) mb-0.5"
                    style={{ gridTemplateColumns: '9px 1fr auto auto', gap: '6px 10px' }}>
                  <span/>
                  <span>{t('dashCourseName')}</span> <span>{t('dashType')}</span>
                  <span className="text-right">{t('dashCredits')}</span>
                </div>
                {currentCourses.map((c: any) => (
                  <div key={c.id}
                      className="grid items-center px-4 py-1.75 cursor-pointer
                                  hover:bg-(--surface-2) transition-colors"
                      style={{ gridTemplateColumns: '9px 1fr auto auto', gap: '4px 10px' }}>
                    <span className={`w-2 h-2 rounded-full
                                      inline-block ${dotColor(c.category ?? '')}`} />

                    <span className="text-[12px] font-medium text-(--text-1)">{c.name}</span>
                    <span className="text-[10px] text-(--text-3)">{c.category}</span>
                    <span className="text-[12px] font-semibold text-(--text-1)
                                    text-right tabular-nums">{c.credit}</span>
                  </div>
                ))}
                <div className="px-4 py-2 border-t border-(--border)
                                flex justify-between items-center mt-0.5">
                  <span className="text-[11px] text-(--text-3)">
                      {currentCourses.length} {t('dashSubjectUnit')}
                  </span>

                  <span className="text-[11px] font-bold text-(--text-1)">
                    {t('dashTotalCredits')} <span className="tabular-nums">
                      {sumCredits(currentCourses)}</span>{t('dashCreditsUnit')}
                  </span>
                </div>
              </div>
            </div>

            {/* 시간표 블럭 */}
            <div className="bg-(--surface) rounded-xl border border-(--border)
                            overflow-hidden flex flex-col flex-1"
                style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-3.5 py-3 border-b border-(--border) flex
                            justify-between items-center shrink-0">
                <span className="font-bold text-[13px]">{t('dashScheduleCard')}</span>

                { /* 전체보기 버튼 @ */ }
                <button
                  onClick={onGoTimetable}
                  className="text-[10px] font-medium text-(--text-2)
                                  border border-(--border) rounded-lg
                                  px-2 py-0.5 hover:bg-(--surface-2) transition-colors">
                  {t('viewAll')}
                </button>
              </div>
              <div className="p-3 flex flex-col flex-1 min-h-0">
                <div className="grid grid-cols-5 gap-0.5 text-center text-[9px] font-bold
                                text-(--text-3) mb-1 shrink-0">
                  {[t('dashDayMon'),t('dashDayTue'),t('dashDayWed'),t('dashDayThu'),t('dashDayFri')].map(d => <div key={d}>{d}</div>)}
                </div>

                {/* 시간표 데이터 — Timetable API 연결
                    DB col: 2~6(월~금), 대시보드 grid는 1~5이므로 col-1 로 조정 */}
                <div className="grid gap-0.5 flex-1 min-h-45"
                    style={{ gridTemplateColumns: 'repeat(5,1fr)',
                              gridTemplateRows: 'repeat(8,1fr)' }}>
                  {dashBlocks.length === 0 && (
                    <div className="col-span-5 flex items-center justify-center
                                    text-[10px] text-(--text-3)">
                      {t('dashNoClasses')}
                    </div>
                  )}
                  {dashBlocks.map(b => (
                    <div key={b.id}
                        className="rounded-lg text-[10px] whitespace-nowrap
                                   leading-tight px-1.5 py-1"
                        style={{
                          gridColumn: b.col - 1,
                          gridRow: b.grid_row,
                          background: `var(--timetable-${dashColorMap[b.name]}-bg)`,
                          border: `1px solid var(--timetable-${dashColorMap[b.name]}-bd)`,
                          color: `var(--timetable-${dashColorMap[b.name]}-text)`,
                        }}>
                      <b>{b.name}</b><br/>
                      <span style={{ opacity: .7 }}>{b.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div> {/* #2열+3열 wrapper 닫기 */}

      </div>

      {/* ## 학점 이수 현황 (임시, 하드코딩) */}
      <div className="bg-(--surface) rounded-xl border card-enter stagger-3
                      border-(--border) overflow-hidden mt-3.5"
           style={{ boxShadow: 'var(--shadow-card)' }}>

        {/* 학점 이수 현황 상단 바 */}
        <div className="px-4.5 py-3 border-b border-(--border)
                        flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[13px]">{t('dashCreditsStatus')}</span>
            <span className="text-[11px] text-(--text-2)">{t('dashTotalEarned')}</span>
            <span className="text-xl font-bold tabular-nums text-(--text-1)"
                  style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif",
                           letterSpacing: '-.01em' }}>{earnedTotal}</span>
            <span className="text-[11px] text-(--text-3)">/ {gradTotal || '-'} {t('dashCreditsUnit')}</span>
            <div className="w-20 h-1.5 rounded-full bg-(--bar-track) overflow-hidden">
              <div className="h-full rounded-full bg-(--bar)"
                   style={{ width: gradPct + '%' }}/>
            </div>
          </div>
        </div>

        <div className="p-4.5 flex flex-col gap-5">

          {/* ##1 전공학점 */}
          <div>

            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-(--text-1) inline-block"/>
                <span className="text-[12px] font-bold">{t('dashMajorCredits')}</span>
                <span className="text-lg font-bold tabular-nums text-(--text-1)"
                      style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                  {majorEarned}
                </span>
                <span className="text-[10px] text-(--text-3)">/ {majorReqTotal || '-'} {t('dashCreditsUnit')}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold
                               bg-(--warn-bg) text-(--warn-text) border border-(--border)">
                {majorReqTotal ? (majorReqTotal - majorEarned) + t('dashRemainSuffix') : t('dashNoGradReq')}
              </span>
            </div>

            {/* ##1-1, ##1-2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { key: '전공선택', label: t('catElectMajor'), earned: majorSelEarned, required: majorReqSel || 54 },
                { key: '전공필수', label: t('catReqMajor'),   earned: majorFilEarned, required: majorReqFil || 31 },
              ].map(row => (
                <div key={row.key}>
                  <div className="flex justify-between text-[10px]
                                  text-(--text-2) mb-1.5">
                    <span>{row.label}</span>
                    <span>{row.earned}/{row.required} {t('dashCreditsUnit')}</span>
                  </div>
                  <div className="h-6 rounded-full bg-(--bar-track) overflow-hidden">
                    <div className="h-full rounded-full bg-(--bar)"
                         style={{ width: row.required > 0 ? Math.min(100, Math.round(row.earned / row.required * 100)) + '%' : '0%' }}/>
                  </div>
                  <p className="text-[9px] text-(--text-3) mt-1">
                    {Math.max(0, row.required - row.earned)}{t('dashRemainSuffix')}
                  </p>
                </div>
              ))}
            </div>

          </div>

          {/* ##2 교양학점 Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">

              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-(--text-2) inline-block"/>
                <span className="text-[12px] font-bold">{t('dashLiberalCr')}</span>
                <span className="text-lg font-bold tabular-nums text-(--text-1)"
                      style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                      &nbsp; {liberalEarned}
                </span>
                <span className="text-[10px] text-(--text-3)">/ {liberalReqTotal} {t('dashCreditsUnit')}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold
                               bg-(--badge-neutral-bg) text-(--badge-neutral-text)
                               border border-(--border)">
                {Math.max(0, liberalReqTotal - liberalEarned)}{t('dashRemainSuffix')}
              </span>

            </div>

            {/* 교양학점 table (area별 동적 계산 — 기준학점은 사용자 설정 예정) */}
            <div className="rounded-lg border border-(--border) overflow-hidden">
              <div className="grid text-[10px] font-semibold text-(--text-3)
                              px-3.5 py-2 bg-(--surface-2)"
                   style={{ gridTemplateColumns: '1fr 56px' }}>
                <span>{t('dashArea')}</span>
                <span className="text-right">{t('dashEarned')}</span>
              </div>

              {Object.entries(liberalAreaMap).map(([area, earned]) => (
                <div key={area}
                     className="grid items-center px-3.5 py-2 border-t
                                border-(--border) text-[11px]"
                     style={{ gridTemplateColumns: '1fr 56px' }}>
                  <span className="text-(--text-1)">{area}</span>
                  <span className="text-right font-bold tabular-nums text-(--text-1)">
                    {earned}
                  </span>
                </div>
              ))}

              {Object.keys(liberalAreaMap).length === 0 && (
                <div className="px-3.5 py-3 text-center text-[11px] text-(--text-3)">
                  {t('noData')}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>

    {/* == 엑셀 업로드 팝업 (데이터 없을 때 강제 표시 & 헤더 재업로드 버튼으로도 열림) == */}
    <ExcelUploadPopup
      open={uploadOpen}
      onSuccess={() => { onReuploadDone?.(); loadData(); }}
      onClose={reuploadOpen ? onReuploadDone : undefined}
    />

    {/* == 학기 추가 팝업 == */}
    <Popup open={addSemOpen} onClose={() => setAddSemOpen(false)} width="460px">
      <PopupHeader
        title={<><Calendar size={14} className="text-(--accent)"/> {t('dashAddSem')}</>}
        onClose={() => setAddSemOpen(false)}
      />

      <div className="px-4.5 py-4 flex flex-col gap-4">
        {/* 학기 입력 — 연도 숫자 입력 + 학기 구분 select */}
        <div>
          <p className="block text-[11px] font-semibold text-(--text-2) mb-1.5">
            {t('dashSemGrades')} <span className="font-normal text-(--text-3)">(e.g. 2025 {t('dashSem1')})</span>
          </p>

          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={newSemYear}
              onChange={e => setNewSemYear(e.target.value)}
              placeholder="2025"
              min={2000}
              max={2050}
              className="w-24 px-3 py-1.5 text-[13px] rounded-lg
                         bg-(--surface) border border-(--border) text-(--text-1)
                         focus:outline-none focus:border-(--text-2) transition-colors"
            />
            <span className="text-[12px] text-(--text-3)">{t('dashYearUnit')}</span>
            <select
              value={newSemTerm}
              onChange={e => setNewSemTerm(e.target.value as '1'|'2'|'summer'|'winter')}
              className="px-3 py-1.5 text-[13px] rounded-lg bg-(--surface) border
                         border-(--border) text-(--text-1) focus:outline-none cursor-pointer">
              <option value="1">{t('dashSem1')}</option>
              <option value="2">{t('dashSem2')}</option>
              <option value="summer">{t('dashSummer')}</option>
              <option value="winter">{t('dashWinter')}</option>
            </select>
          </div>

        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold text-(--text-2)">
              {t('dashCoursesHeader')} <span className="font-normal text-(--text-3)">({t('dashOptional')})</span>
            </label>

            {/* 과목 추가 버튼 */}
            <button
              onClick={() => setNewSemCourses([...newSemCourses, {
                name: '', category: '전공필수', credit: '3', grade: '' }
              ])}
              className="flex items-center gap-1 text-[10px] font-medium text-(--text-2)
                         border border-(--border) rounded-lg px-2 py-0.5
                         hover:bg-(--surface-2) transition-colors">
              {t('addCourse')}
            </button>
          </div>

          <div className="grid text-[10px] text-(--text-3) px-0.5 mb-1"
               style={{ gridTemplateColumns: '1fr 96px 48px 60px 22px', gap: '0 5px' }}>
            <span>{t('dashCourseName')}</span><span>{t('dashType')}</span><span className="text-center">{t('dashCredits')}</span><span className="text-center">{t('dashGrade')}</span><span/>
          </div>

          {/* 인풋 필드 @ */}
          <div className="flex flex-col gap-1.5">
            {newSemCourses.map((c, i) => (
              <div key={i} className="grid gap-1.5 items-center"
                   style={{ gridTemplateColumns: '1fr 96px 48px 60px 22px' }}>

                {/* 과목명 */}
                <input
                  value={c.name}
                  onChange={e => setNewSemCourses(newSemCourses.map((x, j) => j === i
                    ? { ...x, name: e.target.value }
                    : x ))}
                  placeholder={t('dashCourseName')}
                  className="px-2 py-1 text-[11px] rounded-lg
                             bg-(--surface) border border-(--border)
                             text-(--text-1) focus:outline-none
                             focus:border-(--text-2) transition-colors"
                />

                {/* 구분(필드) */}
                <select
                  value={c.category}
                  onChange={e => setNewSemCourses(newSemCourses.map((x, j) => j === i
                    ? { ...x, category: e.target.value }
                    : x ))}
                  className="px-2 py-1 text-[11px] rounded-lg bg-(--surface) border
                             border-(--border) text-(--text-1) focus:outline-none cursor-pointer">
                  {['전공필수','전공선택','교양필수','교양선택'].map(o => <option key={o} value={o}>{catLabel[o]}</option>)}
                </select> {/* 연결 해야함 @ (아마도 key === field 로 매핑해서 추가할듯.) */}

                {/* 학점 */}
                <input
                  value={c.credit}
                  onChange={e => setNewSemCourses(newSemCourses.map((x, j) => j === i
                    ? { ...x, credit: e.target.value }
                    : x ))}
                  placeholder="3"
                  className="px-2 py-1 text-[11px] text-center rounded-lg bg-(--surface) border
                             border-(--border) text-(--text-1) focus:outline-none
                             focus:border-(--text-2) transition-colors"
                />

                {/* 성적 */}
                <select
                  value={c.grade}
                  onChange={e => setNewSemCourses(newSemCourses.map((x, j) => j === i
                    ? { ...x, grade: e.target.value }
                    : x ))}
                  className="px-2 py-1 text-[11px] rounded-lg bg-(--surface) border
                             border-(--border) text-(--text-1) focus:outline-none cursor-pointer">
                  <option value="">-</option>
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => setNewSemCourses(newSemCourses.filter((_, j) => j !== i))}
                  className="text-(--text-3) hover:text-red-400
                  transition-colors text-[16px] leading-none">
                  ×
                </button>

              </div>
            ))}

            {newSemCourses.length === 0 && (
              <p className="text-[11px] text-(--text-3) text-center py-3">
                {t('dashAddCourseHint')}
              </p>
            )}

          </div>

        </div>
      </div>

      <PopupFooter>
        <button onClick={() => setAddSemOpen(false)}
                className="px-4 py-1.5 rounded-lg text-[12px]
                           border border-(--border)
                           text-(--text-2) hover:bg-(--surface-2) transition-colors">
          {t('cancel')}
        </button>

        <button
          onClick={saveSemester}
          className="px-4 py-1.5 rounded-lg text-[12px] font-semibold
                     bg-(--text-1) text-(--surface)
                     hover:opacity-85 transition-opacity">
          {t('save')}
        </button>
      </PopupFooter>
    </Popup>

    {/* == 목표 GPA 수정 팝업 == */}
    <Popup open={editTargetOpen} onClose={() => setEditTargetOpen(false)} width="320px">
      <PopupHeader title={t('dashEditTargetGPA')} onClose={() => setEditTargetOpen(false)} />

      <div className="px-4.5 py-4">
        <label className="block text-[11px] font-semibold text-(--text-2) mb-1.5">
          {t('dashTargetGPA')}
        </label>
        <input
          type="number"
          min={0}
          max={4.5}
          step={0.01}
          value={targetInput}
          onChange={e => setTargetInput(e.target.value)}
          className="w-full px-3 py-2 text-[13px] rounded-lg
                     bg-(--surface) border border-(--border) text-(--text-1)
                     focus:outline-none focus:border-(--text-2) transition-colors"
        />
        <p className="text-[10px] text-(--text-3) mt-1">
          {t('dashGPARange')}</p>
      </div>

      <PopupFooter>
        <button onClick={() => setEditTargetOpen(false)}
                className="px-4 py-1.5 rounded-lg text-[12px]
                           border border-(--border)
                           text-(--text-2) hover:bg-(--surface-2) transition-colors">
          {t('cancel')}
        </button>
        <button
          onClick={saveTargetGpa}
          className="px-4 py-1.5 rounded-lg text-[12px] font-semibold
                     bg-(--text-1) text-(--surface)
                     hover:opacity-85 transition-opacity">
          {t('save')}
        </button>
      </PopupFooter>
    </Popup>
    </>
  );
}

export default Dashboard;

import { API_BASE } from '../../../api';
import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, BarChart2, FileText,
         RefreshCw, Lightbulb, KeyRound, Sparkles, MapPin,
         MessageSquare, Globe } from 'lucide-react';
import { useGradeData } from '../../../hooks/useGradeData';
import { calcGpa, semLabel } from './dashHelper';
import { useLang } from '../../../LangContext';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement,
         CategoryScale, LinearScale, Tooltip } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

// CSS 변수 실제 색상값 읽기 (Chart.js canvas는 CSS var 직접 안됨)
function getCss(name: string) {
  return getComputedStyle(document.documentElement)
         .getPropertyValue(name).trim();
}

// AI 분석 응답 타입
interface AiResult {
  summary:           string;
  strength:          { title: string; description: string };
  improvement:       { title: string; description: string };
  graduationOutlook: { title: string; description: string };
  strategies:        string[];
  career:            { title: string; fields: string[]; description: string };
  report:            { title: string; content: string }[];
  consultation?:     { question: string; answer: string };
}


function AiAnalysis() {

  const { semesters, courses } = useGradeData();
  const { t } = useLang();

  // Groq API 키 (localStorage 유지)
  const [apiKey,      setApiKey]      = useState(() => localStorage.getItem('groq_key') || '');
  const [keyInput,    setKeyInput]    = useState('');
  const [showKeyForm, setShowKeyForm] = useState(false);

  // 상담 내용 입력
  const [question,     setQuestion]     = useState('');
  const [showQuestion, setShowQuestion] = useState(false);

  // AI 응답 언어 선택 (UI 언어와 별개)
  const [aiLang, setAiLang] = useState<'ko' | 'en'>('ko');

  // 분석 결과 + 상태
  const [result,       setResult]       = useState<AiResult | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState(
    () => localStorage.getItem('ai_last_analyzed') || ''
  );

  // 마운트 시 저장된 분석 결과 자동 로드
  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch(`${API_BASE}/api/ai/saved`, {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setResult(data.result);
        if (data.lang) setAiLang(data.lang);
        if (data.question) setQuestion(data.question);
        const date = new Date(data.analyzed_at).toLocaleDateString('ko-KR');
        setLastAnalyzed(date);
        localStorage.setItem('ai_last_analyzed', date);
      })
      .catch(() => {});
  }, []);

  // 키 저장
  function saveKey() {
    const k = keyInput.trim();
    if (!k) return;
    localStorage.setItem('groq_key', k);
    setApiKey(k);
    setKeyInput('');
    setShowKeyForm(false);
  }

  // 분석 실행
  async function analyze() {
    if (!apiKey) { setShowKeyForm(true); return; }
    setResult(null); // 재분석 시 초기화 → 처음처럼 보임
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const params = new URLSearchParams({ lang: aiLang });
      if (question.trim()) params.append('question', question.trim());

      const res = await fetch(`${API_BASE}/api/ai/analyze?${params}`, {
        headers: {
          Authorization: 'Bearer ' + token,
          'x-ai-key': apiKey,
        },
      });
      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || '분석 실패');
      }
      const data: AiResult = await res.json();
      setResult(data);
      const now = new Date().toLocaleDateString('ko-KR');
      setLastAnalyzed(now);
      localStorage.setItem('ai_last_analyzed', now);
    } catch (e: any) {
      setError(e.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // 차트 데이터 — semester.gpa 컬럼 대신 courses에서 직접 계산
  const semBars = semesters
    .map((s, i) => {
      const semCourses = courses.filter(c => c.semester_id === s.id);
      const gpa = calcGpa(semCourses);
      return gpa !== null ? {
        label: i === semesters.length - 1 ? t('aiCurrentSem') : semLabel(s, t),
        gpa,
      } : null;
    })
    .filter((b): b is { label: string; gpa: number } => b !== null);

  const avgGPA = semBars.length
    ? semBars.reduce((a, s) => a + s.gpa, 0) / semBars.length
    : 0;


  return (
    <div className="p-6 pb-15 w-full">

      {/* 헤더 — flex-wrap으로 좁은 화면 대응 */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="w-7 h-7 rounded-lg bg-(--accent) flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <p className="text-[16px] font-extrabold text-(--text-1) whitespace-nowrap"
               style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
              {t('aiTitle')}
            </p>
            {lastAnalyzed && (
              <span className="text-[10px] text-(--text-3) bg-(--surface-2) px-2 py-0.5 rounded whitespace-nowrap">
                {t('aiLastAnalyzed')}{lastAnalyzed}
              </span>
            )}
          </div>
          <p className="text-[11px] text-(--text-3) ml-9">
            {t('aiSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* AI 응답 언어 토글 */}
          <div className="flex items-center bg-(--surface-2) rounded-lg border border-(--border) p-0.5 shrink-0">
            <button
              onClick={() => setAiLang('ko')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap
                ${aiLang === 'ko'
                  ? 'bg-(--surface) text-(--text-1) shadow-sm'
                  : 'text-(--text-3) hover:text-(--text-2)'}`}>
              KO
            </button>
            <button
              onClick={() => setAiLang('en')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap
                ${aiLang === 'en'
                  ? 'bg-(--surface) text-(--text-1) shadow-sm'
                  : 'text-(--text-3) hover:text-(--text-2)'}`}>
              EN
            </button>
          </div>

          {/* 상담 버튼 */}
          <button
            onClick={() => setShowQuestion(!showQuestion)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] border transition-colors whitespace-nowrap shrink-0
              ${question.trim()
                ? 'border-(--accent) text-(--accent) bg-(--accent-bg)'
                : 'border-(--border) text-(--text-3) hover:bg-(--surface-2)'}`}>
            <MessageSquare size={11} />
            {question.trim() ? t('aiConsultSet') : t('aiConsultBtn')}
          </button>

          {/* 키 설정 버튼 */}
          <button
            onClick={() => { setShowKeyForm(!showKeyForm); setKeyInput(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px]
                        border transition-colors whitespace-nowrap shrink-0
              ${apiKey
                ? 'border-(--border) text-(--text-3) hover:bg-(--surface-2)'
                : 'border-(--accent) text-(--accent) bg-(--accent-bg)'}`}>
            <KeyRound size={11} />
            {apiKey ? t('aiChangeKey') : t('aiNeedKey')}
          </button>

          {/* 분석 버튼 */}
          <button
            onClick={analyze}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold
                       bg-(--text-1) text-(--surface) hover:opacity-85 transition-opacity
                       disabled:opacity-50 whitespace-nowrap shrink-0">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            {loading ? t('aiAnalyzing') : result ? t('aiReanalyze') : t('aiStart')}
          </button>
        </div>
      </div>

      {/* 상담 내용 입력 */}
      {showQuestion && (
        <div className="mb-4 bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
             style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="px-3.5 py-2.5 border-b border-(--border) flex items-center gap-1.5">
            <MessageSquare size={12} className="text-(--accent)" />
            <span className="text-[12px] font-semibold text-(--text-1)">{t('aiConsultTitle')}</span>
            <span className="text-[10px] text-(--text-3) ml-1">{t('aiConsultNote')}</span>
          </div>
          <div className="p-3">
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={t('aiConsultPh')}
              rows={3}
              className="w-full text-[12px] bg-transparent outline-none text-(--text-1)
                         placeholder:text-(--text-3) resize-none leading-relaxed"
            />
            {question.trim() && (
              <div className="flex justify-end mt-1">
                <button
                  onClick={() => setQuestion('')}
                  className="text-[10px] text-(--text-3) hover:text-(--text-2)">
                  {t('aiClear')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* API 키 입력 폼 */}
      {showKeyForm && (
        <div className="mb-4 p-3.5 bg-(--surface) rounded-xl border border-(--border) flex gap-2 items-center"
             style={{ boxShadow: 'var(--shadow-card)' }}>
          <KeyRound size={13} className="text-(--text-3) shrink-0" />
          <input
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveKey(); }}
            placeholder={t('aiKeyPh')}
            type="password"
            className="flex-1 text-[12px] bg-transparent outline-none text-(--text-1)
                       placeholder:text-(--text-3)"
          />
          <button
            onClick={saveKey}
            className="px-3 py-1 text-[11px] font-semibold rounded-lg
                       bg-(--text-1) text-(--surface) hover:opacity-85 transition-opacity">
            {t('save')}
          </button>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-(--warn-bg) text-(--warn-text) text-[12px]">
          {error}
        </div>
      )}

      {/* 분석 전 안내 */}
      {!result && !loading && (
        <div className="mb-4 p-5 bg-(--surface) rounded-xl border border-(--border) text-center"
             style={{ boxShadow: 'var(--shadow-card)' }}>
          <Sparkles size={28} className="text-(--text-3) mx-auto mb-2" strokeWidth={1.5}/>
          <p className="text-[13px] font-semibold text-(--text-2) mb-1">
            {apiKey ? t('aiPressStart') : t('aiEnterKey')}
          </p>
          <p className="text-[11px] text-(--text-3)">
            {t('aiDesc')}
          </p>
          {apiKey && (
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-[10px] text-(--text-3)">
                <Globe size={10} />
                {t('aiRespLang')} <b className="text-(--text-2)">{aiLang === 'ko' ? t('aiLangKo') : 'English'}</b>
              </div>
              {question.trim() && (
                <div className="flex items-center gap-1.5 text-[10px] text-(--accent)">
                  <MessageSquare size={10} />
                  {t('aiConsultIncluded')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="mb-4 p-8 bg-(--surface) rounded-xl border border-(--border) text-center"
             style={{ boxShadow: 'var(--shadow-card)' }}>
          <RefreshCw size={24} className="text-(--accent) mx-auto mb-2 animate-spin"/>
          <p className="text-[13px] text-(--text-2)">{t('aiAnalyzingMsg')}</p>
          <p className="text-[11px] text-(--text-3) mt-1">{t('aiWaitMsg')}</p>
        </div>
      )}

      {/* 분석 결과 */}
      {result && (
        <>
          {/* 요약 3카드 */}
          <div className="grid md:grid-cols-3 gap-3 mb-4 card-enter">
            <div className="bg-(--surface) rounded-xl border border-(--border) p-3.5"
                 style={{ boxShadow:'var(--shadow-card)', borderLeft:'3px solid var(--accent)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={14} className="text-(--accent)"/>
                <span className="text-[11px] font-bold text-(--accent)">
                  {t('aiStrength')}
                </span>
              </div>
              <p className="text-[12px] font-semibold text-(--text-1) mb-1">{result.strength.title}</p>
              <p className="text-[10px] text-(--text-3) leading-relaxed">{result.strength.description}</p>
            </div>

            {result.improvement && (
            <div className="bg-(--surface) rounded-xl border border-(--border) p-3.5"
                 style={{ boxShadow:'var(--shadow-card)', borderLeft:'3px solid var(--badge-neutral-text)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle size={14} style={{ color:'var(--badge-neutral-text)' }}/>
                <span className="text-[11px] font-bold" style={{ color:'var(--badge-neutral-text)' }}>
                  {t('aiImprovement')}
                </span>
              </div>
              <p className="text-[12px] font-semibold text-(--text-1) mb-1">{result.improvement.title}</p>
              <p className="text-[10px] text-(--text-3) leading-relaxed">{result.improvement.description}</p>
            </div>
            )}

            <div className="bg-(--surface) rounded-xl border border-(--border) p-3.5"
                 style={{ boxShadow:'var(--shadow-card)', borderLeft:'3px solid var(--navy)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart2 size={14} style={{ color:'var(--navy)' }}/>
                <span className="text-[11px] font-bold" style={{ color:'var(--navy)' }}>
                  {t('aiGraduation')}
                </span>
              </div>
              <p className="text-[12px] font-semibold text-(--text-1) mb-1">{result.graduationOutlook.title}</p>
              <p className="text-[10px] text-(--text-3) leading-relaxed">{result.graduationOutlook.description}</p>
            </div>
          </div>

          {/* 메인 2열 */}
          <div className="grid grid-cols-1 sm:grid-cols-[1.3fr_1fr] gap-3.5 min-w-0">

            {/* 1열: GPA 차트 + 학습전략 */}
            <div className="flex flex-col gap-3.5 min-w-0 overflow-hidden card-enter stagger-1">

              {/* GPA 막대 차트 */}
              <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
                   style={{ boxShadow:'var(--shadow-card)' }}>
                <div className="px-4 py-3 border-b border-(--border)">
                  <span className="font-bold text-[13px] flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-(--accent)"/>
                    {t('aiGpaTrend')}
                  </span>
                </div>
                <div className="px-4 pb-3 pt-3">
                  <div style={{ height: 80 }} className="w-full overflow-hidden">
                    {semBars.length > 0 ? (
                      <Bar
                        data={{
                          labels: semBars.map(s => s.label),
                          datasets: [{
                            data: semBars.map(s => s.gpa),
                            backgroundColor: semBars.map((_, i) =>
                              i === semBars.length - 1
                                ? getCss('--accent')
                                : getCss('--accent') + '99'
                            ),
                            borderRadius: 3,
                            borderSkipped: false,
                            barPercentage: 0.4,
                            categoryPercentage: 0.8,
                          }],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false }, tooltip: { enabled: false } },
                          scales: {
                            y: { display: false, min: 2.0, max: 5.0 },
                            x: {
                              grid: { display: false },
                              ticks: { font: { size: 9 }, color: getCss('--text-3') },
                            },
                          },
                        }}
                        plugins={[{
                          id: 'topLabel',
                          afterDatasetsDraw(chart) {
                            const { ctx, data } = chart;
                            ctx.save();
                            data.datasets[0].data.forEach((val, i) => {
                              const meta = chart.getDatasetMeta(0);
                              const bar  = meta.data[i];
                              ctx.fillStyle = getCss('--text-2');
                              ctx.font = 'bold 9px Inter, sans-serif';
                              ctx.textAlign = 'center';
                              ctx.fillText((val as number).toFixed(2), bar.x, bar.y - 4);
                            });
                            ctx.restore();
                          },
                        }]}
                      />
                    ) : (
                      <p className="text-[11px] text-(--text-3) text-center py-6">{t('aiNoGradeData')}</p>
                    )}
                  </div>
                  <p className="text-[10px] text-(--text-3) mt-1.5 text-center">
                    {t('aiGpaLabel')}{' '}
                    <b className="text-(--accent)">{avgGPA.toFixed(2)}</b>
                  </p>
                </div>
              </div>

              {/* AI 학습 전략 */}
              <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden flex-1"
                   style={{ boxShadow:'var(--shadow-card)' }}>
                <div className="px-3.5 py-2.5 border-b border-(--border)">
                  <span className="font-bold text-[12px] text-(--text-1) flex items-center gap-1.5">
                    <Lightbulb style={{ color: 'var(--accent)' }} size={14}/>
                    {t('aiStudyStrat')}
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  {result.strategies.map((tip, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="w-4.5 h-4.5 bg-(--accent-bg) rounded
                                       flex items-center justify-center shrink-0 mt-0.5
                                       text-[9px] font-bold text-(--accent)">
                        {i + 1}
                      </span>
                      <p className="text-[10px] text-(--text-2) leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2열: 진로 추천 + 졸업전망 */}
            <div className="flex flex-col gap-3.5 min-w-0 card-enter stagger-2">

              {/* 진로 추천 */}
              <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
                   style={{ boxShadow:'var(--shadow-card)' }}>
                <div className="px-3.5 py-2.5 border-b border-(--border) bg-(--accent-bg)
                                flex items-center gap-1.5">
                  <MapPin size={12} className="text-(--accent)"/>
                  <span className="font-bold text-[12px] text-(--accent)">
                    {t('aiCareer')}
                  </span>
                </div>
                <div className="p-3.5">
                  <p className="text-[12px] font-semibold text-(--text-1) mb-2">{result.career.title}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {result.career.fields.map(f => (
                      <span key={f}
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold
                                       bg-(--accent-bg) text-(--accent)">
                        {f}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-(--text-3) leading-relaxed">{result.career.description}</p>
                </div>
              </div>

              {/* 졸업 전망 상세 */}
              <div className="bg-(--surface) rounded-xl border border-(--border) overflow-hidden flex-1"
                   style={{ boxShadow:'var(--shadow-card)' }}>
                <div className="px-3.5 py-2.5 border-b border-(--border)">
                  <span className="font-bold text-[12px] text-(--text-1) flex items-center gap-1.5">
                    <BarChart2 style={{ color: 'var(--accent)'}} size={12}/>
                    {t('aiGradOutlook')}
                  </span>
                </div>
                <div className="p-3.5">
                  <p className="text-[11px] font-semibold text-(--text-1) mb-1.5">
                    {result.graduationOutlook.title}
                  </p>
                  <p className="text-[10px] text-(--text-3) leading-relaxed">
                    {result.graduationOutlook.description}
                  </p>
                  <div className="mt-3 px-3 py-2 bg-(--accent-bg) rounded-lg">
                    <p className="text-[10px] text-(--text-2) leading-relaxed">{result.summary}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 상담 답변 카드 (상담 입력 시에만 표시) */}
          {result.consultation && (
            <div className="mt-3.5 rounded-xl border overflow-hidden"
                 style={{ boxShadow:'var(--shadow-card)',
                          borderColor: 'var(--accent)',
                          background: 'var(--accent-bg)' }}>
              <div className="px-4 py-3 border-b flex items-center gap-2"
                   style={{ borderColor: 'var(--accent)', background: 'var(--accent-bg)' }}>
                <MessageSquare size={14} className="text-(--accent)" />
                <span className="font-bold text-[13px] text-(--accent)">
                  {t('aiConsultResp')}
                </span>
              </div>
              <div className="p-4 bg-(--surface)">
                <div className="mb-3 px-3 py-2 rounded-lg bg-(--accent-bg) border border-(--accent)/30">
                  <p className="text-[10px] text-(--text-3) mb-0.5">
                    {t('aiQuestion')}
                  </p>
                  <p className="text-[12px] text-(--text-1) font-medium leading-relaxed">
                    {result.consultation.question}
                  </p>
                </div>
                <p className="text-[11px] text-(--text-2) leading-relaxed">
                  {result.consultation.answer}
                </p>
              </div>
            </div>
          )}

          {/* AI 종합 분석 리포트 */}
          <div className="mt-3.5 bg-(--surface) rounded-xl border border-(--border) overflow-hidden"
               style={{ boxShadow:'var(--shadow-card)' }}>
            <div className="px-4 py-3 border-b border-(--border)">
              <span className="font-bold text-[13px] text-(--text-1) flex items-center gap-1.5">
                <FileText style={{ color: 'var(--accent)', margin: '3px'}} size={14}/>
                {t('aiReport')}
              </span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {result.report.map((sec, i) => (
                <div key={i}
                     className="p-4 border border-(--border) rounded-xl hover:shadow-md transition-all">
                  <h3 className="font-bold text-(--text-1) mb-2 text-[13px] flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-(--accent-bg) text-(--accent)
                                     flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    {sec.title}
                  </h3>
                  <p className="text-[11px] text-(--text-2) leading-relaxed">{sec.content}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default AiAnalysis;




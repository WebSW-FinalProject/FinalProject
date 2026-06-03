
import { useState } from 'react';
import { TrendingUp, AlertCircle, BarChart2, CheckCircle, FileText,
         RefreshCw, Star, Check, Lightbulb } from 'lucide-react';
import { mockSemesters } from '../../../data/mock';


import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, 
          CategoryScale, LinearScale, Tooltip } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

// CSS 변수 실제 색상값 읽기 (Chart.js canvas는 CSS var 직접 안됨)
function getCss(name: string) {
  return getComputedStyle(document.documentElement)
         .getPropertyValue(name).trim();
}

// AI API에서 나올 데이터들은 모두 하드코딩으로 유지!
// 일부만 변수화한 후 나중에 기능연결 후 마무리

// AI 수강 추천 (임시, 하드코딩)
const AI_RECOMMEND = [
  { name: '컴퓨터 네트워크',  field: '전공필수 3학점', rec: '강력 추천', highlight: true },
  { name: '운영체제',         field: '전공필수 3학점', rec: '추천',     highlight: true },
  { name: '소프트웨어공학',   field: '전공선택 · 3학점', rec: '관심',   highlight: false},
  { name: '영어회화(심화)',   field: '교양선택 · 2학점',  rec: '여유',  highlight: false},
]; // 강의명, 강의 분야 및 학점, 추천도*UI표기강약 => 엑셀 데이터 형식에 따라 바뀔 수 있는 구조..


function AiAnalysis() {
  const [refreshing, setRefreshing] = useState(false); // 분석 새로고침 상태 관리
  const finishedSems = mockSemesters.filter(s => s.gpa !== null); // 성적입력 완료 학기

  let sum = 0;
  for (const sem of finishedSems) {
    sum += sem.gpa!; 
  }
  const avgGPA = finishedSems.length > 0 
                 ? sum / finishedSems.length : 0;
    
    // 학기별 막대 데이터 (mock 연결)
    const semBars = finishedSems.map((s, i) => {
      const MIN_GPA = 2.0; 
      const MAX_GPA = 4.5;
      const refineGpa = Math.max(MIN_GPA, Math.min(MAX_GPA, s.gpa!));
            // if문 대신 간단하게 최대최소 함수로 범위 제한 : s.gpa: MIN~MAX

      const pct = Math.round(((refineGpa - MIN_GPA) / (MAX_GPA - MIN_GPA)) * 100);
            // x축 범위를 조정해서 보통 학점대인 2.0~4.5 사이를 보여주도록 조정..
            // 차트용 비율이라고 생각하면 쉬움

      return {
        label: `${Math.floor(i / 2) + 1}-${(i % 2) + 1}`,
                // i=0 → 1-1, i=1 → 1-2, ... (학기)
        gpa: s.gpa!, // filter로 null 이미 제거함
        pct: pct,    // 보여줄 범위
        isCurrent: i === finishedSems.length - 1, // 현재 요소 
      };
    });

  
  function handleRefresh() { // 새로고침 상태관리 (프론트. not back.)
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
    // setTimeout(()=> A동작, ms) => 실행할 함수, 대기시간
    // 비동기 처리. setTimeout = Web API 에서 처리
    // setTimeout  만나면, ms=1000 인 경우, 1초 뒤에 A동작 실행함.
    // 1초 지난 후에는 브라우저가(Web) 다시 JS(TS) 로 실행 함수 돌려줌.
  }

  return (
    <div className="p-6 pb-15 w-full ">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            
            <div className="w-7 h-7 rounded-lg bg-(--accent) flex 
                            items-center justify-center">
              <AlertCircle size={14} className="text-white" />
            </div>

            <p className="text-[16px] font-extrabold text-(--text-1)"
               style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
              AI 성적분석
            </p>
            <span className="text-[10px] text-(--text-3) bg-(--surface-2) 
                              px-2 py-0.5 rounded">
              마지막 분석 2025-06-01
            </span>
          </div>

          <p className="text-[11px] text-(--text-3) ml-9">
            이문세 님의 학업 데이터를 기반으로 분석되었습니다
          </p>
        </div>

        {/* 분석 새로고침 구현 필요 @ */}
        <button onClick={handleRefresh}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold
                           bg-(--text-1) text-(--surface) hover:opacity-85 transition-opacity">
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> 
          {/* 새로고침 버튼 애니메이션만 해둠 */}
          분석 새로고침
        </button>
      </div>

      {/* 요약 3카드 (강점, 개선, 졸업전망 => 백 구현하면서 재고하기) */}
      <div className="grid md:grid-cols-3 gap-3 mb-4">

        <div className="bg-(--surface) rounded-xl border border-(--border) p-3.5"
             style={{ boxShadow:'var(--shadow-card)', 
                      borderLeft:'3px solid var(--accent)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={14} className="text-(--accent)"/>
            <span className="text-[11px] font-bold text-(--accent)">강점</span>
          </div>
          <p className="text-[12px] font-semibold text-(--text-1) mb-1">
            전공 이론 과목 우수
          </p>
          <p className="text-[10px] text-(--text-3) leading-relaxed">
            자료구조, 알고리즘 등 이론 과목에서 꾸준히 A등급 이상을 유지하고 있습니다.
          </p>
        </div>

        <div className="bg-(--surface) rounded-xl border border-(--border) p-3.5"
             style={{ boxShadow:'var(--shadow-card)', 
                      borderLeft:'3px solid var(--badge-neutral-text)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle size={14} style={{ color:'var(--badge-neutral-text)' }}/>
            <span className="text-[11px] font-bold" style={{ color:'var(--badge-neutral-text)' }}>
              개선 포인트
            </span>
          </div>
          <p className="text-[12px] font-semibold text-(--text-1) mb-1">
            실험·실습 과목 보강 필요
          </p>
          <p className="text-[10px] text-(--text-3) leading-relaxed">
            실습 위주 과목의 평균이 이론 과목 대비 0.4점 낮습니다. 병행 학습을 권장합니다.
          </p>
        </div>

        <div className="bg-(--surface) rounded-xl border border-(--border) p-3.5"
             style={{ boxShadow:'var(--shadow-card)', 
                      borderLeft:'3px solid var(--navy)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart2 size={14} style={{ color:'var(--navy)' }}/>
            <span className="text-[11px] font-bold" style={{ color:'var(--navy)' }}>
              졸업 전망
            </span>
          </div>

          <p className="text-[12px] font-semibold text-(--text-1) mb-1">
            현재 페이스 유지 시 우등 졸업 예상
          </p>
          <p className="text-[10px] text-(--text-3) leading-relaxed">
            잔여 3.8 이상 유지 시 졸업평점 4.0 도달 예상 (잔여 60학점 기준)
          </p>
        </div>

      </div>

      {/* 메인 섹션 2열 구조 */}
      <div className="grid grid-cols-1 sm:grid-cols-[1.3fr_1fr] gap-3.5 min-w-0">

        {/* #A 1열 : 학기별 GPA | AI 학습 전략 */}
        <div className="flex flex-col gap-3.5 min-w-0 overflow-hidden">

          {/* ##A-1 학기별 GPA 막대 차트 (mock 연결) */}
          <div className="bg-(--surface) rounded-xl border 
                          border-(--border) overflow-hidden"
               style={{ boxShadow:'var(--shadow-card)' }}>
            {/* 헤더 (상위 %: 임시, 하드코딩) */}
            <div className="px-4 py-3 border-b border-(--border) 
                            flex items-center justify-between">
              <span className="font-bold text-[13px] flex items-center gap-1.5">
                <TrendingUp size={14} className="text-(--accent)"/> 학기별 GPA 추이
              </span>

              <span className="px-2 py-0.5 rounded-full text-[9px] 
                              font-semibold bg-(--rec-neutral-bg) 
                              text-(--rec-neutral-text)">
                상위 15%
              </span>
            </div>
            
            {/* 막대 차트 */}
            <div className="px-4 pb-3 pt-3">
              <div style={{ height: 80 }} className="w-full overflow-hidden">
                <Bar
                  data={{
                    labels: semBars.map(s => s.isCurrent ? '현재' : s.label),
                    datasets: [{
                      data: semBars.map(s => s.gpa),
                      backgroundColor: semBars.map(s =>
                        s.isCurrent ? getCss('--accent') 
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
                    plugins: {
                      legend: { display: false },
                      tooltip: { enabled: false },
                    },
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
                        // forEach = 각 요소를 처리하는 것! iterator 유사
                        const meta = chart.getDatasetMeta(0);
                        const bar = meta.data[i];

                        ctx.fillStyle = getCss('--text-2');
                        ctx.font = 'bold 9px Inter, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText((val as number)
                            .toFixed(2), bar.x, bar.y - 4);
                        // fillText = 실제로 글자 그리는 메서드
                        // bar.x = 막대 가로중앙위치 (텍스트 막대 정중앙)
                        // bar.y = 막대 세로꼭대기, bar.y-4 = 막대 위에 띄움.(간격)
                      });
                      ctx.restore();
                    },
                  }]}
                />
              </div>
              <p className="text-[10px] text-(--text-3) mt-1.5 text-center">
                학기별 GPA · 누적 평균 <b className="text-(--accent)">{avgGPA.toFixed(2)}</b>
              </p>
            </div>
          </div>

          {/* ##A-2 AI 학습 전략 (임시, 하드코딩) : 변수화/데이터교체 & UI 손보기 */}
          <div className="bg-(--surface) rounded-xl border 
                          border-(--border) overflow-hidden flex-1"
               style={{ boxShadow:'var(--shadow-card)' }}>
            <div className="px-3.5 py-2.5 border-b border-(--border)">
              <span className="font-bold text-[12px] text-(--text-1) 
                               flex items-center gap-1.5">
                <Lightbulb style={{ color: 'var(--accent)' }} size={14}/>
                AI 학습 전략
              </span>
            </div>

            <div className="p-4 flex flex-col gap-2">
              {[
                '알고리즘 문제풀이를 주 3회 이상 꾸준히 유지하세요',
                '실험·실습 과목은 사전에 이론을 충분히 예습하면 효과적입니다',
                '교양 잔여 3학점을 다음 학기 우선 이수하면 졸업 리스크가 줄어듭니다',
                '전공 심화 과목은 팀 프로젝트 일정을 미리 확인하고 시간표를 구성하세요',
                '학기 초 수강 신청 변경 기간에 교수님들의 강의 계획서를 다시 한번 체크하세요',
                '취업을 준비한다면 3학년 때 전공 관련 자격증 공부를 병행하는 것을 추천합니다'
              ].map((tip, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="w-4.5 h-4.5 bg-(--accent-bg) rounded 
                                  flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="text-(--accent)"/>
                  </span>
                  <p className="text-[10px] text-(--text-2) leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* #B: AI 수강 추천 | 졸업 예측*/}
        <div className="flex flex-col gap-3.5 min-w-0">

          {/* ##B-1 AI 수강 추천 */}
          <div className="bg-(--surface) rounded-xl border border-(--border)
                          overflow-hidden" style={{ boxShadow:'var(--shadow-card)' }}>
            {/* 헤더 */}
            <div className="px-3.5 py-2.5 border-b border-(--border)
                            bg-(--accent-bg) flex items-center justify-between">
              <span className="font-bold text-[12px] flex items-center
                               gap-1.5 text-(--accent)">
                <Star size={12}/> AI 수강 추천
              </span>
            </div>

            {/* 엑셀 업로드 기능 추가 필요 @ */}
            <div className="p-4 flex flex-col items-center justify-center gap-2 py-8">
              <p className="text-[12px] text-(--text-3)">강의목록 엑셀 업로드</p>
              <p className="text-[10px] text-(--text-3) my-1">엑셀(xlsx) 파일을 올려 주세요</p>
            </div>

            {/* 추천 목록 (임시, 하드코딩) */}
            <div className="p-3 flex flex-col gap-1.5">
              {AI_RECOMMEND.map(r => (
                <div key={r.name} className="bg-(--inner-bg) rounded-lg px-3 py-2">
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] font-semibold text-(--text-1)">{r.name}</p>
                    <span className="px-1.5 py-px rounded-full text-[9px] font-semibold"
                          style={r.highlight ? { background:'var(--accent-bg)', color:'var(--accent)' }
                                  : { background:'var(--rec-neutral-bg)', color:'var(--rec-neutral-text)' }}>
                      {r.rec}
                    </span>
                  </div>
                  <p className="text-[9px] text-(--text-3) mt-0.5">{r.field}</p>
                </div>
              ))}
              </div>
          </div>

          {/* ##B-2 졸업 예측 (임시, 하드코딩) */}
          <div className="bg-(--surface) rounded-xl border border-(--border) 
                          overflow-hidden" style={{ boxShadow:'var(--shadow-card)' }}>
            
            {/* 헤더 */}
            <div className="px-3.5 py-2.5 border-b border-(--border)">
              <span className="font-bold text-[12px] text-(--text-1) 
                               flex items-center gap-1.5">
                <CheckCircle style={{ color: 'var(--accent)'}} size={12}/>
                졸업 예측
              </span>
            </div>

            <div className="p-3.5 flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-(--text-2)">예상 졸업평점</span>
                <b className="text-[15px] tabular-nums text-(--accent)" 
                  style={{ fontFamily:"'Bricolage Grotesque', Inter, sans-serif" }}>3.98</b>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-(--text-2)">우등 졸업 가능성</span>
                <b className="text-[15px] tabular-nums text-(--accent)" 
                  style={{ fontFamily:"'Bricolage Grotesque', Inter, sans-serif" }}>87%</b>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-(--text-2)">잔여 필요 학점</span>
                <b className="text-[15px] tabular-nums text-(--accent)" 
                  style={{ fontFamily:"'Bricolage Grotesque', Inter, sans-serif" }}>60학점</b>
              </div>

              <div className="mt-1 px-3 py-2 bg-(--accent-bg) rounded-lg">
                <p className="text-[10px] text-(--text-3) leading-relaxed">
                  현재 페이스(학기 평균 3.9) 유지 시 
                  <b className="text-(--text-2)">2026년 2월 졸업</b> 예상
                </p>
              </div>
            </div>

          </div>
        </div>
         
      </div>

      {/* AI 종합 분석 리포트 — 1열 전체 (임시, 하드코딩) */}
      <div className="mt-3.5 bg-(--surface) rounded-xl border 
                      border-(--border) overflow-hidden"
           style={{ boxShadow:'var(--shadow-card)' }}>
        <div className="px-4 py-3 border-b border-(--border)">
          <span className="font-bold text-[13px] text-(--text-1) flex items-center gap-1.5">
            <FileText style={{ color: 'var(--accent)', margin: '3px'}} size={14}/>
            AI 종합 분석 리포트
          </span>
        </div>

        <div className="px-4 py-3.5">
          <div className="text-[12px] text-(--text-2) leading-relaxed p-2">
            이문세 님은 전공 이론 과목에서 꾸준한 A등급 성취를 보이며,
            현재 누적 GPA <b className="text-(--text-1)">4.03</b>으로 상위 
            <b className="text-(--text-1)">15%</b> 수준입니다.
            다만 실험·실습 과목 평균이 이론 과목 대비 0.4점 낮아 이 부분의 보강이
            졸업 평점에 긍정적 영향을 줄 것으로 예상됩니다.
            잔여 학점 60학점을 현재 페이스로 이수하면 
            <b className="text-(--text-1)">2026년 2월 우등 졸업</b>이 가능하며,
            다음 학기 전공필수 2과목 A 이상 달성 시 목표 GPA 4.2에 도달할 수 있습니다.

            <div className="p-4 m-2 border border-(--border) rounded-xl 
                            hover:shadow-md transition-all">
              <h3 className="font-bold text-(--text-1) mb-2 flex items-center gap-2">
                <span>ICON1</span> 상세 성취 현황 분석
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                현재 이문세 님은 전공 핵심 이론 과목에서 4.03이라는 매우 견고한 누적 GPA를 유지하고 있습니다. 
                특히 알고리즘과 자료구조와 같은 논리적 사고 기반의 과목에서 얻은 A등급은 
                단순한 지식 습득을 넘어, 복잡한 문제를 구조적으로 분해하고 해결하는 역량이 
                상위 15% 수준임을 방증합니다. 이러한 강점은 향후 4학년 프로젝트나 졸업 논문, 
                나아가 실무 현장에서 필요한 '문제 해결 가설 수립' 단계에서 큰 자산이 될 것입니다. 
                기초가 탄탄한 만큼, 이제는 이 이론적 기반을 더 넓은 응용 분야로 확장하는 
                '학제 간 융합 학습'에 도전해 보시길 권장합니다. 이론적 완성도는 
                취업 시장에서의 기술 면접 시 본인만의 논리 체계를 구축하는 가장 강력한 무기가 될 것입니다.
              </p>
            </div>

            <div className="p-4 m-2 border border-(--border) rounded-xl 
                            hover:shadow-md transition-all">
              <h3 className="font-bold text-(--text-1) mb-2 flex items-center gap-2">
                <span>ICON2</span> 실무 역량 강화 전략
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                이론 대비 0.4점 낮은 실습 평점은 실질적인 '결과물 도출 단계'에서의 개선이 필요함을 시사합니다. 
                실습은 단순히 이론을 적용하는 시간이 아니라, 예상치 못한 변수를 통제하고 
                최적의 결과값을 찾아가는 '실무 시뮬레이션' 과정입니다. 
                이를 위해 첫째, 실습 수업 24시간 전 **'사전 가상 시뮬레이션'** 루틴을 도입하십시오. 
                실습 과정에서 발생할 수 있는 오류를 미리 예측하고, 그 해결책을 이론서에서 찾는 과정만으로도 
                실습 현장에서의 자신감이 비약적으로 상승할 것입니다. 
                둘째, 실습 종료 후에는 반드시 '디버깅 일지'를 작성하여 데이터가 의도대로 나오지 않았던 
                이유를 명확히 규명하십시오. 이러한 사후 분석은 단순 점수 향상을 넘어, 
                엔지니어로서의 예리한 관찰력을 키우는 최고의 훈련이 될 것입니다.
              </p>
            </div>

            <div className="p-4 m-2 border border-(--border) 
                            rounded-xl hover:shadow-md transition-all">
              <h3 className="font-bold text-(--text-1) mb-2 flex items-center gap-2">
                <span>ICON3</span> 우등 졸업 로드맵
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                2026년 2월 우등 졸업을 위한 핵심은 '전략적 선택과 집중'입니다. 
                잔여 60학점 중 전공필수 2과목은 목표 GPA 4.2 달성을 위한 교두보가 되어야 합니다. 
                이를 위해 타인에게 핵심 개념을 설명해보는 '파인만 학습법(Feynman Technique)'을 적극 활용하십시오. 
                스터디 그룹을 구성하여 동료들에게 강의의 주요 개념을 10분간 설명해보는 시간은 
                본인이 진정으로 이해하고 있는 부분과 빈틈을 확실히 구분해 줄 것입니다. 
                또한, 남은 학기 동안은 수강 과목의 우선순위를 '성적 향상'과 '실무 역량 강화'로 
                50:50으로 배분하는 포트폴리오 전략을 추천합니다. 지금의 페이스라면 
                충분히 우등 졸업은 물론, 졸업 후 바로 현장에 투입될 수 있는 실무형 인재로 도약할 것입니다.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      
    </div>
  );
}



export default AiAnalysis;

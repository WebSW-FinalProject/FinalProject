
import { API_BASE } from '../../api';
import Logo from '../logo.tsx';
import { useState } from 'react';
import { BarChart3, CalendarDays, MessageSquareText } from 'lucide-react';
import previewImg from '../../assets/preview.png';

interface Props {
  onLogin: (token: string) => void;
}

function LandingPage({ onLogin }: Props) {
  const [mode, setMode] = useState('login'); // login | register 같은 form CSS
  const [form, setForm] = useState(
    { email: '', password: '', username: '' }
    ); // 사용자가 입력하는 로그인/회원가입 정보 관리 state

  const [error, setError] = useState(''); // form 에러메시지
  const [loading, setLoading] = useState(false); // 버튼 상태관리 (중복요청 방지)

    
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        // React.ChangeEvent<HTMLInputElement> 
        // React type - 사용자 ChangeEvent - <Input/>=>HTMLInputElement 
    
    // email, password, username == name
    // 사용자의 input 입력값 == value   
    const name = e.target.name; 
    const value = e.target.value; 
    setForm({ ...form, [name]: value }); 
  }

  // 사용자가 제출한 form 값 back 전달 (대기가 필요해서 async 필수)
  async function handleSubmit(e: { preventDefault: () => void }) {
    // e: onSubmit 제출 form 객체묶음 (단, onsubmit=form 이란 보장은X)
    // 이 객체의 묶음에 preventDefault 존재함을 보장. (form 객체)

    e.preventDefault();  // 제출했을 때 새로고침 막고 백엔드 전송하도록 함(필수)

    setLoading(true);  // disable button
    setError(''); 

    // login | register 구분
    const url = mode === 'login'
      ? `${API_BASE}/api/auth/login`
      : `${API_BASE}/api/auth/register`;

    const body = mode === 'login'
      ? { email: form.email,  password: form.password }
      : { email: form.email,  password: form.password,  username: form.username };
      // 회원가입의 경우 username 까지 받음.

    try {
      // then(): 코드복잡, 주의(힌트)뜸. => async/await 사용
      // a.then(b.c) <=> b = await a; ...
      // 아래 예시 참조해서 작성해가기.

      /* fetch(url,{}).then(res => res.json())
                      .then(data => console.log(data)) */
      
      /*const res  = await fetch(url,{})
        const data = await res.json()
        console.log(data) */
      

      const res  = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      }); // 유저가 제출한 form 데이터 내용 묶어(body) 보냄

      const data = await res.json(); // res => json 파싱 
      // res 형태: { message: '로그인 성공!', token: token }

      if (!res.ok) {
        setError(data.message || '오류가 발생했습니다.');
        return;
      } 

      if (mode === 'register') {  // 회원가입 성공 => 로그인 화면
        setMode('login');
        setForm({ email: form.email, password: '', username: '' });
        setError('');
        return;
      }
      
      onLogin(data.token); // 로그인 성공 → App으로 토큰 전달
    } 
    catch { setError('서버에 연결할 수 없습니다.'); } 
    finally { setLoading(false); }  // 버튼 enable
  }

  return (
    <div className="min-h-screen bg-(--bg) flex">

      {/* # 좌 — 로그인/회원가입 form */}
      <div className="flex flex-col justify-center items-center flex-1 px-6">
        <div className="w-full max-w-sm border p-10 py-12 border-(--border) 
                        rounded-xl bg-(--surface)">

          {/* 좌측 hidden 일떄 보여줄 로고 */}
          <div className="flex items-center gap-2 mb-4.5 lg:hidden">
            <div className="flex items-center gap-3 mb-2 text-(--accent)">
                <div className="bg-(--inner-bg) rounded-xl border-(--border) p-2"> <Logo/> </div>
                <span className="text-[24px] font-black text-(--accent) tracking-tight">
                    UNIGUIDE
                </span>
            </div>
          </div>

          <h2 className="text-[22px] font-extrabold text-(--text-1) mb-1">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>

          <p className="text-[13px] text-(--text-3) mb-5 mt-1.5">
            {mode === 'login'
              ? '계정에 로그인하여 학사 관리를 시작하세요'
              : '유니가이드에 오신 것을 환영합니다'}
          </p>

          {/* 로그인 | 회원가입 폼 */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            { (mode === 'register') && (
            <div>
                <label className="text-[11px] font-bold text-(--text-2) mb-1.5 block">이름</label>
                <input name="username" value={form.username} onChange={handleChange}
                    placeholder="홍길동"
                    className="w-full px-3.5 py-2.5 text-[13px] rounded-xl bg-(--surface) 
                                border border-(--border) text-(--text-1) 
                                placeholder:text-(--text-3) focus:outline-none 
                                focus:border-(--accent) transition-colors"/>
            </div>
            )} {/* register = name, email, password | login = email, password. */}

            <div>
            <label className="text-[11px] font-bold text-(--text-2) mb-1.5 block"> 이메일 </label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="example@gmail.com"
                    className="w-full px-3.5 py-2.5 text-[13px] rounded-xl bg-(--surface) 
                                border border-(--border) text-(--text-1) 
                                placeholder:text-(--text-3) focus:outline-none 
                                focus:border-(--accent) transition-colors"/>
            </div>

            <div>
            <label className="text-[11px] font-bold text-(--text-2) mb-1.5 block">비밀번호</label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-[13px] rounded-xl bg-(--surface) 
                                border border-(--border) text-(--text-1) 
                                placeholder:text-(--text-3) focus:outline-none 
                                focus:border-(--accent) transition-colors"/>
            </div>

            {/* 에러 메시지 */}
            {error && (
            <p className="text-[12px] text-(--alert-warn) 
                            bg-(--alert-warn-bg) px-3 py-2 rounded-lg">
                {error}
            </p>
            )}

            <button type="submit" disabled={loading}
                    className="w-full py-2.5 rounded-xl text-[13px] font-bold bg-(--accent)
                            text-white hover:opacity-85 transition-opacity 
                            disabled:opacity-50 mt-1">
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
            </button>
          </form>

          <p className="text-center text-[12px] text-(--text-3) mt-5">
            {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'} &nbsp;&nbsp;
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); 
                                     setError(''); }}
                    className="text-(--accent) font-semibold hover:underline">
              {mode === 'login' ? '회원가입' : '로그인'}
            </button>
          </p>

        </div>

        {/* 팀원 소개 */}
        <div className="mt-5 text-center">
          <p className="text-[10px] text-(--text-3)">
            이도연 · 김성령 · 윤채은 &nbsp;|&nbsp; 소프트웨어학부
          </p>
        </div>

      </div>

      {/* # 우 — 서비스 소개 (화면 크기 클때만 보임) */}
      <div className="hidden lg:flex flex-col justify-center px-16 w-1/2
                      bg-(--surface) relative overflow-hidden">

        {/* 웹 미리보기 배경 */}
        <div className="absolute -right-10 -bottom-5 w-[70%] 
                        pointer-events-none select-none">
          <img src={previewImg} alt="preview"
               className="w-full rounded-xl opacity-[0.25] object-cover shadow-2xl"/>
        </div>

        <div className="relative z-10 max-w-md ml-10">
          {/* 로고 */}
          <div className="flex items-center gap-3 mb-8 text-(--accent)">
            <div className="bg-(--inner-bg) rounded-xl border-(--border) p-2"> <Logo/> </div>
            <span className="text-[24px] font-black text-(--accent) tracking-tight">
                UNIGUIDE
            </span>
          </div>

          {/* 소개 */}
            <h1 className="text-[32px] font-extrabold text-(--text-1) leading-tight mb-4"
                style={{ fontFamily: "'Bricolage Grotesque', Inter, sans-serif" }}>
                성적, 졸업요건 관리,<br/>학교생활 소통을 한 곳에서.
            </h1>

            <p className="text-[15px] text-(--text-2) leading-relaxed mb-10">
                유니가이드는 대학생을 위한 통합 학사 관리 플랫폼입니다.<br/>
                성적 분석부터 졸업요건 관리, 커뮤니티까지 한 번에 관리하세요.
            </p>

          {/* 기능 소개 */}
          <div className="flex flex-col gap-4">
            {/* 성적 대시보드 */}
            <div className="flex items-start gap-3">
                <span className="text-[20px] shrink-0">
                <BarChart3 className="text-(--accent)" />
                </span>
                <div>
                <p className="text-[13px] font-bold text-(--text-1)">성적 대시보드</p>
                <p className="text-[12px] text-(--text-2)">학기별 GPA 추이와 졸업 달성률을 한눈에</p>
                </div>
            </div>

            {/* 수강신청 계획 */}
            <div className="flex items-start gap-3">
                <span className="text-[20px] shrink-0">
                <CalendarDays className="text-(--accent)" />
                </span>
                <div>
                <p className="text-[13px] font-bold text-(--text-1)">수강신청 계획</p>
                <p className="text-[12px] text-(--text-2)">이수 모형 기반으로 다음 학기 계획 세우기</p>
                </div>
            </div>

            {/* 학과 커뮤니티 */}
            <div className="flex items-start gap-3">
                <span className="text-[20px] shrink-0">
                <MessageSquareText className="text-(--accent)" />
                </span>
                <div>
                <p className="text-[13px] font-bold text-(--text-1)">학과 커뮤니티</p>
                <p className="text-[12px] text-(--text-2)">정보 공유, 스터디, 취업 소식 한 곳에서</p>
                </div>
            </div>
          </div>

        </div>
      </div>


    </div>
  );
}

export default LandingPage;





// 언어 설정 Context — KOR | ENG 전역 관리
// Header의 KOR|ENG 버튼 => 해당파일 lang 상태 변경 => 모든 컴포넌트 useLang() 전파

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { t as translate, type Lang } from './lang';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;  
  // 현재 lang 기준으로 번역
}

const LangContext = createContext<LangCtx>({
  lang: 'ko',
  setLang: () => {}, 
  t: (key) => key,
}); // props 전파하면 비효율적임.(모든페이지) => 상위레이어 만든것.

export function LangProvider({ children }: { children: ReactNode }) {

  // localStorage에서 초기값 로드 (새로고침 유지)
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem('ui_lang') as Lang) || 'ko'
  );

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('ui_lang', l);
  }

  const t = (key: string) => translate(key, lang);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

// useLang 호출하면 langcontext 객체꼴 돌려줌
export const useLang = () => useContext(LangContext);

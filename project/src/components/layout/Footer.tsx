function Footer() {
  return (
    <footer className="bg-(--surface) border-t border-(--border)
                       px-11 py-3.5 flex items-center justify-between
                       text-[11px] text-(--text-3)">
      <span className="flex items-center gap-4">
        <b className="text-(--text-2) font-bold">Uniguide</b>
        <span>© 2025 · 개인정보처리방침 · 이용약관</span>
      </span>
      <span>소프트웨어학부</span>
    </footer>
  );
}

export default Footer;

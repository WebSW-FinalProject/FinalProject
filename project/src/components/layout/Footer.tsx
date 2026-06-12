import { useLang } from '../../LangContext';

function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-(--surface) border-t border-(--border)
                       px-11 py-3.5 flex items-center justify-between
                       text-[11px] text-(--text-3)">
      <span className="flex items-center gap-4">
        <b className="text-(--text-2) font-bold">Uniguide</b>
        <span>© 2026 · {t('footerPrivacy')} · {t('footerTerms')}</span>
      </span>
      <span>{t('footerDept')}</span>
    </footer>
  );
}

export default Footer;

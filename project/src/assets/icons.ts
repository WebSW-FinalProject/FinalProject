// SVG path 문자열 모음 (viewBox="0 0 24 24" 기준)
export const ICONS: Record<string, string> = {
  dashboard:
    '<rect x="3" y="3" width="7" height="7" rx="1"/>' +
    '<rect x="14" y="3" width="7" height="7" rx="1"/>' +
    '<rect x="3" y="14" width="7" height="7" rx="1"/>' +
    '<rect x="14" y="14" width="7" height="7" rx="1"/>',

  credits:
    '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',

  timetable:
    '<rect x="3" y="4" width="18" height="18" rx="2"/>' +
    '<line x1="16" y1="2" x2="16" y2="6"/>' +
    '<line x1="8" y1="2" x2="8" y2="6"/>' +
    '<line x1="3" y1="10" x2="21" y2="10"/>',

  ai:
    '<path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>' +
    '<circle cx="12" cy="12" r="10"/>' +
    '<line x1="12" y1="17" x2="12.01" y2="17"/>',
};

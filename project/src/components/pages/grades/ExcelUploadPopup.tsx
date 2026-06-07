
import { useState } from 'react';
import { Upload } from 'lucide-react';
import Popup, { PopupHeader, PopupFooter } from '../../ui/Popup';

// 엑셀 업로드 팝업
// 성적 데이터가 없을 때 강제로 띄움 (닫기 버튼 없음)
// 업로드 성공 시 onSuccess() 호출 → 부모에서 데이터 리로드

interface Props {
  open: boolean;
  onSuccess: () => void;
}

function ExcelUploadPopup({ open, onSuccess }: Props) {

  const [file, setFile]         = useState<File | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [dragOver, setDragOver] = useState(false);


  function handleFile(f: File) {
    setFile(f);
    setError('');
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token') || '';
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('http://localhost:3000/api/grade/parse', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: fd,
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || '파싱에 실패했습니다.');
        return;
      }

      // 업로드 완료 → 파일 초기화 + 부모에 알림
      setFile(null);
      onSuccess();

    } catch {
      setError('업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }


  return (
    <Popup open={open} onClose={() => {}} width="440px">
      <PopupHeader
        title={<><Upload size={14} className="text-(--accent)"/> 성적표 업로드</>}
      />

      <div className="px-5 py-5 flex flex-col gap-4">
        <p className="text-[12px] text-(--text-2) leading-relaxed">
          학교 포털에서 <b className="text-(--text-1)">성적 확인 → 성적표 저장</b>으로
          다운받은 <b className="text-(--text-1)">.xlsx 파일</b>을 업로드하면
          자동으로 학기/과목 데이터를 불러옵니다.
        </p>

        {/* 드래그 앤 드롭 영역 */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => document.getElementById('grade-file-input')?.click()}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center
                      justify-center gap-2 py-8 cursor-pointer transition-colors
                      ${dragOver
                        ? 'border-(--accent) bg-(--accent-bg)'
                        : 'border-(--border) hover:border-(--text-3)'}`}>

          <Upload size={28} className={dragOver ? 'text-(--accent)' : 'text-(--text-3)'}/>
          <p className="text-[12px] font-medium text-(--text-2)">
            {file ? file.name : '파일을 드래그하거나 클릭해서 선택'}
          </p>
          <p className="text-[10px] text-(--text-3)">.xlsx 파일만 지원</p>

          <input
            id="grade-file-input"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>

        {error && <p className="text-[11px] text-red-400">{error}</p>}
      </div>

      <PopupFooter>
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="px-5 py-1.5 rounded-lg text-[12px] font-semibold
                     bg-(--text-1) text-(--surface) hover:opacity-85
                     transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? '업로드 중...' : '업로드'}
        </button>
      </PopupFooter>
    </Popup>
  );
}

export default ExcelUploadPopup;

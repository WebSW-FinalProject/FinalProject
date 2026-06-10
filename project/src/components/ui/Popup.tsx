

interface PopupProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
} // 열려있는지, 닫힘요청 왔는지
// children == Popup 태그 안(<> 여기 </>) 에 넣는 내용 
// width ==팝업창너비. ? == 생략가능 (디폴트 존재 !)

// 공용 팝업 컴포넌트
// PopupHeader , Popup , PopupFooter 
// 팝업이름 / 내용 / 버튼 형식으로 구분
// 사용 예시 :   <Popup open="" onClose="" width="" />
//               <PopupHeader title="" onClose=""/> // onclose 비어있을수있음(엑셀업로드)
//               <PopupFooter />

function Popup({ open, onClose, children, width = '400px' }: PopupProps) {

  if (!open) return null; // 이미 열려있을 경우 겹치지 않도록 방지..

  return (
    <div
      className="fixed inset-0 z-900 flex items-center justify-center
                  overflow-y-auto popup-scroll px-4 py-10"
      style={{ background: 'rgba(0,0,0,.38)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-(--surface) rounded-2xl overflow-hidden w-full"
           style={{ maxWidth: width, boxShadow: '0 8px 40px rgba(0,0,0,.22)' }}>
        {children}
      </div>
    </div>
  );
}

// 팝업 헤더 (이름 + 닫기버튼)
export function PopupHeader(
  { title, onClose }: { title: React.ReactNode; onClose?: () => void } 
  // 엑셀 업로드 팝업은 X 없이(onClose?: x버튼 없는것 허용) 구현해야 함.
) {
  return (
    <div className="px-4.5 py-3.5 border-b border-(--border) 
                    flex items-center justify-between 
                    sticky top-0 bg-(--surface) z-10">
      <p className="text-[14px] font-bold text-(--text-1) 
                    flex items-center gap-1.5"> {title} </p>
      {onClose && (
        <button onClick={onClose}
                className="text-[22px] leading-none text-(--text-3) p-1 rounded-lg
                hover:text-(--text-1) hover:bg-(--surface-2) transition-colors">
          ×
        </button>
      )} {/* onClose 인자가 존재할 때만(close state O) 닫기버튼표시함. */}
    </div>
  );
}

// 팝업 푸터 (버튼자리)
export function PopupFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4.5 py-3 border-t border-(--border) flex justify-end gap-2">
      {children}
    </div>
  );
}

export default Popup;

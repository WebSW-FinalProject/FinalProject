// 사용법: showToast('저장되었습니다') — App.tsx에서 전역 호출
export function showToast(msg: string, icon = '✓') {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  stack.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 220);
  }, 2200);
}

function ToastStack() {
  return <div id="toast-stack" />;
}

export default ToastStack;

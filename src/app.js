/* =========================================================
   STARTUP ENTRY POINT
   ========================================================= */
(async function init() {
  try {
    await loadAll(); // localStorage에서 단원 데이터 로드

    // Firebase Auth 상태 감지 → 로그인 여부에 따라 라우팅
    auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        await onAuthLogin(fbUser);
      } else {
        state.currentUser = null;
        state.currentTeacher = null;
        state.view = 'login';
      }
      render();
    });
  } catch (e) {
    console.error('App init failed:', e);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '<div style="color:#fff;background:rgba(0,0,0,0.7);padding:24px;border-radius:12px;margin:20px;font-family:monospace;white-space:pre-wrap">Error: ' + e.message + '\n\n' + e.stack + '</div>';
    }
  }
})();
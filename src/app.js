/* =========================================================
   STARTUP ENTRY POINT
   ========================================================= */
(async function init() {
  try {
    // Firebase Auth 상태 감지 → 로그인 여부에 따라 라우팅
    // _signingUp 플래그: 회원가입 중 중복 실행 방지
    auth.onAuthStateChanged(async (fbUser) => {
      if (window._signingUp) return;

      state.view = 'loading';
      render();

      if (fbUser) {
        // Firebase 로그인 상태: Firestore에서 교사 데이터 로드
        await onAuthLogin(fbUser);
      } else {
        // 미인증 상태는 예외 없이 로그인 화면으로 보낸다.
        // 이전에는 Firestore의 첫 교사로 자동 진입하는 "테스트 모드"가 있었으나,
        // 주소만 알면 누구나 관리자 화면에 들어갈 수 있어 제거했다.
        state.currentUser = null;
        state.currentTeacher = null;
        state.currentStudent = null;
        state.currentStudentDoc = null;
        state.students = [];
        state.units = [];
        masterState.teachers = [];
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
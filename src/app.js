/* =========================================================
   STARTUP ENTRY POINT
   ========================================================= */
(async function init() {
  try {
    await loadAll(); // localStorage에서 단원 데이터 로드

    // Firebase Auth 상태 감지 → 로그인 여부에 따라 라우팅
    // _signingUp 플래그: 회원가입 중 중복 실행 방지
    auth.onAuthStateChanged(async (fbUser) => {
      if (window._signingUp) return;
      if (fbUser) {
        state.view = 'loading';
        render();
        await onAuthLogin(fbUser);
        render();
      } else {
        // 로그아웃 상태: 기존 교사가 있으면 첫 번째 교사로 자동 진입 (테스트 모드)
        // 교사가 한 명도 없으면 가입 화면 표시
        state.view = 'loading';
        render();
        const teachers = await fbGetAllTeachers();
        if (teachers.length === 0) {
          state.view = 'signup';
        } else {
          // 첫 번째 교사(관리자)로 자동 로드
          const first = teachers.find(t => t.isAdmin) || teachers[0];
          state.currentUser = { uid: first.id, email: first.email || '', ...first };
          if (first.isAdmin) {
            const allStudents = await fbGetAllStudents(teachers.map(t => t.id));
            masterState.teachers = teachers.map(t => ({
              ...t, students: allStudents.filter(s => s.teacherId === t.id)
            }));
            state.view = 'admin';
          } else {
            const students = await fbGetStudents(first.id);
            state.currentTeacher = { ...first, students };
            state.students = students.map(s => s.name);
            masterState.teachers = [state.currentTeacher];
            state.view = 'teacher';
          }
        }
        render();
      }
    });
  } catch (e) {
    console.error('App init failed:', e);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '<div style="color:#fff;background:rgba(0,0,0,0.7);padding:24px;border-radius:12px;margin:20px;font-family:monospace;white-space:pre-wrap">Error: ' + e.message + '\n\n' + e.stack + '</div>';
    }
  }
})();
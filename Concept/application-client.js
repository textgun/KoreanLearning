// 신청·관리 화면이 Firebase 인증과 서버 API, 공통 모집 정책을 사용하도록 연결한다.
const applicationReady = (async () => {
  const response = await fetch('application-policy.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('모집 안내를 불러오지 못했습니다.');
  const policy = await response.json();
  // 기존 src/firebase.js와 동일한 공개 Firebase 프로젝트 설정이다.
  const app = firebase.initializeApp({
    apiKey: 'AIzaSyCvUom9f5AeeB1Df-SVqlxU2Td2TBW6ccI',
    authDomain: 'korean-learning-fdaff.firebaseapp.com', projectId: 'korean-learning-fdaff',
  }, 'teacher-applications');
  const auth = app.auth();
  await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
  const functions = app.functions('asia-northeast3');
  return { policy, auth, call: async (name, data = {}) => (await functions.httpsCallable(name)(data)).data };
})();
// 화면에서 사용하기 전에 실패해도 처리되지 않은 Promise 오류를 남기지 않는다.
applicationReady.catch(() => {});

// 실제 src 함수를 메모리 대역으로 실행해 신규 검토 항목을 재현하는 스크립트
const fs = require('fs');
const vm = require('vm');
const SRC = require('path').join(__dirname, '../../../src/');
const files = ['config.js', 'storage.js', 'api.js', 'utils.js', 'router.js', 'views-teacher.js', 'views-student.js', 'firebase.js'];

const toasts = [];
const ctx = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, Promise, JSON, Math, Date, Set,
  localStorage: { _m: {}, getItem(k) { return this._m[k] ?? null; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } },
  document: { querySelector: () => ({ set textContent(v) { toasts.push(v); }, set className(v) {} }), querySelectorAll: () => [] },
  firebase: Object.assign({
    initializeApp: () => ({}), apps: [],
    firestore: Object.assign(() => ({}), { FieldValue: { serverTimestamp: () => 'TS', delete: () => 'DEL' } }),
    auth: () => ({}),
  }),
};
ctx.window = ctx;
vm.createContext(ctx);
const code = files.map(f => fs.readFileSync(SRC + f, 'utf8')).join('\n') + `
;globalThis.__api = { state, masterState, calcOverallProgress, loadStudentStats, _doSaveStudent, onAuthLogin,
  generateOXQuestions, SAMPLE_UNIT, getUnitActivities,
  set fbUpdateStudent(f) { fbUpdateStudent = f; }, set fbGetTeacher(f) { fbGetTeacher = f; },
  set fbSaveTeacher(f) { fbSaveTeacher = f; }, set fbGetCurriculum(f) { fbGetCurriculum = f; },
  set fbSaveCurriculum(f) { fbSaveCurriculum = f; }, set fbGetStudents(f) { fbGetStudents = f; },
  set fbGetSharedCurriculum(f) { fbGetSharedCurriculum = f; } };`;
vm.runInContext(code, ctx);
const A = ctx.__api;

(async () => {
  // ---- 1. 관리자 상세 화면의 진도: 다른 교사 학생을 관리자 단원 기준으로 계산 ----
  const teacherXUnit = { id: 222, title: 'X 단원', vocabulary: [{ word: 'a' }, { word: 'b' }, { word: 'c' }, { word: 'd' }], grammar: [], quizzes: [] };
  const adminUnit = { id: 111, title: '관리자 단원', vocabulary: [{ word: 'z' }], grammar: [], quizzes: [] };
  const best = {};
  A.getUnitActivities(teacherXUnit).forEach(act => { best[`222_${act}`] = 50; });
  A.state.units = [adminUnit]; A.state.sharedUnits = [];
  const adminView = A.calcOverallProgress(best);
  A.state.units = [teacherXUnit];
  const teacherView = A.calcOverallProgress(best);
  console.log('[1] 같은 학생 진도  관리자 화면:', adminView + '%', ' 담당 교사 화면:', teacherView + '%');

  // ---- 2. 교사 기기 학생 모드가 로그인 시점 캐시로 원격 학습 기록을 덮어씀 ----
  const db = { s1: { name: '민수', teacherId: 'T', stats: { xp: 100, level: 2, streak: 0, badges: [], bestScores: { '1_quiz': 40 } } } };
  const deepMerge = (a, b) => { for (const k of Object.keys(b)) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) deepMerge(a[k], b[k]); else a[k] = JSON.parse(JSON.stringify(b[k])); } return a; };
  let reads = 0;
  A.fbUpdateStudent = async (id, data) => { deepMerge(db[id], data); };
  // 교사가 아침에 로그인하면서 명단을 읽어 둠
  const cachedDoc = { firestoreId: 's1', ...JSON.parse(JSON.stringify(db.s1)) };
  // 학생이 집에서 원격 접속으로 학습 → 서버 XP 160, quiz 최고 90
  db.s1.stats.xp = 160; db.s1.stats.level = 2; db.s1.stats.bestScores['1_quiz'] = 90;
  // 수업 시간에 교사 기기에서 같은 학생으로 학습 모드 진입
  A.state.role = 'teacher'; A.state.currentStudent = '민수'; A.state.currentStudentDoc = cachedDoc;
  await A.loadStudentStats(cachedDoc, '민수');
  A.state.stats.xp += 10; A.state.stats.bestScores['1_quiz'] = 45;
  await A._doSaveStudent();
  console.log('[2] 서버 기록  XP 160→', db.s1.stats.xp, ' quiz 최고 90→', db.s1.stats.bestScores['1_quiz']);

  // ---- 3. OX 퀴즈: 어순만 바뀐 문법적 문장을 X(틀림)로 채점 ----
  let xTotal = 0, verbFinal = 0; const examples = new Set();
  for (let i = 0; i < 3000; i++) {
    A.generateOXQuestions(A.SAMPLE_UNIT).filter(q => !q.correct).forEach(q => {
      xTotal++;
      const w = q.sentence.split(' ');
      if (/[요다]\.?$/.test(w[w.length - 1]) && w.length >= 3) { verbFinal++; if (examples.size < 4) examples.add(q.sentence); }
    });
  }
  console.log('[3] X 문항 중 서술어가 문장 끝에 남은 비율:', (verbFinal / xTotal * 100).toFixed(1) + '%', [...examples]);

  // ---- 4. 관리자가 삭제한 교사가 다시 로그인하면 교사 문서가 자동 재생성 ----
  let created = null;
  A.fbGetTeacher = async () => created ? { id: 'X', ...created } : null;
  A.fbSaveTeacher = async (uid, data) => { created = data; };
  A.fbGetCurriculum = async () => ({ units: [teacherXUnit], language: 'en' });
  A.fbGetStudents = async () => [];
  A.fbGetSharedCurriculum = async () => null;
  await A.onAuthLogin({ uid: 'X', email: 'deleted@t.com' });
  console.log('[4] 삭제된 교사 재로그인  교사 문서 재생성:', !!created, ' 이전 단원 복원:', A.state.units.map(u => u.title));

  // ---- 5. 샘플 단원의 외국어 번역에 한글이 섞인 항목 ----
  const bad = [];
  const scan = (obj, path) => {
    if (typeof obj === 'string') { return; }
    for (const [k, v] of Object.entries(obj || {})) {
      if (typeof v === 'string' && /^(zh|ja|th|es|vi|ne|hi)$/.test(k) && /[가-힣]/.test(v)) bad.push(`${path}.${k}: ${v}`);
      else if (v && typeof v === 'object') scan(v, `${path}.${k}`);
    }
  };
  scan(A.SAMPLE_UNIT, 'SAMPLE_UNIT');
  console.log('[5] 한글이 섞인 외국어 번역', bad.length + '건'); bad.forEach(b => console.log('   ', b));
})();

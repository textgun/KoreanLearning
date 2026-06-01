/* =========================================================
   STORAGE
   ========================================================= */
// GitHub Pages 환경에서 window.storage 대신 localStorage를 사용하는 폴리필
if (!window.storage) {
  window.storage = {
    get: (key) => Promise.resolve(
      localStorage.getItem(key) ? { value: localStorage.getItem(key) } : null
    ),
    set: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    delete: (key) => Promise.resolve(localStorage.removeItem(key))
  };
}

let _savingTeacher = false, _savingStudent = false, _storageOK = true;
const TEACHER_KEY = 'korean_teacher_v1';
const LEGACY_KEY = 'korean_app_v1';
function studentKey(name) { return 'korean_student_' + encodeURIComponent(name) + '_v1'; }
function defaultStats() { return { xp: 0, level: 1, streak: 0, badges: [], bestScores: {} }; }

async function _withRetry(fn, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) { lastErr = e; if (i < attempts - 1) await new Promise(r => setTimeout(r, 500 * Math.pow(2, i))); }
  }
  throw lastErr;
}

async function _doSaveTeacher() {
  if (_savingTeacher) return;
  _savingTeacher = true;
  try {
    const payload = JSON.stringify({ units: state.units, settings: { language: state.language, students: state.students } });
    await _withRetry(() => window.storage.set(TEACHER_KEY, payload), 3);
    if (!_storageOK) { _storageOK = true; toast('저장 복구됨', 'success'); }
  } catch (e) {
    if (_storageOK) { _storageOK = false; toast('⚠️ 자동저장 일시 중단', 'accent'); }
    console.warn('Teacher save failed:', e.message || e);
  } finally { _savingTeacher = false; }
}

async function _doSaveStudent() {
  if (!state.currentStudent || _savingStudent) return;
  _savingStudent = true;
  try {
    const payload = JSON.stringify({ stats: state.stats });
    await _withRetry(() => window.storage.set(studentKey(state.currentStudent), payload), 3);
  } catch (e) {
    console.warn('Student save failed:', e.message || e);
  } finally { _savingStudent = false; }
}

let _teacherTimer = null, _studentTimer = null;

async function persistTeacher(immediate = false) {
  if (_teacherTimer) { clearTimeout(_teacherTimer); _teacherTimer = null; }
  if (immediate) await _doSaveTeacher();
  else _teacherTimer = setTimeout(_doSaveTeacher, 700);
}

async function persistStudent(immediate = false) {
  if (!state.currentStudent) return;
  if (_studentTimer) { clearTimeout(_studentTimer); _studentTimer = null; }
  if (immediate) await _doSaveStudent();
  else _studentTimer = setTimeout(_doSaveStudent, 700);
}

async function persistAll(immediate = false) {
  await persistTeacher(immediate);
  await persistStudent(immediate);
}

async function migrateFromLegacy() {
  try {
    const r = await window.storage.get(LEGACY_KEY);
    if (!r || !r.value) return;
    const data = JSON.parse(r.value);
    if (data.units && data.units.length > 0) {
      state.units = data.units;
      state.language = (data.settings && data.settings.language) || 'en';
      state.students = (data.settings && data.settings.students) || [];
      await _doSaveTeacher();
      try { await window.storage.delete(LEGACY_KEY); } catch {}
    }
  } catch (e) { console.warn('Migration failed:', e); }
}

async function loadTeacher() {
  try {
    const r = await _withRetry(() => window.storage.get(TEACHER_KEY), 3);
    if (r && r.value) {
      const data = JSON.parse(r.value);
      state.units = data.units && data.units.length > 0 ? data.units : [SAMPLE_UNIT];
      state.language = (data.settings && data.settings.language) || 'en';
      state.students = (data.settings && data.settings.students) || [];
      return;
    }
  } catch (e) {
    console.warn('Storage unavailable, using defaults');
    _storageOK = false;
    setTimeout(() => toast('⚠️ 저장소 접근 오류 - 메모리에 임시 저장됩니다', 'accent'), 800);
  }
  if (!state.units || state.units.length === 0) state.units = [SAMPLE_UNIT];
}

async function loadStudentStats(name) {
  try {
    const r = await _withRetry(() => window.storage.get(studentKey(name)), 3);
    if (r && r.value) {
      const data = JSON.parse(r.value);
      state.stats = data.stats || defaultStats();
      return;
    }
  } catch (e) { console.warn('Student stats load failed:', e); }
  state.stats = defaultStats();
}

async function loadAll() {
  await migrateFromLegacy();
  await loadTeacher();
  await loadMaster();
  state.stats = defaultStats();
}

/* =========================================================
   MASTER ADMIN STORAGE
   ========================================================= */
const MASTER_KEY = 'korean_master_v1';
const NATIONALITIES = [
  '중국','베트남','일본','태국','몽골','필리핀','인도네시아','우즈베키스탄','네팔','캄보디아','키르기스스탄','카자흐스탄','타지키스탄','투르크메니스탄','미얀마','라오스','말레이시아','싱가포르','인도','방글라데시','파키스탄','스리랑카',
  '미국','캐나다','멕시코','브라질','아르헨티나','콜롬비아','칠레','페루','베네수엘라','에콰도르','볼리비아','파라과이','우루과이',
  '영국','독일','프랑스','이탈리아','스페인','포르투갈','네덜란드','벨기에','스위스','오스트리아','스웨덴','노르웨이','덴마크','핀란드','폴란드','체코','헝가리','루마니아','그리스','우크라이나','러시아','터키',
  '오스트레일리아','뉴질랜드',
  '이집트','사우디아라비아','아랍에미리트','이란','이라크','이스라엘','요르단','쿠웨이트','카타르','바레인','오만','레바논','시리아','아프가니스탄',
  '나이지리아','에티오피아','케냐','가나','남아프리카공화국','탄자니아','우ганда','잠비아','짐바브웨','모로코','튀니지','알제리','수단',
  '기타'
];

let masterState = { teachers: [] };

function syncStudentsFromMaster() {
  const all = [];
  masterState.teachers.forEach(t => (t.students || []).forEach(s => { if (!all.includes(s.name)) all.push(s.name); }));
  if (all.length > 0) state.students = all;
}

async function loadMaster() {
  try {
    const r = await window.storage.get(MASTER_KEY);
    if (r && r.value) {
      const data = JSON.parse(r.value);
      masterState.teachers = data.teachers || [];
      syncStudentsFromMaster();
    }
  } catch (e) { console.warn('Master load failed:', e); }
}

async function saveMaster() {
  try {
    await window.storage.set(MASTER_KEY, JSON.stringify(masterState));
    syncStudentsFromMaster();
    await persistTeacher();
  } catch (e) { console.warn('Master save failed:', e); }
}

async function loadStudentsProgress(names) {
  const cache = {};
  await Promise.all(names.map(async name => {
    try {
      const r = await window.storage.get(studentKey(name));
      cache[name] = (r && r.value) ? (JSON.parse(r.value).stats || defaultStats()) : defaultStats();
    } catch (e) { cache[name] = defaultStats(); }
  }));
  return cache;
}

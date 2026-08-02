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
// 계정으로 옮긴 뒤에도 되돌릴 사본은 남겨둔다 (접두어 + 원래 키)
const BACKUP_PREFIX = 'korean_migrated_backup_';
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
  // 단원은 교사 계정에 속한다. 로그인 전에는 저장할 곳이 없다
  const uid = state.currentUser && state.currentUser.uid;
  if (!uid || _savingTeacher) return;
  _savingTeacher = true;
  try {
    await _withRetry(() => fbSaveTeacher(uid, { units: state.units, language: state.language }), 3);
    if (!_storageOK) { _storageOK = true; toast('저장 복구됨', 'success'); }
    return true;
  } catch (e) {
    if (_storageOK) { _storageOK = false; toast('⚠️ 자동저장 일시 중단', 'accent'); }
    console.warn('Teacher save failed:', e.message || e);
    return false;
  } finally { _savingTeacher = false; }
}

async function _doSaveStudent() {
  if (!state.currentStudent || _savingStudent) return;
  _savingStudent = true;
  try {
    const doc = state.currentStudentDoc;
    if (doc && doc.firestoreId) {
      // 등록 학생: Firestore에 저장해야 교사 화면과 다른 기기에서도 보인다
      await _withRetry(() => fbUpdateStudent(doc.firestoreId, { stats: state.stats }), 3);
      doc.stats = { ...state.stats }; // 리더보드가 참조하는 캐시 갱신
    } else {
      // 게스트: Firestore 문서가 없으므로 이 기기에만 남긴다
      const payload = JSON.stringify({ stats: state.stats });
      await _withRetry(() => window.storage.set(studentKey(state.currentStudent), payload), 3);
    }
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

// 이 기기에 남아 있는 옛 단원 데이터를 읽는다. 없으면 null
async function _readLocalUnits() {
  for (const key of [TEACHER_KEY, LEGACY_KEY]) {
    try {
      const r = await window.storage.get(key);
      if (!r || !r.value) continue;
      const data = JSON.parse(r.value);
      if (Array.isArray(data.units) && data.units.length > 0) {
        return { units: data.units, language: data.settings && data.settings.language };
      }
    } catch (e) { console.warn('Local units read failed:', e); }
  }
  return null;
}

// 로그인한 교사의 단원과 설정을 Firestore에서 읽는다.
// Firestore에 아직 없으면 이 기기의 옛 데이터를 1회 올린다.
// 플래그를 두지 않고 "필드가 있으면 그걸 쓴다"로 판단해 몇 번 실행돼도 안전하다
async function loadTeacherData(teacher) {
  state.language = teacher.language || 'en';

  if (Array.isArray(teacher.units)) {
    state.units = teacher.units.length > 0 ? teacher.units : [SAMPLE_UNIT];
    return;
  }

  const legacy = await _readLocalUnits();
  if (!legacy) { state.units = [SAMPLE_UNIT]; return; }

  state.units = legacy.units;
  if (legacy.language) state.language = legacy.language;

  if (await _doSaveTeacher()) {
    // 옮긴 원본은 치운다. 그대로 두면 같은 브라우저에서 다음에 로그인한
    // 교사가 남의 단원을 가져가 버린다
    await _archiveLocalUnits();
    toast(`이 기기에 있던 단원 ${legacy.units.length}개를 계정으로 옮겼습니다`, 'success');
  }
}

// 계정으로 옮긴 로컬 단원을 백업 키로 이동시켜 다시 소비되지 않게 한다
async function _archiveLocalUnits() {
  for (const key of [TEACHER_KEY, LEGACY_KEY]) {
    try {
      const r = await window.storage.get(key);
      if (!r || !r.value) continue;
      await window.storage.set(BACKUP_PREFIX + key, r.value);
      await window.storage.delete(key);
    } catch (e) { console.warn('Local units archive failed:', e); }
  }
}

// 이 기기에 남아 있는 옛 학습 기록을 읽는다. 없으면 null
async function _readLocalStats(name) {
  try {
    const r = await _withRetry(() => window.storage.get(studentKey(name)), 3);
    if (r && r.value) return { ...defaultStats(), ...(JSON.parse(r.value).stats || {}) };
  } catch (e) { console.warn('Local stats read failed:', e); }
  return null;
}

// 등록 학생은 Firestore에서, 게스트는 이 기기에서 학습 기록을 읽는다
async function loadStudentStats(studentDoc, name) {
  state.stats = defaultStats();

  if (!studentDoc || !studentDoc.firestoreId) {
    const local = await _readLocalStats(name);
    if (local) state.stats = local;
    return;
  }

  if (studentDoc.stats) {
    state.stats = { ...defaultStats(), ...studentDoc.stats };
    return;
  }

  // Firestore에 기록이 아직 없는 학생: 이 기기의 옛 기록을 1회 올려준다
  const legacy = await _readLocalStats(name);
  if (!legacy) return;
  state.stats = legacy;
  try {
    await fbUpdateStudent(studentDoc.firestoreId, { stats: legacy });
    studentDoc.stats = legacy;
    // 올린 뒤 로컬 원본을 지운다. 동명이인이 다음에 이 기기를 쓸 때
    // 남의 기록을 물려받는 것을 막는다
    await window.storage.delete(studentKey(name));
  } catch (e) { console.warn('Stats migration failed:', e); }
}


/* =========================================================
   MASTER ADMIN (Firebase Firestore로 이전, 전역 캐시만 유지)
   ========================================================= */
const NATIONALITIES = [
  '중국','베트남','일본','태국','몽골','필리핀','인도네시아','우즈베키스탄','네팔','캄보디아','키르기스스탄','카자흐스탄','타지키스탄','투르크메니스탄','미얀마','라오스','말레이시아','싱가포르','인도','방글라데시','파키스탄','스리랑카',
  '미국','캐나다','멕시코','브라질','아르헨티나','콜롬비아','칠레','페루','베네수엘라','에콰도르','볼리비아','파라과이','우루과이',
  '영국','독일','프랑스','이탈리아','스페인','포르투갈','네덜란드','벨기에','스위스','오스트리아','스웨덴','노르웨이','덴마크','핀란드','폴란드','체코','헝가리','루마니아','그리스','우크라이나','러시아','터키',
  '오스트레일리아','뉴질랜드',
  '이집트','사우디아라비아','아랍에미리트','이란','이라크','이스라엘','요르단','쿠웨이트','카타르','바레인','오만','레바논','시리아','아프가니스탄',
  '나이지리아','에티오피아','케냐','가나','남아프리카공화국','탄자니아','우간다','잠비아','짐바브웨','모로코','튀니지','알제리','수단',
  '기타'
];

// Firestore 로그인 후 onAuthLogin()에서 채워짐
let masterState = { teachers: [] };

// 한 교사의 학생 학습 기록을 Firestore에서 한 번에 읽어 이름별로 정리한다
async function loadStudentsProgress(teacherId) {
  const cache = {};
  try {
    const students = await fbGetStudents(teacherId);
    students.forEach(s => { cache[s.name] = { ...defaultStats(), ...(s.stats || {}) }; });
  } catch (e) { console.warn('Progress load failed:', e); }
  return cache;
}

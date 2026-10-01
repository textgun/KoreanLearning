// 실제 src 스크립트를 jsdom에 올려 권한 관련 클라이언트 동작을 검증하는 테스트
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

// build.py와 같은 순서. app.js는 실제 Firebase 인증을 기다리므로 뺀다
const SCRIPTS = ['config.js', 'storage.js', 'api.js', 'utils.js', 'router.js', 'views-teacher.js', 'views-student.js', 'firebase.js'];
const CODE = SCRIPTS.map(f => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8')).join('\n');

// 앱이 쓰는 compat API 중 이 테스트에 필요한 만큼만 흉내 낸 메모리 Firestore
function makeFakeDb(initial = {}) {
  const store = new Map(Object.entries(initial));
  const ops = [];
  const docRef = (path) => ({
    path,
    id: path.split('/').pop(),
    async get() {
      const d = store.get(path);
      return { exists: !!d, id: path.split('/').pop(), data: () => (d ? structuredClone(d) : undefined) };
    },
    async set(data, opts) {
      store.set(path, opts && opts.merge ? { ...(store.get(path) || {}), ...data } : { ...data });
    },
    async delete() { store.delete(path); }
  });
  const query = (name, field, value) => ({
    limit() { return this; },
    async get() {
      const docs = [...store.entries()]
        .filter(([p, d]) => p.split('/')[0] === name && d[field] === value)
        .map(([p, d]) => ({ id: p.split('/')[1], ref: docRef(p), data: () => structuredClone(d) }));
      return { docs, empty: docs.length === 0 };
    }
  });
  return {
    store,
    ops,
    collection: (name) => ({
      doc: (id) => docRef(`${name}/${id}`),
      where: (field, _op, value) => query(name, field, value)
    }),
    batch() {
      const pending = [];
      return {
        delete(ref) { pending.push(ref.path); },
        async commit() { pending.forEach(p => { ops.push(`delete ${p}`); store.delete(p); }); }
      };
    }
  };
}

// eval로 올리면 최상위 let(state 등)이 그 eval 안에 갇힌다.
// 브라우저처럼 <script>로 실행해야 이후 w.eval에서 state를 볼 수 있다
function loadApp(db) {
  const dom = new JSDOM('<!DOCTYPE html><body><div id="app"></div><div id="toast"></div><div id="modal-root"></div></body>',
    { runScripts: 'dangerously', url: 'https://example.test/' });
  const w = dom.window;
  w.firebase = {
    apps: [],
    initializeApp: () => ({}),
    firestore: Object.assign(() => db, { FieldValue: { serverTimestamp: () => 'TS', delete: () => 'DEL' } }),
    auth: () => ({ onAuthStateChanged() {}, signOut: async () => {} })
  };
  const script = w.document.createElement('script');
  script.textContent = CODE;
  w.document.body.appendChild(script);
  return w;
}

describe('매칭 카드 (1차 #3)', () => {
  test('교재 문자열을 HTML로 해석하지 않는다', () => {
    const w = loadApp(makeFakeDb());
    w.eval(`
      state.units = [{ id: 7, title: 't', grammar: [], quizzes: [], vocabulary: [
        { word: '<img src=x onerror="window.__pwned=1">', emoji: '<b>e</b>', translations: { en: '<svg onload="window.__pwned=2"></svg>' } },
        { word: '공원', emoji: '🌿', translations: { en: 'park' } },
        { word: '도서관', emoji: '📚', translations: { en: 'library' } },
        { word: '박물관', emoji: '🏛', translations: { en: 'museum' } }
      ] }];
      state.sharedUnits = [];
      state.currentUnitId = 7;
      initGame('matching');
    `);
    const node = w.eval('renderMatchingGame()');
    w.document.body.appendChild(node);
    assert.equal(node.querySelectorAll('img, svg, b').length, 0);
    assert.ok(node.textContent.includes('<img src=x'));
    assert.ok(node.textContent.includes('<svg onload'));
    assert.equal(w.__pwned, undefined);
  });
});

describe('삭제 시 원격 접속 연결 정리 (1차 #2)', () => {
  test('학생을 지우면 연결 문서도 같은 일괄 처리로 지운다', async () => {
    const db = makeFakeDb();
    const w = loadApp(db);
    await w.fbDeleteStudent('s1', 'u1');
    assert.deepEqual(db.ops, ['delete students/s1', 'delete studentIndex/u1']);
    db.ops.length = 0;
    await w.fbDeleteStudent('s2');
    assert.deepEqual(db.ops, ['delete students/s2']);
  });

  test('교사를 지우면 그 반 학생과 고아 연결까지 지우고 다른 반은 건드리지 않는다', async () => {
    const db = makeFakeDb({
      'teachers/tA': { name: 'A' },
      'students/s1': { name: '민수', teacherId: 'tA', authUid: 'u1' },
      'students/s2': { name: '지영', teacherId: 'tA' },
      'students/s3': { name: '하늘', teacherId: 'tB', authUid: 'u3' },
      'studentIndex/u1': { studentId: 's1', teacherId: 'tA' },
      'studentIndex/uOld': { studentId: 's2', teacherId: 'tA' },
      'studentIndex/u3': { studentId: 's3', teacherId: 'tB' }
    });
    const w = loadApp(db);
    await w.fbDeleteTeacherDoc('tA');
    assert.deepEqual([...db.ops].sort(), [
      'delete studentIndex/u1', 'delete studentIndex/uOld',
      'delete students/s1', 'delete students/s2', 'delete teachers/tA'
    ]);
    assert.ok(db.store.has('students/s3') && db.store.has('studentIndex/u3'));
  });
});

describe('교사 승인 (2차 검토 N1)', () => {
  test('문서가 없는 계정은 승인 대기 문서를 만들고 대기 화면으로 간다', async () => {
    const db = makeFakeDb();
    const w = loadApp(db);
    await w.onAuthLogin({ uid: 'tN', email: 'new@school.test' });
    assert.equal(db.store.get('teachers/tN').approved, false);
    assert.equal(db.store.get('teachers/tN').isAdmin, false);
    assert.equal(w.eval('state.view'), 'teacher-pending');
    assert.equal(db.store.has('curricula/tN'), false, '승인 전에는 샘플 단원도 저장하지 않는다');
  });

  test('승인 대기 교사는 단원을 읽지 않는다', async () => {
    const db = makeFakeDb({
      'teachers/tP': { name: 'P', approved: false },
      'curricula/tP': { units: [{ id: 1, title: '옛 단원' }] }
    });
    const w = loadApp(db);
    await w.onAuthLogin({ uid: 'tP', email: 'p@school.test' });
    assert.equal(w.eval('state.view'), 'teacher-pending');
    assert.equal(w.eval('state.units.length'), 0);
    assert.equal(w.eval('state.currentTeacher'), null);
  });

  test('승인 대기 교사는 다른 화면으로 이동해도 대기 화면에 머문다', () => {
    const w = loadApp(makeFakeDb());
    w.eval(`state.currentUser = { uid: 'tP', name: 'P', approved: false }; state.view = 'teacher'; render();`);
    assert.equal(w.eval('state.view'), 'teacher-pending');
    assert.ok(w.document.getElementById('app').textContent.includes('관리자 승인 대기 중'));
  });

  test('approved 필드가 없는 기존 교사는 평소대로 단원을 읽는다', async () => {
    const db = makeFakeDb({
      'teachers/tA': { name: 'A', isAdmin: false },
      'curricula/tA': { units: [{ id: 1, title: '내 단원', vocabulary: [], grammar: [], quizzes: [] }], language: 'en' },
      'students/s1': { name: '민수', teacherId: 'tA' }
    });
    const w = loadApp(db);
    await w.onAuthLogin({ uid: 'tA', email: 'a@school.test' });
    assert.equal(w.eval('state.view'), 'home');
    assert.equal(w.eval('state.units[0].title'), '내 단원');
    assert.equal(w.eval('state.currentTeacher.students.length'), 1);
  });
});

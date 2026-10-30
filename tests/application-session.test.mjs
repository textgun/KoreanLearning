// 계정 변경 전 응답 차단과, 모집 전·모집 종료 후 신청 결과 조회 화면을 검증한다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const settle = () => new Promise(resolve => setTimeout(resolve, 0));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const page = name => new JSDOM(readFileSync(`Concept/${name}.html`, 'utf8'), { runScripts: 'outside-only' });

test('계정 전환 뒤 관리자 요청의 늦은 응답을 폐기하고 새 조회를 수행한다', async () => {
  const dom = page('admin'); let user = { uid: 'admin' }, listener;
  const old = deferred(), latest = deferred(); let calls = 0;
  dom.window.applicationReady = Promise.resolve({ auth: { get currentUser() { return user; }, onAuthStateChanged(fn) { listener = fn; fn(user); } }, call() { return ++calls === 1 ? old.promise : latest.promise; } });
  dom.window.eval(readFileSync('Concept/admin.js', 'utf8')); await settle();
  user = null; listener(user); user = { uid: 'ordinary' }; listener(user);
  old.resolve({ items: [{ id: 'private', name: 'PRIVATE_NAME', email: 'private@example.invalid', status: 'pending', createdAt: 0 }], next: null }); await settle();
  assert.equal(calls, 2);
  assert.equal(dom.window.document.querySelector('#admin-workspace').hidden, true);
  assert.doesNotMatch(dom.window.document.body.textContent, /PRIVATE_NAME/);
  latest.reject(new Error('permission-denied')); await settle();
  assert.equal(dom.window.document.querySelector('#admin-workspace').hidden, true);
  assert.equal(dom.window.document.querySelector('#admin-logout').hidden, false);
  dom.window.close();
});

test('모집 종료 상태에서도 기존 신청자의 심사 결과를 조회한다', async () => {
  const dom = page('apply'); const calls = [];
  const user = { uid: 'teacher', email: 'teacher@example.invalid', emailVerified: true };
  dom.window.applicationReady = Promise.resolve({ policy: { acceptingApplications: false, statusLookupOpen: true }, auth: { currentUser: user, onAuthStateChanged(fn) { fn(user); } }, call: async name => { calls.push(name); return { status: 'approved', reviewMessage: '승인했습니다.' }; } });
  dom.window.eval(readFileSync('Concept/apply.js', 'utf8')); await settle();
  assert.equal(dom.window.document.querySelector('#account-panel').hidden, false);
  assert.equal(dom.window.document.querySelector('#account-create').hidden, true);
  assert.match(dom.window.document.querySelector('#submission-status').textContent, /승인했습니다/);
  assert.deepEqual(calls, ['getTeacherApplication']);
  dom.window.close();
});

test('로그아웃 뒤 이전 신청 결과 응답이 다시 표시되지 않는다', async () => {
  const dom = page('apply'); const old = deferred(); let user = { uid: 'teacher', email: 'teacher@example.invalid' }, listener;
  dom.window.applicationReady = Promise.resolve({ policy: { acceptingApplications: false, statusLookupOpen: true }, auth: { get currentUser() { return user; }, onAuthStateChanged(fn) { listener = fn; fn(user); } }, call: () => old.promise });
  dom.window.eval(readFileSync('Concept/apply.js', 'utf8')); await settle();
  user = null; listener(null);
  old.resolve({ status: 'rejected', reviewMessage: 'PRIVATE_REVIEW' }); await settle();
  assert.doesNotMatch(dom.window.document.body.textContent, /PRIVATE_REVIEW/);
  dom.window.close();
});

test('첫 모집 전에는 결과 조회 패널을 숨기고 서버를 호출하지 않는다', async () => {
  const dom = page('apply'); const calls = []; let listened = false;
  const user = { uid: 'teacher', email: 'teacher@example.invalid', emailVerified: true };
  dom.window.applicationReady = Promise.resolve({ policy: { acceptingApplications: false, statusLookupOpen: false }, auth: { currentUser: user, onAuthStateChanged(fn) { listened = true; fn(user); } }, call: async name => { calls.push(name); return null; } });
  dom.window.eval(readFileSync('Concept/apply.js', 'utf8')); await settle();
  assert.equal(dom.window.document.querySelector('#account-panel').hidden, true);
  assert.equal(dom.window.document.querySelector('.demo-badge').textContent, '접수 준비 중');
  assert.equal(listened, false);
  assert.deepEqual(calls, []);
  dom.window.close();
});

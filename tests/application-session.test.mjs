// 계정 변경 전 관리자 응답 차단을 검증한다.
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

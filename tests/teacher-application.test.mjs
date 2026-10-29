// 말이음 신청 화면의 입력 검증·수정·초기화와, 접수가 열렸을 때의 인증·동의·제출 흐름을 검증한다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

test('신청 시안은 유효한 입력만 진행하고 수정·초기화를 지원한다', () => {
  const dom = new JSDOM(readFileSync('Concept/apply.html', 'utf8'), { runScripts: 'outside-only' });
  const { document, Event } = dom.window;
  assert.doesNotMatch(document.body.textContent, /시안|체험/);
  assert.match(document.body.textContent, /접수 준비 중/);
  dom.window.eval(readFileSync('Concept/apply.js', 'utf8'));
  const field = id => document.getElementById(id);
  const fill = (id, value) => { field(id).value = value; field(id).dispatchEvent(new Event('input')); };
  const submit = () => field('application-form').dispatchEvent(new Event('submit', { cancelable: true }));
  submit();
  assert.equal(field('teacher-name').getAttribute('aria-invalid'), 'true');
  assert.equal(document.activeElement.id, 'teacher-name');
  fill('teacher-name', '   ');
  fill('teacher-email', 'invalid');
  fill('teacher-language', '한국어');
  submit();
  assert.equal(field('teacher-name').getAttribute('aria-invalid'), 'true');
  assert.equal(field('teacher-email').getAttribute('aria-invalid'), 'true');
  fill('teacher-name', '시안 선생님');
  fill('teacher-email', 'demo@example.com');
  submit();
  assert.equal(document.querySelector('[data-step="1"]').hidden, false);
  submit();
  assert.equal(field('teacher-experience').getAttribute('aria-invalid'), 'true');
  fill('teacher-experience', '처음 시작해요');
  fill('teacher-introduction', '<img src=x onerror=alert(1)> 한국어를 나눠요.');
  submit();
  const review = document.querySelector('[data-review="teacher-introduction"]');
  assert.equal(review.querySelector('img'), null);
  assert.match(review.textContent, /<img/);
  field('previous').click();
  assert.match(field('teacher-introduction').value, /한국어/);
  fill('teacher-introduction', '함께 한국어를 배워요.');
  submit();
  assert.equal(review.textContent, '함께 한국어를 배워요.');
  submit();
  assert.equal(field('completion').hidden, false);
  assert.match(field('completion').textContent, /작성 내용은 저장되거나 접수되지 않았습니다/);
  field('restart').click();
  assert.equal(field('completion').hidden, true);
  assert.equal(field('teacher-email').value, '');
  assert.equal(review.textContent, '');
  assert.equal(document.querySelector('[aria-current="step"]').textContent.trim(), '01 기본 정보');
  dom.window.close();
});

test('접수가 열리면 이메일 인증과 동의를 확인한 뒤 서버에 제출하고, 다시 작성할 때 계정 이메일을 유지한다', async () => {
  const dom = new JSDOM(readFileSync('Concept/apply.html', 'utf8'), { runScripts: 'outside-only' });
  const { document, Event } = dom.window;
  const calls = [];
  let user = { email: 'teacher@example.com', emailVerified: false };
  const client = {
    policy: { acceptingApplications: true, version: 'test-version' },
    auth: { get currentUser() { return user; }, onAuthStateChanged(listener) { listener(user); } },
    call: async (name, data) => {
      calls.push([name, data]);
      return name === 'submitTeacherApplication' ? { id: 'uid-1', status: 'pending', duplicate: false } : null;
    },
  };
  dom.window.applicationReady = Promise.resolve(client);
  dom.window.eval(readFileSync('Concept/apply.js', 'utf8'));
  const settle = () => new Promise(resolve => setTimeout(resolve, 0));
  await settle();
  const field = id => document.getElementById(id);
  const fill = (id, value) => { field(id).value = value; field(id).dispatchEvent(new Event('input')); };
  const submit = async () => { field('application-form').dispatchEvent(new Event('submit', { cancelable: true })); await settle(); };
  assert.equal(field('account-panel').hidden, false);
  assert.equal(field('teacher-email').readOnly, true);
  assert.equal(field('teacher-email').value, 'teacher@example.com');
  fill('teacher-name', '김말이음');
  fill('teacher-language', '한국어');
  await submit();
  fill('teacher-experience', '처음 시작해요');
  fill('teacher-introduction', '함께 한국어를 배워요.');
  await submit();
  assert.match(field('next').textContent, /신청서 제출하기/);
  await submit();
  assert.match(field('submission-status').textContent, /이메일 인증/);
  user.emailVerified = true;
  await submit();
  assert.match(field('submission-status').textContent, /동의/);
  assert.equal(calls.some(([name]) => name === 'submitTeacherApplication'), false);
  field('adult-consent').checked = true;
  field('privacy-consent').checked = true;
  await submit();
  const [, sent] = calls.find(([name]) => name === 'submitTeacherApplication');
  // jsdom 창에서 만든 객체라 Node 쪽 객체로 복사해 비교한다.
  assert.deepEqual({ ...sent }, { name: '김말이음', languages: '한국어', experience: '처음 시작해요', introduction: '함께 한국어를 배워요.',
    adultConfirmed: true, privacyConsent: true, policyVersion: 'test-version' });
  assert.equal(field('completion').hidden, false);
  assert.match(field('completion').textContent, /접수 번호: uid-1/);
  field('restart').click();
  assert.equal(field('teacher-email').value, 'teacher@example.com');
  dom.window.close();
});

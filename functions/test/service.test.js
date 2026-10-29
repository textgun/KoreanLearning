// Firestore 에뮬레이터에서 실제 신청 트랜잭션과 권한·알림·만료 처리를 검증한다.
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { createService } = require('../service');
let app, db, service;
let clock = Date.UTC(2026, 9, 30);
const policy = { ...require('../application-policy.json'), acceptingApplications: true };
const user = uid => ({ uid, token: { email: `${uid}@example.com`, email_verified: true } });
const data = () => ({ name: '신청자', languages: '한국어', experience: '처음 시작해요', introduction: '함께 배워요', adultConfirmed: true, privacyConsent: true, policyVersion: policy.version });
before(() => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Emulator required');
  app = initializeApp({ projectId: 'demo-application-service' }, 'application-tests');
  db = getFirestore(app); service = createService(db, policy, () => clock);
});
after(async () => { await deleteApp(app); });
beforeEach(async () => {
  clock = Date.UTC(2026, 9, 30);
  for (const name of ['teacherApplications', 'teachers']) await db.recursiveDelete(db.collection(name));
  await db.doc('teachers/admin').set({ isAdmin: true, approved: true });
});
test('인증·이메일 인증·동의·버전·연령 및 서버 접수 개시를 강제한다', async () => {
  await assert.rejects(service.submit(null, data()), { code: 'unauthenticated' });
  await assert.rejects(service.submit({ uid: 'x', token: { email: 'x@example.com' } }, data()), { code: 'failed-precondition' });
  await assert.rejects(service.submit(user('x'), { ...data(), adultConfirmed: false }), { code: 'invalid-argument' });
  await assert.rejects(service.submit(user('x'), { ...data(), privacyConsent: false }), { code: 'invalid-argument' });
  await assert.rejects(service.submit(user('x'), { ...data(), policyVersion: 'old' }), { code: 'invalid-argument' });
  await assert.rejects(service.submit(user('x'), { ...data(), introduction: ' ' }), { code: 'invalid-argument' });
  await assert.rejects(createService(db, { ...policy, acceptingApplications: false }).submit(user('x'), data()), { code: 'failed-precondition' });
});
test('동시 중복 제출은 신청서 하나만 만들고 사용자 이메일 위조를 무시한다', async () => {
  const results = await Promise.all([service.submit(user('x'), data()), service.submit(user('x'), { ...data(), email: 'other@example.com' })]);
  assert.equal(results.filter(r => !r.duplicate).length, 1);
  const saved = (await db.doc('teacherApplications/x').get()).data();
  assert.equal(saved.email, 'x@example.com'); assert.equal(saved.status, 'pending');
  assert.equal(saved.expiresAt.toMillis() - saved.createdAt.toMillis(), 90 * 86400000);
});
test('일반 사용자는 목록·심사를 수행할 수 없고 본인 상태만 받는다', async () => {
  await service.submit(user('x'), data());
  assert.equal(await service.getOwn(user('y')), null);
  await assert.rejects(service.list(user('x')), { code: 'permission-denied' });
  await assert.rejects(service.review(user('x'), { id: 'x', status: 'approved', revision: 0, message: '승인' }), { code: 'permission-denied' });
});
test('승인과 반려의 경쟁에서 한 처리만 성공하고 승인 시 권한이 연결된다', async () => {
  await service.submit(user('x'), data());
  const input = { id: 'x', revision: 0, message: '심사 완료' };
  const results = await Promise.allSettled([service.review(user('admin'), { ...input, status: 'approved' }), service.review(user('admin'), { ...input, status: 'rejected' })]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  const saved = (await db.doc('teacherApplications/x').get()).data();
  const teacher = await db.doc('teachers/x').get();
  assert.equal(teacher.exists, saved.status === 'approved');
  if (teacher.exists) { assert.equal(teacher.data().isAdmin, false); assert.equal(saved.expiresAt, undefined); }
});
test('보류 후 승인하며 기존 강사 문서의 메모·공개 프로필을 건드리지 않는다', async () => {
  await db.doc('teachers/x').set({ approved: false, isAdmin: false, note: '기존 메모' });
  await service.submit(user('x'), data());
  await service.review(user('admin'), { id: 'x', status: 'hold', revision: 0, message: '추가 설명 필요' });
  await assert.rejects(service.review(user('admin'), { id: 'x', status: 'approved', revision: 0, message: '승인' }), { code: 'aborted' });
  await service.review(user('admin'), { id: 'x', status: 'approved', revision: 1, message: '설명 확인' });
  assert.equal((await db.doc('teachers/x').get()).data().note, '기존 메모');
  assert.equal((await db.doc('teacherProfiles/x').get()).exists, false);
  assert.equal((await service.getOwn(user('x'))).status, 'approved');
});
test('90일 만료 시 미승인 신청만 삭제하며 승인 신청은 유지한다', async () => {
  await service.submit(user('x'), data()); await service.submit(user('y'), data());
  await service.review(user('admin'), { id: 'y', status: 'approved', revision: 0, message: '승인' });
  clock += 90 * 86400000 + 1;
  await assert.rejects(service.review(user('admin'), { id: 'x', status: 'approved', revision: 0, message: '승인' }), { code: 'failed-precondition' });
  assert.equal(await service.purgeExpired(), 1);
  assert.equal((await db.doc('teacherApplications/y').get()).exists, true);
});
test('메일 실패는 접수를 유지하며 재시도 성공 후 반복 발송하지 않는다', async () => {
  await service.submit(user('x'), data());
  await service.notifyDue(async () => { throw new Error('SMTP failure'); });
  let saved = (await db.doc('teacherApplications/x').get()).data();
  assert.equal(saved.status, 'pending'); assert.equal(saved.notificationState, 'failed');
  clock += 3600001; let sent = 0;
  await service.notifyDue(async message => {
    sent++; assert.equal(message.to, 'piction825@gmail.com');
    assert.ok(!message.text.includes('x@example.com')); assert.ok(!message.text.includes('함께 배워요'));
    return { accepted: [message.to] };
  });
  await service.notifyDue(async () => { sent++; });
  assert.equal(sent, 1); assert.equal((await db.doc('teacherApplications/x').get()).data().notificationState, 'sent');
});
test('메일 발송 작업의 동시 실행은 한 번만 점유한다', async () => {
  await service.submit(user('x'), data()); let sends = 0;
  const send = async () => { sends++; return { accepted: ['ok'] }; };
  await Promise.all([service.notifyDue(send), service.notifyDue(send)]);
  assert.equal(sends, 1);
});

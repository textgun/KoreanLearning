// Firestore 에뮬레이터에서 이전 계정의 학생·단원 이전과 새 관리자 지정, 이전 계정 삭제를 검증한다.
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { createAccountTransfer } = require('../scripts/account-transfer');
let app, db;
const users = { 'old@example.com': 'oldUid', 'new@example.com': 'newUid', 'kid@student.korean-learning.app': 'kidUid' };
function fakeAuth(events) {
  return {
    async getUserByEmail(email) {
      if (!users[email]) throw Object.assign(new Error('user not found'), { code: 'auth/user-not-found' });
      return { uid: users[email], email };
    },
    async deleteUser(uid) {
      events.push(['deleteUser', uid, (await db.doc(`teachers/${uid}`).get()).exists]);
    },
  };
}
before(() => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Emulator required');
  app = initializeApp({ projectId: 'demo-application-service' }, 'account-transfer-tests');
  db = getFirestore(app);
});
after(async () => { await deleteApp(app); });
beforeEach(async () => {
  for (const name of ['teachers', 'curricula', 'students', 'studentIndex', 'teacherApplications', 'teacherProfiles']) {
    await db.recursiveDelete(db.collection(name));
  }
});

test('같은 계정이나 학생 원격 접속 계정은 대상으로 받지 않는다', async () => {
  const transfer = createAccountTransfer(db, fakeAuth([]));
  await assert.rejects(transfer.plan('old@example.com', 'OLD@example.com'), /서로 다르게/);
  await assert.rejects(transfer.plan('old@example.com', 'kid@student.korean-learning.app'), /학생 원격 접속/);
  await db.doc('studentIndex/newUid').set({ studentId: 's', teacherId: 'x', code: '1' });
  await assert.rejects(transfer.plan('old@example.com', 'new@example.com'), /학생 원격 접속/);
});

test('미리보기는 아무것도 바꾸지 않고, 실행하면 학생·단원을 옮긴 뒤 이전 계정을 지운다', async () => {
  await db.doc('teachers/oldUid').set({ name: '이전', email: 'old@example.com', phone: '010', isAdmin: true, approved: true });
  await db.doc('teachers/newUid').set({ name: '새', email: 'new@example.com', isAdmin: false, approved: false, note: '유지' });
  await db.doc('curricula/oldUid').set({ units: [{ id: 1, title: '이전 계정이 고친 단원' }, { id: 5, title: '이전 단원' }], language: 'ja' });
  await db.doc('curricula/newUid').set({ units: [{ id: 1, title: '샘플' }, { id: 9, title: '새 단원' }], language: 'en' });
  await db.doc('students/s1').set({ name: '학생1', teacherId: 'oldUid', authUid: 'a1', stats: { score: 3 } });
  await db.doc('students/s2').set({ name: '학생2', teacherId: 'oldUid' });
  await db.doc('students/s3').set({ name: '다른 반', teacherId: 'otherUid' });
  await db.doc('studentIndex/a1').set({ studentId: 's1', teacherId: 'oldUid', code: '123' });
  await db.doc('teacherApplications/oldUid').set({ status: 'approved' });
  await db.doc('teacherProfiles/oldUid').set({ displayName: '이전' });
  const events = [];
  const transfer = createAccountTransfer(db, fakeAuth(events));

  const plan = await transfer.plan('old@example.com', 'new@example.com');
  assert.equal(plan.oldIsAdmin, true);
  assert.equal(plan.students, 2);
  assert.equal(plan.studentLinks, 1);
  assert.deepEqual(plan.units, { fromOld: 2, keptFromNew: 1, replacedOnNew: 1 });
  assert.equal((await db.doc('teachers/oldUid').get()).exists, true);
  assert.equal((await db.doc('students/s1').get()).data().teacherId, 'oldUid');
  assert.deepEqual(events, []);

  await transfer.execute(plan);
  const newTeacher = (await db.doc('teachers/newUid').get()).data();
  assert.equal(newTeacher.isAdmin, true);
  assert.equal(newTeacher.approved, true);
  assert.equal(newTeacher.note, '유지');
  const curriculum = (await db.doc('curricula/newUid').get()).data();
  assert.deepEqual(curriculum.units.map(unit => unit.title), ['이전 계정이 고친 단원', '이전 단원', '새 단원']);
  assert.equal(curriculum.language, 'ja');
  assert.equal((await db.doc('students/s1').get()).data().teacherId, 'newUid');
  assert.deepEqual((await db.doc('students/s1').get()).data().stats, { score: 3 });
  assert.equal((await db.doc('students/s2').get()).data().teacherId, 'newUid');
  assert.equal((await db.doc('students/s3').get()).data().teacherId, 'otherUid');
  assert.equal((await db.doc('studentIndex/a1').get()).data().teacherId, 'newUid');
  for (const path of ['teachers/oldUid', 'curricula/oldUid', 'teacherApplications/oldUid', 'teacherProfiles/oldUid']) {
    assert.equal((await db.doc(path).get()).exists, false, path);
  }
  // 인증 계정은 서버 문서를 지운 뒤 마지막에 한 번만 삭제한다.
  assert.deepEqual(events, [['deleteUser', 'oldUid', false]]);
});

test('새 계정의 강사 문서가 없으면 관리자로 새로 만든다', async () => {
  await db.doc('teachers/oldUid').set({ isAdmin: true, approved: true });
  const transfer = createAccountTransfer(db, fakeAuth([]), () => Date.UTC(2026, 9, 30));
  await transfer.execute(await transfer.plan('old@example.com', 'new@example.com'));
  const created = (await db.doc('teachers/newUid').get()).data();
  assert.equal(created.email, 'new@example.com');
  assert.equal(created.isAdmin, true);
  assert.equal(created.approved, true);
  assert.equal(created.status, 'teaching');
});

// 이전 강사 계정의 학생·단원을 새 계정으로 옮기고 새 계정을 관리자로 연 뒤 이전 계정의 서버 데이터를 지운다.
const { Timestamp } = require('firebase-admin/firestore');
const STUDENT_DOMAIN = /@student\.korean-learning\.app$/i;
const CHUNK = 400;

function createAccountTransfer(db, auth, now = () => Date.now()) {
  const doc = (collection, id) => db.collection(collection).doc(id);
  const ownedBy = (collection, uid) => db.collection(collection).where('teacherId', '==', uid);

  async function plan(oldEmail, newEmail) {
    if (!oldEmail || !newEmail || oldEmail.trim().toLowerCase() === newEmail.trim().toLowerCase()) {
      throw new Error('이전 계정과 새 계정 이메일을 서로 다르게 지정해 주세요.');
    }
    const [oldUser, newUser] = await Promise.all([auth.getUserByEmail(oldEmail.trim()), auth.getUserByEmail(newEmail.trim())]);
    if (STUDENT_DOMAIN.test(oldUser.email) || STUDENT_DOMAIN.test(newUser.email)) {
      throw new Error('학생 원격 접속 계정은 대상으로 지정할 수 없습니다.');
    }
    const [newLink, oldTeacher, newTeacher, oldCurriculum, newCurriculum, application, profile, students, links] = await Promise.all([
      doc('studentIndex', newUser.uid).get(), doc('teachers', oldUser.uid).get(), doc('teachers', newUser.uid).get(),
      doc('curricula', oldUser.uid).get(), doc('curricula', newUser.uid).get(),
      doc('teacherApplications', oldUser.uid).get(), doc('teacherProfiles', oldUser.uid).get(),
      ownedBy('students', oldUser.uid).get(), ownedBy('studentIndex', oldUser.uid).get(),
    ]);
    if (newLink.exists) throw new Error('새 계정이 학생 원격 접속에 연결되어 있어 강사로 쓸 수 없습니다.');
    const oldUnits = oldCurriculum.exists ? oldCurriculum.data().units || [] : [];
    const newUnits = newCurriculum.exists ? newCurriculum.data().units || [] : [];
    const oldIds = new Set(oldUnits.map(unit => unit.id));
    return {
      oldUser: { uid: oldUser.uid, email: oldUser.email },
      newUser: { uid: newUser.uid, email: newUser.email },
      oldIsAdmin: oldTeacher.exists && oldTeacher.data().isAdmin === true,
      newTeacherExists: newTeacher.exists,
      students: students.size,
      studentLinks: links.size,
      units: { fromOld: oldUnits.length, keptFromNew: newUnits.filter(unit => !oldIds.has(unit.id)).length,
        replacedOnNew: newUnits.filter(unit => oldIds.has(unit.id)).length },
      deletes: { teacher: oldTeacher.exists, curriculum: oldCurriculum.exists, application: application.exists,
        profile: profile.exists, authUser: true },
    };
  }

  async function commitInChunks(refs, patch) {
    for (let i = 0; i < refs.length; i += CHUNK) {
      const batch = db.batch();
      refs.slice(i, i + CHUNK).forEach(ref => batch.update(ref, patch));
      await batch.commit();
    }
  }

  // 단계마다 다시 조회하므로, 중간에 실패해도 같은 명령을 다시 실행하면 이어서 끝난다.
  async function execute({ oldUser, newUser }) {
    const oldUid = oldUser.uid;
    const newUid = newUser.uid;
    // 관리자가 한 명도 없는 순간이 생기지 않도록 새 계정 권한을 가장 먼저 연다.
    await db.runTransaction(async tx => {
      const ref = doc('teachers', newUid);
      const current = await tx.get(ref);
      if (current.exists) tx.update(ref, { isAdmin: true, approved: true });
      else tx.create(ref, { name: newUser.email.split('@')[0], email: newUser.email, phone: '', status: 'teaching',
        note: '', isAdmin: true, approved: true, createdAt: Timestamp.fromMillis(now()) });
    });
    // 같은 id의 단원은 실제로 쓰던 이전 계정 쪽을 남기고, 새 계정에만 있는 단원은 뒤에 붙인다.
    await db.runTransaction(async tx => {
      const [from, to] = await Promise.all([tx.get(doc('curricula', oldUid)), tx.get(doc('curricula', newUid))]);
      if (!from.exists) return;
      const oldUnits = from.data().units || [];
      const ids = new Set(oldUnits.map(unit => unit.id));
      const newUnits = to.exists ? to.data().units || [] : [];
      tx.set(doc('curricula', newUid), {
        units: [...oldUnits, ...newUnits.filter(unit => !ids.has(unit.id))],
        language: from.data().language || (to.exists && to.data().language) || 'en',
      }, { merge: true });
    });
    const [students, links] = await Promise.all([ownedBy('students', oldUid).get(), ownedBy('studentIndex', oldUid).get()]);
    await commitInChunks([...students.docs, ...links.docs].map(snapshot => snapshot.ref), { teacherId: newUid });
    const [leftStudents, leftLinks] = await Promise.all([ownedBy('students', oldUid).limit(1).get(), ownedBy('studentIndex', oldUid).limit(1).get()]);
    if (!leftStudents.empty || !leftLinks.empty) throw new Error('이전 계정에 남은 학생이 있어 삭제를 멈췄습니다. 다시 실행해 주세요.');
    const batch = db.batch();
    ['teacherApplications', 'teacherProfiles', 'curricula', 'teachers'].forEach(collection => batch.delete(doc(collection, oldUid)));
    await batch.commit();
    // 인증 계정은 되돌릴 수 없으니 서버 데이터를 모두 옮기고 지운 뒤 마지막에 삭제한다.
    await auth.deleteUser(oldUid);
  }

  return { plan, execute };
}

module.exports = { createAccountTransfer };

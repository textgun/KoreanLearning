// firestore.rules를 Firestore 에뮬레이터에서 검증하는 권한 테스트 (npm test로 실행)
import { readFileSync } from 'node:fs';
import { describe, test, before, after, beforeEach } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

const STUDENT_EMAIL = (code) => `s-${code}@student.korean-learning.app`;

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-korean-learning',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') }
  });
});

after(async () => { await env.cleanup(); });

// 교사 셋(관리자·기존 교사·승인 교사)과 승인 대기 교사 하나, 반마다 학생과 원격 접속 연결을 둔다
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'teachers/admin'), { name: '관리자', isAdmin: true });
    await setDoc(doc(db, 'teachers/tA'), { name: '기존교사', isAdmin: false, status: 'teaching', note: '' });
    await setDoc(doc(db, 'teachers/tB'), { name: '승인교사', isAdmin: false, approved: true, status: 'teaching' });
    await setDoc(doc(db, 'teachers/tP'), { name: '대기교사', isAdmin: false, approved: false, status: 'teaching' });
    for (const t of ['tA', 'tB', 'tP']) await setDoc(doc(db, `curricula/${t}`), { units: [{ id: 1, title: t }] });
    await setDoc(doc(db, 'students/sA1'), { name: '민수', teacherId: 'tA', authUid: 'uA1' });
    await setDoc(doc(db, 'students/sA2'), { name: '지영', teacherId: 'tA' });
    await setDoc(doc(db, 'students/sB1'), { name: '하늘', teacherId: 'tB', authUid: 'uB1' });
    await setDoc(doc(db, 'studentIndex/uA1'), { studentId: 'sA1', teacherId: 'tA', code: 'AAAA-2222' });
    await setDoc(doc(db, 'studentIndex/uB1'), { studentId: 'sB1', teacherId: 'tB', code: 'BBBB-3333' });
    await setDoc(doc(db, 'sharedCurriculum/main'), { units: [] });
  });
});

const teacher = (uid) => env.authenticatedContext(uid, { email: `${uid}@school.test` }).firestore();
const student = (uid, code = 'abcd2345') => env.authenticatedContext(uid, { email: STUDENT_EMAIL(code) }).firestore();
const classOf = (db, teacherId) => getDocs(query(collection(db, 'students'), where('teacherId', '==', teacherId)));

describe('교사 가입과 승인 (2차 검토 N1)', () => {
  test('새 가입자는 approved:false 문서만 만들 수 있다', async () => {
    const db = teacher('newbie');
    const base = { name: '신규', isAdmin: false, status: 'teaching', note: '' };
    await assertFails(setDoc(doc(db, 'teachers/newbie'), { ...base, approved: true }));
    await assertFails(setDoc(doc(db, 'teachers/newbie'), base));
    await assertFails(setDoc(doc(db, 'teachers/newbie'), { ...base, isAdmin: true, approved: false }));
    await assertSucceeds(setDoc(doc(db, 'teachers/newbie'), { ...base, approved: false }));
  });

  test('학생 원격 접속 계정은 교사 문서를 만들 수 없다', async () => {
    const db = student('uA1');
    await assertFails(setDoc(doc(db, 'teachers/uA1'), { name: 's', isAdmin: false, approved: false }));
  });

  test('승인 대기 교사는 자기 문서만 읽고 단원·명단·공용 단원에 접근하지 못한다', async () => {
    const db = teacher('tP');
    await assertSucceeds(getDoc(doc(db, 'teachers/tP')));
    await assertFails(getDoc(doc(db, 'curricula/tP')));
    await assertFails(setDoc(doc(db, 'curricula/tP'), { units: [] }));
    await assertFails(setDoc(doc(db, 'students/new'), { name: 'x', teacherId: 'tP' }));
    await assertFails(classOf(db, 'tP'));
    await assertFails(getDoc(doc(db, 'sharedCurriculum/main')));
  });

  test('approved 필드가 없는 기존 교사는 그대로 쓴다', async () => {
    const db = teacher('tA');
    await assertSucceeds(getDoc(doc(db, 'curricula/tA')));
    await assertSucceeds(setDoc(doc(db, 'curricula/tA'), { units: [] }, { merge: true }));
    await assertSucceeds(classOf(db, 'tA'));
    await assertSucceeds(getDoc(doc(db, 'sharedCurriculum/main')));
  });

  test('교사는 자기 권한·승인·상태·관리자 메모를 바꿀 수 없다', async () => {
    await assertFails(updateDoc(doc(teacher('tP'), 'teachers/tP'), { approved: true }));
    const db = teacher('tA');
    await assertFails(updateDoc(doc(db, 'teachers/tA'), { isAdmin: true }));
    await assertFails(updateDoc(doc(db, 'teachers/tA'), { approved: true }));
    await assertFails(updateDoc(doc(db, 'teachers/tA'), { status: 'training' }));
    await assertFails(updateDoc(doc(db, 'teachers/tA'), { note: '내가 쓴 메모' }));
    await assertSucceeds(updateDoc(doc(db, 'teachers/tA'), { phone: '010-1111-2222' }));
  });

  test('관리자가 승인하면 그때부터 접근할 수 있다', async () => {
    await assertSucceeds(updateDoc(doc(teacher('admin'), 'teachers/tP'), { approved: true }));
    await assertSucceeds(getDoc(doc(teacher('tP'), 'curricula/tP')));
  });

  test('삭제된 교사가 다시 로그인하면 승인 대기로 시작해 기존 단원을 못 본다', async () => {
    await assertSucceeds(deleteDoc(doc(teacher('admin'), 'teachers/tA')));
    const db = teacher('tA');
    await assertSucceeds(setDoc(doc(db, 'teachers/tA'), { name: '기존교사', isAdmin: false, approved: false }));
    await assertFails(getDoc(doc(db, 'curricula/tA')));
    await assertFails(classOf(db, 'tA'));
  });
});

describe('원격 접속 연결 위조 (1차 #1)', () => {
  test('다른 반 학생을 가리키는 연결은 만들 수 없다', async () => {
    const db = teacher('tA');
    await assertFails(setDoc(doc(db, 'studentIndex/uEvil'), { studentId: 'sB1', teacherId: 'tA', code: 'X' }));
    await assertFails(setDoc(doc(db, 'studentIndex/uEvil'), { studentId: 'sB1', teacherId: 'tB', code: 'X' }));
  });

  test('자기 반 학생 연결은 만들 수 있다', async () => {
    await assertSucceeds(setDoc(doc(teacher('tA'), 'studentIndex/uNew'), { studentId: 'sA2', teacherId: 'tA', code: 'CCCC-4444' }, { merge: true }));
  });

  test('기존 연결의 학생이나 교사를 바꿀 수 없다', async () => {
    const db = teacher('tA');
    await assertFails(updateDoc(doc(db, 'studentIndex/uA1'), { teacherId: 'tB' }));
    await assertFails(setDoc(doc(db, 'studentIndex/uA1'), { studentId: 'sA2' }, { merge: true }));
  });

  test('교사 계정을 학생으로 연결할 수 없다', async () => {
    await assertFails(setDoc(doc(teacher('tA'), 'studentIndex/tB'), { studentId: 'sA2', teacherId: 'tA', code: 'X' }));
  });

  test('승인 대기 교사는 연결을 만들 수 없다', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'students/sP1'), { name: 'p', teacherId: 'tP' });
    });
    await assertFails(setDoc(doc(teacher('tP'), 'studentIndex/uP'), { studentId: 'sP1', teacherId: 'tP', code: 'X' }));
  });

  test('학생 문서의 authUid는 이 학생을 가리키는 연결이 있을 때만 바꿀 수 있다', async () => {
    const db = teacher('tA');
    await assertFails(updateDoc(doc(db, 'students/sA2'), { authUid: 'uRandom' }));
    // 다른 학생을 가리키는 연결로는 안 된다
    await assertFails(updateDoc(doc(db, 'students/sA2'), { authUid: 'uA1' }));
    await assertSucceeds(setDoc(doc(db, 'studentIndex/uNew'), { studentId: 'sA2', teacherId: 'tA', code: 'CCCC-4444' }));
    await assertSucceeds(updateDoc(doc(db, 'students/sA2'), { authUid: 'uNew' }));
  });

  test('학생 문서를 authUid와 함께 만들 수 없다', async () => {
    const db = teacher('tA');
    await assertFails(setDoc(doc(db, 'students/sNew'), { name: 'n', teacherId: 'tA', authUid: 'uEvil' }));
    await assertSucceeds(setDoc(doc(db, 'students/sNew'), { name: 'n', teacherId: 'tA' }));
  });

  test('위조한 연결로 다른 반을 읽는 경로가 모두 막힌다', async () => {
    // 교사 B가 자기 보조 계정을 교사 A의 학생으로 연결하려는 시도
    await assertFails(setDoc(doc(teacher('tB'), 'studentIndex/uEvil'), { studentId: 'sA1', teacherId: 'tB', code: 'X' }));
    const evil = student('uEvil', 'evil0000');
    await assertFails(getDoc(doc(evil, 'curricula/tA')));
    await assertFails(classOf(evil, 'tA'));
    await assertFails(getDoc(doc(evil, 'students/sA1')));
  });
});

describe('학생 접근과 회수 (1차 #2)', () => {
  test('정상 학생은 자기 반 단원·명단을 읽고 자기 학습 기록만 고친다', async () => {
    const db = student('uA1');
    await assertSucceeds(getDoc(doc(db, 'curricula/tA')));
    await assertSucceeds(classOf(db, 'tA'));
    await assertSucceeds(getDoc(doc(db, 'students/sA1')));
    await assertSucceeds(getDoc(doc(db, 'sharedCurriculum/main')));
    await assertSucceeds(updateDoc(doc(db, 'students/sA1'), { stats: { xp: 10 } }));
    await assertFails(updateDoc(doc(db, 'students/sA1'), { name: '바꾼이름' }));
    await assertFails(getDoc(doc(db, 'students/sA2')));
    await assertFails(getDoc(doc(db, 'curricula/tB')));
    await assertFails(classOf(db, 'tB'));
  });

  test('학생 문서만 지우고 연결이 남아도 접근이 끊긴다', async () => {
    await assertSucceeds(deleteDoc(doc(teacher('tA'), 'students/sA1')));
    const db = student('uA1');
    await assertFails(getDoc(doc(db, 'curricula/tA')));
    await assertFails(classOf(db, 'tA'));
    await assertFails(getDoc(doc(db, 'sharedCurriculum/main')));
  });

  test('재발급하면 옛 계정은 옛 연결이 남아도 접근이 끊긴다', async () => {
    const db = teacher('tA');
    await assertSucceeds(setDoc(doc(db, 'studentIndex/uA1new'), { studentId: 'sA1', teacherId: 'tA', code: 'DDDD-5555' }));
    await assertSucceeds(updateDoc(doc(db, 'students/sA1'), { authUid: 'uA1new' }));
    await assertFails(getDoc(doc(student('uA1'), 'curricula/tA')));
    await assertSucceeds(getDoc(doc(student('uA1new', 'dddd5555'), 'curricula/tA')));
  });

  test('학생과 연결을 한 번에 지울 수 있고, 이미 없는 연결이 섞여도 실패하지 않는다', async () => {
    const db = teacher('tA');
    const batch = writeBatch(db);
    batch.delete(doc(db, 'students/sA1'));
    batch.delete(doc(db, 'studentIndex/uA1'));
    await assertSucceeds(batch.commit());

    const batch2 = writeBatch(db);
    batch2.delete(doc(db, 'students/sA2'));
    batch2.delete(doc(db, 'studentIndex/uMissing'));
    await assertSucceeds(batch2.commit());
  });

  test('다른 반의 연결은 지울 수 없다', async () => {
    await assertFails(deleteDoc(doc(teacher('tA'), 'studentIndex/uB1')));
  });

  test('관리자는 교사와 그 반 학생·연결을 한 번에 지운다', async () => {
    const db = teacher('admin');
    const links = await assertSucceeds(getDocs(query(collection(db, 'studentIndex'), where('teacherId', '==', 'tA'))));
    const students = await assertSucceeds(classOf(db, 'tA'));
    const batch = writeBatch(db);
    students.docs.forEach(d => batch.delete(d.ref));
    links.docs.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'teachers/tA'));
    await assertSucceeds(batch.commit());
    await assertFails(getDoc(doc(student('uA1'), 'curricula/tA')));
  });
});

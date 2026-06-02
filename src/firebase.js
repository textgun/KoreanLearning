// Firebase 초기화, 인증 및 Firestore CRUD 헬퍼

const firebaseConfig = {
  apiKey: "AIzaSyCvUom9f5AeeB1Df-SVqlxU2Td2TBW6ccI",
  authDomain: "korean-learning-fdaff.firebaseapp.com",
  projectId: "korean-learning-fdaff",
  storageBucket: "korean-learning-fdaff.firebasestorage.app",
  messagingSenderId: "654351366179",
  appId: "1:654351366179:web:01d6190d21551effddd996"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

/* ===== AUTH ===== */

async function fbSignIn(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

async function fbRegister(email, password) {
  return auth.createUserWithEmailAndPassword(email, password);
}

async function fbSignOut() {
  state.currentUser = null;
  state.currentTeacher = null;
  state.students = [];
  masterState.teachers = [];
  state.view = 'login';
  render();
  await auth.signOut();
}

async function fbResetPassword(email) {
  return auth.sendPasswordResetEmail(email);
}

/* ===== TEACHERS ===== */

async function fbGetTeacher(uid) {
  const doc = await db.collection('teachers').doc(uid).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function fbSaveTeacher(uid, data) {
  return db.collection('teachers').doc(uid).set(data, { merge: true });
}

async function fbDeleteTeacherDoc(uid) {
  const students = await fbGetStudents(uid);
  const batch = db.batch();
  students.forEach(s => batch.delete(db.collection('students').doc(s.firestoreId)));
  batch.delete(db.collection('teachers').doc(uid));
  return batch.commit();
}

async function fbGetAllTeachers() {
  const snap = await db.collection('teachers').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* ===== STUDENTS ===== */

async function fbGetStudents(teacherId) {
  const snap = await db.collection('students').where('teacherId', '==', teacherId).get();
  return snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
}

async function fbGetAllStudents(teacherIds) {
  if (!teacherIds.length) return [];
  const results = [];
  for (let i = 0; i < teacherIds.length; i += 10) {
    const chunk = teacherIds.slice(i, i + 10);
    const snap = await db.collection('students').where('teacherId', 'in', chunk).get();
    snap.docs.forEach(d => results.push({ firestoreId: d.id, ...d.data() }));
  }
  return results;
}

async function fbAddStudent(teacherId, data) {
  const ref = await db.collection('students').add({ ...data, teacherId });
  return ref.id;
}

async function fbUpdateStudent(firestoreId, data) {
  return db.collection('students').doc(firestoreId).set(data, { merge: true });
}

async function fbDeleteStudent(firestoreId) {
  return db.collection('students').doc(firestoreId).delete();
}

/* ===== 로그인 후 상태 로드 ===== */

async function onAuthLogin(fbUser) {
  try {
    // 교사 정보 + 전체 교사 목록 병렬 조회 (순차 → 동시)
    const [teacher, allTeachers] = await Promise.all([
      fbGetTeacher(fbUser.uid),
      fbGetAllTeachers()
    ]);

    if (!teacher) {
      toast('계정 데이터를 찾을 수 없습니다. 관리자에게 문의하세요.', 'danger');
      await auth.signOut();
      state.view = 'login';
      return;
    }

    state.currentUser = { uid: fbUser.uid, email: fbUser.email, ...teacher };

    if (teacher.isAdmin) {
      // 이미 allTeachers 조회 완료 — 학생만 추가 조회
      const teacherIds = allTeachers.map(t => t.id);
      const allStudents = await fbGetAllStudents(teacherIds);
      masterState.teachers = allTeachers.map(t => ({
        ...t,
        students: allStudents.filter(s => s.teacherId === t.id)
      }));
    } else {
      // 일반 교사: 본인 학생만 조회
      const students = await fbGetStudents(fbUser.uid);
      const teacherWithStudents = { ...teacher, students };
      state.currentTeacher = teacherWithStudents;
      state.students = students.map(s => s.name);
      const idx = masterState.teachers.findIndex(t => t.id === fbUser.uid);
      if (idx >= 0) masterState.teachers[idx] = teacherWithStudents;
      else masterState.teachers.push(teacherWithStudents);
    }

    // 로그인/자동진입 후 항상 홈으로
    state.view = 'home';
  } catch (e) {
    console.error('onAuthLogin error:', e);
    toast('데이터 로드 중 오류가 발생했습니다.', 'danger');
    state.view = 'login';
  }
}

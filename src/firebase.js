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
  state.currentStudent = null;
  state.currentStudentDoc = null;
  state.classmates = [];
  state.role = null;
  state.students = [];
  state.loadError = null;
  state.sharedUnits = [];
  masterState.teachers = [];
  state.view = 'login';
  render();
  await auth.signOut();
}

async function fbResetPassword(email) {
  return auth.sendPasswordResetEmail(email);
}

/* ===== 학생 원격 접속 =====
   학생에게 이메일을 요구하지 않기 위해 코드를 합성 이메일로 바꿔 인증한다.
   이 주소는 실제 메일함이 아니라 Firebase Auth의 식별자로만 쓰인다. */

const STUDENT_EMAIL_DOMAIN = '@student.korean-learning.app';
// 사람이 잘못 읽는 글자(0/O, 1/I/L)는 뺀다
const CODE_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_DIGITS = '23456789';

function studentCodeToEmail(code) {
  return 's-' + String(code).toLowerCase().replace(/[^a-z0-9]/g, '') + STUDENT_EMAIL_DOMAIN;
}

function generateStudentCode() {
  const pick = (set, n) => Array.from({ length: n }, () => set[Math.floor(Math.random() * set.length)]).join('');
  return pick(CODE_LETTERS, 4) + '-' + pick(CODE_DIGITS, 4);
}

// Firebase 최소 비밀번호 길이가 6자라 PIN도 6자리여야 한다
function generateStudentPin() {
  return Array.from({ length: 6 }, () => CODE_DIGITS[Math.floor(Math.random() * CODE_DIGITS.length)]).join('');
}

async function fbStudentSignIn(code, pin) {
  return auth.signInWithEmailAndPassword(studentCodeToEmail(code), pin);
}

// 보조 앱 인스턴스로 계정을 만든다. 기본 인스턴스를 쓰면 새 계정으로
// 로그인이 바뀌어 교사가 자기 세션에서 튕겨 나간다
async function fbCreateStudentAuth(code, pin) {
  const name = 'student-provisioning';
  const app = firebase.apps.find(a => a.name === name) || firebase.initializeApp(firebaseConfig, name);
  try {
    const cred = await app.auth().createUserWithEmailAndPassword(studentCodeToEmail(code), pin);
    const uid = cred.user.uid;
    await app.auth().signOut();
    return uid;
  } finally {
    await app.delete().catch(() => {});
  }
}

// 규칙이 authUid → teacherId를 찾는 경로. 규칙 내부 get()은 읽기 권한을 타지 않는다
async function fbSaveStudentIndex(authUid, data) {
  return db.collection('studentIndex').doc(authUid).set(data, { merge: true });
}

async function fbDeleteStudentIndex(authUid) {
  return db.collection('studentIndex').doc(authUid).delete();
}

async function fbGetStudentIndex(authUid) {
  const doc = await db.collection('studentIndex').doc(authUid).get();
  return doc.exists ? doc.data() : null;
}

// 로그인한 계정이 학생인지 확인한다. 교사면 빈 결과가 나온다
async function fbFindStudentByAuthUid(authUid) {
  const snap = await db.collection('students').where('authUid', '==', authUid).limit(1).get();
  return snap.empty ? null : { firestoreId: snap.docs[0].id, ...snap.docs[0].data() };
}

/* ===== CURRICULA (단원) =====
   교사 문서에는 연락처·주소가 들어 있어 학생에게 열 수 없다.
   학생이 읽어야 하는 단원만 별도 문서로 떼어낸다. */

async function fbGetCurriculum(teacherId) {
  const doc = await db.collection('curricula').doc(teacherId).get();
  return doc.exists ? doc.data() : null;
}

async function fbSaveCurriculum(teacherId, data) {
  return db.collection('curricula').doc(teacherId).set(data, { merge: true });
}

/* ===== 공용 단원 =====
   관리자가 발행한 단원. 모든 교사와 학생이 읽고 관리자만 쓴다.
   문서 하나에 모으는 이유는 curricula와 같다. 읽기 1회로 전부 가져온다 */

const SHARED_CURRICULUM_DOC = 'main';

async function fbGetSharedCurriculum() {
  const doc = await db.collection('sharedCurriculum').doc(SHARED_CURRICULUM_DOC).get();
  return doc.exists ? doc.data() : null;
}

async function fbSaveSharedCurriculum(units) {
  return db.collection('sharedCurriculum').doc(SHARED_CURRICULUM_DOC).set({
    units,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

/* ===== TEACHERS ===== */

async function fbGetTeacher(uid) {
  const doc = await db.collection('teachers').doc(uid).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function fbSaveTeacher(uid, data) {
  return db.collection('teachers').doc(uid).set(data, { merge: true });
}

// 교사 문서와 학생 명단, 원격 접속 연결을 함께 지운다.
// 인증 계정은 서버 없이 지울 수 없지만, 다시 로그인하면 승인 대기 문서로 새로 시작해 권한이 돌아오지 않는다
async function fbDeleteTeacherDoc(uid) {
  const students = await fbGetStudents(uid);
  const links = await db.collection('studentIndex').where('teacherId', '==', uid).get();
  const batch = db.batch();
  students.forEach(s => batch.delete(db.collection('students').doc(s.firestoreId)));
  links.docs.forEach(d => batch.delete(d.ref));
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

// 원격 접속 연결도 함께 지운다. 규칙이 학생 문서를 다시 확인하므로 연결이 남아도 접근은 막히지만,
// 지운 학생을 가리키는 연결 문서를 남기지 않는다
async function fbDeleteStudent(firestoreId, authUid) {
  const batch = db.batch();
  batch.delete(db.collection('students').doc(firestoreId));
  if (authUid) batch.delete(db.collection('studentIndex').doc(authUid));
  return batch.commit();
}

/* ===== 로그인 후 상태 로드 ===== */

// 원격 접속한 학생의 세션을 연다. 교사 문서는 건드리지 않는다
async function onStudentLogin(studentDoc) {
  state.role = 'student';
  state.currentUser = { uid: studentDoc.authUid, name: studentDoc.name };
  state.currentTeacher = null;
  state.students = [];
  state.loadError = null;
  masterState.teachers = [];
  state.currentStudent = studentDoc.name;
  state.currentStudentDoc = studentDoc;
  state.stats = { ...defaultStats(), ...(studentDoc.stats || {}) };
  // 학생의 언어 선택은 교사 설정과 별개라 이 기기에만 둔다
  state.language = localStorage.getItem('student_language') || 'en';

  // 관리자 공용 단원도 학생 화면에 나와야 한다
  await loadSharedUnits();

  try {
    const curriculum = await fbGetCurriculum(studentDoc.teacherId);
    state.units = (curriculum && Array.isArray(curriculum.units)) ? curriculum.units : [];
  } catch (e) {
    // 토스트만 띄우면 2.2초 뒤 사라져서, 단원을 못 읽은 것인지 선생님이
    // 아직 안 만든 것인지 학생도 교사도 구분할 수 없다
    console.error('Curriculum load failed:', e);
    state.units = [];
    state.loadError = firestoreErrorText(e);
  }

  // 리더보드용 같은 반 명단. 규칙이 막으면 리더보드만 빠지고 학습은 계속된다
  try {
    state.classmates = await fbGetStudents(studentDoc.teacherId);
  } catch (e) {
    console.warn('Classmates load failed:', e);
    state.classmates = [];
  }

  state.view = 'student';
}

async function onAuthLogin(fbUser) {
  state.role = 'teacher';
  state.loadError = null;
  state.view = 'home'; // 오류가 나도 홈으로 (로그인 루프 방지)

  let teacher = null;
  try {
    teacher = await fbGetTeacher(fbUser.uid);

    // Firestore 문서가 없으면 자동 생성 (Race Condition 복구)
    // auth.signOut()을 호출하면 onAuthStateChanged 중복 실행 버그 발생 → 제거
    // 관리자 권한과 승인은 절대 클라이언트에서 부여하지 않는다 (규칙이 approved == false를 강제한다).
    // 관리자가 삭제한 교사가 다시 로그인해도 이 경로로 승인 대기부터 시작한다
    if (!teacher) {
      await fbSaveTeacher(fbUser.uid, {
        name: fbUser.email.split('@')[0],
        email: fbUser.email,
        phone: '',
        status: 'teaching',
        note: '',
        isAdmin: false,
        approved: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      teacher = await fbGetTeacher(fbUser.uid);
    }
  } catch (e) {
    // 교사 문서를 못 읽으면 이 세션으로 할 수 있는 일이 없다.
    // 예전에는 여기서 조용히 홈으로 보내 state.currentTeacher가 null인 채
    // 교사 화면이 열렸고, 학생 등록 버튼을 눌러도 아무 반응이 없었다
    console.error('Teacher doc load failed:', e);
    state.currentUser = { uid: fbUser.uid, email: fbUser.email, name: fbUser.email.split('@')[0] };
    state.currentTeacher = null;
    state.loadError = firestoreErrorText(e);
    return;
  }

  state.currentUser = { uid: fbUser.uid, email: fbUser.email, ...teacher };

  // 승인 대기. 규칙이 단원·명단을 모두 막으므로 읽으려 하지 않고 대기 화면만 띄운다
  if (teacher.approved === false) {
    state.currentTeacher = null;
    state.view = 'teacher-pending';
    return;
  }

  // 단원·명단 로드보다 먼저 교사 컨텍스트를 세운다. 이 순서가 뒤집히면
  // 뒤쪽 조회가 하나라도 실패했을 때 currentTeacher가 null로 남는데,
  // 화면은 멀쩡해 보이면서 학생 등록·수정이 전부 조용히 터진다
  state.currentTeacher = { ...teacher, students: [] };
  state.students = [];

  try {
    // 단원은 교사 계정에 붙어 있으므로 로그인이 끝난 뒤에 읽는다
    await loadTeacherData(teacher);
    await loadSharedUnits();

    if (teacher.isAdmin) {
      // 교사 전체 조회는 관리자만 수행한다 (보안 규칙에서도 관리자만 허용)
      const allTeachers = await fbGetAllTeachers();
      const teacherIds = allTeachers.map(t => t.id);
      const allStudents = await fbGetAllStudents(teacherIds);
      masterState.teachers = allTeachers.map(t => ({
        ...t,
        students: allStudents.filter(s => s.teacherId === t.id)
      }));

      // 관리자도 자기 학생을 가르친다. 본인 교사 컨텍스트를 채우지 않으면
      // 교사 모드에서 명단이 비어 보이고 '학생 등록'이 null 참조로 터진다
      state.currentTeacher = masterState.teachers.find(t => t.id === fbUser.uid) || { ...teacher, id: fbUser.uid, students: [] };
      state.students = (state.currentTeacher.students || []).map(s => s.name);
    } else {
      const students = await fbGetStudents(fbUser.uid);
      const teacherWithStudents = { ...teacher, students };
      state.currentTeacher = teacherWithStudents;
      state.students = students.map(s => s.name);
      const idx = masterState.teachers.findIndex(t => t.id === fbUser.uid);
      if (idx >= 0) masterState.teachers[idx] = teacherWithStudents;
      else masterState.teachers.push(teacherWithStudents);
    }
  } catch (e) {
    // 여기서 실패해도 교사 컨텍스트는 살아 있다. 명단이 비어 보일 뿐이고
    // 배너로 이유를 알린다
    console.error('Teacher data load failed:', e);
    state.loadError = firestoreErrorText(e);
  }
}

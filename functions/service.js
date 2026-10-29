// 강사 신청의 검증·중복 방지·관리자 심사·보관 기간을 서버에서 처리한다.
const { HttpsError } = require('firebase-functions/v2/https');
const { Timestamp, FieldValue } = require('firebase-admin/firestore');
const EXPERIENCES = ['처음 시작해요', '1년 미만', '1년 이상 ~ 3년 미만', '3년 이상'];
const STATUSES = ['pending', 'hold', 'approved', 'rejected'];

function requireUser(auth) {
  if (!auth || !auth.uid || !auth.token.email || /@student\.korean-learning\.app$/i.test(auth.token.email)) {
    throw new HttpsError('unauthenticated', '이메일 계정으로 로그인해 주세요.');
  }
  return auth.uid;
}
function text(value, max, label) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new HttpsError('invalid-argument', `${label} 항목을 확인해 주세요.`);
  }
  return value.trim();
}
function createService(db, policy, now = () => Date.now()) {
  const applications = db.collection('teacherApplications');
  async function requireAdmin(auth) {
    const uid = requireUser(auth);
    const doc = await db.collection('teachers').doc(uid).get();
    if (!doc.exists || doc.data().isAdmin !== true || doc.data().approved === false) {
      throw new HttpsError('permission-denied', '관리자만 이용할 수 있습니다.');
    }
    return uid;
  }
  async function submit(auth, input) {
    const uid = requireUser(auth);
    if (!policy.acceptingApplications) throw new HttpsError('failed-precondition', '현재 접수 준비 중입니다.');
    if (auth.token.email_verified !== true) throw new HttpsError('failed-precondition', '이메일 인증을 완료해 주세요.');
    if (!input || input.adultConfirmed !== true || input.privacyConsent !== true || input.policyVersion !== policy.version) {
      throw new HttpsError('invalid-argument', '모집 기준과 최신 개인정보 안내에 동의해 주세요.');
    }
    const data = {
      name: text(input.name, 50, '이름'), email: auth.token.email.toLowerCase(),
      languages: text(input.languages, 100, '사용 언어'),
      experience: text(input.experience, 30, '교육 경험'),
      introduction: text(input.introduction, 1000, '자기소개'),
    };
    if (!EXPERIENCES.includes(data.experience)) throw new HttpsError('invalid-argument', '교육 경험을 선택해 주세요.');
    const ref = applications.doc(uid);
    return db.runTransaction(async tx => {
      const existing = await tx.get(ref);
      if (existing.exists) return { id: uid, status: existing.data().status, duplicate: true };
      const teacher = await tx.get(db.collection('teachers').doc(uid));
      if (teacher.exists && teacher.data().approved !== false) {
        throw new HttpsError('already-exists', '이미 승인된 강사 계정입니다.');
      }
      const stamp = Timestamp.fromMillis(now());
      tx.create(ref, {
        ...data, uid, status: 'pending', revision: 0, adultConfirmed: true,
        policyVersion: policy.version, consentAt: stamp, createdAt: stamp, updatedAt: stamp,
        expiresAt: Timestamp.fromMillis(now() + policy.pendingRetentionDays * 86400000),
        notificationState: 'pending', nextNotifyAt: stamp, notificationAttempts: 0,
      });
      return { id: uid, status: 'pending', duplicate: false };
    });
  }
  async function getOwn(auth) {
    const doc = await applications.doc(requireUser(auth)).get();
    if (!doc.exists) return null;
    const d = doc.data();
    return { id: doc.id, status: d.status, createdAt: d.createdAt.toMillis(), reviewMessage: d.reviewMessage || '' };
  }
  async function list(auth, input = {}) {
    await requireAdmin(auth);
    const status = input.status || 'pending';
    if (!STATUSES.includes(status)) throw new HttpsError('invalid-argument', '잘못된 상태입니다.');
    let query = applications.where('status', '==', status).orderBy('__name__').limit(50);
    if (input.after) query = query.startAfter(text(input.after, 128, '페이지'));
    const snap = await query.get();
    return { items: snap.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt.toMillis() })),
      next: snap.size === 50 ? snap.docs[49].id : null };
  }
  async function review(auth, input) {
    const reviewer = await requireAdmin(auth);
    const uid = text(input?.id, 128, '신청 ID');
    if (!['hold', 'approved', 'rejected'].includes(input.status) || !Number.isInteger(input.revision)) {
      throw new HttpsError('invalid-argument', '심사 상태를 확인해 주세요.');
    }
    const message = text(input.message, 500, '신청자에게 안내할 사유');
    return db.runTransaction(async tx => {
      // 권한 회수와 심사 간 경쟁도 트랜잭션 안에서 다시 검사한다.
      const admin = await tx.get(db.collection('teachers').doc(reviewer));
      if (!admin.exists || admin.data().isAdmin !== true || admin.data().approved === false) throw new HttpsError('permission-denied', '관리자 권한이 없습니다.');
      const ref = applications.doc(uid);
      const doc = await tx.get(ref);
      if (!doc.exists) throw new HttpsError('not-found', '신청서를 찾을 수 없습니다.');
      const current = doc.data();
      if (!['pending', 'hold'].includes(current.status) || current.revision !== input.revision) {
        throw new HttpsError('aborted', '이미 처리되거나 변경된 신청입니다. 목록을 새로고침해 주세요.');
      }
      if (current.expiresAt.toMillis() <= now()) throw new HttpsError('failed-precondition', '보관 기간이 만료된 신청입니다.');
      const teacherRef = db.collection('teachers').doc(uid);
      const teacher = input.status === 'approved' ? await tx.get(teacherRef) : null;
      const patch = { status: input.status, reviewMessage: message, reviewedBy: reviewer,
        updatedAt: Timestamp.fromMillis(now()), revision: current.revision + 1 };
      if (input.status === 'approved') {
        patch.expiresAt = FieldValue.delete();
        if (teacher.exists) tx.update(teacherRef, { approved: true });
        else tx.create(teacherRef, { name: current.name, email: current.email, phone: '',
          status: 'teaching', note: '', isAdmin: false, approved: true, createdAt: Timestamp.fromMillis(now()) });
      }
      tx.update(ref, patch);
      return { status: input.status };
    });
  }
  async function purgeExpired() {
    const snap = await applications.where('expiresAt', '<=', Timestamp.fromMillis(now())).limit(200).get();
    let deleted = 0;
    for (const doc of snap.docs) {
      await db.runTransaction(async tx => {
        const latest = await tx.get(doc.ref);
        const d = latest.data();
        if (latest.exists && d.status !== 'approved' && d.expiresAt.toMillis() <= now()) {
          tx.delete(doc.ref); deleted++;
        }
      });
    }
    return deleted;
  }
  async function notifyDue(sendMail) {
    const snap = await applications.where('nextNotifyAt', '<=', Timestamp.fromMillis(now())).limit(20).get();
    for (const doc of snap.docs) {
      const claimed = await db.runTransaction(async tx => {
        const current = await tx.get(doc.ref);
        const data = current.data();
        if (!current.exists || !data.nextNotifyAt || data.nextNotifyAt.toMillis() > now()) return false;
        tx.update(doc.ref, { nextNotifyAt: Timestamp.fromMillis(now() + 600000), notificationState: 'sending',
          notificationAttempts: (data.notificationAttempts || 0) + 1 });
        return true;
      });
      if (!claimed) continue;
      try {
        const result = await sendMail({
          to: policy.notificationEmail, subject: '[말이음] 새로운 강사 신청이 도착했습니다',
          text: `새로운 신청이 접수되었습니다.\n접수 ID: ${doc.id}\n관리자 확인: ${policy.adminUrl}\n\n개인정보는 관리자 로그인 후 확인해 주세요.`,
          messageId: `<application-${doc.id}@korean-learning-fdaff.firebaseapp.com>`,
        });
        if (!result.accepted?.length) throw new Error('SMTP_NOT_ACCEPTED');
        await doc.ref.update({ notificationState: 'sent', nextNotifyAt: FieldValue.delete(), notifiedAt: Timestamp.fromMillis(now()) });
      } catch {
        // 본문·연락처·SMTP 인증정보를 로그나 오류 필드에 남기지 않는다.
        await doc.ref.update({ notificationState: 'failed', nextNotifyAt: Timestamp.fromMillis(now() + 3600000) }).catch(() => {});
      }
    }
  }
  return { submit, getOwn, list, review, purgeExpired, notifyDue };
}
module.exports = { createService };

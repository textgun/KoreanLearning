// 강사 신청 API와 메일 알림·만료 삭제 작업을 Firebase에 등록한다.
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret, defineString } = require('firebase-functions/params');
const { auth } = require('firebase-functions/v1');
const nodemailer = require('nodemailer');
const policy = require('./application-policy.json');
const { createService } = require('./service');
initializeApp();
const db = getFirestore();
const service = createService(db, policy);
const options = { region: 'asia-northeast3', maxInstances: 5 };
const smtpUser = defineString('SMTP_USER', { default: 'piction825@gmail.com' });
const smtpPassword = defineSecret('SMTP_PASSWORD');
const call = handler => onCall(options, async request => {
  try { return await handler(request.auth, request.data); }
  catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', '처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
});
exports.submitTeacherApplication = call(service.submit);
exports.getTeacherApplication = call(service.getOwn);
exports.listTeacherApplications = call(service.list);
exports.reviewTeacherApplication = call(service.review);
exports.sendApplicationNotifications = onSchedule({ ...options, schedule: 'every 5 minutes', secrets: [smtpPassword] }, async () => {
  const transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: smtpUser.value(), pass: smtpPassword.value() }, connectionTimeout: 10000, socketTimeout: 20000 });
  await service.notifyDue(message => transport.sendMail({ ...message, from: smtpUser.value() }));
});
exports.expireTeacherApplications = onSchedule({ ...options, schedule: 'every 24 hours', timeZone: 'Asia/Seoul' }, service.purgeExpired);
// 승인 신청도 인증 계정 탈퇴 시 삭제한다. 기존 앱의 강사 문서 삭제는 계정 탈퇴와 다르다.
exports.removeApplicationOnAccountDeletion = auth.user().onDelete(user => db.collection('teacherApplications').doc(user.uid).delete());

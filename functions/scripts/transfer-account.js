#!/usr/bin/env node
// 이전 강사 계정을 새 계정으로 넘기고 지우는 운영자용 명령. --confirm 없이 실행하면 미리보기만 한다.
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { createAccountTransfer } = require('./account-transfer');

const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const oldEmail = option('old');
const newEmail = option('new');
const projectId = option('project') || 'korean-learning-fdaff';
const confirm = args.includes('--confirm');

async function main() {
  if (!oldEmail || !newEmail) {
    console.error('사용법: node scripts/transfer-account.js --old 이전계정@메일 --new 새계정@메일 [--confirm]');
    process.exitCode = 1;
    return;
  }
  initializeApp({ credential: applicationDefault(), projectId });
  const transfer = createAccountTransfer(getFirestore(), getAuth());
  const plan = await transfer.plan(oldEmail, newEmail);
  const yes = value => (value ? '있음 → 삭제' : '없음');
  console.log(`프로젝트          ${projectId}`);
  console.log(`이전 계정         ${plan.oldUser.email} (${plan.oldUser.uid})${plan.oldIsAdmin ? ' · 관리자' : ''}`);
  console.log(`새 계정           ${plan.newUser.email} (${plan.newUser.uid}) → 관리자로 지정${plan.newTeacherExists ? '' : ' (강사 문서 새로 만듦)'}`);
  console.log(`옮길 학생         ${plan.students}명, 원격 접속 연결 ${plan.studentLinks}건`);
  console.log(`단원              이전 계정 ${plan.units.fromOld}개 옮김, 새 계정 단원 ${plan.units.keptFromNew}개 유지, 같은 id ${plan.units.replacedOnNew}개는 이전 계정 것으로 바뀜`);
  console.log(`신청서            ${yes(plan.deletes.application)}`);
  console.log(`공개 프로필       ${yes(plan.deletes.profile)}`);
  console.log(`강사 문서         ${yes(plan.deletes.teacher)}`);
  console.log(`단원 문서         ${yes(plan.deletes.curriculum)}`);
  console.log('인증 계정         삭제 (되돌릴 수 없음)');
  if (!confirm) {
    console.log('\n미리보기만 했습니다. 내용이 맞으면 같은 명령 끝에 --confirm을 붙여 다시 실행하세요.');
    return;
  }
  await transfer.execute(plan);
  console.log('\n완료했습니다. 새 계정으로 로그인해 학생 명단과 단원, 관리자 메뉴를 확인하세요.');
}

main().catch(error => {
  console.error(`중단했습니다. ${error.message}`);
  process.exitCode = 1;
});

// 강사 신청 단계와 인증·동의 검증을 관리하고 활성화된 서버에 접수한다.
const form = document.querySelector('#application-form');
const steps = [...document.querySelectorAll('.form-step')];
const progress = [...document.querySelectorAll('.form-progress li')];
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const completion = document.querySelector('#completion');
const introduction = document.querySelector('#teacher-introduction');
const count = document.querySelector('#character-count');
const fields = [
  ['teacher-name', 'name-error', '이름을 입력해 주세요.'],
  ['teacher-email', 'email-error', '올바른 이메일 주소를 입력해 주세요.'],
  ['teacher-language', 'language-error', '수업에 사용할 언어를 입력해 주세요.'],
  ['teacher-experience', 'experience-error', '교육 경험을 선택해 주세요.'],
  ['teacher-introduction', 'introduction-error', '자기소개와 수업 이야기를 입력해 주세요.'],
];
let currentStep = 0;
let applicationClient = null;
let submitting = false;
const submissionStatus = document.querySelector('#submission-status');
const isOpen = () => applicationClient?.policy.acceptingApplications === true;
const statusNames = { pending: '심사 대기', hold: '보류', approved: '승인', rejected: '반려' };

async function updateAccount() {
  const user = applicationClient.auth.currentUser;
  document.querySelector('#account-credentials').hidden = !!user;
  document.querySelector('#account-signed-in').hidden = !user;
  document.querySelector('#account-status').textContent = user ? `${user.email} · ${user.emailVerified ? '인증 완료' : '이메일 인증 필요'}` : '로그인하거나 새 계정을 만들어 주세요.';
  document.querySelector('#teacher-email').readOnly = !!user;
  if (user) {
    document.querySelector('#teacher-email').value = user.email;
    const own = await applicationClient.call('getTeacherApplication');
    if (own) submissionStatus.textContent = `신청 상태: ${statusNames[own.status]}${own.reviewMessage ? ' · ' + own.reviewMessage : ''}`;
  } else submissionStatus.textContent = '';
}
if (typeof applicationReady !== 'undefined') applicationReady.then(async client => {
  applicationClient = client;
  if (!isOpen()) return;
  document.querySelector('.demo-badge').textContent = '강사 모집 중';
  document.querySelector('.demo-note p').textContent = '만 18세 이상이면 지원할 수 있어요. 자격증은 필수가 아니며, 한국어 설명 능력과 자기소개를 검토합니다.';
  document.querySelector('#teacher-email').parentElement.querySelector('.field-hint').textContent = '인증한 계정의 이메일로 신청합니다.';
  document.querySelector('.review-note').textContent = '동의 항목과 작성 내용을 확인한 뒤 신청서를 제출해 주세요.';
  document.querySelector('#account-panel').hidden = false;
  document.querySelector('#application-consents').hidden = false;
  client.auth.onAuthStateChanged(() => updateAccount().catch(() => { submissionStatus.textContent = '신청 상태를 불러오지 못했습니다. 다시 확인해 주세요.'; }));
}).catch(() => { submissionStatus.textContent = '접수 연결을 확인할 수 없습니다. 입력 정보는 전송되지 않습니다.'; });

async function accountAction(button, action) {
  button.disabled = true;
  try { await action(); }
  catch { document.querySelector('#account-status').textContent = '계정 처리를 완료하지 못했습니다. 입력 정보와 연결 상태를 확인해 주세요.'; }
  finally { button.disabled = false; }
}
['login', 'create'].forEach(mode => document.querySelector(`#account-${mode}`).addEventListener('click', event => accountAction(event.currentTarget, async () => {
  const email = document.querySelector('#account-email').value.trim();
  const password = document.querySelector('#account-password').value;
  if (mode === 'create') {
    if (!document.querySelector('#account-consent').checked || password.length < 8) {
      document.querySelector('#account-status').textContent = '계정 개인정보 안내 동의와 8자 이상 비밀번호가 필요합니다.'; return;
    }
    const result = await applicationClient.auth.createUserWithEmailAndPassword(email, password);
    await result.user.sendEmailVerification();
    document.querySelector('#account-status').textContent = '인증 메일을 보냈습니다. 메일 확인 후 인증·신청 상태 확인을 눌러 주세요.';
  } else await applicationClient.auth.signInWithEmailAndPassword(email, password);
  document.querySelector('#account-password').value = '';
})));
document.querySelector('#account-verify').addEventListener('click', event => accountAction(event.currentTarget, async () => {
  await applicationClient.auth.currentUser.sendEmailVerification();
  document.querySelector('#account-status').textContent = '인증 메일을 보냈습니다.';
}));
document.querySelector('#account-refresh').addEventListener('click', event => accountAction(event.currentTarget, async () => {
  await applicationClient.auth.currentUser.reload();
  await applicationClient.auth.currentUser.getIdToken(true);
  await updateAccount();
}));
document.querySelector('#account-logout').addEventListener('click', event => accountAction(event.currentTarget, async () => {
  await applicationClient.auth.signOut();
  document.querySelector('#restart').click();
}));

function validateField(id, errorId, message) {
  const input = document.getElementById(id);
  const valid = input.value.trim() !== '' && input.validity.valid;
  document.getElementById(errorId).textContent = valid ? '' : message;
  input.setAttribute('aria-invalid', String(!valid));
  return valid;
}

fields.forEach(([id, errorId, message]) => {
  const input = document.getElementById(id);
  const hint = input.parentElement.querySelector('.field-hint');
  if (hint) hint.id = `${id}-hint`;
  input.setAttribute('aria-describedby', [hint?.id, errorId].filter(Boolean).join(' '));
  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') validateField(id, errorId, message);
  });
});
introduction.addEventListener('input', () => {
  count.textContent = `${introduction.value.length.toLocaleString('en-US')} / 1,000`;
});

function showStep(index) {
  currentStep = index;
  steps.forEach((step, i) => { step.hidden = i !== index; });
  progress.forEach((item, i) => {
    if (i === index) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
    item.classList.toggle('passed', i < index);
  });
  previous.hidden = index === 0;
  next.firstChild.textContent = index === 2 ? (isOpen() ? '신청서 제출하기 ' : '작성 마치기 ') : '다음으로 ';
  document.querySelector('.step-caption').textContent = `총 3단계 중 ${index + 1}단계`;
  if (index === 2) {
    document.querySelectorAll('[data-review]').forEach(item => {
      item.textContent = document.getElementById(item.dataset.review).value.trim();
    });
  }
  steps[index].querySelector('h2').focus();
}

previous.addEventListener('click', () => showStep(currentStep - 1));
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting) return;
  let firstInvalid;
  fields.forEach(field => {
    if (steps[currentStep].contains(document.getElementById(field[0])) && !validateField(...field)) {
      firstInvalid ??= document.getElementById(field[0]);
    }
  });
  if (firstInvalid) { firstInvalid.focus(); return; }
  if (currentStep < 2) { showStep(currentStep + 1); return; }
  if (isOpen()) {
    const user = applicationClient.auth.currentUser;
    if (!user?.emailVerified) { submissionStatus.textContent = '이메일 인증을 완료하고 인증·신청 상태 확인을 눌러 주세요.'; return; }
    if (!document.querySelector('#adult-consent').checked || !document.querySelector('#privacy-consent').checked) {
      submissionStatus.textContent = '모집 기준과 개인정보 안내에 동의해 주세요.'; return;
    }
    submitting = true; next.disabled = true; previous.disabled = true;
    submissionStatus.textContent = '신청서를 접수하고 있습니다…';
    try {
      const result = await applicationClient.call('submitTeacherApplication', {
        name: document.querySelector('#teacher-name').value, languages: document.querySelector('#teacher-language').value,
        experience: document.querySelector('#teacher-experience').value, introduction: introduction.value,
        adultConfirmed: true, privacyConsent: true, policyVersion: applicationClient.policy.version,
      });
      document.querySelector('#complete-title').textContent = result.duplicate ? '이미 접수된 신청입니다.' : '신청서가 접수되었습니다.';
      completion.querySelector('p:not(.eyebrow)').textContent = `접수 번호: ${result.id} · 상태: ${statusNames[result.status]}`;
      completion.querySelector('.completion-next p').textContent = '같은 계정으로 로그인하면 심사 상태를 확인할 수 있습니다. 승인 후 기존 학습 도구를 이용할 수 있어요.';
      completion.querySelector('a').href = '../';
      completion.querySelector('a').firstChild.textContent = '학습 도구 열기 ';
      submissionStatus.textContent = '';
    } catch (error) {
      submissionStatus.textContent = error.code === 'functions/already-exists' ? '이미 승인된 강사입니다. 학습 도구에서 로그인해 주세요.' : '접수 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다. 상태 확인 후 다시 시도해 주세요.';
      return;
    } finally { submitting = false; next.disabled = false; previous.disabled = false; }
  }
  form.hidden = true;
  completion.hidden = false;
  progress.forEach(item => { item.removeAttribute('aria-current'); item.classList.add('passed'); });
  document.getElementById('complete-title').focus();
});
document.querySelector('#restart').addEventListener('click', () => {
  form.reset();
  fields.forEach(([id, errorId]) => {
    document.getElementById(id).removeAttribute('aria-invalid');
    document.getElementById(errorId).textContent = '';
  });
  document.querySelectorAll('[data-review]').forEach(item => { item.textContent = ''; });
  count.textContent = '0 / 1,000';
  completion.hidden = true;
  form.hidden = false;
  showStep(0);
});

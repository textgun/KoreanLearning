// 강사 신청 시안의 필수값 검증과 단계 이동을 처리하며 정보를 저장하거나 전송하지 않는다.
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
  next.firstChild.textContent = index === 2 ? '작성 마치기 ' : '다음으로 ';
  document.querySelector('.step-caption').textContent = `총 3단계 중 ${index + 1}단계`;
  if (index === 2) {
    document.querySelectorAll('[data-review]').forEach(item => {
      item.textContent = document.getElementById(item.dataset.review).value.trim();
    });
  }
  steps[index].querySelector('h2').focus();
}

previous.addEventListener('click', () => showStep(currentStep - 1));
form.addEventListener('submit', event => {
  event.preventDefault();
  let firstInvalid;
  fields.forEach(field => {
    if (steps[currentStep].contains(document.getElementById(field[0])) && !validateField(...field)) {
      firstInvalid ??= document.getElementById(field[0]);
    }
  });
  if (firstInvalid) { firstInvalid.focus(); return; }
  if (currentStep < 2) { showStep(currentStep + 1); return; }
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

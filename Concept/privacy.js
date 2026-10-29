// 공통 정책 파일의 운영자와 문의 주소를 개인정보 안내에 표시한다.
fetch('application-policy.json', { cache: 'no-store' }).then(response => {
  if (!response.ok) throw new Error('policy unavailable');
  return response.json();
}).then(policy => {
  document.querySelector('#policy-contact').textContent = `${policy.operatorName} · 안내 버전 ${policy.version}`;
  const link = document.createElement('a');
  link.href = `mailto:${policy.contactEmail}`;
  link.textContent = `개인정보 문의 · ${policy.contactEmail}`;
  document.querySelector('#privacy-mail').append(link);
}).catch(() => { document.querySelector('#policy-contact').textContent = '운영자 안내를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.'; });

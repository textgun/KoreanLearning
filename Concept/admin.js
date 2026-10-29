// 관리자 인증 후 신청 목록을 안전한 텍스트로 표시하고 서버에 심사 결과를 요청한다.
const adminStatus = document.querySelector('#admin-status');
const listRoot = document.querySelector('#application-list');
let adminClient;
let cursor = null;
let loading = false;
const make = (tag, content, className) => {
  const node = document.createElement(tag);
  node.textContent = content;
  if (className) node.className = className;
  return node;
};
function renderApplication(item) {
  const card = make('article', '', 'review-card');
  card.append(make('h2', item.name));
  card.append(make('p', `${item.email} · ${item.languages} · ${item.experience}`));
  card.append(make('p', item.introduction));
  card.append(make('p', `접수일 ${new Date(item.createdAt).toLocaleString('ko-KR')} · 알림 ${item.notificationState}`));
  if (item.reviewMessage) card.append(make('p', `이전 심사 안내: ${item.reviewMessage}`));
  if (['pending', 'hold'].includes(item.status)) {
    const label = make('label', '신청자에게 안내할 심사 사유');
    const reason = document.createElement('textarea'); reason.maxLength = 500; reason.id = `reason-${item.id}`;
    label.htmlFor = reason.id; card.append(label, reason);
    const actions = make('div', '', 'account-actions');
    for (const [state, title] of [['approved', '승인'], ['hold', '보류'], ['rejected', '반려']]) {
      const button = make('button', title, state === 'approved' ? 'button yellow' : 'button outline');
      button.addEventListener('click', async () => {
        if (!reason.value.trim()) { reason.focus(); adminStatus.textContent = '신청자에게 안내할 사유를 입력해 주세요.'; return; }
        actions.querySelectorAll('button').forEach(b => { b.disabled = true; });
        try {
          await adminClient.call('reviewTeacherApplication', { id: item.id, status: state, revision: item.revision, message: reason.value.trim() });
          await loadApplications();
        } catch { adminStatus.textContent = '처리 결과를 확인하지 못했습니다. 새로고침 후 상태를 확인해 주세요.'; }
        finally { actions.querySelectorAll('button').forEach(b => { b.disabled = false; }); }
      });
      actions.append(button);
    }
    card.append(actions);
  }
  listRoot.append(card);
}
async function loadApplications(more = false) {
  if (loading) return;
  loading = true;
  document.querySelector('#status-filter').disabled = true;
  adminStatus.textContent = '신청 목록을 불러오고 있습니다…';
  if (!more) { cursor = null; listRoot.replaceChildren(); }
  try {
    const result = await adminClient.call('listTeacherApplications', { status: document.querySelector('#status-filter').value, after: more ? cursor : null });
    result.items.forEach(renderApplication); cursor = result.next;
    document.querySelector('#load-more').hidden = !cursor;
    adminStatus.textContent = listRoot.children.length ? `${listRoot.children.length}건을 표시하고 있습니다.` : '해당 상태의 신청이 없습니다.';
  } catch { listRoot.replaceChildren(); document.querySelector('#load-more').hidden = true; adminStatus.textContent = '신청 목록을 열 수 없습니다. 관리자 권한과 서버 배포 상태를 확인해 주세요.'; }
  finally { loading = false; document.querySelector('#status-filter').disabled = false; }
}
applicationReady.then(client => {
  adminClient = client;
  client.auth.onAuthStateChanged(user => {
    listRoot.replaceChildren();
    document.querySelector('#admin-login').hidden = !!user;
    document.querySelector('#admin-workspace').hidden = !user;
    if (user) loadApplications();
  });
}).catch(() => { adminStatus.textContent = '서버 연결을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.'; });
document.querySelector('#admin-login').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button'); button.disabled = true;
  try {
    await adminClient.auth.signInWithEmailAndPassword(document.querySelector('#admin-email').value.trim(), document.querySelector('#admin-password').value);
    document.querySelector('#admin-password').value = '';
  } catch { adminStatus.textContent = '로그인하지 못했습니다. 계정과 연결 상태를 확인해 주세요.'; }
  finally { button.disabled = false; }
});
document.querySelector('#admin-logout').addEventListener('click', async () => {
  try { await adminClient.auth.signOut(); adminStatus.textContent = '로그아웃되었습니다.'; }
  catch { adminStatus.textContent = '로그아웃하지 못했습니다. 다시 시도해 주세요.'; }
});
document.querySelector('#refresh-list').addEventListener('click', () => loadApplications());
document.querySelector('#status-filter').addEventListener('change', () => loadApplications());
document.querySelector('#load-more').addEventListener('click', () => loadApplications(true));

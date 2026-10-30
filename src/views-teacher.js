/* =========================================================
   VIEWS - TEACHER & ADMIN MODES
   ========================================================= */

/* ---------- 로딩 ---------- */
function renderLoadingPage() {
  const root = el('div', { style: 'display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:16px' });
  const spinner = el('div', { style: 'width:48px; height:48px; border:4px solid var(--primary-soft); border-top-color:var(--primary); border-radius:50%; animation:spin 0.8s linear infinite' });
  root.appendChild(spinner);
  root.appendChild(el('p', { style: 'color:var(--muted); font-size:1rem' }, '데이터를 불러오는 중...'));
  // 스피너 CSS
  if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
  }
  return root;
}

/* ---------- 로그인 ---------- */
// 로그인 화면에서 선택한 탭. 학생은 코드+PIN, 교사는 이메일+비밀번호
let _loginTab = 'teacher';

// 로그인·가입 화면 공통 배치. 왼쪽은 랜딩과 같은 안내 문구, 오른쪽은 입력 카드다
function renderAuthLayout({ eyebrow, title, highlight, intro }, panel) {
  const root = el('div', { class: 'auth-layout' });
  const story = el('div', { class: 'auth-story' });
  story.appendChild(el('p', { class: 'eyebrow' }, eyebrow));
  story.appendChild(el('h1', {}, [title, el('br'), el('span', { class: 'underline' }, highlight)]));
  story.appendChild(el('p', { class: 'auth-intro' }, intro));
  panel.classList.add('auth-card');
  root.append(story, panel);
  return root;
}

function renderLoginPage() {
  const panel = el('div', { class: 'panel' });
  panel.appendChild(el('h2', {}, '로그인'));

  // 교사 / 학생 탭
  const tabs = el('div', { class: 'segmented' });
  [['teacher', '선생님', 'book-open'], ['student', '학생', 'graduation-cap']].forEach(([code, label, icon]) => {
    const tab = el('button', { class: _loginTab === code ? 'active' : '', onClick: () => { _loginTab = code; render(); } });
    tab.appendChild(el('i', { 'data-lucide': icon, style: 'width:16px; height:16px; color:currentColor' }));
    tab.appendChild(document.createTextNode(label));
    tabs.appendChild(tab);
  });
  panel.appendChild(tabs);

  const story = _loginTab === 'student'
    ? { eyebrow: 'READY TO LEARN', title: '오늘도 한 걸음,', highlight: '함께 배워요.', intro: '선생님께 받은 학생 코드와 PIN으로 들어와요.' }
    : { eyebrow: 'WELCOME BACK', title: '다시 만나서', highlight: '반가워요.', intro: '단원을 준비하고 학생들의 배움을 이어 가요.' };
  if (_loginTab === 'student') return renderAuthLayout(story, renderStudentLoginForm(panel));

  const emailIn = el('input', { type: 'email', placeholder: 'example@email.com' });
  const pwIn    = el('input', { type: 'password', placeholder: '비밀번호' });
  panel.appendChild(el('div', { class: 'field' }, [el('label', {}, '이메일'), emailIn]));
  panel.appendChild(el('div', { class: 'field' }, [el('label', {}, '비밀번호'), pwIn]));

  const loginBtn = el('button', { class: 'btn btn-primary btn-block btn-lg', onClick: async () => {
    const email = emailIn.value.trim();
    const pw    = pwIn.value;
    if (!email || !pw) { toast('이메일과 비밀번호를 입력하세요', 'danger'); return; }
    loginBtn.disabled = true;
    loginBtn.textContent = '로그인 중...';
    try {
      await fbSignIn(email, pw);
      // onAuthStateChanged가 자동으로 처리
    } catch (e) {
      const msg = e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
        ? '이메일 또는 비밀번호가 맞지 않습니다' : '로그인 실패: ' + e.message;
      toast(msg, 'danger');
      loginBtn.disabled = false;
      loginBtn.textContent = '로그인';
    }
  }}, '로그인');
  panel.appendChild(loginBtn);

  const links = el('div', { class: 'auth-links' });
  links.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: () => { state.view = 'signup'; render(); } }, '회원가입'));
  links.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: () => { state.view = 'forgot-password'; render(); } }, '비밀번호 찾기'));
  panel.appendChild(links);

  pwIn.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });
  return renderAuthLayout(story, panel);
}

// 학생 로그인 양식. 선생님이 알려준 코드와 PIN만 입력한다
function renderStudentLoginForm(panel) {
  const codeIn = el('input', { type: 'text', placeholder: 'ABCD-2345', autocomplete: 'off', autocapitalize: 'characters', style: 'letter-spacing:0.06em; text-transform:uppercase' });
  const pinIn = el('input', { type: 'password', inputmode: 'numeric', placeholder: '••••••', autocomplete: 'off', style: 'letter-spacing:0.06em' });
  panel.appendChild(el('div', { class: 'field' }, [el('label', {}, '학생 코드 (Student Code)'), codeIn]));
  panel.appendChild(el('div', { class: 'field' }, [el('label', {}, 'PIN (6자리)'), pinIn]));

  const btn = el('button', { class: 'btn btn-primary btn-block btn-lg', onClick: async () => {
    const code = codeIn.value.trim();
    const pin = pinIn.value.trim();
    if (!code || !pin) { toast('코드와 PIN을 입력하세요', 'danger'); return; }
    btn.disabled = true;
    btn.textContent = '접속 중...';
    try {
      await fbStudentSignIn(code, pin);
      // onAuthStateChanged가 학생 세션을 연다
    } catch (e) {
      const wrong = ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-email'];
      toast(wrong.includes(e.code) ? '코드 또는 PIN이 맞지 않습니다' : '접속 실패: ' + e.message, 'danger');
      btn.disabled = false;
      btn.textContent = '시작하기';
    }
  }}, '시작하기');
  panel.appendChild(btn);

  panel.appendChild(el('p', { class: 'auth-note' }, '코드와 PIN은 선생님께 받으세요.\n잊어버렸다면 선생님이 다시 발급해 줍니다.'));

  pinIn.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
  setTimeout(() => codeIn.focus(), 50);
  return panel;
}

/* ---------- 회원가입 ---------- */
function renderSignupPage() {
  const panel = el('div', { class: 'panel' });
  panel.appendChild(el('button', { class: 'back-btn', onClick: () => { state.view = 'login'; render(); } }, '← 로그인'));
  panel.appendChild(el('h2', { style: 'margin-top:10px' }, '회원가입'));

  const f = (label, input) => el('div', { class: 'field' }, [el('label', {}, label), input]);

  const nameIn  = el('input', { type: 'text',     placeholder: '홍길동' });
  const phoneIn = el('input', { type: 'tel',      placeholder: '010-0000-0000' });
  const emailIn = el('input', { type: 'email',    placeholder: 'example@email.com' });
  const addrIn  = el('input', { type: 'text',     placeholder: '서울시 강남구 ...' });
  const pwIn    = el('input', { type: 'password', placeholder: '6자 이상' });
  const pwCfmIn = el('input', { type: 'password', placeholder: '비밀번호 재입력' });

  [f('이름 *', nameIn), f('연락처 *', phoneIn), f('이메일 *', emailIn),
   f('주소', addrIn), f('비밀번호 * (6자 이상)', pwIn), f('비밀번호 확인 *', pwCfmIn)]
    .forEach(w => panel.appendChild(w));

  const submitBtn = el('button', { class: 'btn btn-primary btn-block btn-lg', style: 'margin-top:4px', onClick: async () => {
    const name  = nameIn.value.trim();
    const phone = phoneIn.value.trim();
    const email = emailIn.value.trim();
    const pw    = pwIn.value;
    if (!name || !phone || !email || !pw) { toast('필수 항목을 모두 입력하세요', 'danger'); return; }
    if (pw.length < 6) { toast('비밀번호는 6자 이상이어야 합니다', 'danger'); return; }
    if (pw !== pwCfmIn.value) { toast('비밀번호가 일치하지 않습니다', 'danger'); return; }

    submitBtn.disabled = true; submitBtn.textContent = '처리 중...';
    try {
      // 회원가입 중 onAuthStateChanged 중복 실행 방지
      window._signingUp = true;

      const cred = await fbRegister(email, pw);
      const uid  = cred.user.uid;

      // Firestore 문서 먼저 저장 후 라우팅 (Race condition 방지)
      // isAdmin은 항상 false. 관리자 승격은 Firebase 콘솔에서만 가능하다
      // (이전에는 '첫 가입자 = 관리자'였으나, 신규 배포판을 먼저 발견한
      //  아무나 관리자가 될 수 있어 제거했다)
      // approved도 항상 false. 관리자가 승인해야 교사 권한이 생긴다
      await fbSaveTeacher(uid, {
        name, phone, email, address: addrIn.value.trim(),
        status: 'teaching', note: '', isAdmin: false, approved: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      window._signingUp = false;

      // 직접 onAuthLogin 호출
      state.view = 'loading';
      render();
      await onAuthLogin(cred.user);
      render();
      toast('✅ 가입 완료. 관리자 승인 후 이용할 수 있습니다.', 'success');
    } catch (e) {
      window._signingUp = false;
      const msg = e.code === 'auth/email-already-in-use' ? '이미 사용 중인 이메일입니다' : '가입 실패: ' + e.message;
      toast(msg, 'danger');
      submitBtn.disabled = false; submitBtn.textContent = '가입하기';
    }
  }}, '가입하기');
  panel.appendChild(submitBtn);
  return renderAuthLayout({ eyebrow: 'JOIN AS A TEACHER', title: '함께 가르칠', highlight: '선생님을 기다려요.',
    intro: '가입 후 관리자가 승인하면 단원과 학생 관리를 시작할 수 있어요.' }, panel);
}

/* ---------- 비밀번호 찾기 ---------- */
function renderForgotPassword() {
  const panel = el('div', { class: 'panel' });
  panel.appendChild(el('button', { class: 'back-btn', onClick: () => { state.view = 'login'; render(); } }, '← 로그인'));
  panel.appendChild(el('h2', { style: 'margin-top:10px' }, '비밀번호 찾기'));
  panel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:20px' }, '가입한 이메일로 비밀번호 재설정 링크를 보내드립니다.'));

  const emailIn = el('input', { type: 'email', placeholder: 'example@email.com' });
  panel.appendChild(el('div', { class: 'field' }, [el('label', {}, '이메일'), emailIn]));

  const sendBtn = el('button', { class: 'btn btn-primary btn-block', onClick: async () => {
    const email = emailIn.value.trim();
    if (!email) { toast('이메일을 입력하세요', 'danger'); return; }
    sendBtn.disabled = true; sendBtn.textContent = '전송 중...';
    try {
      await fbResetPassword(email);
      panel.innerHTML = '';
      panel.appendChild(el('div', { style: 'text-align:center; padding:20px' }, [
        el('i', { 'data-lucide': 'mail-check', style: 'width:48px; height:48px; color:var(--green); display:block; margin:0 auto 16px' }),
      ]));
      panel.appendChild(el('h3', { style: 'text-align:center; margin-bottom:8px' }, '이메일을 확인하세요'));
      panel.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; margin-bottom:20px' }, `${email}로 재설정 링크를 발송했습니다.`));
      panel.appendChild(el('button', { class: 'btn btn-primary btn-block', onClick: () => { state.view = 'login'; render(); } }, '로그인으로 돌아가기'));
      if (window.lucide) window.lucide.createIcons();
    } catch (e) {
      toast('이메일 발송 실패: ' + e.message, 'danger');
      sendBtn.disabled = false; sendBtn.textContent = '재설정 이메일 보내기';
    }
  }}, '재설정 이메일 보내기');
  panel.appendChild(sendBtn);
  return renderAuthLayout({ eyebrow: 'FORGOT PASSWORD', title: '비밀번호를', highlight: '다시 설정해요.',
    intro: '메일로 받은 링크에서 새 비밀번호를 정하면 바로 로그인할 수 있어요.' }, panel);
}

/* ---------- 승인 대기 ---------- */
// 가입했지만 관리자가 아직 승인하지 않은 교사의 화면. 승인 여부는 로그인 때 판정하므로 새로고침으로 다시 확인한다
function renderTeacherPending() {
  const panel = el('div', { class: 'panel', style: 'text-align:center' });
  panel.appendChild(el('i', { 'data-lucide': 'hourglass', style: 'width:44px; height:44px; color:var(--primary); display:block; margin:0 auto 14px' }));
  panel.appendChild(el('h2', { style: 'margin-bottom:10px' }, '관리자 승인 대기 중'));
  panel.appendChild(el('p', { class: 'text-muted', style: 'line-height:1.7; margin-bottom:18px; white-space:pre-line' },
    '가입이 완료되었습니다.\n관리자가 승인하면 단원과 학생 관리를 시작할 수 있습니다.'));
  panel.appendChild(el('button', { class: 'btn btn-primary btn-block', onClick: () => location.reload() }, '승인 확인 (새로고침)'));
  return renderAuthLayout({ eyebrow: 'ALMOST THERE', title: '첫 수업까지', highlight: '조금만 기다려 주세요.',
    intro: '승인되면 같은 계정으로 바로 수업을 준비할 수 있어요.' }, panel);
}

function renderHome() {
  const root = el('div');

  const hero = el('div', { class: 'home-hero' });
  hero.appendChild(el('p', { class: 'eyebrow' }, 'KOREAN LEARNING APP'));
  hero.appendChild(el('h1', {}, ['한국어 ', el('span', { class: 'underline' }, '학습 도구')]));
  hero.appendChild(el('p', {}, '단원을 준비하고, 학생과 함께 게임으로 배워요.'));
  root.appendChild(hero);

  // 모드 선택. 랜딩의 기능 카드처럼 색 아이콘·번호·설명·태그로 구성한다
  const grid = el('div', { class: 'mode-grid' });
  const modeCard = (num, tone, icon, title, sub, tag, onClick) => el('div', { class: 'mode-card', onClick }, [
    el('span', { class: `mode-icon ${tone}` }, [el('i', { 'data-lucide': icon })]),
    el('span', { class: 'mode-num' }, num),
    el('h3', {}, title),
    el('p', {}, sub),
    el('span', { class: 'mode-tag' }, tag),
    el('span', { class: 'mode-arrow', 'aria-hidden': 'true' }, '→')
  ]);
  grid.append(
    modeCard('01', 'green', 'book-open', '교사 모드', 'Teacher Mode', '단원 관리 · PDF 자동 변환', () => { state.view = 'teacher'; render(); }),
    modeCard('02', 'coral', 'graduation-cap', '학생 모드', 'Student Mode', '게임으로 한국어 배우기', () => { state.view = 'student-select'; render(); })
  );
  root.appendChild(grid);
  root.appendChild(renderTeacherDirectory());

  return root;
}




// 로그인 직후 Firestore 조회가 실패했을 때 이유를 화면에 붙여둔다.
// 토스트는 2.2초 뒤 사라져 로딩 화면에 묻힌다. 그래서 명단이 왜 비어 있는지
// 아무도 모른 채 버튼만 눌러보게 된다
function renderLoadErrorBanner() {
  if (!state.loadError) return null;
  const box = el('div', { class: 'panel', style: 'border-left:4px solid var(--danger); background:var(--red-soft)' });
  const t = el('h3', { style: 'color:var(--red); display:flex; align-items:center; gap:8px; margin:0 0 8px' });
  t.appendChild(el('i', { 'data-lucide': 'alert-triangle', style: 'width:18px; height:18px; color:var(--red);' }));
  t.appendChild(document.createTextNode('데이터를 불러오지 못했습니다'));
  box.appendChild(t);
  box.appendChild(el('p', { style: 'color:var(--red); font-size:0.9rem; line-height:1.6; margin:0' }, state.loadError));
  // 학생 세션은 currentTeacher가 원래 null이다. 교사에게만 해당하는 안내다
  if (state.role === 'teacher' && !state.currentTeacher) {
    box.appendChild(el('p', { style: 'color:var(--red); font-size:0.9rem; line-height:1.6; margin:8px 0 0; font-weight:700' },
      '교사 정보를 읽지 못해 단원 생성과 학생 등록이 동작하지 않습니다.'));
  }
  return box;
}

function renderTeacher() {
  const root = el('div');
  const banner = renderLoadErrorBanner();
  if (banner) root.appendChild(banner);
  const panel = el('div', { class: 'panel' });
  const head = el('div', { class: 'row-between' });

  const isTraining = state.currentTeacher && state.currentTeacher.status === 'training';

  const title = el('h2', { style: 'display:flex; align-items:center; gap:8px' });
  title.appendChild(el('i', { 'data-lucide': 'book-open', style: 'width:24px; height:24px; color:var(--primary);' }));
  title.appendChild(document.createTextNode('단원 관리'));
  head.appendChild(title);
  
  const headBtns = el('div', { style: 'display:flex; gap:8px; flex-wrap:wrap' });

  const _pv = getProvider(); const _pk = !!getApiKey(_pv); const _pi = PROVIDERS[_pv];
  const aiBtn = el('button', {
    class: 'btn btn-sm',
    style: `background:${_pk ? 'var(--green-soft)' : 'var(--red-soft)'}; color:${_pk ? 'var(--green-deep)' : 'var(--red)'}; border:1.5px solid ${_pk ? 'var(--green-line)' : 'var(--red-line)'}; display:inline-flex; align-items:center; gap:4px`,
    onClick: showApiKeyModal
  });
  aiBtn.appendChild(el('i', { 'data-lucide': _pi.icon, style: 'width:13px; height:13px;' }));
  aiBtn.appendChild(document.createTextNode(_pk ? ' AI 설정 ✓' : ' ⚠️ AI 설정'));
  headBtns.appendChild(aiBtn);

  const progressBtn = el('button', { class: 'btn btn-ghost', style: 'display:flex; align-items:center; gap:6px', onClick: () => { _progressCache = null; state.view = 'teacher-progress'; render(); }});
  progressBtn.appendChild(el('i', { 'data-lucide': 'bar-chart-2', style: 'width:16px; height:16px;' }));
  progressBtn.appendChild(document.createTextNode('진도 현황'));
  headBtns.appendChild(progressBtn);

  const profileBtn = el('button', { class: 'btn btn-ghost', style: 'display:flex; align-items:center; gap:6px', onClick: showTeacherProfileModal });
  profileBtn.appendChild(el('i', { 'data-lucide': 'id-card', style: 'width:16px; height:16px;' }));
  profileBtn.appendChild(document.createTextNode('공개 프로필'));
  headBtns.appendChild(profileBtn);

  if (!isTraining) {
    const addStuBtn = el('button', { class: 'btn btn-accent btn-sm', style: 'display:inline-flex; align-items:center; gap:4px', onClick: () => showAddStudentModal(state.currentTeacher) });
    addStuBtn.appendChild(el('i', { 'data-lucide': 'user-plus', style: 'width:13px; height:13px; color:#fff;' }));
    addStuBtn.appendChild(document.createTextNode('학생 등록'));
    headBtns.appendChild(addStuBtn);

    const createBtn = el('button', { class: 'btn btn-primary', style: 'display:flex; align-items:center; gap:6px', onClick: () => { state.view = 'teacher-create'; render(); }});
    createBtn.appendChild(el('i', { 'data-lucide': 'plus', style: 'width:16px; height:16px; color:#fff;' }));
    createBtn.appendChild(document.createTextNode('새 단원'));
    headBtns.appendChild(createBtn);
  }
  
  head.appendChild(headBtns);
  panel.appendChild(head);
  
  // 교육중 상태 배너 추가
  if (isTraining) {
    const banner = el('div', { style: 'background:var(--accent-soft); color:var(--accent-ink); border:1px solid var(--yellow-line); border-radius:10px; padding:12px; margin: 12px 0 16px; display:flex; align-items:center; gap:8px; font-weight:600; font-size:0.88rem; line-height:1.4;' });
    banner.appendChild(el('i', { 'data-lucide': 'alert-triangle', style: 'width:18px; height:18px; color:var(--accent-ink); flex-shrink:0;' }));
    banner.appendChild(document.createTextNode('⚠️ 현재 교육중 모드입니다. 대시보드를 조회만 할 수 있으며, 단원 생성/편집 및 학생 등록이 제한됩니다.'));
    panel.appendChild(banner);
  }
  
  panel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:14px' }, 'PDF 업로드 또는 직접 입력으로 단원을 만들고 편집할 수 있습니다.'));

  const visibleUnits = allUnits();
  if (visibleUnits.length === 0) {
    panel.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; padding:24px' }, '아직 단원이 없습니다.'));
  } else {
    const isAdmin = !!(state.currentUser && state.currentUser.isAdmin);

    const makeUnitItem = (u) => {
      const item = el('div', { class: 'unit-item' });
      const info = el('div');
      const shared = isSharedUnit(u);

      const h = el('h4', { style: 'display:flex; align-items:center; gap:6px; flex-wrap:wrap' });
      h.appendChild(document.createTextNode(u.title));
      if (shared) h.appendChild(el('span', { style: 'font-size:0.72rem; font-weight:800; color:var(--lavender-ink); background:var(--lavender); border-radius:20px; padding:2px 8px' }, '공용'));
      else if (isAdmin && isPublished(u)) h.appendChild(el('span', { style: 'font-size:0.72rem; font-weight:800; color:var(--green-deep); background:var(--green-soft); border-radius:20px; padding:2px 8px' }, '발행됨'));
      info.appendChild(h);
      info.appendChild(el('div', { class: 'meta' }, `어휘 ${u.vocabulary.length} · 문법 ${u.grammar.length} · 퀴즈 ${(u.quizzes || []).length}`));

      // 공용 단원은 관리자 문서에 있다. 교사가 편집하면 자기 문서에만 반영되는
      // 유령 수정이 되므로 편집·삭제를 아예 주지 않는다
      if (shared) {
        const actions = el('div', { class: 'unit-actions' });
        if (!isTraining) {
          const copyBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'display:inline-flex; align-items:center; gap:4px', onClick: () => copySharedUnit(u) });
          copyBtn.appendChild(el('i', { 'data-lucide': 'copy', style: 'width:13px; height:13px;' }));
          copyBtn.appendChild(document.createTextNode('내 단원으로 복사'));
          actions.appendChild(copyBtn);
        }
        if (isAdmin) {
          const downBtn = el('button', { class: 'btn btn-danger btn-sm', style: 'display:inline-flex; align-items:center; gap:4px', onClick: () => unpublishUnit(u) });
          downBtn.appendChild(document.createTextNode('발행 취소'));
          actions.appendChild(downBtn);
        }
        item.append(info, actions);
        return item;
      }

      if (!isTraining) {
        const actions = el('div', { class: 'unit-actions' });

        const editBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'display:inline-flex; align-items:center; gap:4px', onClick: () => editUnit(u.id) });
        editBtn.appendChild(el('i', { 'data-lucide': 'edit-2', style: 'width:13px; height:13px;' }));
        editBtn.appendChild(document.createTextNode('편집'));
        actions.appendChild(editBtn);

        // 발행은 관리자만 한다. 발행 후 원본을 고치면 '발행 갱신'을 다시 눌러야
        // 교사·학생에게 반영된다. 자동 동기화는 쓰기 횟수만 늘린다
        if (isAdmin) {
          const published = isPublished(u);
          const pubBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'display:inline-flex; align-items:center; gap:4px; color:var(--lavender-ink)', onClick: () => publishUnit(u) });
          pubBtn.appendChild(el('i', { 'data-lucide': 'share-2', style: 'width:13px; height:13px;' }));
          pubBtn.appendChild(document.createTextNode(published ? '발행 갱신' : '공용으로 발행'));
          actions.appendChild(pubBtn);

          if (published) {
            const downBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'display:inline-flex; align-items:center; gap:4px; color:var(--danger)', onClick: () => unpublishUnit(u) });
            downBtn.appendChild(document.createTextNode('발행 취소'));
            actions.appendChild(downBtn);
          }
        }

        const delBtn = el('button', { class: 'btn btn-danger btn-sm', style: 'display:inline-flex; align-items:center;', onClick: () => deleteUnit(u.id) });
        delBtn.appendChild(el('i', { 'data-lucide': 'trash-2', style: 'width:13px; height:13px; color:#fff;' }));
        actions.appendChild(delBtn);

        item.append(info, actions);
      } else {
        const viewLabel = el('div', { style: 'font-size:0.82rem; color:var(--muted); font-weight:700; padding:4px 10px; background:var(--surface-2); border-radius:20px; display:inline-flex; align-items:center; gap:4px;' });
        viewLabel.appendChild(el('i', { 'data-lucide': 'eye', style: 'width:12px; height:12px; color:var(--muted);' }));
        viewLabel.appendChild(document.createTextNode('조회 모드'));
        item.append(info, viewLabel);
      }
      return item;
    };

    // 난이도별로 묶어 표시한다. 단원이 없는 난이도는 나오지 않는다
    groupUnitsByLevel(visibleUnits).forEach(g => {
      const head = el('div', { style: 'display:flex; align-items:center; gap:8px; margin:18px 0 8px' });
      head.appendChild(el('i', { 'data-lucide': g.level.icon, style: `width:17px; height:17px; color:${g.level.color};` }));
      head.appendChild(el('span', { style: `font-weight:800; font-size:1rem; color:${g.level.color}` }, g.level.name));
      head.appendChild(el('span', { style: 'font-size:0.82rem; color:var(--muted); font-weight:600' }, `${g.units.length}개`));
      head.appendChild(el('div', { style: `flex:1; height:1px; background:${g.level.color}33` }));
      panel.appendChild(head);

      const list = el('div', { class: 'unit-list' });
      g.units.forEach(u => list.appendChild(makeUnitItem(u)));
      panel.appendChild(list);
    });
  }
  root.appendChild(panel);

  // Student roster
  const rosterPanel = el('div', { class: 'panel' });
  const rosterTitle = el('div', { class: 'row-between', style: 'margin-bottom:10px;' });
  
  const titleText = el('h3', { style: 'display:flex; align-items:center; gap:8px; margin:0;' });
  titleText.appendChild(el('i', { 'data-lucide': 'users', style: 'width:18px; height:18px; color:var(--primary);' }));
  titleText.appendChild(document.createTextNode('학생 명단'));
  rosterTitle.appendChild(titleText);
  
  rosterPanel.appendChild(rosterTitle);
  
  const teacherStudents = state.currentTeacher ? (state.currentTeacher.students || []) : [];
  if (teacherStudents.length === 0) {
    rosterPanel.appendChild(el('p', { class: 'text-muted', style: 'margin-top:10px; font-size:0.9rem' }, '등록된 학생이 없습니다.'));
  } else {
    const stuList = el('div', { style: 'display:flex; flex-direction:column; gap:8px; margin-top:10px' });
    teacherStudents.forEach((s, idx) => {
      const row = el('div', { style: 'display:flex; align-items:center; gap:10px; background:var(--surface-2); border:1px solid var(--line); border-radius:10px; padding:10px 14px' });
      row.appendChild(el('i', { 'data-lucide': 'user', style: 'width:14px; height:14px; color:var(--primary);' }));
      row.appendChild(el('div', { style: 'font-weight:600; flex:1' }, s.name));
      if (s.nationality) row.appendChild(el('div', { style: 'font-size:0.85rem; color:var(--muted)' }, s.nationality));
      if (s.age) row.appendChild(el('div', { style: 'font-size:0.85rem; color:var(--muted)' }, `${s.age}세`));
      
      if (!isTraining) {
        // 코드 발급 여부다. 지금 접속해 있는지가 아니다.
        // 앱은 접속 상태를 추적하지 않으므로 '접속됨'이라고 쓰면 거짓말이 된다
        const hasRemote = !!s.authUid;
        const remoteBtn = el('button', {
          class: 'btn btn-ghost btn-sm',
          style: `padding:2px 8px; min-height:auto; display:inline-flex; align-items:center; gap:3px; margin-right:4px; font-size:0.78rem; font-weight:700; color:${hasRemote ? 'var(--green)' : 'var(--muted)'}`,
          title: hasRemote ? '원격 접속 코드 재발급' : '원격 접속 코드 발급',
          onClick: () => showRemoteAccessModal(s)
        });
        remoteBtn.appendChild(el('i', { 'data-lucide': hasRemote ? 'smartphone' : 'smartphone-nfc', style: `width:14px; height:14px; color:${hasRemote ? 'var(--green)' : 'var(--muted)'};` }));
        remoteBtn.appendChild(document.createTextNode(hasRemote ? '발급됨' : '미발급'));
        row.appendChild(remoteBtn);

        const editStuBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'color:var(--sky-ink); padding:2px; min-height:auto; display:inline-flex; align-items:center; justify-content:center; margin-right:4px;', onClick: () => showEditStudentModal(state.currentTeacher, s, idx) });
        editStuBtn.appendChild(el('i', { 'data-lucide': 'pencil', style: 'width:14px; height:14px; color:var(--sky-ink);' }));
        row.appendChild(editStuBtn);

        const delStuBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'color:var(--danger); padding:2px; min-height:auto; display:inline-flex; align-items:center; justify-content:center;', onClick: async () => {
          const ok = await showConfirm('학생 삭제', `"${s.name}" 학생을 정말 삭제하시겠습니까?`, true);
          if (!ok) return;
          try {
            if (s.firestoreId) await fbDeleteStudent(s.firestoreId, s.authUid);
          } catch (err) {
            // 실패했는데 명단에서 먼저 빼면 지워진 것처럼 보이다가
            // 새로고침하면 학생이 되살아난다
            toastSaveError('학생 삭제', err);
            return;
          }
          state.currentTeacher.students.splice(idx, 1);
          state.students = state.currentTeacher.students.map(st => st.name);
          render();
          toast(`${s.name} 학생을 삭제했습니다`, 'success');
        }});
        delStuBtn.appendChild(el('i', { 'data-lucide': 'trash-2', style: 'width:14px; height:14px; color:var(--danger);' }));
        row.appendChild(delStuBtn);
      }
      stuList.appendChild(row);
    });
    rosterPanel.appendChild(stuList);
  }
  root.appendChild(rosterPanel);

  // Danger zone - reset all data (수업중 상태일 때만 활성화)
  if (!isTraining) {
    const dangerPanel = el('div', { class: 'panel', style: 'border-left:4px solid var(--danger)' });
    
    const dangerTitle = el('h3', { style: 'color:var(--danger); display:flex; align-items:center; gap:8px;' });
    dangerTitle.appendChild(el('i', { 'data-lucide': 'alert-triangle', style: 'width:18px; height:18px; color:var(--danger);' }));
    dangerTitle.appendChild(document.createTextNode('데이터 초기화'));
    dangerPanel.appendChild(dangerTitle);
    
    dangerPanel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:12px' }, '모든 단원, 점수, 레벨, 배지를 삭제하고 처음부터 다시 시작합니다. 샘플 단원으로 초기화되며 되돌릴 수 없습니다.'));
    
    const resetBtn = el('button', { class: 'btn btn-danger', style: 'display:inline-flex; align-items:center; gap:6px', onClick: async () => {
      const ok1 = await showConfirm('⚠️ 데이터 초기화', '정말 모든 데이터를 삭제하시겠습니까?\n\n- 모든 단원 삭제\n- 점수/레벨/배지 초기화\n- 샘플 단원으로 초기화\n\n⚠️ 되돌릴 수 없습니다.', true);
      if (!ok1) return;
      const ok2 = await showConfirm('마지막 확인', '정말로 처음부터 다시 시작하시겠습니까?', true);
      if (!ok2) return;
      try { await window.storage.delete(TEACHER_KEY); } catch (e) {}
      state.units = [SAMPLE_UNIT];
      state.stats = defaultStats();
      state.language = 'en';
      state.students = [];
      state.currentStudent = null;
      state.currentStudentDoc = null;
      state.view = 'home';
      state.currentUnitId = null;
      state.currentActivity = null;
      state.game = null;
      await persistTeacher(true);
      toast('초기화 완료. 처음부터 시작합니다.', 'success');
      render();
    }});
    resetBtn.appendChild(el('i', { 'data-lucide': 'refresh-cw', style: 'width:15px; height:15px; color:#fff;' }));
    resetBtn.appendChild(document.createTextNode('모든 데이터 초기화하기'));
    dangerPanel.appendChild(resetBtn);
    root.appendChild(dangerPanel);
  }

  return root;
}

function editUnit(id) { state.currentUnitId = id; state.view = 'teacher-edit'; render(); }

/* =========================================================
   공용 단원 — 관리자가 발행하고 교사·학생이 함께 본다
   ========================================================= */

function isPublished(unit) {
  return (state.sharedUnits || []).some(s => s.id === sharedIdOf(unit.id));
}

// 내 단원을 공용 목록에 복사한다. 원본은 그대로 내 것으로 남는다.
// 원본을 고친 뒤 다시 누르면 공용본이 갱신된다
async function publishUnit(unit) {
  const copy = JSON.parse(JSON.stringify(unit));
  copy.id = sharedIdOf(unit.id);
  copy.shared = true;
  const next = (state.sharedUnits || []).filter(s => s.id !== copy.id).concat([copy]);
  try {
    await fbSaveSharedCurriculum(next);
    state.sharedUnits = next;
    toast(`"${unit.title}" 공용 단원으로 발행했습니다`, 'success');
    render();
  } catch (e) {
    toastSaveError('공용 단원 발행', e);
  }
}

async function unpublishUnit(unit) {
  const sharedId = isSharedUnit(unit) ? unit.id : sharedIdOf(unit.id);
  const ok = await showConfirm('발행 취소',
    `"${unit.title}"을(를) 공용 목록에서 내립니다.\n\n다른 교사와 학생 화면에서 사라집니다.\n학생들이 쌓은 진도 기록 자체는 지워지지 않습니다.`, true);
  if (!ok) return;
  const next = (state.sharedUnits || []).filter(s => s.id !== sharedId);
  try {
    await fbSaveSharedCurriculum(next);
    state.sharedUnits = next;
    toast('공용 목록에서 내렸습니다', 'success');
    render();
  } catch (e) {
    toastSaveError('발행 취소', e);
  }
}

// 공용 단원을 내 단원으로 복사한다. 새 id를 받아 원본과 완전히 분리된다.
// 이후 자유롭게 고칠 수 있고 관리자가 원본을 고쳐도 영향받지 않는다
async function copySharedUnit(unit) {
  const copy = JSON.parse(JSON.stringify(unit));
  copy.id = Date.now();
  copy.title = unit.title + ' (복사본)';
  delete copy.shared;
  state.units.push(copy);
  try {
    await persistAll(true);
    toast('내 단원으로 복사했습니다', 'success');
    render();
  } catch (e) {
    state.units = state.units.filter(u => u.id !== copy.id);
    toastSaveError('단원 복사', e);
  }
}
async function deleteUnit(id) {
  const unit = state.units.find(u => u.id === id);
  const ok = await showConfirm('단원 삭제', `"${unit ? unit.title : '이 단원'}"을 정말 삭제하시겠습니까?\n\n포함된 모든 어휘, 문법, 퀴즈가 함께 삭제됩니다`, true);
  if (!ok) return;
  state.units = state.units.filter(u => u.id !== id);
  await persistAll(true);
  toast('단원 삭제됨', 'danger');
  render();
}

// 새로 만드는 단원에 붙일 난이도. PDF 변환과 직접 입력이 함께 참조한다
let _createLevel = DEFAULT_LEVEL;

function renderTeacherCreate() {
  const root = el('div');
  const panel = el('div', { class: 'panel' });
  panel.appendChild(el('button', { class: 'back-btn', onClick: () => { state.view = 'teacher'; render(); }}, '← 뒤로'));

  const title = el('h2', { style: 'margin-top:10px; display:flex; align-items:center; gap:8px' });
  title.appendChild(el('i', { 'data-lucide': 'plus-circle', style: 'width:24px; height:24px; color:var(--primary);' }));
  title.appendChild(document.createTextNode('새 단원 만들기'));
  panel.appendChild(title);

  // 난이도 선택. 아래 두 방식(PDF 변환·직접 입력) 모두에 적용된다
  panel.appendChild(el('label', { style: 'display:block; font-size:0.9rem; font-weight:700; margin:14px 0 6px' }, '난이도'));
  const levelRow = el('div', { style: 'display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-bottom:6px' });
  LEVELS.forEach(lv => {
    const active = _createLevel === lv.code;
    const btn = el('button', {
      class: 'btn btn-sm',
      style: `padding:10px 4px; line-height:1.35; font-weight:700;
              background:${active ? lv.color : 'var(--surface-2)'}; color:${active ? '#fff' : 'var(--muted)'};
              border:1.5px solid ${active ? lv.color : 'transparent'}`,
      onClick: () => { _createLevel = lv.code; render(); }
    });
    btn.appendChild(el('i', { 'data-lucide': lv.icon, style: `display:block; margin:0 auto 4px; width:17px; height:17px; color:${active ? '#fff' : lv.color};` }));
    btn.appendChild(document.createTextNode(lv.name));
    levelRow.appendChild(btn);
  });
  panel.appendChild(levelRow);
  panel.appendChild(el('p', { class: 'text-muted', style: 'font-size:0.82rem; margin-bottom:14px' }, '만든 뒤 단원 편집 화면에서 언제든 바꿀 수 있습니다.'));

  const opts = el('div', { class: 'create-options' });

  const pdfOpt = el('div', { class: 'option-card' });
  pdfOpt.innerHTML = '<i data-lucide="file-text" class="card-icon" style="width:40px; height:40px;"></i><div class="label">PDF 자동 변환</div><div class="desc">학습지 PDF에서 어휘·문법·퀴즈를 자동 추출</div>';
  const fileInput = el('input', { type: 'file', accept: 'application/pdf', style: 'margin-top:10px; font-size:0.92rem' });
  fileInput.onchange = handlePDFUpload;
  pdfOpt.appendChild(fileInput);

  const manualOpt = el('div', { class: 'option-card', onClick: createBlankUnit });
  manualOpt.innerHTML = '<i data-lucide="edit-3" class="card-icon" style="width:40px; height:40px;"></i><div class="label">직접 입력</div><div class="desc">새 단원을 만들어 직접 입력</div>';

  opts.append(pdfOpt, manualOpt);
  panel.appendChild(opts);
  panel.appendChild(el('p', { style: 'font-size:0.82rem; color:var(--accent-ink); background:var(--accent-soft); border-radius:8px; padding:10px 12px; margin-top:10px; line-height:1.5' }, '⚠️ PDF 내용은 선택한 AI 서비스(Gemini·OpenAI·Anthropic 등) 서버로 전송됩니다. 개인정보·민감 자료가 포함된 경우 업로드 전 확인하세요.'));
  panel.appendChild(el('div', { id: 'pdf-status', class: 'loading hidden' }));
  root.appendChild(panel);
  return root;
}

async function createBlankUnit() {
  const title = await showPrompt('새 단원 만들기', '예: 10단원 - 가족');
  if (!title) return;
  state.units.push({ id: Date.now(), title, level: _createLevel, vocabulary: [], grammar: [], quizzes: [] });
  await persistAll(true);
  state.currentUnitId = state.units[state.units.length - 1].id;
  state.view = 'teacher-edit';
  render();
}

async function handlePDFUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const provider = getProvider();
  if (!getApiKey(provider)) {
    toast('⚠️ AI 설정을 먼저 완료하세요 (상단 버튼)', 'danger');
    showApiKeyModal();
    return;
  }
  const status = $('#pdf-status');
  status.className = 'loading';
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  const pInfo = PROVIDERS[provider];

  try {
    let aiText;

    if (provider === 'gemini') {
      status.innerHTML = `<span class="spinner"></span> PDF (${sizeMB}MB) Gemini에 업로드 중...`;
      const key = getApiKey('gemini');
      const model = getModel('gemini');
      const uploadedFile = await uploadToGeminiFiles(file, key);
      status.innerHTML = `<span class="spinner"></span> ${pInfo.icon} ${pInfo.name} PDF 분석 중...`;
      const langName = LANGS.find(l => l.code === state.language)?.name || 'English';
      const prompt = `이것은 한국어 학습 교재 PDF입니다. 학생 언어: ${langName}. 내용을 분석하여 아래 JSON 형식으로만 출력하세요 (마크다운, 코드블록 없이 순수 JSON만):\n{"title":"단원 제목","vocab":[{"w":"한글단어","r":"romanization","e":"📝","m":"${langName}로 뜻"}],"grammar":[{"p":"~패턴","x":"${langName}로 설명","ex":[{"k":"한국어 예문","e":"${langName}로 번역"}]}],"quiz":[{"q":"문장 ___ 빈칸","o":["선택지1","선택지2","선택지3","선택지4"],"c":0,"h":"${langName}로 힌트"}]}\n\n요구사항:\n- 모든 한국어 어휘 추출 (장소, 동사, 명사, 형용사 등)\n- 1~3개 문법 패턴 식별\n- 5~6개 빈칸 채우기 퀴즈 (4지선다)\n- 뜻/설명/힌트는 반드시 ${langName}로 작성\n- JSON만 출력`;
      try {
        aiText = await callGeminiWithFile(uploadedFile.uri, prompt, key, model);
      } finally {
        deleteGeminiFile(uploadedFile.name, key);
      }
    } else {
      status.innerHTML = `<span class="spinner"></span> PDF (${sizeMB}MB) 텍스트 추출 중...`;
      const pdfText = await extractPdfText(file);
      const validationError = validateExtractedText(pdfText);
      if (validationError) throw new Error(validationError);
      const textForAI = pdfText.slice(0, 6000);
      status.innerHTML = `<span class="spinner"></span> ${pInfo.icon} ${pInfo.name} 분석 중... (${textForAI.length}자)`;
      const langName = LANGS.find(l => l.code === state.language)?.name || 'English';
      const prompt = `Below is text from a Korean language learning textbook. Student language: ${langName}. Extract content as JSON only (no markdown):\n{"title":"단원 제목","vocab":[{"w":"한글단어","r":"romanization","e":"📝","m":"meaning in ${langName}"}],"grammar":[{"p":"~패턴","x":"explanation in ${langName}","ex":[{"k":"예문","e":"translation in ${langName}"}]}],"quiz":[{"q":"문장 ___ 빈칸","o":["a","b","c","d"],"c":0,"h":"hint in ${langName}"}]}\n\nAll meanings, explanations, and hints MUST be written in ${langName}.\n\nTEXT:\n${textForAI}`;
      aiText = await callAI(prompt);
    }

    const parsed = parseJSONSafe(aiText);
    const parseError = validateParsedUnit(parsed);
    if (parseError) throw new Error(parseError);

    const newUnit = {
      id: Date.now(),
      title: parsed.title || '새 단원',
      level: _createLevel,
      vocabulary: (parsed.vocab || []).map(v => ({
        word: v.w || v.word || v.korean || '',
        romanization: v.r || v.romanization || '',
        emoji: v.e || v.emoji || '📝',
        translations: { en: v.m || v.meaning || v.english || '', [state.language]: v.m || v.meaning || v.english || '' }
      })).filter(v => v.word),
      grammar: (parsed.grammar || []).map(g => ({
        pattern: g.p || g.pattern || '',
        explanation: { en: g.x || g.explanation || g.english || '', [state.language]: g.x || g.explanation || g.english || '' },
        examples: (g.ex || g.examples || []).map(ex => ({
          ko: ex.k || ex.korean || '',
          en: ex.e || ex.english || ''
        }))
      })).filter(g => g.pattern),
      quizzes: (parsed.quiz || []).map(q => ({
        question: q.q || q.question || '',
        options: q.o || q.options || [],
        correct: typeof q.c === 'number' ? q.c : (typeof q.correct === 'number' ? q.correct : 0),
        hint: { en: q.h || q.hint || '', [state.language]: q.h || q.hint || '' }
      })).filter(q => q.question && q.options && q.options.length >= 2)
    };

    const totalCount = newUnit.vocabulary.length + newUnit.grammar.length + newUnit.quizzes.length;
    if (totalCount === 0) throw new Error('추출된 콘텐츠가 없습니다. PDF 내용을 AI가 인식하지 못했습니다. 직접 입력을 이용하세요.');

    state.units.push(newUnit);
    await persistAll(true);
    status.className = 'loading hidden';
    toast(`✅ 어휘 ${newUnit.vocabulary.length} · 문법 ${newUnit.grammar.length} · 퀴즈 ${newUnit.quizzes.length}`, 'success');
    state.currentUnitId = newUnit.id;
    state.view = 'teacher-edit';
    render();
  } catch (err) {
    console.error('PDF error:', err);
    status.className = 'loading';
    const message = err.message || '알 수 없는 오류가 발생했습니다.';
    status.innerHTML = `❌ 오류: ${message.split('\n')[0]}<br><small style="white-space:pre-line">${message.split('\n').slice(1).join('\n')}</small>`;
  }
}

function renderTeacherEdit() {
  const unit = state.units.find(u => u.id === state.currentUnitId);
  if (!unit) { state.view = 'teacher'; render(); return el('div'); }
  if (!unit.quizzes) unit.quizzes = [];
  const root = el('div');

  // Header
  const headPanel = el('div', { class: 'panel' });
  headPanel.appendChild(el('button', { class: 'back-btn', onClick: async () => { await persistAll(true); state.view = 'teacher'; render(); }}, '← 단원 목록'));
  const titleInput = el('input', { type: 'text', value: unit.title, style: 'margin-top:10px; font-size:1.2rem; font-weight:700' });
  titleInput.oninput = () => { unit.title = titleInput.value; };
  headPanel.appendChild(el('label', { style: 'margin-top:10px' }, '단원 제목'));
  headPanel.appendChild(titleInput);

  // 난이도 변경. 바꾸면 단원 목록에서 해당 그룹으로 이동한다
  headPanel.appendChild(el('label', { style: 'margin-top:12px' }, '난이도'));
  const levelSel = el('select', { style: 'width:100%; max-width:220px' });
  LEVELS.forEach(lv => {
    const opt = el('option', { value: lv.code }, lv.name);
    if ((unit.level || DEFAULT_LEVEL) === lv.code) opt.setAttribute('selected', '');
    levelSel.appendChild(opt);
  });
  levelSel.onchange = () => { unit.level = levelSel.value; persistAll(); render(); };
  headPanel.appendChild(levelSel);
  root.appendChild(headPanel);

  // Vocabulary
  const vocabPanel = el('div', { class: 'panel' });
  const vocabTitle = el('h2', { style: 'display:flex; align-items:center; gap:8px' });
  vocabTitle.appendChild(el('i', { 'data-lucide': 'book', style: 'width:22px; height:22px; color:var(--primary);' }));
  vocabTitle.appendChild(document.createTextNode(`어휘 (${unit.vocabulary.length})`));
  vocabPanel.appendChild(vocabTitle);

  const missingTrans = unit.vocabulary.filter(v => !v.translations || !v.translations.zh || !v.translations.ja).length;
  if (unit.vocabulary.length > 0 && missingTrans > 0) {
    const bulkTransBtn = el('button', { class: 'btn btn-accent btn-block', style: 'margin-bottom:12px; display:flex; align-items:center; justify-content:center; gap:6px', onClick: () => bulkTranslateVocab(unit) });
    bulkTransBtn.appendChild(el('i', { 'data-lucide': 'globe', style: 'width:16px; height:16px;' }));
    bulkTransBtn.appendChild(document.createTextNode(`모든 단어 자동 번역 (${missingTrans}개 · 6개 언어)`));
    vocabPanel.appendChild(bulkTransBtn);
  }

  unit.vocabulary.forEach((v, i) => {
    const item = el('div', { class: 'vocab-edit-item' });
    const grid = el('div', { class: 'vocab-edit-grid' });
    const emojiIn = el('input', { type: 'text', value: v.emoji || '', placeholder: '😀' });
    emojiIn.oninput = () => { v.emoji = emojiIn.value; };
    const wordIn = el('input', { type: 'text', value: v.word, placeholder: '한국어' });
    wordIn.oninput = () => { wordIn.value = wordIn.value; v.word = wordIn.value; };
    wordIn.onblur = () => { autoFillEmoji(v, emojiIn); };
    const romanIn = el('input', { type: 'text', value: v.romanization || '', placeholder: '발음' });
    romanIn.oninput = () => { v.romanization = romanIn.value; };
    const meaningIn = el('input', { type: 'text', value: (v.translations && v.translations.en) || '', placeholder: 'English' });
    meaningIn.oninput = () => { if (!v.translations) v.translations = {}; v.translations.en = meaningIn.value; };
    
    const delBtn = el('button', { class: 'btn btn-danger btn-sm', style: 'display:inline-flex; align-items:center; justify-content:center;', onClick: () => { unit.vocabulary.splice(i, 1); persistAll(); render(); }});
    delBtn.appendChild(el('i', { 'data-lucide': 'trash-2', style: 'width:13px; height:13px; color:#fff;' }));
    
    grid.append(emojiIn, wordIn, romanIn, meaningIn, delBtn);
    item.appendChild(grid);
    vocabPanel.appendChild(item);
  });
  
  const addVocabBtn = el('button', { class: 'btn btn-primary btn-block', style: 'margin-top:14px; padding:14px; display:flex; align-items:center; justify-content:center; gap:6px', onClick: () => addVocab(unit) });
  addVocabBtn.appendChild(el('i', { 'data-lucide': 'plus', style: 'width:16px; height:16px; color:#fff;' }));
  addVocabBtn.appendChild(document.createTextNode('단어 추가하기'));
  vocabPanel.appendChild(addVocabBtn);
  root.appendChild(vocabPanel);

  // Grammar
  const grPanel = el('div', { class: 'panel' });
  const grTitle = el('h2', { style: 'display:flex; align-items:center; gap:8px' });
  grTitle.appendChild(el('i', { 'data-lucide': 'book-open', style: 'width:22px; height:22px; color:var(--primary);' }));
  grTitle.appendChild(document.createTextNode(`문법 (${unit.grammar.length})`));
  grPanel.appendChild(grTitle);

  unit.grammar.forEach((g, i) => {
    const item = el('div', { class: 'grammar-edit-item' });
    const patIn = el('input', { type: 'text', value: g.pattern, placeholder: '예) ~에서' });
    patIn.oninput = () => { g.pattern = patIn.value; };
    item.appendChild(el('label', {}, '패턴'));
    item.appendChild(patIn);

    const expIn = el('textarea', { placeholder: '문법 설명을 한국어로 입력하세요' });
    expIn.value = (g.explanation && (g.explanation.ko || g.explanation.en)) || '';
    expIn.oninput = () => { if (!g.explanation) g.explanation = {}; g.explanation.ko = expIn.value; };
    item.appendChild(el('label', { style: 'margin-top:8px' }, '설명 (한국어)'));
    item.appendChild(expIn);

    const exTa = el('textarea', { placeholder: '한국어 | English\n예) 도서관에서 책을 읽어요 | I read at the library.' });
    exTa.value = (g.examples || []).map(e => `${e.ko} | ${e.en}`).join('\n');
    exTa.oninput = () => {
      g.examples = exTa.value.split('\n').filter(l => l.trim()).map(l => {
        const [ko, en] = l.split('|').map(s => (s || '').trim());
        return { ko, en };
      });
    };
    item.appendChild(el('label', { style: 'margin-top:8px' }, '예문 (한 줄에 하나)'));
    item.appendChild(exTa);
    
    const delGbtn = el('button', { class: 'btn btn-danger btn-sm', style: 'margin-top:8px; display:inline-flex; align-items:center; gap:4px', onClick: () => { unit.grammar.splice(i, 1); persistAll(); render(); }});
    delGbtn.appendChild(el('i', { 'data-lucide': 'trash-2', style: 'width:13px; height:13px; color:#fff;' }));
    delGbtn.appendChild(document.createTextNode('삭제'));
    item.appendChild(delGbtn);
    
    grPanel.appendChild(item);
  });
  
  const addGrBtn = el('button', { class: 'btn btn-primary btn-block', style: 'margin-top:14px; padding:14px; display:flex; align-items:center; justify-content:center; gap:6px', onClick: () => addGrammar(unit) });
  addGrBtn.appendChild(el('i', { 'data-lucide': 'plus', style: 'width:16px; height:16px; color:#fff;' }));
  addGrBtn.appendChild(document.createTextNode('문법 추가하기'));
  grPanel.appendChild(addGrBtn);
  root.appendChild(grPanel);

  // Quizzes
  const qzPanel = el('div', { class: 'panel' });
  const qzTitle = el('h2', { style: 'display:flex; align-items:center; gap:8px' });
  qzTitle.appendChild(el('i', { 'data-lucide': 'file-text', style: 'width:22px; height:22px; color:var(--primary);' }));
  qzTitle.appendChild(document.createTextNode(`PDF 퀴즈 (${unit.quizzes.length})`));
  qzPanel.appendChild(qzTitle);
  qzPanel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:12px' }, '학습지에서 자동 추출된 객관식 문제입니다. ___ 자리에 들어갈 단어를 4개 보기에서 선택하는 방식.'));

  unit.quizzes.forEach((q, i) => {
    const item = el('div', { class: 'quiz-edit-item' });
    item.appendChild(el('label', {}, `Q${i + 1} 문제 (___ 을 빈칸으로 사용)`));
    const qIn = el('input', { type: 'text', value: q.question, placeholder: '예) 도서관 ___ 책을 읽어요' });
    qIn.oninput = () => { q.question = qIn.value; };
    item.appendChild(qIn);

    item.appendChild(el('label', { style: 'margin-top:8px' }, '4개 보기 (정답 위치를 선택)'));
    (q.options || ['', '', '', '']).forEach((opt, oi) => {
      const row = el('div', { style: 'display:flex; gap:8px; align-items:center; margin-bottom:6px' });
      const radio = el('input', { type: 'radio', name: `qc_${i}`, style: 'flex:0' });
      radio.checked = q.correct === oi;
      radio.onchange = () => { q.correct = oi; };
      const optIn = el('input', { type: 'text', value: opt, placeholder: `보기 ${oi + 1}`, style: 'flex:1' });
      optIn.oninput = () => { q.options[oi] = optIn.value; };
      row.append(radio, optIn);
      item.appendChild(row);
    });

    const hintIn = el('input', { type: 'text', value: (q.hint && q.hint.en) || '', placeholder: 'English hint' });
    hintIn.oninput = () => { if (!q.hint) q.hint = {}; q.hint.en = hintIn.value; };
    item.appendChild(el('label', { style: 'margin-top:8px' }, '힌트 (English)'));
    item.appendChild(hintIn);

    const delQbtn = el('button', { class: 'btn btn-danger btn-sm', style: 'margin-top:8px; display:inline-flex; align-items:center; gap:4px', onClick: () => { unit.quizzes.splice(i, 1); persistAll(); render(); }});
    delQbtn.appendChild(el('i', { 'data-lucide': 'trash-2', style: 'width:13px; height:13px; color:#fff;' }));
    delQbtn.appendChild(document.createTextNode('삭제'));
    item.appendChild(delQbtn);
    
    qzPanel.appendChild(item);
  });
  
  const addQzBtn = el('button', { class: 'btn btn-primary btn-block', style: 'margin-top:14px; padding:14px; display:flex; align-items:center; justify-content:center; gap:6px', onClick: () => addQuiz(unit) });
  addQzBtn.appendChild(el('i', { 'data-lucide': 'plus', style: 'width:16px; height:16px; color:#fff;' }));
  addQzBtn.appendChild(document.createTextNode('퀴즈 추가하기'));
  qzPanel.appendChild(addQzBtn);
  root.appendChild(qzPanel);

  // Save
  const savePanel = el('div', { class: 'panel' });
  const vocabNeedCount = unit.vocabulary.filter(v => v.word && (!v.translations || !v.translations.zh)).length;
  const grammarNeedCount = unit.grammar.filter(g => g.explanation && g.explanation.en && (!g.explanation.zh)).length;
  const totalNeed = vocabNeedCount + grammarNeedCount;
  const btnLabel = totalNeed > 0
    ? `저장하기 + 자동 번역 (어휘 ${vocabNeedCount} · 문법 ${grammarNeedCount})`
    : '저장하기';
    
  const saveBtn = el('button', { class: 'btn btn-success btn-block btn-lg', style: 'display:flex; align-items:center; justify-content:center; gap:8px', onClick: async () => { await saveWithAutoTranslate(unit); } });
  saveBtn.appendChild(el('i', { 'data-lucide': 'save', style: 'width:20px; height:20px; color:#fff;' }));
  saveBtn.appendChild(document.createTextNode(btnLabel));
  savePanel.appendChild(saveBtn);
  if (totalNeed > 0) {
    savePanel.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; margin-top:10px; font-size:0.92rem' }, '🌐 저장 시 비어있는 번역은 AI로 자동 채워집니다 (영어·중국어·일본어·태국어·스페인어·베트남어)'));
  }
  root.appendChild(savePanel);

  return root;
}

function addVocab(unit) {
  unit.vocabulary.push({ word: '', romanization: '', emoji: '📝', translations: {} });
  render();
  scrollToNewItem('.vocab-edit-item', 'input[placeholder="한국어"]');
}

function addGrammar(unit) {
  unit.grammar.push({ pattern: '', explanation: {}, examples: [] });
  render();
  scrollToNewItem('.grammar-edit-item', 'input[type="text"]');
}

function addQuiz(unit) {
  if (!unit.quizzes) unit.quizzes = [];
  unit.quizzes.push({ question: '', options: ['', '', '', ''], correct: 0, hint: {} });
  render();
  scrollToNewItem('.quiz-edit-item', 'input[type="text"]');
}

function scrollToNewItem(itemSelector, focusSelector) {
  setTimeout(() => {
    const items = document.querySelectorAll(itemSelector);
    if (items.length === 0) return;
    const last = items[items.length - 1];
    last.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Highlight briefly
    last.style.transition = 'background 0.4s';
    const original = last.style.background;
    last.style.background = 'var(--accent-soft)';
    setTimeout(() => { last.style.background = original; }, 800);
    if (focusSelector) {
      const input = last.querySelector(focusSelector);
      if (input) setTimeout(() => input.focus(), 400);
    }
  }, 100);
}

async function autoFillEmoji(v, emojiInput) {
  if (!v.word || (v.emoji && v.emoji !== '📝') || !getApiKey(getProvider())) return;
  try {
    const text = await callAI(`Korean word: "${v.word}". Reply with ONLY one emoji. Nothing else.`);
    const match = text.trim().match(/\p{Extended_Pictographic}/u);
    const emoji = match ? match[0] : null;
    if (emoji) {
      v.emoji = emoji;
      if (emojiInput) emojiInput.value = emoji;
      persistAll();
    }
  } catch (e) {}
}

async function autoTranslateVocab(v) {
  if (!v.word) { toast('먼저 한국어 단어 입력', 'danger'); return; }
  toast('🌐 번역 중..', 'accent');
  try {
    const prompt = `For the Korean word "${v.word}", return ONLY JSON: {"romanization":"...","emoji":"X","translations":{"en":"...","zh":"...","ja":"...","th":"...","es":"...","vi":"..."}} - romanization with hyphens, ONE emoji.`;
    const text = await callAI(prompt);
    const parsed = parseJSONSafe(text);
    if (!parsed) throw new Error('AI 응답을 파싱할 수 없습니다.');
    v.romanization = parsed.romanization;
    v.emoji = parsed.emoji;
    v.translations = parsed.translations;
    await persistAll();
    toast('✅ 완료', 'success');
    render();
  } catch (e) { console.error(e); toast('번역 실패', 'danger'); }
}

async function bulkTranslateVocab(unit) {
  const targets = unit.vocabulary.filter(v => v.word && (!v.translations || !v.translations.zh));
  if (targets.length === 0) { toast('번역할 단어가 없습니다', 'accent'); return; }
  const total = targets.length;
  let done = 0;
  toast(`🌐 ${total}개 번역 시작...`, 'accent');
  const CHUNK = 5;
  for (let i = 0; i < targets.length; i += CHUNK) {
    const chunk = targets.slice(i, i + CHUNK);
    try {
      const list = chunk.map((v, idx) => `${idx + 1}. ${v.word}`).join('\n');
      const prompt = `For each Korean word below, return JSON array. Each item: {"r":"romanization","e":"emoji","t":{"en":"...","zh":"...","ja":"...","th":"...","es":"...","vi":"...","ne":"...","hi":"..."}}\n\nWords:\n${list}\n\nReturn ONLY a JSON array of ${chunk.length} items in same order.`;
      const text = await callAI(prompt);
      const arr = parseJSONSafe(text);
      if (!Array.isArray(arr)) { console.warn('bulkTranslate: 파싱 실패, 건너뜀'); continue; }
      chunk.forEach((v, idx) => {
        const it = arr[idx];
        if (!it) return;
        v.romanization = v.romanization || it.r;
        v.emoji = (v.emoji === '📝' || !v.emoji) ? it.e : v.emoji;
        v.translations = v.translations || {};
        ['en','zh','ja','th','es','vi','ne','hi'].forEach(lang => {
          if (!v.translations[lang] && it.t && it.t[lang]) v.translations[lang] = it.t[lang];
        });
      });
      done += chunk.length;
      toast(`🌐 어휘 ${done}/${total}`, 'accent');
      await persistAll();
      render();
    } catch (err) { console.error(err); }
  }
  toast(`✅ 어휘 번역 완료 (${done}/${total})`, 'success');
}

async function bulkTranslateGrammar(unit) {
  const targets = unit.grammar.filter(g => g.explanation && (g.explanation.ko || g.explanation.en) && (!g.explanation.zh || !g.explanation.ne));
  if (targets.length === 0) return 0;
  const total = targets.length;
  let done = 0;
  toast(`🌐 문법 ${total}개 번역 시작...`, 'accent');
  for (const g of targets) {
    try {
      const source = g.explanation.ko || g.explanation.en;
      const prompt = `아래 한국어 문법 설명을 7개 언어로 번역하세요. JSON만 출력하세요 (마크다운 없이):
{"en":"English","zh":"中文","ja":"日本語","th":"ภาษาไทย","es":"Español","vi":"Tiếng Việt","ne":"नेपाली","hi":"हिन्दी"}

패턴: ${g.pattern}
한국어 설명: ${source}

한국어 학습자를 위해 간결하고 명확하게 번역하세요.`;
      const text = await callAI(prompt);
      const parsed = parseJSONSafe(text);
      if (!parsed) { console.warn('bulkTranslateGrammar: 파싱 실패, 건너뜀'); continue; }
      ['en','zh','ja','th','es','vi','ne','hi'].forEach(lang => {
        if (!g.explanation[lang] && parsed[lang]) g.explanation[lang] = parsed[lang];
      });
      done++;
      toast(`🌐 문법 ${done}/${total}`, 'accent');
      await persistAll();
    } catch (e) { console.warn('Grammar translation failed:', e); }
  }
  return done;
}

async function saveWithAutoTranslate(unit) {
  // Count items needing translation
  const vocabNeed = unit.vocabulary.filter(v => v.word && (!v.translations || !v.translations.zh));
  const grammarNeed = unit.grammar.filter(g => g.explanation && (g.explanation.ko || g.explanation.en) && (!g.explanation.zh));

  if (vocabNeed.length === 0 && grammarNeed.length === 0) {
    await persistAll(true);
    toast('✅ 저장 완료', 'success');
    return;
  }

  toast(`🌐 저장 + 자동 번역 시작... (어휘 ${vocabNeed.length}, 문법 ${grammarNeed.length})`, 'accent');

  if (vocabNeed.length > 0) await bulkTranslateVocab(unit);
  if (grammarNeed.length > 0) await bulkTranslateGrammar(unit);

  await persistAll(true);
  toast('✅ 저장 + 자동 번역 완료!', 'success');
  render();
}

/* =========================================================
   TEACHER PROGRESS
   ========================================================= */
const BADGE_NAMES = { perfect: '완벽주의자', combo10: '🔥 10연속', xp500: '⭐ XP 500', level5: '🏆 Lv.5 달성' };
let _progressCache = null;

function getUnitActivities(unit) {
  const acts = [];
  if (unit.vocabulary.length > 0) {
    acts.push('flashcard');
    if (unit.vocabulary.length >= 4) { acts.push('quiz'); acts.push('matching'); }
  }
  if (unit.grammar.length > 0) { acts.push('fillblank'); acts.push('sentorder'); acts.push('oxquiz'); }
  if ((unit.quizzes || []).length > 0) acts.push('pdfquiz');
  return acts;
}

function calcUnitProgress(bestScores, unit) {
  const acts = getUnitActivities(unit);
  if (acts.length === 0) return null;
  const done = acts.filter(act => (bestScores[`${unit.id}_${act}`] || 0) > 0).length;
  return { done, total: acts.length, pct: Math.round(done / acts.length * 100) };
}

function calcOverallProgress(bestScores) {
  let done = 0, total = 0;
  allUnits().forEach(unit => {
    const p = calcUnitProgress(bestScores, unit);
    if (p) { done += p.done; total += p.total; }
  });
  return total > 0 ? Math.round(done / total * 100) : 0;
}

function renderProgressBar(pct, height = '10px') {
  const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--sky-ink)' : pct > 0 ? 'var(--gold)' : 'var(--line)';
  const wrap = el('div', { style: `background:var(--line); border-radius:99px; height:${height}; overflow:hidden; flex:1` });
  wrap.appendChild(el('div', { style: `background:${color}; width:${pct}%; height:100%; border-radius:99px` }));
  return wrap;
}

function renderTeacherProgress() {
  const root = el('div');
  const panel = el('div', { class: 'panel' });
  panel.appendChild(el('button', { class: 'back-btn', onClick: () => { _progressCache = null; state.view = 'teacher'; render(); }}, '← 교사 메뉴'));
  
  const title = el('h2', { style: 'margin-top:10px; display:flex; align-items:center; gap:8px' });
  title.appendChild(el('i', { 'data-lucide': 'bar-chart-2', style: 'width:24px; height:24px; color:var(--primary);' }));
  title.appendChild(document.createTextNode('학생 진도 현황'));
  panel.appendChild(title);

  // 명단은 학생 문서에서 그때그때 뽑는다. state.students(이름 배열)는 학생을
  // 새로 등록해도 갱신되지 않아 방금 추가한 학생이 빠진다
  const names = state.currentTeacher
    ? (state.currentTeacher.students || []).map(s => s.name)
    : state.students;

  if (names.length === 0) {
    panel.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; padding:20px' }, '교사 메뉴 → 학생 명단에서 이름을 추가해주세요.'));
    root.appendChild(panel);
    return root;
  }

  if (!_progressCache) {
    panel.appendChild(el('div', { style: 'text-align:center; padding:32px; color:var(--muted); font-size:1.05rem' }, '📊 학생 데이터 불러오는 중...'));
    root.appendChild(panel);
    loadStudentsProgress(state.currentUser.uid).then(cache => { _progressCache = cache; render(); });
    return root;
  }

  const avgPct = Math.round(
    names.reduce((sum, name) => sum + calcOverallProgress((_progressCache[name] || defaultStats()).bestScores), 0) / names.length
  );
  
  const summary = el('div', { style: 'display:flex; align-items:center; gap:16px; flex-wrap:wrap; background:var(--surface-2); border-radius:12px; padding:14px 18px; margin-bottom:20px' });
  
  const stuCountSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:600' });
  stuCountSpan.appendChild(el('i', { 'data-lucide': 'users', style: 'width:15px; height:15px; color:var(--primary);' }));
  stuCountSpan.appendChild(document.createTextNode(`${names.length}명`));
  summary.appendChild(stuCountSpan);
  
  const avgSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:600; color:var(--green)' });
  avgSpan.appendChild(el('i', { 'data-lucide': 'trending-up', style: 'width:15px; height:15px; color:var(--green);' }));
  avgSpan.appendChild(document.createTextNode(`평균 ${avgPct}%`));
  summary.appendChild(avgSpan);
  
  const unitSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:600' });
  unitSpan.appendChild(el('i', { 'data-lucide': 'book', style: 'width:15px; height:15px; color:var(--primary);' }));
  unitSpan.appendChild(document.createTextNode(`단원 ${allUnits().length}개`));
  summary.appendChild(unitSpan);
  
  const refreshBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'margin-left:auto; display:inline-flex; align-items:center; gap:4px', onClick: () => { _progressCache = null; render(); } });
  refreshBtn.appendChild(el('i', { 'data-lucide': 'refresh-cw', style: 'width:13px; height:13px;' }));
  refreshBtn.appendChild(document.createTextNode('새로고침'));
  summary.appendChild(refreshBtn);
  
  panel.appendChild(summary);

  names.forEach(name => {
    const stats = _progressCache[name] || defaultStats();
    const overallPct = calcOverallProgress(stats.bestScores);

    const card = el('div', { style: 'border:1px solid var(--line); border-radius:14px; padding:18px; margin-bottom:14px' });

    const hdr = el('div', { style: 'display:flex; align-items:center; gap:10px; margin-bottom:14px; flex-wrap:wrap' });
    
    const sNameDiv = el('div', { style: 'font-size:1.1rem; font-weight:700; color:var(--text); flex:1; display:flex; align-items:center; gap:6px' });
    sNameDiv.appendChild(el('i', { 'data-lucide': 'user', style: 'width:18px; height:18px; color:var(--primary);' }));
    sNameDiv.appendChild(document.createTextNode(name));
    hdr.appendChild(sNameDiv);
    
    hdr.appendChild(el('div', { style: 'background:var(--lavender); color:var(--lavender-ink); border-radius:20px; padding:3px 10px; font-size:0.85rem; font-weight:600' }, `⭐ Lv.${stats.level}`));
    hdr.appendChild(el('div', { style: 'background:var(--accent-soft); color:var(--accent-ink); border-radius:20px; padding:3px 10px; font-size:0.85rem; font-weight:600' }, `✨ ${stats.xp} XP`));
    card.appendChild(hdr);

    const overallRow = el('div', { style: 'display:flex; align-items:center; gap:10px; margin-bottom:14px' });
    overallRow.appendChild(el('div', { style: 'font-size:0.88rem; color:var(--muted); white-space:nowrap' }, '전체 진도'));
    overallRow.appendChild(renderProgressBar(overallPct));
    overallRow.appendChild(el('div', { style: 'font-weight:700; font-size:0.95rem; min-width:40px; text-align:right' }, `${overallPct}%`));
    card.appendChild(overallRow);

    if (allUnits().length > 0) {
      const grid = el('div', { style: 'display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:8px' });
      allUnits().forEach(unit => {
        const p = calcUnitProgress(stats.bestScores, unit);
        const pct = p ? p.pct : 0;
        const label = unit.title.replace(/^\d+(?:단원|단)?\s*[-·]\s*/, '') || unit.title;
        const chip = el('div', { style: 'background:var(--surface-2); border:1px solid var(--line); border-radius:8px; padding:8px 10px' });
        chip.appendChild(el('div', { style: 'font-size:0.82rem; font-weight:600; color:var(--text); margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis' }, label));
        const chipBar = el('div', { style: 'background:var(--line); border-radius:99px; height:6px; overflow:hidden; margin-bottom:3px' });
        chipBar.appendChild(el('div', { style: `background:${pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--sky-ink)' : pct > 0 ? 'var(--gold)' : 'var(--line-strong)'}; width:${pct}%; height:100%; border-radius:99px` }));
        chip.appendChild(chipBar);
        chip.appendChild(el('div', { style: 'font-size:0.78rem; color:var(--muted)' }, p ? `${p.done}/${p.total} (${pct}%)` : '활동 없음'));
        grid.appendChild(chip);
      });
      card.appendChild(grid);
    }

    if (stats.badges && stats.badges.length > 0) {
      const badgeNames = stats.badges.map(id => BADGE_NAMES[id] || id).join('  ');
      const badgeDiv = el('div', { style: 'margin-top:10px; font-size:0.82rem; color:var(--muted); display:flex; align-items:center; gap:4px' });
      badgeDiv.appendChild(el('i', { 'data-lucide': 'award', style: 'width:14px; height:14px; color:var(--gold);' }));
      badgeDiv.appendChild(document.createTextNode(badgeNames));
      card.appendChild(badgeDiv);
    }

    panel.appendChild(card);
  });

  root.appendChild(panel);
  return root;
}

/* =========================================================
   ADMINISTRATOR ACTIONS
   ========================================================= */
let _adminProgressCache = null;
let _adminProfileCache = null;   // { id, profile, error } — 교사 상세에서 본 공개 프로필

function renderAdmin() {
  const root = el('div');
  const panel = el('div', { class: 'panel' });

  const head = el('div', { class: 'row-between' });
  const title = el('h2', { style: 'display:flex; align-items:center; gap:8px' });
  title.appendChild(el('i', { 'data-lucide': 'crown', style: 'width:24px; height:24px; color:var(--gold);' }));
  title.appendChild(document.createTextNode('관리자 대시보드'));
  head.appendChild(title);
  
  const headBtns = el('div', { style: 'display:flex; gap:8px' });
  const _pv = getProvider(); const _pk = !!getApiKey(_pv); const _pi = PROVIDERS[_pv];
  
  const aiBtn = el('button', {
    class: 'btn btn-sm',
    style: `background:${_pk ? 'var(--green-soft)' : 'var(--red-soft)'}; color:${_pk ? 'var(--green-deep)' : 'var(--red)'}; border:1.5px solid ${_pk ? 'var(--green-line)' : 'var(--red-line)'}; display:inline-flex; align-items:center; gap:4px`,
    onClick: showApiKeyModal
  });
  aiBtn.appendChild(el('i', { 'data-lucide': _pi.icon, style: 'width:13px; height:13px;' }));
  aiBtn.appendChild(document.createTextNode(_pk ? ' AI 설정 ✓' : ' AI 설정'));
  headBtns.appendChild(aiBtn);
  
  const addTbtn = el('button', { class: 'btn btn-primary', style: 'display:inline-flex; align-items:center; gap:4px', onClick: () => showTeacherModal() });
  addTbtn.appendChild(el('i', { 'data-lucide': 'plus', style: 'width:15px; height:15px; color:#fff;' }));
  addTbtn.appendChild(document.createTextNode('교사 추가'));
  headBtns.appendChild(addTbtn);
  
  head.appendChild(headBtns);
  panel.appendChild(head);
  panel.appendChild(el('button', { class: 'back-btn', style: 'margin-top:8px', onClick: () => { state.view = 'home'; render(); }}, '← 홈'));

  // 승인 대기 교사는 아직 수업 상태가 의미 없으므로 따로 센다
  const pending = masterState.teachers.filter(t => t.approved === false).length;
  const teaching = masterState.teachers.filter(t => t.approved !== false && t.status === 'teaching').length;
  const training = masterState.teachers.filter(t => t.approved !== false && t.status === 'training').length;
  const totalStudents = masterState.teachers.reduce((s, t) => s + (t.students || []).length, 0);

  const summary = el('div', { style: 'display:flex; gap:16px; flex-wrap:wrap; background:var(--surface-2); border-radius:12px; padding:14px 18px; margin:16px 0; align-items:center;' });
  
  const tCountSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:600' });
  tCountSpan.appendChild(el('i', { 'data-lucide': 'users', style: 'width:15px; height:15px; color:var(--primary);' }));
  tCountSpan.appendChild(document.createTextNode(`교사 ${masterState.teachers.length}명`));
  summary.appendChild(tCountSpan);
  
  const teachingSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:600; color:var(--green)' });
  teachingSpan.appendChild(el('i', { 'data-lucide': 'activity', style: 'width:15px; height:15px; color:var(--green);' }));
  teachingSpan.appendChild(document.createTextNode(`수업중 ${teaching}명`));
  summary.appendChild(teachingSpan);
  
  const trainingSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:600; color:var(--accent-ink)' });
  trainingSpan.appendChild(el('i', { 'data-lucide': 'book', style: 'width:15px; height:15px; color:var(--accent-ink);' }));
  trainingSpan.appendChild(document.createTextNode(`교육중 ${training}명`));
  summary.appendChild(trainingSpan);

  if (pending > 0) {
    const pendingSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:700; color:var(--danger)' });
    pendingSpan.appendChild(el('i', { 'data-lucide': 'hourglass', style: 'width:15px; height:15px; color:var(--danger);' }));
    pendingSpan.appendChild(document.createTextNode(`승인 대기 ${pending}명`));
    summary.appendChild(pendingSpan);
  }
  
  const sCountSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:600' });
  sCountSpan.appendChild(el('i', { 'data-lucide': 'graduation-cap', style: 'width:15px; height:15px; color:var(--primary);' }));
  sCountSpan.appendChild(document.createTextNode(`전체 학생 ${totalStudents}명`));
  summary.appendChild(sCountSpan);
  
  panel.appendChild(summary);

  if (masterState.teachers.length === 0) {
    panel.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; padding:24px' }, '등록된 교사가 없습니다. + 교사 추가 버튼으로 시작하세요.'));
  } else {
    masterState.teachers.forEach(teacher => {
      const card = el('div', { style: 'border:1px solid var(--line); border-radius:12px; padding:16px; margin-bottom:10px; cursor:pointer', onClick: () => { state.adminTeacherId = teacher.id; _adminProgressCache = null; _adminProfileCache = null; state.view = 'admin-teacher'; render(); }});
      const hdr = el('div', { style: 'display:flex; align-items:center; gap:10px; margin-bottom:8px' });
      
      const tNameDiv = el('div', { style: 'font-weight:700; font-size:1.05rem; flex:1; display:flex; align-items:center; gap:6px' });
      tNameDiv.appendChild(el('i', { 'data-lucide': 'user', style: 'width:16px; height:16px; color:var(--primary);' }));
      tNameDiv.appendChild(document.createTextNode(teacher.name));
      hdr.appendChild(tNameDiv);
      
      const sc = teacher.status === 'teaching';
      if (teacher.approved === false) {
        hdr.appendChild(el('div', { style: 'background:var(--red-soft); color:var(--danger); border-radius:20px; padding:3px 10px; font-size:0.82rem; font-weight:700' }, '⏳ 승인 대기'));
      } else {
        hdr.appendChild(el('div', { style: `background:${sc ? 'var(--green-soft)' : 'var(--accent-soft)'}; color:${sc ? 'var(--green)' : 'var(--accent-ink)'}; border-radius:20px; padding:3px 10px; font-size:0.82rem; font-weight:600` }, sc ? '🟢 수업중' : '🟡 교육중'));
      }
      card.appendChild(hdr);
      
      const meta = el('div', { style: 'font-size:0.88rem; color:var(--muted); display:flex; gap:16px; flex-wrap:wrap; align-items:center;' });
      if (teacher.phone) {
        const phoneSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px' });
        phoneSpan.appendChild(el('i', { 'data-lucide': 'phone', style: 'width:13px; height:13px;' }));
        phoneSpan.appendChild(document.createTextNode(teacher.phone));
        meta.appendChild(phoneSpan);
      }
      
      const studentsSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px' });
      studentsSpan.appendChild(el('i', { 'data-lucide': 'graduation-cap', style: 'width:13px; height:13px;' }));
      studentsSpan.appendChild(document.createTextNode(`학생 ${(teacher.students || []).length}명`));
      meta.appendChild(studentsSpan);
      
      if (teacher.note) {
        const noteSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px' });
        noteSpan.appendChild(el('i', { 'data-lucide': 'file-text', style: 'width:13px; height:13px;' }));
        noteSpan.appendChild(document.createTextNode(teacher.note));
        meta.appendChild(noteSpan);
      }
      
      card.appendChild(meta);
      panel.appendChild(card);
    });
  }

  root.appendChild(panel);
  return root;
}

function renderAdminTeacherDetail() {
  const teacher = masterState.teachers.find(t => t.id === state.adminTeacherId);
  if (!teacher) { state.view = 'admin'; render(); return el('div'); }

  const root = el('div');
  const panel = el('div', { class: 'panel' });

  panel.appendChild(el('button', { class: 'back-btn', onClick: () => { state.view = 'admin'; render(); }}, '← 교사 목록'));

  const head = el('div', { class: 'row-between', style: 'margin-top:10px; flex-wrap:wrap; gap:8px' });
  
  const tNameH2 = el('h2', { style: 'margin-bottom:0; display:flex; align-items:center; gap:8px' });
  tNameH2.appendChild(el('i', { 'data-lucide': 'user', style: 'width:24px; height:24px; color:var(--primary);' }));
  tNameH2.appendChild(document.createTextNode(teacher.name));
  head.appendChild(tNameH2);
  
  const headBtns = el('div', { style: 'display:flex; gap:8px' });
  
  if (teacher.approved === false) {
    const approveBtn = el('button', { class: 'btn btn-primary btn-sm', style: 'display:inline-flex; align-items:center; gap:4px', onClick: () => approveTeacher(teacher) });
    approveBtn.appendChild(el('i', { 'data-lucide': 'user-check', style: 'width:13px; height:13px; color:#fff;' }));
    approveBtn.appendChild(document.createTextNode('승인'));
    headBtns.appendChild(approveBtn);
  }

  const editBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'display:inline-flex; align-items:center; gap:4px', onClick: () => showTeacherModal(teacher) });
  editBtn.appendChild(el('i', { 'data-lucide': 'edit-2', style: 'width:13px; height:13px;' }));
  editBtn.appendChild(document.createTextNode('수정'));
  headBtns.appendChild(editBtn);
  
  const delBtn = el('button', { class: 'btn btn-danger btn-sm', style: 'display:inline-flex; align-items:center; gap:4px', onClick: () => deleteTeacher(teacher.id) });
  delBtn.appendChild(el('i', { 'data-lucide': 'trash-2', style: 'width:13px; height:13px; color:#fff;' }));
  delBtn.appendChild(document.createTextNode('삭제'));
  headBtns.appendChild(delBtn);
  
  head.appendChild(headBtns);
  panel.appendChild(head);

  const sc = teacher.status === 'teaching';
  const info = el('div', { style: 'display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; margin-bottom:16px; align-items:center' });
  info.appendChild(el('div', { style: `background:${sc ? 'var(--green-soft)' : 'var(--accent-soft)'}; color:${sc ? 'var(--green)' : 'var(--accent-ink)'}; border-radius:20px; padding:4px 12px; font-weight:600; font-size:0.9rem` }, sc ? '🟢 수업진행중' : '🟡 교육중'));
  info.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: async () => { teacher.status = sc ? 'training' : 'teaching'; await fbSaveTeacher(teacher.id, { name: teacher.name, phone: teacher.phone, status: teacher.status, note: teacher.note }); render(); }}, `↔ ${sc ? '교육중으로' : '수업중으로'} 변경`));
  if (teacher.phone) {
    const phoneDiv = el('div', { style: 'color:var(--muted); font-size:0.9rem; display:flex; align-items:center; gap:4px' });
    phoneDiv.appendChild(el('i', { 'data-lucide': 'phone', style: 'width:14px; height:14px;' }));
    phoneDiv.appendChild(document.createTextNode(teacher.phone));
    info.appendChild(phoneDiv);
  }
  if (teacher.note) {
    const noteDiv = el('div', { style: 'color:var(--muted); font-size:0.9rem; display:flex; align-items:center; gap:4px' });
    noteDiv.appendChild(el('i', { 'data-lucide': 'file-text', style: 'width:14px; height:14px;' }));
    noteDiv.appendChild(document.createTextNode(teacher.note));
    info.appendChild(noteDiv);
  }
  panel.appendChild(info);
  panel.appendChild(renderAdminProfileSection(teacher));

  const stuHead = el('div', { class: 'row-between', style: 'margin-bottom:12px' });
  
  const sTitle = el('h3', { style: 'margin-bottom:0; display:flex; align-items:center; gap:6px' });
  sTitle.appendChild(el('i', { 'data-lucide': 'graduation-cap', style: 'width:18px; height:18px; color:var(--primary);' }));
  sTitle.appendChild(document.createTextNode(`학생 명단 (${(teacher.students || []).length}명)`));
  stuHead.appendChild(sTitle);
  
  const stuBtns = el('div', { style: 'display:flex; gap:8px' });
  
  const refreshBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'display:inline-flex; align-items:center; gap:4px', onClick: () => { _adminProgressCache = null; render(); } });
  refreshBtn.appendChild(el('i', { 'data-lucide': 'refresh-cw', style: 'width:13px; height:13px;' }));
  refreshBtn.appendChild(document.createTextNode('새로고침'));
  stuBtns.appendChild(refreshBtn);
  
  const addStuBtn = el('button', { class: 'btn btn-primary btn-sm', style: 'display:inline-flex; align-items:center; gap:4px', onClick: () => showAddStudentModal(teacher) });
  addStuBtn.appendChild(el('i', { 'data-lucide': 'plus', style: 'width:13px; height:13px; color:#fff;' }));
  addStuBtn.appendChild(document.createTextNode('학생 추가'));
  stuBtns.appendChild(addStuBtn);
  
  stuHead.appendChild(stuBtns);
  panel.appendChild(stuHead);

  if (!teacher.students || teacher.students.length === 0) {
    panel.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; padding:20px' }, '등록된 학생이 없습니다.'));
    root.appendChild(panel);
    return root;
  }

  if (!_adminProgressCache) {
    panel.appendChild(el('div', { style: 'text-align:center; padding:24px; color:var(--muted)' }, '📊 진도 불러오는 중...'));
    root.appendChild(panel);
    loadStudentsProgress(teacher.id).then(cache => { _adminProgressCache = cache; render(); });
    return root;
  }

  const rows = el('div', { style: 'display:flex; flex-direction:column; gap:8px' });
  teacher.students.forEach((student, idx) => {
    const stats = _adminProgressCache[student.name] || defaultStats();
    const pct = calcOverallProgress(stats.bestScores);
    const row = el('div', { style: 'display:grid; grid-template-columns:1fr 64px 120px 36px 36px; gap:8px; align-items:center; border:1px solid var(--line); border-radius:10px; padding:12px 14px' });

    const nameDiv = el('div');
    nameDiv.appendChild(el('div', { style: 'font-weight:600; font-size:0.95rem' }, student.name));
    const metaStr = [student.nationality, student.age ? student.age + '세' : ''].filter(Boolean).join(' · ');
    if (metaStr) nameDiv.appendChild(el('div', { style: 'font-size:0.82rem; color:var(--muted); margin-top:2px' }, metaStr));
    row.appendChild(nameDiv);

    const lvl = el('div', { style: 'text-align:center; font-size:0.82rem' });
    lvl.appendChild(el('div', { style: 'font-weight:700; color:var(--lavender-ink)' }, `Lv.${stats.level}`));
    lvl.appendChild(el('div', { style: 'color:var(--accent-ink)' }, `${stats.xp}XP`));
    row.appendChild(lvl);

    const prog = el('div');
    const barWrap = el('div', { style: 'background:var(--line); border-radius:99px; height:8px; overflow:hidden; margin-bottom:2px' });
    const barColor = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--sky-ink)' : pct > 0 ? 'var(--gold)' : 'var(--line)';
    barWrap.appendChild(el('div', { style: `background:${barColor}; width:${pct}%; height:100%; border-radius:99px` }));
    prog.appendChild(barWrap);
    prog.appendChild(el('div', { style: 'font-size:0.78rem; color:var(--muted); text-align:center' }, `${pct}%`));
    row.appendChild(prog);

    const editStuBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'padding:4px 6px; display:inline-flex; align-items:center; justify-content:center;', onClick: () => showEditStudentModal(teacher, student, idx) });
    editStuBtn.appendChild(el('i', { 'data-lucide': 'pencil', style: 'width:14px; height:14px; color:var(--sky-ink);' }));
    row.appendChild(editStuBtn);

    const delStuBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'padding:4px 6px; display:inline-flex; align-items:center; justify-content:center;', onClick: async () => {
      const ok = await showConfirm('학생 삭제', `"${student.name}" 학생을 삭제하시겠습니까?`, true);
      if (!ok) return;
      try {
        if (student.firestoreId) await fbDeleteStudent(student.firestoreId, student.authUid);
      } catch (err) {
        toastSaveError('학생 삭제', err);
        return;
      }
      teacher.students.splice(idx, 1);
      _adminProgressCache = null;
      render();
      toast(`${student.name} 학생을 삭제했습니다`, 'success');
    }});
    delStuBtn.appendChild(el('i', { 'data-lucide': 'trash-2', style: 'width:14px; height:14px; color:var(--danger);' }));
    row.appendChild(delStuBtn);

    rows.appendChild(row);
  });
  panel.appendChild(rows);

  root.appendChild(panel);
  return root;
}

/* =========================================================
   학생 원격 접속 발급
   ========================================================= */

// 계정 생성 → 규칙용 색인 → 학생 문서 연결 순서로 진행한다.
// 중간에 실패해도 학생 문서가 옛 계정을 가리킨 채 남아 이전 접속이 계속 동작한다
async function issueRemoteAccess(student) {
  const teacherId = state.currentTeacher.id;
  const previousUid = student.authUid || null;
  const pin = generateStudentPin();

  // 코드가 아주 드물게 겹친다. 겹치면 계정 생성이 막히므로 다시 뽑는다
  let code, authUid;
  for (let i = 0; ; i++) {
    code = generateStudentCode();
    try {
      authUid = await fbCreateStudentAuth(code, pin);
      break;
    } catch (e) {
      if (e.code !== 'auth/email-already-in-use' || i >= 4) throw e;
    }
  }
  // 어느 단계에서 막혔는지 남긴다. 보안 규칙은 컬렉션마다 따로라
  // students는 되는데 studentIndex만 막히는 경우가 실제로 나온다
  try {
    await fbSaveStudentIndex(authUid, { studentId: student.firestoreId, teacherId, code });
  } catch (e) {
    // 인증 계정은 이미 만들어졌고 서버 없이는 지울 수 없다.
    // 이 코드는 아무 데도 연결되지 않은 채 남는다
    e.step = 'studentIndex 색인 저장';
    throw e;
  }
  try {
    await fbUpdateStudent(student.firestoreId, { authUid });
  } catch (e) {
    e.step = 'students 문서에 authUid 연결';
    throw e;
  }

  // 이전 색인을 지우면 옛 코드로는 아무것도 읽지 못한다.
  // 인증 계정 자체는 서버 없이 삭제할 수 없어 그대로 남지만, 연결이 끊겨 무력하다
  if (previousUid && previousUid !== authUid) {
    await fbDeleteStudentIndex(previousUid).catch(e => console.warn('Old index cleanup failed:', e));
  }
  student.authUid = authUid;
  return { code, pin };
}

function showRemoteAccessModal(student) {
  const root = $('#modal-root');
  const close = () => { root.innerHTML = ''; render(); };

  function draw(issued, existingCode) {
    root.innerHTML = '';
    const backdrop = el('div', { class: 'modal-backdrop' });
    // 발급 중에 창이 닫히면 코드는 만들어졌는데 아무도 그 값을 모르게 되고,
    // PIN이 떠 있을 때 닫히면 영영 다시 볼 수 없다. 이 두 경우만 붙잡는다
    let issuing = false;
    let askingClose = false;
    backdrop.onclick = async (e) => {
      if (e.target !== backdrop || askingClose) return;
      if (issuing) return;
      if (!issued) { close(); return; }
      askingClose = true;
      const ok = await confirmOverModal('PIN 확인 종료',
        'PIN은 창을 닫으면 다시 볼 수 없습니다. 학생에게 전달하셨나요?', '계속 보기', '닫기');
      askingClose = false;
      if (ok) close();
    };
    const modal = el('div', { class: 'modal', style: 'max-width:440px' });

    const h = el('h3', { style: 'margin-bottom:10px; display:flex; align-items:center; gap:7px' });
    h.appendChild(el('i', { 'data-lucide': 'smartphone', style: 'width:19px; height:19px; color:var(--primary);' }));
    h.appendChild(document.createTextNode(`${student.name} — 원격 접속`));
    modal.appendChild(h);

    if (issued) {
      modal.appendChild(el('p', { style: 'font-size:0.88rem; margin-bottom:14px; line-height:1.6; color:var(--accent-ink); background:var(--accent-soft); border-radius:8px; padding:10px 12px' },
        'PIN은 지금만 보입니다. 창을 닫으면 다시 볼 수 없고, 잊으면 재발급해야 합니다.'));

      const box = el('div', { style: 'background:var(--green-soft); border:1.5px solid var(--green-line); border-radius:12px; padding:18px; text-align:center; margin-bottom:14px' });
      box.appendChild(el('div', { style: 'font-size:0.78rem; color:var(--green-deep); font-weight:700; margin-bottom:3px' }, '학생 코드'));
      box.appendChild(el('div', { style: 'font-size:1.5rem; font-weight:900; letter-spacing:0.09em; color:var(--green-deep); margin-bottom:14px' }, issued.code));
      box.appendChild(el('div', { style: 'font-size:0.78rem; color:var(--green-deep); font-weight:700; margin-bottom:3px' }, 'PIN'));
      box.appendChild(el('div', { style: 'font-size:1.5rem; font-weight:900; letter-spacing:0.2em; color:var(--green-deep)' }, issued.pin));
      modal.appendChild(box);

      const copyBtn = el('button', { class: 'btn btn-ghost btn-block', style: 'margin-bottom:8px', onClick: async () => {
        const text = `한국어 학습 접속\n주소: ${location.origin}${location.pathname}\n학생 코드: ${issued.code}\nPIN: ${issued.pin}`;
        try { await navigator.clipboard.writeText(text); toast('복사했습니다', 'success'); }
        catch (e) { toast('복사할 수 없습니다. 직접 적어주세요', 'danger'); }
      }}, '📋 접속 안내 복사');
      modal.appendChild(copyBtn);
      modal.appendChild(el('button', { class: 'btn btn-primary btn-block', onClick: close }, '확인했습니다'));
      backdrop.appendChild(modal);
      root.appendChild(backdrop);
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const desc = el('p', { class: 'text-muted', style: 'font-size:0.88rem; line-height:1.65; margin-bottom:14px; white-space:pre-line' });
    desc.textContent = student.authUid
      ? '이미 발급된 학생입니다.\nPIN은 다시 볼 수 없습니다. 학생이 잊었다면 재발급하세요.\n재발급하면 이전 코드와 PIN은 즉시 쓸 수 없게 됩니다.'
      : '학생이 자기 기기에서 접속할 수 있게 코드와 PIN을 만듭니다.\n이메일은 필요하지 않습니다.';
    modal.appendChild(desc);

    if (existingCode) {
      const cur = el('div', { style: 'background:var(--surface-2); border:1px solid var(--line); border-radius:10px; padding:12px; margin-bottom:14px; text-align:center' });
      cur.appendChild(el('div', { style: 'font-size:0.78rem; color:var(--muted); font-weight:700; margin-bottom:3px' }, '현재 학생 코드'));
      cur.appendChild(el('div', { style: 'font-size:1.2rem; font-weight:800; letter-spacing:0.08em; color:var(--text)' }, existingCode));
      modal.appendChild(cur);
    }

    const btns = el('div', { style: 'display:flex; gap:8px' });
    btns.appendChild(el('button', { class: 'btn btn-ghost', style: 'flex:1', onClick: close }, '닫기'));
    const goBtn = el('button', { class: 'btn btn-primary', style: 'flex:1', onClick: async () => {
      goBtn.disabled = true;
      goBtn.textContent = '발급 중...';
      issuing = true;
      try {
        draw(await issueRemoteAccess(student), null);
      } catch (e) {
        toastSaveError('원격 접속 발급', e);
        issuing = false;
        goBtn.disabled = false;
        goBtn.textContent = student.authUid ? '재발급' : '발급하기';
      }
    }}, student.authUid ? '재발급' : '발급하기');
    btns.appendChild(goBtn);
    modal.appendChild(btns);

    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    if (window.lucide) window.lucide.createIcons();
  }

  draw(null, null);
  // 이미 발급된 학생이면 현재 코드를 찾아 보여준다 (PIN은 저장하지 않는다)
  if (student.authUid) {
    fbGetStudentIndex(student.authUid)
      .then(idx => { if (idx && idx.code) draw(null, idx.code); })
      .catch(e => console.warn('Index lookup failed:', e));
  }
}

function showTeacherModal(existing = null) {
  return new Promise(resolve => {
    const root = $('#modal-root');
    root.innerHTML = '';
    const backdrop = el('div', { class: 'modal-backdrop' });
    backdrop.onclick = (e) => { if (e.target === backdrop) { root.innerHTML = ''; resolve(false); }};
    const modal = el('div', { class: 'modal', style: 'max-width:440px' });
    modal.appendChild(el('h3', { style: 'margin-bottom:16px' }, existing ? '✏️ 교사 정보 수정' : '👩‍🏫 교사 추가'));

    const field = (label, input) => { modal.appendChild(el('label', { style: 'display:block; font-weight:600; font-size:0.9rem; margin-bottom:4px' }, label)); modal.appendChild(input); };

    const nameIn = el('input', { type: 'text', placeholder: '홍길동', style: 'width:100%; margin-bottom:12px' });
    if (existing) nameIn.value = existing.name;
    field('이름 *', nameIn);

    const phoneIn = el('input', { type: 'text', placeholder: '010-0000-0000', style: 'width:100%; margin-bottom:12px' });
    if (existing) phoneIn.value = existing.phone || '';
    field('연락처', phoneIn);

    const statusSel = el('select', { style: 'width:100%; margin-bottom:12px' });
    [['teaching', '🟢 수업진행중'], ['training', '🟡 교육중']].forEach(([v, l]) => {
      const opt = el('option', { value: v }, l);
      if (existing && existing.status === v) opt.setAttribute('selected', '');
      statusSel.appendChild(opt);
    });
    field('상태', statusSel);

    const noteIn = el('input', { type: 'text', placeholder: '담당 반, 특이사항 등', style: 'width:100%; margin-bottom:16px' });
    if (existing) noteIn.value = existing.note || '';
    field('메모', noteIn);

    const btns = el('div', { style: 'display:flex; gap:8px' });
    btns.appendChild(el('button', { class: 'btn btn-ghost', style: 'flex:1', onClick: () => { root.innerHTML = ''; resolve(false); }}, '취소'));
    btns.appendChild(el('button', { class: 'btn btn-primary', style: 'flex:1', onClick: async () => {
      const name = nameIn.value.trim();
      if (!name) { toast('이름을 입력하세요', 'danger'); return; }
      if (existing) {
        existing.name = name; existing.phone = phoneIn.value.trim();
        existing.status = statusSel.value; existing.note = noteIn.value.trim();
        await fbSaveTeacher(existing.id, { name: existing.name, phone: existing.phone, status: existing.status, note: existing.note });
      } else {
        toast('새 교사 등록은 회원가입 페이지를 이용하세요.', 'accent');
        root.innerHTML = ''; resolve(false); return;
      }
      root.innerHTML = ''; resolve(true); render();
    }}, existing ? '저장' : '추가'));
    modal.appendChild(btns);
    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    setTimeout(() => nameIn.focus(), 50);
  });
}

// 입력 중인 모달 위에 겹쳐 띄우는 확인창.
// showConfirm()은 #modal-root를 통째로 비워서 뒤에 있는 모달과 입력값까지 날린다
function confirmOverModal(title, message, keepLabel = '계속 작성', discardLabel = '취소하기') {
  return new Promise(resolve => {
    const backdrop = el('div', { class: 'modal-backdrop', style: 'z-index:60' });
    const close = (v) => { backdrop.remove(); resolve(v); };
    backdrop.onclick = (e) => { if (e.target === backdrop) close(false); };
    const modal = el('div', { class: 'modal', style: 'max-width:360px' });
    modal.appendChild(el('h3', { style: 'margin-bottom:10px' }, title));
    modal.appendChild(el('div', { style: 'margin-bottom:18px; color:var(--muted); line-height:1.6' }, message));
    const btns = el('div', { style: 'display:flex; gap:10px; justify-content:flex-end' });
    btns.appendChild(el('button', { class: 'btn btn-ghost', onClick: () => close(false) }, keepLabel));
    btns.appendChild(el('button', { class: 'btn btn-danger', onClick: () => close(true) }, discardLabel));
    modal.appendChild(btns);
    backdrop.appendChild(modal);
    $('#modal-root').appendChild(backdrop);
  });
}

// 저장 실패를 화면에 드러낸다. 이걸 빼먹으면 예외가 핸들러를 조용히 끝내
// "버튼을 눌러도 아무 일도 없다"로만 보인다
function toastSaveError(what, err) {
  console.error(`[${what}] 실패:`, err);
  const step = err && err.step ? ` (${err.step} 단계)` : '';
  toast(`${what} 실패${step}. ` + firestoreErrorText(err), 'danger');
}

function showAddStudentModal(teacher) {
  // 교사 컨텍스트가 비어 있으면 모달을 열어봐야 '추가'에서 null 참조로 죽는다.
  // 예외가 핸들러를 조용히 끝내서 "눌러도 아무 일도 없다"로만 보였다
  if (!teacher || !teacher.id) {
    toast('교사 정보를 불러오지 못해 학생을 등록할 수 없습니다. 새로고침 후 다시 로그인하세요.', 'danger');
    return Promise.resolve(false);
  }
  return new Promise(resolve => {
    const root = $('#modal-root');
    root.innerHTML = '';
    const backdrop = el('div', { class: 'modal-backdrop' });
    // 바깥을 잘못 눌러 입력하던 내용이 사라지지 않도록 확인을 받는다
    let askingCancel = false;
    backdrop.onclick = async (e) => {
      if (e.target !== backdrop || askingCancel) return;
      askingCancel = true;
      const ok = await confirmOverModal('학생 등록 취소', '입력한 내용이 사라집니다. 취소하시겠습니까?');
      askingCancel = false;
      if (!ok) return;
      root.innerHTML = ''; resolve(false);
    };
    const modal = el('div', { class: 'modal', style: 'max-width:400px' });
    modal.appendChild(el('h3', { style: 'margin-bottom:16px' }, '🧑‍🎓 학생 추가'));

    const field = (label, input) => { modal.appendChild(el('label', { style: 'display:block; font-weight:600; font-size:0.9rem; margin-bottom:4px' }, label)); modal.appendChild(input); };

    const nameIn = el('input', { type: 'text', placeholder: '김철수', style: 'width:100%; margin-bottom:12px' });
    field('이름 *', nameIn);

    const natSel = el('select', { style: 'width:100%; margin-bottom:12px' });
    NATIONALITIES.forEach(n => natSel.appendChild(el('option', { value: n }, n)));
    field('국적', natSel);

    const ageIn = el('input', { type: 'number', placeholder: '25', min: '1', max: '99', style: 'width:100%; margin-bottom:16px' });
    field('나이', ageIn);

    const btns = el('div', { style: 'display:flex; gap:8px' });
    const cancelBtn = el('button', { class: 'btn btn-ghost', style: 'flex:1', onClick: () => { root.innerHTML = ''; resolve(false); }}, '취소');
    const addBtn = el('button', { class: 'btn btn-primary', style: 'flex:1' }, '추가');
    addBtn.onclick = async () => {
      const name = nameIn.value.trim();
      if (!name) { toast('이름을 입력하세요', 'danger'); return; }
      if (!teacher.students) teacher.students = [];
      if (teacher.students.some(s => s.name === name)) { toast('이미 등록된 이름입니다', 'danger'); return; }
      const age = parseInt(ageIn.value) || null;

      // 저장이 끝나기 전 다시 누르면 같은 학생 문서가 두 개 만들어진다.
      // 위 중복 검사가 보는 로컬 배열은 await 이후에야 채워지기 때문이다
      addBtn.disabled = true; cancelBtn.disabled = true;
      try {
        const firestoreId = await fbAddStudent(teacher.id, { name, nationality: natSel.value, age, teacherId: teacher.id });
        teacher.students.push({ name, nationality: natSel.value, age, firestoreId, teacherId: teacher.id });
        _adminProgressCache = null;
        root.innerHTML = ''; resolve(true); render();
        toast(`${name} 학생을 등록했습니다`, 'success');
      } catch (err) {
        toastSaveError('학생 등록', err);
        addBtn.disabled = false; cancelBtn.disabled = false;
      }
    };
    btns.appendChild(cancelBtn);
    btns.appendChild(addBtn);
    modal.appendChild(btns);
    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    setTimeout(() => nameIn.focus(), 50);
    // 이름을 치고 엔터를 눌러도 등록되게 한다
    const onEnter = (e) => { if (e.key === 'Enter') addBtn.click(); };
    nameIn.onkeydown = onEnter;
    ageIn.onkeydown = onEnter;
  });
}

function showEditStudentModal(teacher, student, idx) {
  if (!teacher || !teacher.students) {
    toast('교사 정보를 불러오지 못해 수정할 수 없습니다. 새로고침 후 다시 로그인하세요.', 'danger');
    return Promise.resolve(false);
  }
  return new Promise(resolve => {
    const root = $('#modal-root');
    root.innerHTML = '';
    const backdrop = el('div', { class: 'modal-backdrop' });
    // 바깥을 잘못 눌러 고치던 내용이 사라지지 않도록 확인을 받는다
    let askingCancel = false;
    backdrop.onclick = async (e) => {
      if (e.target !== backdrop || askingCancel) return;
      askingCancel = true;
      const ok = await confirmOverModal('학생 정보 수정 취소', '고친 내용이 저장되지 않습니다. 취소하시겠습니까?');
      askingCancel = false;
      if (!ok) return;
      root.innerHTML = ''; resolve(false);
    };
    const modal = el('div', { class: 'modal', style: 'max-width:400px' });
    modal.appendChild(el('h3', { style: 'margin-bottom:16px' }, '✏️ 학생 정보 수정'));

    const field = (label, input) => {
      modal.appendChild(el('label', { style: 'display:block; font-weight:600; font-size:0.9rem; margin-bottom:4px' }, label));
      modal.appendChild(input);
    };

    const nameIn = el('input', { type: 'text', style: 'width:100%; margin-bottom:12px' });
    nameIn.value = student.name;
    field('이름 *', nameIn);

    const natSel = el('select', { style: 'width:100%; margin-bottom:12px' });
    NATIONALITIES.forEach(n => {
      const opt = el('option', { value: n }, n);
      if (n === student.nationality) opt.setAttribute('selected', '');
      natSel.appendChild(opt);
    });
    field('국적', natSel);

    const ageIn = el('input', { type: 'number', min: '1', max: '99', style: 'width:100%; margin-bottom:16px' });
    ageIn.value = student.age || '';
    field('나이', ageIn);

    const btns = el('div', { style: 'display:flex; gap:8px' });
    const cancelBtn = el('button', { class: 'btn btn-ghost', style: 'flex:1', onClick: () => { root.innerHTML = ''; resolve(false); } }, '취소');
    const saveBtn = el('button', { class: 'btn btn-primary', style: 'flex:1' }, '저장');
    saveBtn.onclick = async () => {
      const name = nameIn.value.trim();
      if (!name) { toast('이름을 입력하세요', 'danger'); return; }
      const duplicate = teacher.students.some((s, i) => i !== idx && s.name === name);
      if (duplicate) { toast('이미 등록된 이름입니다', 'danger'); return; }
      // 바뀐 항목만 보낸다. 문서 전체를 덮어쓰면 stats와 authUid가 날아가고,
      // authUid를 잃으면 재발급 때 이전 코드를 정리하지 못해 옛 코드가 계속 살아 있다
      const changes = { name, nationality: natSel.value, age: parseInt(ageIn.value) || null };

      saveBtn.disabled = true; cancelBtn.disabled = true;
      try {
        if (student.firestoreId) await fbUpdateStudent(student.firestoreId, changes);
        // 저장에 성공한 뒤에야 화면 명단을 고친다. 먼저 고치면 실패해도
        // 바뀐 것처럼 보이다가 새로고침하면 옛 값으로 돌아온다
        teacher.students[idx] = { ...student, ...changes };
        _adminProgressCache = null;
        root.innerHTML = '';
        resolve(true);
        render();
        toast('수정했습니다', 'success');
      } catch (err) {
        toastSaveError('학생 정보 수정', err);
        saveBtn.disabled = false; cancelBtn.disabled = false;
      }
    };
    btns.appendChild(cancelBtn);
    btns.appendChild(saveBtn);
    modal.appendChild(btns);

    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    setTimeout(() => nameIn.focus(), 50);
    const onEnter = (e) => { if (e.key === 'Enter') saveBtn.click(); };
    nameIn.onkeydown = onEnter;
    ageIn.onkeydown = onEnter;
  });
}

async function deleteTeacher(id) {
  const teacher = masterState.teachers.find(t => t.id === id);
  const ok = await showConfirm('교사 삭제', `"${teacher?.name}" 교사를 삭제하시겠습니까?\n\n학생 명단과 원격 접속 코드도 함께 삭제됩니다.\n다시 로그인해도 관리자가 승인하기 전에는 이용할 수 없습니다.`, true);
  if (!ok) return;
  try {
    await fbDeleteTeacherDoc(id);
  } catch (e) {
    // 실패했는데 목록에서 먼저 빼면 지워진 것처럼 보이다가 새로고침하면 되살아난다
    toastSaveError('교사 삭제', e);
    return;
  }
  masterState.teachers = masterState.teachers.filter(t => t.id !== id);
  state.view = 'admin';
  render();
}

// 승인 대기 교사를 승인한다. 교사는 대기 화면에서 새로고침하거나 다시 로그인하면 쓸 수 있다
async function approveTeacher(teacher) {
  try {
    await fbSaveTeacher(teacher.id, { approved: true });
  } catch (e) {
    toastSaveError('교사 승인', e);
    return;
  }
  teacher.approved = true;
  toast(`${teacher.name} 교사를 승인했습니다`, 'success');
  render();
}

/* =========================================================
   교사 공개 프로필
   ========================================================= */

const EMPTY_TEACHER_PROFILE = { displayName: '', intro: '', languages: [], levels: [], availability: '', experience: '' };
let _directoryCache = null;   // { profiles, error } — 홈의 선생님 소개 목록

// 프로필의 언어·수준 코드를 화면용 이름으로 바꾼다. 모르는 코드는 그대로 보인다
function profileLanguageText(profile) {
  return (profile.languages || []).map(c => { const l = LANGS.find(x => x.code === c); return l ? `${l.flag} ${l.name}` : c; }).join(', ');
}
function profileLevelText(profile) {
  return (profile.levels || []).map(c => { const l = LEVELS.find(x => x.code === c); return l ? l.name : c; }).join(', ');
}

// 홈의 선생님 소개. 관리자가 공개한 프로필만 보인다.
// 교사가 쓴 글이라 innerHTML 없이 텍스트 노드로만 넣는다
function renderTeacherDirectory() {
  const panel = el('div', { class: 'panel', style: 'margin-top:16px' });
  const title = el('h3', { style: 'display:flex; align-items:center; gap:8px' });
  title.appendChild(el('i', { 'data-lucide': 'users', style: 'width:20px; height:20px;' }));
  title.appendChild(document.createTextNode('선생님 소개'));
  panel.appendChild(title);

  if (!_directoryCache) {
    panel.appendChild(el('p', { class: 'text-muted' }, '불러오는 중...'));
    fbGetListedTeacherProfiles()
      .then(profiles => { _directoryCache = { profiles }; })
      .catch(err => { _directoryCache = { profiles: [], error: firestoreErrorText(err) }; })
      // 다 읽기 전에 다른 화면으로 갔으면 그 화면을 다시 그리지 않는다
      .then(() => { if (state.view === 'home') render(); });
    return panel;
  }

  const { profiles, error } = _directoryCache;
  if (error) {
    panel.appendChild(el('p', { style: 'color:var(--red); font-size:0.9rem' }, `불러오지 못했습니다. ${error}`));
    return panel;
  }
  if (!profiles.length) {
    panel.appendChild(el('p', { class: 'text-muted' }, '아직 공개된 선생님이 없습니다.'));
    return panel;
  }

  const grid = el('div', { class: 'directory-grid' });
  [...profiles].sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko')).forEach(p => {
    const card = el('div', { class: 'directory-card' });
    card.appendChild(el('h4', {}, p.displayName));
    const langs = profileLanguageText(p);
    if (langs) card.appendChild(el('div', { class: 'meta' }, `설명 언어 · ${langs}`));
    const levels = profileLevelText(p);
    if (levels) card.appendChild(el('div', { class: 'meta' }, `수준 · ${levels}`));
    if (p.availability) card.appendChild(el('div', { class: 'meta' }, `시간대 · ${p.availability}`));
    if (p.experience) card.appendChild(el('div', { class: 'meta' }, `경력 · ${p.experience}`));
    if (p.intro) {
      card.appendChild(el('p', { class: 'intro' }, p.intro));
      // 긴 소개는 세 줄까지만 보이고, 누르면 펼친다
      card.onclick = () => card.classList.toggle('open');
    }
    grid.appendChild(card);
  });
  panel.appendChild(grid);
  return panel;
}

// 체크박스 묶음과, 선택된 코드 배열을 돌려주는 함수를 함께 만든다
function makeCodeCheckboxes(options, selected) {
  const wrap = el('div', { style: 'display:flex; flex-wrap:wrap; gap:6px 14px; margin-bottom:12px' });
  const boxes = options.map(o => {
    const cb = el('input', { type: 'checkbox', value: o.code });
    cb.checked = selected.includes(o.code);
    wrap.appendChild(el('label', { style: 'display:inline-flex; align-items:center; gap:5px; font-size:0.9rem; cursor:pointer' }, [cb, o.label]));
    return cb;
  });
  return { node: wrap, values: () => boxes.filter(b => b.checked).map(b => b.value) };
}

// 가입자에게 보이는 프로필을 쓴다. 공개 여부는 관리자가 정하므로 여기서는 내용만 고친다
async function showTeacherProfileModal() {
  const uid = state.currentTeacher && state.currentTeacher.id;
  if (!uid) {
    toast('교사 정보를 불러오지 못했습니다. 새로고침 후 다시 로그인하세요.', 'danger');
    return;
  }
  let saved;
  try {
    saved = await fbGetTeacherProfile(uid);
  } catch (err) {
    toastSaveError('프로필 불러오기', err);
    return;
  }
  const p = { ...EMPTY_TEACHER_PROFILE, ...(saved || {}) };

  const root = $('#modal-root');
  root.innerHTML = '';
  const backdrop = el('div', { class: 'modal-backdrop' });
  const modal = el('div', { class: 'modal', style: 'max-width:520px; max-height:90vh; overflow-y:auto' });
  modal.appendChild(el('h3', { style: 'margin-bottom:10px' }, '🪪 공개 프로필'));

  const listed = !!(saved && saved.listed);
  modal.appendChild(el('div', { style: `font-size:0.85rem; font-weight:700; margin-bottom:8px; color:${listed ? 'var(--green-deep)' : 'var(--muted)'}` },
    listed ? '공개 중 — 가입한 사용자에게 보입니다' : '비공개 — 관리자가 확인한 뒤 공개합니다'));
  modal.appendChild(el('p', { style: 'color:var(--accent-ink); background:var(--accent-soft); border-radius:6px; padding:8px 10px; font-size:0.82rem; margin-bottom:14px; line-height:1.5' },
    '가입한 사용자라면 누구나 볼 수 있습니다. 전화번호, 이메일, 주소, 실명은 넣지 마세요.'));

  const field = (label, input) => { modal.appendChild(el('label', { style: 'display:block; font-weight:600; font-size:0.9rem; margin-bottom:4px' }, label)); modal.appendChild(input); };

  const nameIn = el('input', { type: 'text', maxlength: '30', placeholder: '학생에게 보일 이름 (실명이 아니어도 됩니다)', style: 'margin-bottom:12px' });
  nameIn.value = p.displayName;
  field('표시 이름 *', nameIn);

  const introIn = el('textarea', { maxlength: '1000', rows: '4', placeholder: '어떤 수업을 하는지 소개해 주세요', style: 'margin-bottom:12px' });
  introIn.value = p.intro;
  field('소개', introIn);

  const langBoxes = makeCodeCheckboxes(LANGS.map(l => ({ code: l.code, label: `${l.flag} ${l.name}` })), p.languages);
  field('설명할 수 있는 언어', langBoxes.node);

  const levelBoxes = makeCodeCheckboxes(LEVELS.map(l => ({ code: l.code, label: l.name })), p.levels);
  field('가르치는 수준', levelBoxes.node);

  const availIn = el('input', { type: 'text', maxlength: '200', placeholder: '예: 평일 저녁 7~10시 (한국 시간)', style: 'margin-bottom:12px' });
  availIn.value = p.availability;
  field('수업 가능 시간대', availIn);

  const expIn = el('textarea', { maxlength: '500', rows: '3', placeholder: '예: 한국어교원 2급, 어학당 3년', style: 'margin-bottom:16px' });
  expIn.value = p.experience;
  field('경력', expIn);

  const collect = () => ({
    displayName: nameIn.value.trim(), intro: introIn.value.trim(),
    languages: langBoxes.values(), levels: levelBoxes.values(),
    availability: availIn.value.trim(), experience: expIn.value.trim()
  });
  const initial = JSON.stringify(collect());

  // 바깥을 잘못 눌러 고친 내용이 사라지지 않도록, 바뀐 게 있을 때만 확인을 받는다
  let askingCancel = false;
  backdrop.onclick = async (e) => {
    if (e.target !== backdrop || askingCancel) return;
    if (JSON.stringify(collect()) !== initial) {
      askingCancel = true;
      const ok = await confirmOverModal('프로필 작성 취소', '고친 내용이 사라집니다. 닫으시겠습니까?', '계속 작성', '닫기');
      askingCancel = false;
      if (!ok) return;
    }
    root.innerHTML = '';
  };

  const btns = el('div', { style: 'display:flex; gap:8px' });
  const cancelBtn = el('button', { class: 'btn btn-ghost', style: 'flex:1', onClick: () => { root.innerHTML = ''; } }, '취소');
  const saveBtn = el('button', { class: 'btn btn-primary', style: 'flex:1' }, '저장');
  saveBtn.onclick = async () => {
    const profile = collect();
    if (!profile.displayName) { toast('표시 이름을 입력하세요', 'danger'); return; }
    saveBtn.disabled = true; cancelBtn.disabled = true;
    try {
      await fbSaveTeacherProfile(uid, profile);
      _directoryCache = null;
      root.innerHTML = '';
      toast('프로필을 저장했습니다', 'success');
    } catch (err) {
      toastSaveError('프로필 저장', err);
      saveBtn.disabled = false; cancelBtn.disabled = false;
    }
  };
  btns.append(cancelBtn, saveBtn);
  modal.appendChild(btns);
  backdrop.appendChild(modal);
  root.appendChild(backdrop);
  setTimeout(() => nameIn.focus(), 50);
}

// 관리자 교사 상세의 프로필 칸. 내용은 읽기만 하고 공개 여부만 바꾼다.
// 프로필은 교사가 쓴 글이라 innerHTML 없이 텍스트 노드로만 넣는다
function renderAdminProfileSection(teacher) {
  const box = el('div', { style: 'border:1px solid var(--line); border-radius:10px; padding:12px 14px; margin-bottom:16px' });
  const head = el('div', { class: 'row-between', style: 'gap:8px; flex-wrap:wrap; margin-bottom:8px' });
  const title = el('h3', { style: 'margin:0; display:flex; align-items:center; gap:6px; font-size:1rem' });
  title.appendChild(el('i', { 'data-lucide': 'id-card', style: 'width:16px; height:16px; color:var(--primary);' }));
  title.appendChild(document.createTextNode('공개 프로필'));
  head.appendChild(title);
  box.appendChild(head);

  if (!_adminProfileCache || _adminProfileCache.id !== teacher.id) {
    box.appendChild(el('div', { class: 'text-muted', style: 'font-size:0.9rem' }, '불러오는 중...'));
    const id = teacher.id;
    fbGetTeacherProfile(id)
      .then(profile => { _adminProfileCache = { id, profile }; })
      .catch(err => { _adminProfileCache = { id, profile: null, error: firestoreErrorText(err) }; })
      .then(() => render());
    return box;
  }

  const { profile, error } = _adminProfileCache;
  if (error) {
    box.appendChild(el('div', { style: 'color:var(--red); font-size:0.9rem' }, `불러오지 못했습니다. ${error}`));
    return box;
  }
  if (!profile) {
    box.appendChild(el('div', { class: 'text-muted', style: 'font-size:0.9rem' }, '아직 작성하지 않았습니다.'));
    return box;
  }

  const listed = !!profile.listed;
  const badge = el('span', { style: `font-size:0.75rem; font-weight:800; border-radius:20px; padding:2px 8px; background:${listed ? 'var(--green-soft)' : 'var(--surface-2)'}; color:${listed ? 'var(--green-deep)' : 'var(--muted)'}` }, listed ? '공개 중' : '비공개');
  const toggleBtn = el('button', { class: listed ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm' }, listed ? '비공개로 전환' : '공개하기');
  toggleBtn.onclick = async () => {
    toggleBtn.disabled = true;
    try {
      await fbSetTeacherProfileListed(teacher.id, !listed);
    } catch (err) {
      toastSaveError('프로필 공개 전환', err);
      toggleBtn.disabled = false;
      return;
    }
    profile.listed = !listed;
    _directoryCache = null;
    render();
    toast(listed ? '프로필을 비공개로 바꿨습니다' : '프로필을 공개했습니다', 'success');
  };
  head.appendChild(el('div', { style: 'display:flex; align-items:center; gap:8px' }, [badge, toggleBtn]));

  const row = (label, value) => {
    if (!value) return;
    const r = el('div', { style: 'font-size:0.9rem; line-height:1.6; margin-bottom:4px; white-space:pre-line' });
    r.appendChild(el('span', { style: 'font-weight:600; color:var(--muted); margin-right:6px' }, label));
    r.appendChild(document.createTextNode(value));
    box.appendChild(r);
  };
  row('표시 이름', profile.displayName);
  row('설명 언어', profileLanguageText(profile));
  row('수준', profileLevelText(profile));
  row('시간대', profile.availability);
  row('경력', profile.experience);
  row('소개', profile.intro);
  return box;
}

/* =========================================================
   STATE & ROUTER
   ========================================================= */
let state = {
  view: 'login',
  language: 'en',
  students: [],
  units: [],
  currentUnitId: null,
  currentActivity: null,
  currentStudent: null,
  currentTeacher: null,
  currentUser: null,
  adminTeacherId: null,
  stats: { xp: 0, level: 1, streak: 0, badges: [], bestScores: {} },
  game: null
};

function render() {
  const app = $('#app');
  app.innerHTML = '';
  app.appendChild(renderTopbar());
  
  let v = state.view;
  const authViews = ['login', 'signup', 'forgot-password', 'loading'];

  // 미로그인 시 인증 화면으로 이동
  if (!state.currentUser && !authViews.includes(v)) {
    state.view = 'login';
    v = 'login';
  }

  // 교사 세션 없이 교사 뷰 진입 시: 관리자면 홈, 아니면 무시(student가 잘못 진입한 경우)
  if (state.currentUser && v === 'teacher' && !state.currentTeacher && !state.currentUser.isAdmin) {
    state.view = 'home';
    v = 'home';
  }

  const map = {
    'loading': renderLoadingPage,
    'login': renderLoginPage, 'signup': renderSignupPage, 'forgot-password': renderForgotPassword,
    'home': renderHome, 'teacher': renderTeacher, 'teacher-create': renderTeacherCreate,
    'teacher-edit': renderTeacherEdit, 'teacher-progress': renderTeacherProgress,
    'admin': renderAdmin, 'admin-teacher': renderAdminTeacherDetail,
    'student-select': renderStudentSelect,
    'student': renderStudent, 'student-unit': renderStudentUnit,
    'student-activity': renderStudentActivity, 'student-result': renderStudentResult
  };
  if (map[v]) app.appendChild(map[v]());

  // Lucide SVG 아이콘 자동 렌더링 스레드 실행
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderTopbar() {
  const bar = el('div', { class: 'topbar' });
  bar.appendChild(el('div', { class: 'logo' }, '한국어 학습'));
  const statsRow = el('div', { class: 'stats-row' });
  const authViews = ['login', 'signup', 'forgot-password'];

  if (!authViews.includes(state.view) && state.view !== 'home') {
    statsRow.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: goHome }, [
      el('i', { 'data-lucide': 'home', style: 'width:16px; height:16px; display:block;' })
    ]));
  }

  if (state.currentUser) {
    // 언어 선택 (학생 모드)
    if (state.currentStudent) {
      const lang = getLangInfo();
      statsRow.appendChild(el('div', { class: 'stat-chip lang', onClick: showLangModal }, `${lang.flag} ${lang.code.toUpperCase()}`));
    }
    // 관리자 버튼 (admin만)
    if (state.currentUser.isAdmin) {
      statsRow.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: () => { state.view = 'admin'; render(); } }, [
        el('i', { 'data-lucide': 'shield', style: 'margin-right:4px; width:15px; height:15px; vertical-align:middle;' }),
        '관리자'
      ]));
    }
    // 로그인 유저 이름
    const icon = state.currentUser.isAdmin ? 'crown' : state.currentTeacher ? 'book-open' : 'graduation-cap';
    statsRow.appendChild(el('div', { class: 'stat-chip', style: 'background:#e0e7ff; color:#3730a3; border-color:#c7d2fe' }, [
      el('i', { 'data-lucide': icon, style: 'margin-right:4px; width:14px; height:14px; vertical-align:middle;' }),
      state.currentUser.name
    ]));
    // 학생 XP/레벨
    if (state.currentStudent) {
      statsRow.appendChild(el('div', { class: 'stat-chip level' }, `⭐ Lv.${state.stats.level}`));
      statsRow.appendChild(el('div', { class: 'stat-chip xp' }, `✨${state.stats.xp}`));
      if (state.stats.streak > 0) statsRow.appendChild(el('div', { class: 'stat-chip streak' }, `🔥 ${state.stats.streak}`));
    }
    // 로그아웃
    statsRow.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: fbSignOut, title: '로그아웃' }, [
      el('i', { 'data-lucide': 'log-out', style: 'width:15px; height:15px;' })
    ]));
  }

  bar.appendChild(statsRow);
  return bar;
}

function goHome() {
  if (state.currentStudent) {
    state.stats.streak = 0;
    persistStudent(true);
    state.currentStudent = null;
    state.stats = defaultStats();
  }
  state.currentTeacher = null;
  state.view = 'home';
  state.currentUnitId = null;
  state.currentActivity = null;
  state.game = null;
  render();
}

function showApiKeyModal() {
  const root = $('#modal-root');
  let selectedProvider = getProvider();

  function renderModal() {
    root.innerHTML = '';
    const backdrop = el('div', { class: 'modal-backdrop', onClick: (e) => { if (e.target === backdrop) root.innerHTML = ''; }});
    const modal = el('div', { class: 'modal', style: 'max-width:480px' });
    modal.appendChild(el('h3', { style: 'margin-bottom:12px' }, '🤖 AI 프로바이더 설정'));

    // 프로바이더 탭
    const tabs = el('div', { style: 'display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-bottom:16px' });
    Object.entries(PROVIDERS).forEach(([code, info]) => {
      const isActive = selectedProvider === code;
      const hasK = !!getApiKey(code);
      const tab = el('button', {
        class: 'btn btn-sm',
        style: `padding:10px 4px; line-height:1.3; white-space:pre-line; background:${isActive ? 'var(--primary)' : '#f1f5f9'}; color:${isActive ? '#fff' : '#374151'}; ${hasK ? 'outline:2px solid #10b981; outline-offset:1px' : ''}`,
        onClick: () => { selectedProvider = code; renderModal(); }
      });
      tab.appendChild(el('i', { 'data-lucide': info.icon, style: 'display:block; margin:0 auto 4px; width:18px; height:18px;' }));
      tab.appendChild(document.createTextNode(`${info.name}${hasK ? ' ✓' : ''}`));
      tabs.appendChild(tab);
    });
    modal.appendChild(tabs);

    const info = PROVIDERS[selectedProvider];
    const currentKey = getApiKey(selectedProvider);
    const currentModel = getModel(selectedProvider);

    // 안내 문구
    const desc = el('p', { style: 'color:#64748b; font-size:0.88rem; margin-bottom:8px; line-height:1.5' });
    desc.textContent = 'API 키는 이 기기의 localStorage에만 저장되며 외부로 전송되지 않습니다.';
    const warn = el('p', { style: 'color:#92400e; background:#fef3c7; border-radius:6px; padding:8px 10px; font-size:0.82rem; margin-bottom:12px; line-height:1.5' });
    warn.textContent = '⚠️ 공용 PC·공유 브라우저에서는 키가 노출될 수 있습니다. 수업 후 반드시 삭제하세요.';
    modal.appendChild(desc);
    modal.appendChild(warn);

    // API 키 입력
    const labelEl = el('label', { style: 'font-size:0.9rem; font-weight:600; margin-bottom:5px; display:block' });
    labelEl.appendChild(el('i', { 'data-lucide': info.icon, style: 'margin-right:4px; vertical-align:middle; width:15px; height:15px; display:inline-block;' }));
    labelEl.appendChild(document.createTextNode(` ${info.name} API 키`));
    modal.appendChild(labelEl);
    const input = el('input', { type: 'password', placeholder: info.keyHint, style: 'width:100%; margin-bottom:12px; font-family:monospace' });
    input.value = currentKey;
    modal.appendChild(input);

    // 모델 선택
    modal.appendChild(el('label', { style: 'font-size:0.9rem; font-weight:600; margin-bottom:5px; display:block' }, '모델'));
    const modelSel = el('select', { style: 'width:100%; margin-bottom:16px' });
    info.models.forEach(m => {
      const opt = el('option', { value: m }, m);
      if (m === currentModel) opt.setAttribute('selected', '');
      modelSel.appendChild(opt);
    });
    modal.appendChild(modelSel);

    // 버튼
    const btns = el('div', { style: 'display:flex; gap:8px' });
    btns.appendChild(el('button', { class: 'btn btn-ghost', style: 'flex:1', onClick: () => root.innerHTML = '' }, '닫기'));
    if (currentKey) {
      btns.appendChild(el('button', { class: 'btn btn-danger btn-sm', onClick: () => {
        setApiKey(selectedProvider, '');
        renderModal();
        toast('키 삭제됨', 'danger');
      }}, '삭제'));
    }
    btns.appendChild(el('button', { class: 'btn btn-primary', style: 'flex:1', onClick: () => {
      const k = input.value.trim();
      if (!k) { toast('API 키를 입력하세요', 'danger'); return; }
      setApiKey(selectedProvider, k);
      setModel(selectedProvider, modelSel.value);
      setProvider(selectedProvider);
      root.innerHTML = '';
      render();
      toast('✅ 설정 저장됨', 'success');
    }}, '저장'));
    modal.appendChild(btns);

    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    setTimeout(() => input.focus(), 50);
  }

  renderModal();
}

function showLangModal() {
  const root = $('#modal-root');
  root.innerHTML = '';
  const backdrop = el('div', { class: 'modal-backdrop', onClick: (e) => { if (e.target === backdrop) root.innerHTML = ''; }});
  const modal = el('div', { class: 'modal' });
  modal.appendChild(el('h3', { style: 'margin-bottom:14px' }, '🌍 언어 선택 (Choose Language)'));
  const grid = el('div', { class: 'lang-grid' });
  LANGS.forEach(l => {
    const tile = el('div', {
      class: 'lang-tile' + (state.language === l.code ? ' active' : ''),
      onClick: () => { state.language = l.code; persistAll(); root.innerHTML = ''; render(); }
    });
    tile.innerHTML = `<span class="flag">${l.flag}</span><div class="name">${l.name}</div>`;
    grid.appendChild(tile);
  });
  modal.appendChild(grid);
  backdrop.appendChild(modal);
  root.appendChild(backdrop);
}

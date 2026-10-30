/* =========================================================
   STATE & ROUTER
   ========================================================= */
let state = {
  view: 'login',
  language: 'en',
  students: [],
  units: [],                 // 내 단원. 저장 대상
  sharedUnits: [],           // 관리자가 발행한 공용 단원. 읽기 전용, 절대 저장하지 않는다
  currentUnitId: null,
  currentActivity: null,
  role: null,                // 'teacher' | 'student' — 원격 접속 학생과 교사를 구분
  currentStudent: null,      // 화면에 표시할 학생 이름
  currentStudentDoc: null,   // 학습 기록을 저장할 Firestore 학생 문서 (게스트는 null)
  classmates: [],            // 리더보드용 같은 반 명단
  currentTeacher: null,
  currentUser: null,
  adminTeacherId: null,
  loadError: null,           // 로그인 직후 Firestore 조회가 실패한 이유 (교사 화면 배너)
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

  // 승인 대기 교사는 대기 화면 말고 갈 곳이 없다. 다른 화면은 규칙이 데이터를 막아 빈 화면만 나온다
  if (state.currentUser && state.currentUser.approved === false && !authViews.includes(v)) {
    state.view = 'teacher-pending';
    v = 'teacher-pending';
  }

  // 학생이 학습 중일 때는 교사·관리자 화면으로 넘어갈 수 없다.
  // 화면 진입을 여기 한 곳에서 막아야 버튼을 숨기는 것만으로는 남는 경로가 사라진다.
  // 원격 접속 학생(role === 'student')도 같은 관문에 걸린다
  const staffViews = ['home', 'teacher', 'teacher-create', 'teacher-edit',
                      'teacher-progress', 'admin', 'admin-teacher', 'student-select'];
  if ((state.currentStudent || state.role === 'student') && staffViews.includes(v)) {
    state.view = 'student';
    v = 'student';
  }


  const map = {
    'loading': renderLoadingPage,
    'login': renderLoginPage, 'signup': renderSignupPage, 'forgot-password': renderForgotPassword,
    'teacher-pending': renderTeacherPending,
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
  const inStudentMode = !!state.currentStudent;

  // 학생 모드의 홈은 단원 목록이다. 교사 화면으로 빠지지 않는다
  // 승인 대기 화면도 맨 위다. 홈 버튼을 주면 눌러도 대기 화면으로 되돌아온다
  const atTop = state.view === 'home' || state.view === 'teacher-pending' || (inStudentMode && state.view === 'student');
  if (!authViews.includes(state.view) && !atTop) {
    statsRow.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: inStudentMode ? goStudentHome : goHome }, [
      el('i', { 'data-lucide': 'home', style: 'width:16px; height:16px; display:block;' })
    ]));
  }

  if (state.currentUser) {
    // 언어 선택 (학생 모드)
    if (state.currentStudent) {
      const lang = getLangInfo();
      statsRow.appendChild(el('div', { class: 'stat-chip lang', onClick: showLangModal }, `${lang.flag} ${lang.code.toUpperCase()}`));
    }
    // 관리자 버튼 (admin만, 학생 학습 중에는 숨긴다)
    if (state.currentUser.isAdmin && !inStudentMode) {
      statsRow.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: () => { state.view = 'admin'; render(); } }, [
        el('i', { 'data-lucide': 'shield', style: 'margin-right:4px; width:15px; height:15px; vertical-align:middle;' }),
        '관리자'
      ]));
    }
    // 로그인 유저 이름 (학생 학습 중에는 교사 이름을 노출하지 않는다)
    if (!inStudentMode) {
      const icon = state.currentUser.isAdmin ? 'crown' : 'book-open';
      statsRow.appendChild(el('div', { class: 'stat-chip', style: 'background:var(--primary-soft); color:var(--primary-dark); border-color:var(--green-line)' }, [
        el('i', { 'data-lucide': icon, style: 'margin-right:4px; width:14px; height:14px; vertical-align:middle;' }),
        state.currentUser.name
      ]));
    }
    // 학생 XP/레벨
    if (state.currentStudent) {
      statsRow.appendChild(el('div', { class: 'stat-chip level' }, `⭐ Lv.${state.stats.level}`));
      statsRow.appendChild(el('div', { class: 'stat-chip xp' }, `✨${state.stats.xp}`));
      if (state.stats.streak > 0) statsRow.appendChild(el('div', { class: 'stat-chip streak' }, `🔥 ${state.stats.streak}`));
    }
    // 원격 접속 학생은 돌아갈 교사 화면이 없다. 로그아웃이 맞다
    if (state.role === 'student') {
      const outBtn = el('button', { class: 'btn btn-ghost btn-sm', onClick: fbSignOut, title: '로그아웃' });
      outBtn.appendChild(el('i', { 'data-lucide': 'log-out', style: 'margin-right:4px; width:15px; height:15px; vertical-align:middle;' }));
      outBtn.appendChild(document.createTextNode('로그아웃'));
      statsRow.appendChild(outBtn);
    // 교사 세션 안의 학생은 로그아웃 대신 '종료'만 둔다.
    // 학생이 교사 계정을 로그아웃시키는 것을 막는다
    } else if (inStudentMode) {
      const exitBtn = el('button', { class: 'btn btn-ghost btn-sm', onClick: exitStudentMode, title: '학생 모드 종료' });
      exitBtn.appendChild(el('i', { 'data-lucide': 'door-open', style: 'margin-right:4px; width:15px; height:15px; vertical-align:middle;' }));
      exitBtn.appendChild(document.createTextNode('종료'));
      statsRow.appendChild(exitBtn);
    } else {
      statsRow.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: fbSignOut, title: '로그아웃' }, [
        el('i', { 'data-lucide': 'log-out', style: 'width:15px; height:15px;' })
      ]));
    }
  }

  bar.appendChild(statsRow);
  return bar;
}

function goHome() {
  if (state.currentStudent) {
    state.stats.streak = 0;
    persistStudent(true);
    state.currentStudent = null;
    state.currentStudentDoc = null;
    state.stats = defaultStats();
  }
  // state.currentTeacher는 로그인 시 정해지는 소속 정보라 여기서 비우지 않는다.
  // 비우면 홈을 거쳐 교사 모드에 들어갔을 때 학생 명단이 사라진다
  state.view = 'home';
  state.currentUnitId = null;
  state.currentActivity = null;
  state.game = null;
  render();
}

// 학생 모드의 홈. 교사 화면으로 나가지 않고 단원 목록으로만 돌아간다
function goStudentHome() {
  state.view = 'student';
  state.currentUnitId = null;
  state.currentActivity = null;
  state.game = null;
  render();
}

async function exitStudentMode() {
  const ok = await showConfirm('학생 모드 종료', '학습을 마치고 교사 화면으로 돌아갑니다.\n지금까지의 진행 상황은 저장됩니다.');
  if (!ok) return;
  goHome();
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
        style: `padding:10px 4px; line-height:1.3; white-space:pre-line; background:${isActive ? 'var(--primary)' : 'var(--surface-2)'}; color:${isActive ? '#fff' : 'var(--text)'}; ${hasK ? 'outline:2px solid var(--green); outline-offset:1px' : ''}`,
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
    const desc = el('p', { style: 'color:var(--muted); font-size:0.88rem; margin-bottom:8px; line-height:1.5' });
    desc.textContent = 'API 키는 이 기기의 localStorage에만 저장되며 외부로 전송되지 않습니다.';
    const warn = el('p', { style: 'color:var(--accent-ink); background:var(--accent-soft); border-radius:6px; padding:8px 10px; font-size:0.82rem; margin-bottom:12px; line-height:1.5' });
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
      onClick: () => {
        state.language = l.code;
        // 학생은 교사의 단원 설정을 바꿀 권한이 없다. 선택은 이 기기에만 남긴다
        if (state.role === 'student') localStorage.setItem('student_language', l.code);
        else persistAll();
        root.innerHTML = '';
        render();
      }
    });
    tile.innerHTML = `<span class="flag">${l.flag}</span><div class="name">${l.name}</div>`;
    grid.appendChild(tile);
  });
  modal.appendChild(grid);
  backdrop.appendChild(modal);
  root.appendChild(backdrop);
}

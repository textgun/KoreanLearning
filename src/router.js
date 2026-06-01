/* =========================================================
   STATE & ROUTER
   ========================================================= */
let state = {
  view: 'home',
  language: 'en',
  students: [],
  units: [],
  currentUnitId: null,
  currentActivity: null,
  currentStudent: null,
  currentTeacher: null,
  adminTeacherId: null,
  stats: { xp: 0, level: 1, streak: 0, badges: [], bestScores: {} },
  game: null
};

function render() {
  const app = $('#app');
  app.innerHTML = '';
  app.appendChild(renderTopbar());
  const v = state.view;
  const map = {
    'home': renderHome, 'teacher-select': renderTeacherSelect, 'teacher': renderTeacher, 'teacher-create': renderTeacherCreate,
    'teacher-edit': renderTeacherEdit, 'teacher-progress': renderTeacherProgress,
    'admin': renderAdmin, 'admin-teacher': renderAdminTeacherDetail,
    'student-select': renderStudentSelect,
    'student': renderStudent, 'student-unit': renderStudentUnit,
    'student-activity': renderStudentActivity, 'student-result': renderStudentResult
  };
  if (map[v]) app.appendChild(map[v]());
}

function renderTopbar() {
  const bar = el('div', { class: 'topbar' });
  bar.appendChild(el('div', { class: 'logo' }, '한국어 학습'));
  const statsRow = el('div', { class: 'stats-row' });
  if (state.view !== 'home') {
    statsRow.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: goHome }, '🏠'));
  }
  const lang = getLangInfo();
  statsRow.appendChild(el('div', { class: 'stat-chip lang', onClick: showLangModal }, `${lang.flag} ${lang.code.toUpperCase()}`));
  statsRow.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: () => { state.view = 'admin'; render(); }}, '👑 관리자'));
  if (state.currentTeacher) {
    statsRow.appendChild(el('div', { class: 'stat-chip', style: 'background:#dbeafe; color:#1d4ed8' }, `👩‍🏫 ${state.currentTeacher.name}`));
  }
  if (state.currentStudent) {
    statsRow.appendChild(el('div', { class: 'stat-chip', style: 'background:#ede9fe; color:#5b21b6' }, `🧑‍🎓 ${state.currentStudent}`));
    statsRow.appendChild(el('div', { class: 'stat-chip level' }, `⭐ Lv.${state.stats.level}`));
    statsRow.appendChild(el('div', { class: 'stat-chip xp' }, `✨${state.stats.xp}`));
    if (state.stats.streak > 0) statsRow.appendChild(el('div', { class: 'stat-chip streak' }, `🔥 ${state.stats.streak}`));
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
      }, `${info.icon}\n${info.name}${hasK ? ' ✓' : ''}`);
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
    modal.appendChild(el('label', { style: 'font-size:0.9rem; font-weight:600; margin-bottom:5px; display:block' }, `${info.icon} ${info.name} API 키`));
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

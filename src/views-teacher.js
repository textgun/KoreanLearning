/* =========================================================
   VIEWS - TEACHER & ADMIN MODES
   ========================================================= */

function renderHome() {
  const root = el('div');

  const hero = el('div', { class: 'home-hero' });
  hero.appendChild(el('h1', {}, '한국어 학습 도구'));
  hero.appendChild(el('p', {}, 'Korean Learning App'));
  root.appendChild(hero);

  // Mode selection
  const grid = el('div', { class: 'mode-grid' });
  const teacherCard = el('div', { class: 'mode-card', onClick: () => { state.view = 'teacher-select'; render(); }});
  teacherCard.innerHTML = '<i data-lucide="book-open" class="card-icon"></i><h3>교사 모드</h3><p>Teacher Mode</p><p style="font-size:0.9rem; margin-top:8px; color:#94a3b8">단원 관리 · PDF 자동 변환</p>';

  const studentCard = el('div', { class: 'mode-card', onClick: () => { state.view = 'student-select'; render(); }});
  studentCard.innerHTML = '<i data-lucide="graduation-cap" class="card-icon"></i><h3>학생 모드</h3><p>Student Mode</p><p style="font-size:0.9rem; margin-top:8px; color:#94a3b8">게임으로 한국어 배우기</p>';

  grid.append(teacherCard, studentCard);
  root.appendChild(grid);

  return root;
}

function renderTeacherSelect() {
  const root = el('div');
  const panel = el('div', { class: 'panel' });
  panel.appendChild(el('button', { class: 'back-btn', onClick: () => { state.view = 'home'; render(); }}, '← 뒤로'));
  
  const title = el('h2', { style: 'margin-top:10px; display:flex; align-items:center; gap:8px' });
  title.appendChild(el('i', { 'data-lucide': 'users', style: 'width:24px; height:24px; color:var(--primary);' }));
  title.appendChild(document.createTextNode('교사 선택'));
  panel.appendChild(title);
  
  panel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:18px' }, '이름을 선택하거나, 처음이라면 이름을 입력해 바로 시작하세요.'));

  const enterTeacher = (teacher) => {
    state.currentTeacher = teacher;
    state.students = (teacher.students || []).map(s => s.name);
    state.view = 'teacher';
    render();
  };

  // 기존 교사 목록
  if (masterState.teachers.length > 0) {
    const grid = el('div', { class: 'mode-grid', style: 'margin-bottom:20px' });
    masterState.teachers.forEach(teacher => {
      const card = el('div', { class: 'mode-card', onClick: () => enterTeacher(teacher) });
      const sc = teacher.status === 'teaching';
      card.appendChild(el('i', { 'data-lucide': 'user', class: 'card-icon' }));
      card.appendChild(el('h3', {}, teacher.name));
      card.appendChild(el('div', { style: `display:inline-block; background:${sc ? '#d1fae5' : '#fef3c7'}; color:${sc ? '#059669' : '#d97706'}; border-radius:20px; padding:2px 10px; font-size:0.82rem; font-weight:600; margin-top:4px` }, sc ? '🟢 수업중' : '🟡 교육중'));
      card.appendChild(el('p', { style: 'font-size:0.85rem; margin-top:6px; color:#94a3b8' }, `학생 ${(teacher.students || []).length}명`));
      grid.appendChild(card);
    });
    panel.appendChild(grid);
    panel.appendChild(el('div', { style: 'border-top:1px solid #e2e8f0; margin-bottom:18px' }));
  }

  // 신규 교사 등록
  panel.appendChild(el('p', { style: 'font-weight:600; font-size:0.95rem; margin-bottom:10px' }, '처음 사용하시나요?'));
  const newRow = el('div', { style: 'display:flex; gap:8px' });
  const nameIn = el('input', { type: 'text', placeholder: '이름을 입력하세요', style: 'flex:1; padding:10px 14px; border-radius:10px; border:2px solid #e2e8f0; font-size:1rem; box-sizing:border-box' });
  const startBtn = el('button', { class: 'btn btn-primary', onClick: async () => {
    const name = nameIn.value.trim();
    if (!name) { toast('이름을 입력하세요', 'danger'); return; }
    if (masterState.teachers.some(t => t.name === name)) {
      toast('이미 등록된 이름입니다. 위 목록에서 선택하세요', 'accent');
      return;
    }
    const newTeacher = { id: Date.now(), name, phone: '', status: 'teaching', note: '', students: [] };
    masterState.teachers.push(newTeacher);
    await saveMaster();
    toast(`✅ ${name} 선생님 등록됨`, 'success');
    enterTeacher(newTeacher);
  }}, '시작하기');
  nameIn.addEventListener('keydown', e => { if (e.key === 'Enter') startBtn.click(); });
  newRow.append(nameIn, startBtn);
  panel.appendChild(newRow);

  root.appendChild(panel);
  return root;
}

function renderTeacher() {
  const root = el('div');
  const panel = el('div', { class: 'panel' });
  const head = el('div', { class: 'row-between' });
  
  const title = el('h2', { style: 'display:flex; align-items:center; gap:8px' });
  title.appendChild(el('i', { 'data-lucide': 'book-open', style: 'width:24px; height:24px; color:var(--primary);' }));
  title.appendChild(document.createTextNode('단원 관리'));
  head.appendChild(title);
  
  const headBtns = el('div', { style: 'display:flex; gap:8px; flex-wrap:wrap' });

  const _pv = getProvider(); const _pk = !!getApiKey(_pv); const _pi = PROVIDERS[_pv];
  const aiBtn = el('button', {
    class: 'btn btn-sm',
    style: `background:${_pk ? '#dcfce7' : '#fef2f2'}; color:${_pk ? '#166534' : '#991b1b'}; border:1.5px solid ${_pk ? '#86efac' : '#fca5a5'}; display:inline-flex; align-items:center; gap:4px`,
    onClick: showApiKeyModal
  });
  aiBtn.appendChild(el('i', { 'data-lucide': _pi.icon, style: 'width:13px; height:13px;' }));
  aiBtn.appendChild(document.createTextNode(_pk ? ' AI 설정 ✓' : ' ⚠️ AI 설정'));
  headBtns.appendChild(aiBtn);

  const progressBtn = el('button', { class: 'btn btn-ghost', style: 'display:flex; align-items:center; gap:6px', onClick: () => { _progressCache = null; state.view = 'teacher-progress'; render(); }});
  progressBtn.appendChild(el('i', { 'data-lucide': 'bar-chart-2', style: 'width:16px; height:16px;' }));
  progressBtn.appendChild(document.createTextNode('진도 현황'));
  headBtns.appendChild(progressBtn);

  const createBtn = el('button', { class: 'btn btn-primary', style: 'display:flex; align-items:center; gap:6px', onClick: () => { state.view = 'teacher-create'; render(); }});
  createBtn.appendChild(el('i', { 'data-lucide': 'plus', style: 'width:16px; height:16px; color:#fff;' }));
  createBtn.appendChild(document.createTextNode('새 단원'));
  headBtns.appendChild(createBtn);
  
  head.appendChild(headBtns);
  panel.appendChild(head);
  panel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:14px' }, 'PDF 업로드 또는 직접 입력으로 단원을 만들고 편집할 수 있습니다.'));

  if (state.units.length === 0) {
    panel.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; padding:24px' }, '아직 단원이 없습니다.'));
  } else {
    const list = el('div', { class: 'unit-list' });
    state.units.forEach(u => {
      const item = el('div', { class: 'unit-item' });
      const info = el('div');
      info.appendChild(el('h4', {}, u.title));
      info.appendChild(el('div', { class: 'meta' }, `어휘 ${u.vocabulary.length} · 문법 ${u.grammar.length} · 퀴즈 ${(u.quizzes || []).length}`));
      
      const actions = el('div', { class: 'unit-actions' });
      
      const editBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'display:inline-flex; align-items:center; gap:4px', onClick: () => editUnit(u.id) });
      editBtn.appendChild(el('i', { 'data-lucide': 'edit-2', style: 'width:13px; height:13px;' }));
      editBtn.appendChild(document.createTextNode('편집'));
      actions.appendChild(editBtn);
      
      const delBtn = el('button', { class: 'btn btn-danger btn-sm', style: 'display:inline-flex; align-items:center;', onClick: () => deleteUnit(u.id) });
      delBtn.appendChild(el('i', { 'data-lucide': 'trash-2', style: 'width:13px; height:13px; color:#fff;' }));
      actions.appendChild(delBtn);
      
      item.append(info, actions);
      list.appendChild(item);
    });
    panel.appendChild(list);
  }
  root.appendChild(panel);

  // Student roster (read-only — managed by master admin)
  const rosterPanel = el('div', { class: 'panel' });
  const rosterTitle = el('h3', { style: 'display:flex; align-items:center; gap:8px' });
  rosterTitle.appendChild(el('i', { 'data-lucide': 'users', style: 'width:18px; height:18px; color:var(--primary);' }));
  rosterTitle.appendChild(document.createTextNode('학생 명단'));
  rosterPanel.appendChild(rosterTitle);
  
  const teacherStudents = state.currentTeacher ? (state.currentTeacher.students || []) : [];
  if (teacherStudents.length === 0) {
    rosterPanel.appendChild(el('p', { class: 'text-muted', style: 'margin-top:10px; font-size:0.9rem' }, '관리자 대시보드에서 학생을 추가하세요.'));
  } else {
    const stuList = el('div', { style: 'display:flex; flex-direction:column; gap:8px; margin-top:10px' });
    teacherStudents.forEach(s => {
      const row = el('div', { style: 'display:flex; align-items:center; gap:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 14px' });
      row.appendChild(el('i', { 'data-lucide': 'user', style: 'width:14px; height:14px; color:var(--primary);' }));
      row.appendChild(el('div', { style: 'font-weight:600; flex:1' }, s.name));
      if (s.nationality) row.appendChild(el('div', { style: 'font-size:0.85rem; color:#64748b' }, s.nationality));
      if (s.age) row.appendChild(el('div', { style: 'font-size:0.85rem; color:#64748b' }, `${s.age}세`));
      stuList.appendChild(row);
    });
    rosterPanel.appendChild(stuList);
  }
  root.appendChild(rosterPanel);

  // Danger zone - reset all data
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

  return root;
}

function editUnit(id) { state.currentUnitId = id; state.view = 'teacher-edit'; render(); }
async function deleteUnit(id) {
  const unit = state.units.find(u => u.id === id);
  const ok = await showConfirm('단원 삭제', `"${unit ? unit.title : '이 단원'}"을 정말 삭제하시겠습니까?\n\n포함된 모든 어휘, 문법, 퀴즈가 함께 삭제됩니다`, true);
  if (!ok) return;
  state.units = state.units.filter(u => u.id !== id);
  await persistAll(true);
  toast('단원 삭제됨', 'danger');
  render();
}

function renderTeacherCreate() {
  const root = el('div');
  const panel = el('div', { class: 'panel' });
  panel.appendChild(el('button', { class: 'back-btn', onClick: () => { state.view = 'teacher'; render(); }}, '← 뒤로'));
  
  const title = el('h2', { style: 'margin-top:10px; display:flex; align-items:center; gap:8px' });
  title.appendChild(el('i', { 'data-lucide': 'plus-circle', style: 'width:24px; height:24px; color:var(--primary);' }));
  title.appendChild(document.createTextNode('새 단원 만들기'));
  panel.appendChild(title);

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
  panel.appendChild(el('p', { style: 'font-size:0.82rem; color:#92400e; background:#fef3c7; border-radius:8px; padding:10px 12px; margin-top:10px; line-height:1.5' }, '⚠️ PDF 내용은 선택한 AI 서비스(Gemini·OpenAI·Anthropic 등) 서버로 전송됩니다. 개인정보·민감 자료가 포함된 경우 업로드 전 확인하세요.'));
  panel.appendChild(el('div', { id: 'pdf-status', class: 'loading hidden' }));
  root.appendChild(panel);
  return root;
}

async function createBlankUnit() {
  const title = await showPrompt('새 단원 만들기', '예: 10단원 - 가족');
  if (!title) return;
  state.units.push({ id: Date.now(), title, vocabulary: [], grammar: [], quizzes: [] });
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
    last.style.background = '#fef3c7';
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

async function loadAllStudentProgress() {
  const cache = {};
  await Promise.all(state.students.map(async name => {
    try {
      const r = await window.storage.get(studentKey(name));
      cache[name] = (r && r.value) ? (JSON.parse(r.value).stats || defaultStats()) : defaultStats();
    } catch (e) { cache[name] = defaultStats(); }
  }));
  return cache;
}

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
  state.units.forEach(unit => {
    const p = calcUnitProgress(bestScores, unit);
    if (p) { done += p.done; total += p.total; }
  });
  return total > 0 ? Math.round(done / total * 100) : 0;
}

function renderProgressBar(pct, height = '10px') {
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : pct > 0 ? '#f59e0b' : '#e2e8f0';
  const wrap = el('div', { style: `background:#e2e8f0; border-radius:99px; height:${height}; overflow:hidden; flex:1` });
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

  if (state.students.length === 0) {
    panel.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; padding:20px' }, '교사 메뉴 → 학생 명단에서 이름을 추가해주세요.'));
    root.appendChild(panel);
    return root;
  }

  if (!_progressCache) {
    panel.appendChild(el('div', { style: 'text-align:center; padding:32px; color:#64748b; font-size:1.05rem' }, '📊 학생 데이터 불러오는 중...'));
    root.appendChild(panel);
    loadAllStudentProgress().then(cache => { _progressCache = cache; render(); });
    return root;
  }

  const avgPct = Math.round(
    state.students.reduce((sum, name) => sum + calcOverallProgress((_progressCache[name] || defaultStats()).bestScores), 0) / state.students.length
  );
  
  const summary = el('div', { style: 'display:flex; align-items:center; gap:16px; flex-wrap:wrap; background:#f1f5f9; border-radius:12px; padding:14px 18px; margin-bottom:20px' });
  
  const stuCountSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:600' });
  stuCountSpan.appendChild(el('i', { 'data-lucide': 'users', style: 'width:15px; height:15px; color:var(--primary);' }));
  stuCountSpan.appendChild(document.createTextNode(`${state.students.length}명`));
  summary.appendChild(stuCountSpan);
  
  const avgSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:600; color:#059669' });
  avgSpan.appendChild(el('i', { 'data-lucide': 'trending-up', style: 'width:15px; height:15px; color:#059669;' }));
  avgSpan.appendChild(document.createTextNode(`평균 ${avgPct}%`));
  summary.appendChild(avgSpan);
  
  const unitSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:600' });
  unitSpan.appendChild(el('i', { 'data-lucide': 'book', style: 'width:15px; height:15px; color:var(--primary);' }));
  unitSpan.appendChild(document.createTextNode(`단원 ${state.units.length}개`));
  summary.appendChild(unitSpan);
  
  const refreshBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'margin-left:auto; display:inline-flex; align-items:center; gap:4px', onClick: () => { _progressCache = null; render(); } });
  refreshBtn.appendChild(el('i', { 'data-lucide': 'refresh-cw', style: 'width:13px; height:13px;' }));
  refreshBtn.appendChild(document.createTextNode('새로고침'));
  summary.appendChild(refreshBtn);
  
  panel.appendChild(summary);

  state.students.forEach(name => {
    const stats = _progressCache[name] || defaultStats();
    const overallPct = calcOverallProgress(stats.bestScores);

    const card = el('div', { style: 'border:1px solid #e2e8f0; border-radius:14px; padding:18px; margin-bottom:14px' });

    const hdr = el('div', { style: 'display:flex; align-items:center; gap:10px; margin-bottom:14px; flex-wrap:wrap' });
    
    const sNameDiv = el('div', { style: 'font-size:1.1rem; font-weight:700; color:#1e293b; flex:1; display:flex; align-items:center; gap:6px' });
    sNameDiv.appendChild(el('i', { 'data-lucide': 'user', style: 'width:18px; height:18px; color:var(--primary);' }));
    sNameDiv.appendChild(document.createTextNode(name));
    hdr.appendChild(sNameDiv);
    
    hdr.appendChild(el('div', { style: 'background:#ede9fe; color:#5b21b6; border-radius:20px; padding:3px 10px; font-size:0.85rem; font-weight:600' }, `⭐ Lv.${stats.level}`));
    hdr.appendChild(el('div', { style: 'background:#fef3c7; color:#92400e; border-radius:20px; padding:3px 10px; font-size:0.85rem; font-weight:600' }, `✨ ${stats.xp} XP`));
    card.appendChild(hdr);

    const overallRow = el('div', { style: 'display:flex; align-items:center; gap:10px; margin-bottom:14px' });
    overallRow.appendChild(el('div', { style: 'font-size:0.88rem; color:#64748b; white-space:nowrap' }, '전체 진도'));
    overallRow.appendChild(renderProgressBar(overallPct));
    overallRow.appendChild(el('div', { style: 'font-weight:700; font-size:0.95rem; min-width:40px; text-align:right' }, `${overallPct}%`));
    card.appendChild(overallRow);

    if (state.units.length > 0) {
      const grid = el('div', { style: 'display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:8px' });
      state.units.forEach(unit => {
        const p = calcUnitProgress(stats.bestScores, unit);
        const pct = p ? p.pct : 0;
        const label = unit.title.replace(/^\d+(?:단원|단)?\s*[-·]\s*/, '') || unit.title;
        const chip = el('div', { style: 'background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 10px' });
        chip.appendChild(el('div', { style: 'font-size:0.82rem; font-weight:600; color:#374151; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis' }, label));
        const chipBar = el('div', { style: 'background:#e2e8f0; border-radius:99px; height:6px; overflow:hidden; margin-bottom:3px' });
        chipBar.appendChild(el('div', { style: `background:${pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : pct > 0 ? '#f59e0b' : '#cbd5e1'}; width:${pct}%; height:100%; border-radius:99px` }));
        chip.appendChild(chipBar);
        chip.appendChild(el('div', { style: 'font-size:0.78rem; color:#64748b' }, p ? `${p.done}/${p.total} (${pct}%)` : '활동 없음'));
        grid.appendChild(chip);
      });
      card.appendChild(grid);
    }

    if (stats.badges && stats.badges.length > 0) {
      const badgeNames = stats.badges.map(id => BADGE_NAMES[id] || id).join('  ');
      const badgeDiv = el('div', { style: 'margin-top:10px; font-size:0.82rem; color:#64748b; display:flex; align-items:center; gap:4px' });
      badgeDiv.appendChild(el('i', { 'data-lucide': 'award', style: 'width:14px; height:14px; color:#f59e0b;' }));
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

function renderAdmin() {
  const root = el('div');
  const panel = el('div', { class: 'panel' });

  const head = el('div', { class: 'row-between' });
  const title = el('h2', { style: 'display:flex; align-items:center; gap:8px' });
  title.appendChild(el('i', { 'data-lucide': 'crown', style: 'width:24px; height:24px; color:#f59e0b;' }));
  title.appendChild(document.createTextNode('관리자 대시보드'));
  head.appendChild(title);
  
  const headBtns = el('div', { style: 'display:flex; gap:8px' });
  const _pv = getProvider(); const _pk = !!getApiKey(_pv); const _pi = PROVIDERS[_pv];
  
  const aiBtn = el('button', {
    class: 'btn btn-sm',
    style: `background:${_pk ? '#dcfce7' : '#fef2f2'}; color:${_pk ? '#166534' : '#991b1b'}; border:1.5px solid ${_pk ? '#86efac' : '#fca5a5'}; display:inline-flex; align-items:center; gap:4px`,
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

  const teaching = masterState.teachers.filter(t => t.status === 'teaching').length;
  const training = masterState.teachers.filter(t => t.status === 'training').length;
  const totalStudents = masterState.teachers.reduce((s, t) => s + (t.students || []).length, 0);

  const summary = el('div', { style: 'display:flex; gap:16px; flex-wrap:wrap; background:#f1f5f9; border-radius:12px; padding:14px 18px; margin:16px 0; align-items:center;' });
  
  const tCountSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:600' });
  tCountSpan.appendChild(el('i', { 'data-lucide': 'users', style: 'width:15px; height:15px; color:var(--primary);' }));
  tCountSpan.appendChild(document.createTextNode(`교사 ${masterState.teachers.length}명`));
  summary.appendChild(tCountSpan);
  
  const teachingSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:600; color:#059669' });
  teachingSpan.appendChild(el('i', { 'data-lucide': 'activity', style: 'width:15px; height:15px; color:#059669;' }));
  teachingSpan.appendChild(document.createTextNode(`수업중 ${teaching}명`));
  summary.appendChild(teachingSpan);
  
  const trainingSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:600; color:#d97706' });
  trainingSpan.appendChild(el('i', { 'data-lucide': 'book', style: 'width:15px; height:15px; color:#d97706;' }));
  trainingSpan.appendChild(document.createTextNode(`교육중 ${training}명`));
  summary.appendChild(trainingSpan);
  
  const sCountSpan = el('span', { style: 'display:inline-flex; align-items:center; gap:4px; font-weight:600' });
  sCountSpan.appendChild(el('i', { 'data-lucide': 'graduation-cap', style: 'width:15px; height:15px; color:var(--primary);' }));
  sCountSpan.appendChild(document.createTextNode(`전체 학생 ${totalStudents}명`));
  summary.appendChild(sCountSpan);
  
  panel.appendChild(summary);

  if (masterState.teachers.length === 0) {
    panel.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; padding:24px' }, '등록된 교사가 없습니다. + 교사 추가 버튼으로 시작하세요.'));
  } else {
    masterState.teachers.forEach(teacher => {
      const card = el('div', { style: 'border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:10px; cursor:pointer', onClick: () => { state.adminTeacherId = teacher.id; _adminProgressCache = null; state.view = 'admin-teacher'; render(); }});
      const hdr = el('div', { style: 'display:flex; align-items:center; gap:10px; margin-bottom:8px' });
      
      const tNameDiv = el('div', { style: 'font-weight:700; font-size:1.05rem; flex:1; display:flex; align-items:center; gap:6px' });
      tNameDiv.appendChild(el('i', { 'data-lucide': 'user', style: 'width:16px; height:16px; color:var(--primary);' }));
      tNameDiv.appendChild(document.createTextNode(teacher.name));
      hdr.appendChild(tNameDiv);
      
      const sc = teacher.status === 'teaching';
      hdr.appendChild(el('div', { style: `background:${sc ? '#d1fae5' : '#fef3c7'}; color:${sc ? '#059669' : '#d97706'}; border-radius:20px; padding:3px 10px; font-size:0.82rem; font-weight:600` }, sc ? '🟢 수업중' : '🟡 교육중'));
      card.appendChild(hdr);
      
      const meta = el('div', { style: 'font-size:0.88rem; color:#64748b; display:flex; gap:16px; flex-wrap:wrap; align-items:center;' });
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
  info.appendChild(el('div', { style: `background:${sc ? '#d1fae5' : '#fef3c7'}; color:${sc ? '#059669' : '#d97706'}; border-radius:20px; padding:4px 12px; font-weight:600; font-size:0.9rem` }, sc ? '🟢 수업진행중' : '🟡 교육중'));
  info.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: async () => { teacher.status = sc ? 'training' : 'teaching'; await saveMaster(); render(); }}, `↔ ${sc ? '교육중으로' : '수업중으로'} 변경`));
  if (teacher.phone) {
    const phoneDiv = el('div', { style: 'color:#64748b; font-size:0.9rem; display:flex; align-items:center; gap:4px' });
    phoneDiv.appendChild(el('i', { 'data-lucide': 'phone', style: 'width:14px; height:14px;' }));
    phoneDiv.appendChild(document.createTextNode(teacher.phone));
    info.appendChild(phoneDiv);
  }
  if (teacher.note) {
    const noteDiv = el('div', { style: 'color:#64748b; font-size:0.9rem; display:flex; align-items:center; gap:4px' });
    noteDiv.appendChild(el('i', { 'data-lucide': 'file-text', style: 'width:14px; height:14px;' }));
    noteDiv.appendChild(document.createTextNode(teacher.note));
    info.appendChild(noteDiv);
  }
  panel.appendChild(info);

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
    panel.appendChild(el('div', { style: 'text-align:center; padding:24px; color:#64748b' }, '📊 진도 불러오는 중...'));
    root.appendChild(panel);
    loadStudentsProgress(teacher.students.map(s => s.name)).then(cache => { _adminProgressCache = cache; render(); });
    return root;
  }

  const rows = el('div', { style: 'display:flex; flex-direction:column; gap:8px' });
  teacher.students.forEach((student, idx) => {
    const stats = _adminProgressCache[student.name] || defaultStats();
    const pct = calcOverallProgress(stats.bestScores);
    const row = el('div', { style: 'display:grid; grid-template-columns:1fr 64px 120px 36px 36px; gap:8px; align-items:center; border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px' });

    const nameDiv = el('div');
    nameDiv.appendChild(el('div', { style: 'font-weight:600; font-size:0.95rem' }, student.name));
    const metaStr = [student.nationality, student.age ? student.age + '세' : ''].filter(Boolean).join(' · ');
    if (metaStr) nameDiv.appendChild(el('div', { style: 'font-size:0.82rem; color:#64748b; margin-top:2px' }, metaStr));
    row.appendChild(nameDiv);

    const lvl = el('div', { style: 'text-align:center; font-size:0.82rem' });
    lvl.appendChild(el('div', { style: 'font-weight:700; color:#5b21b6' }, `Lv.${stats.level}`));
    lvl.appendChild(el('div', { style: 'color:#92400e' }, `${stats.xp}XP`));
    row.appendChild(lvl);

    const prog = el('div');
    const barWrap = el('div', { style: 'background:#e2e8f0; border-radius:99px; height:8px; overflow:hidden; margin-bottom:2px' });
    const barColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : pct > 0 ? '#f59e0b' : '#e2e8f0';
    barWrap.appendChild(el('div', { style: `background:${barColor}; width:${pct}%; height:100%; border-radius:99px` }));
    prog.appendChild(barWrap);
    prog.appendChild(el('div', { style: 'font-size:0.78rem; color:#64748b; text-align:center' }, `${pct}%`));
    row.appendChild(prog);

    const editStuBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'padding:4px 6px; display:inline-flex; align-items:center; justify-content:center;', onClick: () => showEditStudentModal(teacher, student, idx) });
    editStuBtn.appendChild(el('i', { 'data-lucide': 'pencil', style: 'width:14px; height:14px; color:#3b82f6;' }));
    row.appendChild(editStuBtn);

    const delStuBtn = el('button', { class: 'btn btn-ghost btn-sm', style: 'padding:4px 6px; display:inline-flex; align-items:center; justify-content:center;', onClick: async () => {
      const ok = await showConfirm('학생 삭제', `"${student.name}" 학생을 삭제하시겠습니까?`, true);
      if (!ok) return;
      teacher.students.splice(idx, 1);
      await saveMaster();
      _adminProgressCache = null;
      render();
    }});
    delStuBtn.appendChild(el('i', { 'data-lucide': 'trash-2', style: 'width:14px; height:14px; color:#ef4444;' }));
    row.appendChild(delStuBtn);

    rows.appendChild(row);
  });
  panel.appendChild(rows);

  root.appendChild(panel);
  return root;
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
      } else {
        masterState.teachers.push({ id: Date.now(), name, phone: phoneIn.value.trim(), status: statusSel.value, note: noteIn.value.trim(), students: [] });
      }
      await saveMaster();
      root.innerHTML = ''; resolve(true); render();
    }}, existing ? '저장' : '추가'));
    modal.appendChild(btns);
    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    setTimeout(() => nameIn.focus(), 50);
  });
}

function showAddStudentModal(teacher) {
  return new Promise(resolve => {
    const root = $('#modal-root');
    root.innerHTML = '';
    const backdrop = el('div', { class: 'modal-backdrop' });
    backdrop.onclick = (e) => { if (e.target === backdrop) { root.innerHTML = ''; resolve(false); }};
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
    btns.appendChild(el('button', { class: 'btn btn-ghost', style: 'flex:1', onClick: () => { root.innerHTML = ''; resolve(false); }}, '취소'));
    btns.appendChild(el('button', { class: 'btn btn-primary', style: 'flex:1', onClick: async () => {
      const name = nameIn.value.trim();
      if (!name) { toast('이름을 입력하세요', 'danger'); return; }
      if (!teacher.students) teacher.students = [];
      if (teacher.students.some(s => s.name === name)) { toast('이미 등록된 이름입니다', 'danger'); return; }
      teacher.students.push({ name, nationality: natSel.value, age: parseInt(ageIn.value) || null });
      await saveMaster();
      _adminProgressCache = null;
      root.innerHTML = ''; resolve(true); render();
    }}, '추가'));
    modal.appendChild(btns);
    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    setTimeout(() => nameIn.focus(), 50);
  });
}

function showEditStudentModal(teacher, student, idx) {
  return new Promise(resolve => {
    const root = $('#modal-root');
    root.innerHTML = '';
    const backdrop = el('div', { class: 'modal-backdrop' });
    backdrop.onclick = (e) => { if (e.target === backdrop) { root.innerHTML = ''; resolve(false); } };
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
    btns.appendChild(el('button', { class: 'btn btn-ghost', style: 'flex:1', onClick: () => { root.innerHTML = ''; resolve(false); } }, '취소'));
    btns.appendChild(el('button', { class: 'btn btn-primary', style: 'flex:1', onClick: async () => {
      const name = nameIn.value.trim();
      if (!name) { toast('이름을 입력하세요', 'danger'); return; }
      const duplicate = teacher.students.some((s, i) => i !== idx && s.name === name);
      if (duplicate) { toast('이미 등록된 이름입니다', 'danger'); return; }
      teacher.students[idx] = { name, nationality: natSel.value, age: parseInt(ageIn.value) || null };
      await saveMaster();
      _adminProgressCache = null;
      root.innerHTML = '';
      resolve(true);
      render();
    } }, '저장'));
    modal.appendChild(btns);

    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    setTimeout(() => nameIn.focus(), 50);
  });
}

async function deleteTeacher(id) {
  const teacher = masterState.teachers.find(t => t.id === id);
  const ok = await showConfirm('교사 삭제', `"${teacher?.name}" 교사를 삭제하시겠습니까?\n\n학생 명단도 함께 삭제됩니다.`, true);
  if (!ok) return;
  masterState.teachers = masterState.teachers.filter(t => t.id !== id);
  await saveMaster();
  state.view = 'admin';
  render();
}

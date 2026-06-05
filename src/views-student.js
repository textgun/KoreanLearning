/* =========================================================
   VIEWS - STUDENT & GAMES ENGINE
   ========================================================= */

function addXP(amount) {
  state.stats.xp += amount;
  const newLevel = Math.floor(state.stats.xp / 100) + 1;
  if (newLevel > state.stats.level) {
    state.stats.level = newLevel;
    toast(`🎉 레벨 UP! Level ${newLevel}`, 'accent');
  }
}
function checkBadges(ctx) {
  const newBadges = [];
  const has = b => state.stats.badges.includes(b);
  if (ctx.perfectScore && !has('perfect')) newBadges.push({ id: 'perfect', name: '완벽주의자' });
  if (ctx.streak >= 10 && !has('combo10')) newBadges.push({ id: 'combo10', name: '🔥 10연속' });
  if (state.stats.xp >= 500 && !has('xp500')) newBadges.push({ id: 'xp500', name: '⭐ XP 500' });
  if (state.stats.level >= 5 && !has('level5')) newBadges.push({ id: 'level5', name: '🏆 Lv.5 달성' });
  newBadges.forEach(b => state.stats.badges.push(b.id));
  return newBadges;
}
function recordBestScore(unitId, activity, score) {
  const key = `${unitId}_${activity}`;
  if (!state.stats.bestScores[key] || score > state.stats.bestScores[key]) state.stats.bestScores[key] = score;
}
function getBestScore(unitId, activity) { return state.stats.bestScores[`${unitId}_${activity}`] || 0; }
function calcStars(percent) { return percent >= 90 ? 3 : percent >= 70 ? 2 : percent >= 50 ? 1 : 0; }

function renderStudentSelect() {
  const root = el('div');
  const panel = el('div', { class: 'panel' });
  panel.appendChild(el('button', { class: 'back-btn', onClick: () => { state.view = 'home'; render(); }}, '← 뒤로'));
  
  const title = el('h2', { style: 'margin-top:10px; display:flex; align-items:center; gap:8px' });
  title.appendChild(el('i', { 'data-lucide': 'graduation-cap', style: 'width:24px; height:24px; color:var(--primary);' }));
  title.appendChild(document.createTextNode('학생 선택'));
  panel.appendChild(title);
  
  panel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:18px' }, '이름을 선택하세요. 학습 기록은 개인별로 저장됩니다.'));

  const enterStudent = async (name) => {
    state.currentStudent = name;
    await loadStudentStats(name);
    state.view = 'student';
    render();
  };

  if (state.students.length === 0) {
    panel.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; padding:20px' }, '교사 모드 → 학생 명단에서 이름을 추가해주세요.'));
  } else {
    const grid = el('div', { class: 'mode-grid' });
    state.students.forEach(name => {
      const card = el('div', { class: 'mode-card', onClick: () => enterStudent(name) });
      card.appendChild(el('i', { 'data-lucide': 'user', class: 'card-icon' }));
      card.appendChild(el('h3', {}, name));
      grid.appendChild(card);
    });
    panel.appendChild(grid);
  }

  const guestBtn = el('button', {
    class: 'btn btn-ghost btn-block',
    style: 'margin-top:16px; display:flex; align-items:center; justify-content:center; gap:6px',
    onClick: () => enterStudent('게스트')
  });
  guestBtn.appendChild(el('i', { 'data-lucide': 'user', style: 'width:16px; height:16px;' }));
  guestBtn.appendChild(document.createTextNode('게스트로 시작'));
  panel.appendChild(guestBtn);

  root.appendChild(panel);
  return root;
}

function renderStudent() {
  if (!state.currentStudent) { state.view = 'student-select'; render(); return el('div'); }
  const root = el('div');
  const panel = el('div', { class: 'panel' });
  
  const sTitle = el('h2', { style: 'display:flex; align-items:center; gap:8px' });
  sTitle.appendChild(el('i', { 'data-lucide': 'book', style: 'width:24px; height:24px; color:var(--primary);' }));
  sTitle.appendChild(document.createTextNode('단원 선택 (Choose a Unit)'));
  panel.appendChild(sTitle);
  
  const lang = getLangInfo();
  panel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:14px' }, `현재 언어: ${lang.flag} ${lang.name} · 변경하려면 상단 ${lang.code.toUpperCase()} 버튼 클릭`));

  if (state.units.length === 0) {
    panel.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; padding:20px' }, '아직 단원이 없습니다. 교사 모드에서 만들어주세요.'));
  } else {
    const grid = el('div', { class: 'unit-grid' });
    state.units.forEach((u, i) => {
      const tile = el('div', { class: 'unit-tile', onClick: () => { state.currentUnitId = u.id; state.view = 'student-unit'; render(); }});
      tile.appendChild(el('div', { class: 'num' }, String(i + 1)));
      tile.appendChild(el('div', { class: 'title' }, u.title.replace(/^\d+(?:단원|단)?\s*-?\s*/, '')));
      tile.appendChild(el('div', { class: 'progress' }, `${u.vocabulary.length} 단어 · ${u.grammar.length} 문법 · ${(u.quizzes || []).length} 퀴즈`));
      grid.appendChild(tile);
    });
    panel.appendChild(grid);
  }
  root.appendChild(panel);

  // 우리 반 점수판 (리더보드) 기능 구현
  const myTeacher = masterState.teachers.find(t => (t.students || []).some(s => s.name === state.currentStudent));
  if (myTeacher) {
    const classmates = myTeacher.students || [];
    
    // 같은 반 학생들의 스탯 동기 로드
    const classmatesStats = classmates.map(s => {
      const raw = localStorage.getItem('korean_student_' + encodeURIComponent(s.name) + '_v1');
      let stats = { xp: 0, level: 1, streak: 0, badges: [], bestScores: {} };
      if (raw) {
        try { stats = JSON.parse(raw).stats || stats; } catch(e) {}
      }
      return { name: s.name, nationality: s.nationality, age: s.age, stats };
    });
    
    // XP 점수 내림차순 정렬
    classmatesStats.sort((a, b) => (b.stats.xp || 0) - (a.stats.xp || 0));

    const leaderPanel = el('div', { class: 'panel', style: 'margin-top:20px; border-top: 4px solid var(--accent);' });
    
    const leaderTitle = el('h3', { style: 'display:flex; align-items:center; gap:8px; margin-bottom:12px' });
    leaderTitle.appendChild(el('i', { 'data-lucide': 'crown', style: 'width:20px; height:20px; color:#f59e0b;' }));
    leaderTitle.appendChild(document.createTextNode(`🏆 우리 반 리더보드 (${myTeacher.name} 선생님 반)`));
    leaderPanel.appendChild(leaderTitle);
    
    const table = el('div', { style: 'display:flex; flex-direction:column; gap:8px; margin-top:10px' });
    
    classmatesStats.forEach((c, idx) => {
      const isMe = c.name === state.currentStudent;
      const rank = idx + 1;
      
      const row = el('div', { style: `display:grid; grid-template-columns: 40px 1fr 68px 80px 60px; gap:8px; align-items:center; border:1px solid ${isMe ? 'var(--primary)' : 'rgba(226, 232, 240, 0.8)'}; border-radius:12px; padding:12px 14px; background:${isMe ? 'rgba(79, 70, 229, 0.05)' : 'rgba(255,255,255,0.5)'};` });
      
      // 순위 컬럼
      const rankCol = el('div', { style: 'font-weight:800; font-size:1.1rem; text-align:center; display:flex; justify-content:center; align-items:center;' });
      if (rank === 1) {
        rankCol.appendChild(el('i', { 'data-lucide': 'crown', style: 'width:18px; height:18px; color:#f59e0b;' }));
      } else if (rank === 2) {
        rankCol.appendChild(el('i', { 'data-lucide': 'award', style: 'width:18px; height:18px; color:#3b82f6;' }));
      } else if (rank === 3) {
        rankCol.appendChild(el('i', { 'data-lucide': 'medal', style: 'width:18px; height:18px; color:#10b981;' }));
      } else {
        rankCol.appendChild(document.createTextNode(String(rank)));
      }
      row.appendChild(rankCol);
      
      // 이름 및 국적
      const nameWrap = el('div', { style: `font-weight:${isMe ? '800' : '600'}; font-size:0.95rem; color:${isMe ? 'var(--primary-dark)' : 'var(--text)'}; display:flex; align-items:center; flex-wrap:wrap; gap:4px;` });
      nameWrap.appendChild(document.createTextNode(c.name));
      if (c.nationality) {
        const flag = el('span', { style: 'font-size:0.75rem; color:#64748b; background:#e2e8f0; padding:1px 6px; border-radius:10px;' }, c.nationality);
        nameWrap.appendChild(flag);
      }
      row.appendChild(nameWrap);
      
      // 레벨
      row.appendChild(el('div', { style: 'font-size:0.85rem; font-weight:700; color:#5b21b6; text-align:center;' }, `Lv.${c.stats.level || 1}`));
      
      // XP
      const xpCol = el('div', { style: 'font-size:0.85rem; font-weight:700; color:#92400e; display:flex; align-items:center; gap:2px; justify-content:center;' });
      xpCol.appendChild(el('i', { 'data-lucide': 'sparkles', style: 'width:12px; height:12px; color:#f59e0b;' }));
      xpCol.appendChild(document.createTextNode(`${c.stats.xp || 0} XP`));
      row.appendChild(xpCol);
      
      // 불꽃(Streak)
      const streakCol = el('div', { style: 'font-size:0.85rem; font-weight:700; color:#991b1b; display:flex; align-items:center; gap:2px; justify-content:center;' });
      if ((c.stats.streak || 0) > 0) {
        streakCol.appendChild(el('i', { 'data-lucide': 'zap', style: 'width:12px; height:12px; color:#ef4444; fill:#ef4444;' }));
        streakCol.appendChild(document.createTextNode(`${c.stats.streak}일`));
      } else {
        streakCol.appendChild(document.createTextNode('-'));
      }
      row.appendChild(streakCol);
      
      table.appendChild(row);
    });
    
    leaderPanel.appendChild(table);
    root.appendChild(leaderPanel);
  }

  return root;
}

function renderStudentUnit() {
  const unit = state.units.find(u => u.id === state.currentUnitId);
  if (!unit) { state.view = 'student'; render(); return el('div'); }
  if (!unit.quizzes) unit.quizzes = [];
  const root = el('div');

  // 문법 설명 패널 (활동 목록보다 먼저 표시)
  if (unit.grammar.length > 0) {
    const grPanel = el('div', { class: 'panel student-grammar-panel' });
    
    const grTitle = el('h3', { style: 'margin-bottom:14px; display:flex; align-items:center; gap:8px' });
    grTitle.appendChild(el('i', { 'data-lucide': 'book-open', style: 'width:20px; height:20px; color:var(--primary);' }));
    grTitle.appendChild(document.createTextNode('오늘의 문법'));
    grPanel.appendChild(grTitle);
    
    unit.grammar.forEach(g => {
      const card = el('div', { class: 'student-grammar-card' });
      card.appendChild(el('div', { class: 'student-grammar-pattern' }, g.pattern));
      const expl = getTranslation(g.explanation);
      if (expl) card.appendChild(el('div', { class: 'student-grammar-explanation' }, expl));
      if (g.examples && g.examples.length > 0) {
        const exList = el('div', { class: 'student-grammar-examples' });
        g.examples.forEach(ex => {
          const item = el('div', { class: 'student-grammar-example' });
          item.appendChild(el('div', { class: 'ko' }, ex.ko));
          const trans = ex[state.language] || ex.en;
          if (trans) item.appendChild(el('div', { class: 'trans' }, trans));
          exList.appendChild(item);
        });
        card.appendChild(exList);
      }
      grPanel.appendChild(card);
    });
    root.appendChild(grPanel);
  }

  const panel = el('div', { class: 'panel' });
  panel.appendChild(el('button', { class: 'back-btn', onClick: () => { state.view = 'student'; render(); }}, '← 단원 목록'));
  panel.appendChild(el('h2', { style: 'margin-top:10px' }, unit.title));
  
  const descEl = el('p', { class: 'text-muted', style: 'margin-bottom:14px; display:flex; align-items:center; gap:4px' });
  descEl.appendChild(document.createTextNode('활동을 선택하세요. 게임마다 최고 점수가 기록됩니다 '));
  descEl.appendChild(el('i', { 'data-lucide': 'trophy', style: 'width:14px; height:14px; color:#f59e0b;' }));
  panel.appendChild(descEl);

  if (unit.vocabulary.length > 0) {
    const vocabTitle = el('h3', { style: 'margin-top:12px; display:flex; align-items:center; gap:6px' });
    vocabTitle.appendChild(el('i', { 'data-lucide': 'book', style: 'width:18px; height:18px; color:var(--primary);' }));
    vocabTitle.appendChild(document.createTextNode('어휘'));
    panel.appendChild(vocabTitle);
    
    const vg = el('div', { class: 'activity-grid' });
    ['flashcard', 'quiz', 'matching', 'linematch', 'dictation'].forEach(act => {
      if (act !== 'flashcard' && act !== 'dictation' && unit.vocabulary.length < 4) return;
      vg.appendChild(makeActivityTile(act, unit.id, 'vocab'));
    });
    panel.appendChild(vg);
  }

  if (unit.grammar.length > 0) {
    const grammarTitle = el('h3', { style: 'margin-top:18px; display:flex; align-items:center; gap:6px' });
    grammarTitle.appendChild(el('i', { 'data-lucide': 'book-open', style: 'width:18px; height:18px; color:var(--primary);' }));
    grammarTitle.appendChild(document.createTextNode('문법'));
    panel.appendChild(grammarTitle);
    
    const gg = el('div', { class: 'activity-grid' });
    ['fillblank', 'sentorder', 'oxquiz'].forEach(act => {
      gg.appendChild(makeActivityTile(act, unit.id, 'grammar'));
    });
    panel.appendChild(gg);
  }

  if (unit.quizzes.length > 0) {
    const quizTitle = el('h3', { style: 'margin-top:18px; display:flex; align-items:center; gap:6px' });
    quizTitle.appendChild(el('i', { 'data-lucide': 'file-text', style: 'width:18px; height:18px; color:var(--primary);' }));
    quizTitle.appendChild(document.createTextNode('학습지 퀴즈'));
    panel.appendChild(quizTitle);
    
    const qg = el('div', { class: 'activity-grid' });
    qg.appendChild(makeActivityTile('pdfquiz', unit.id, 'pdfquiz'));
    panel.appendChild(qg);
  }

  root.appendChild(panel);
  return root;
}

function makeActivityTile(act, unitId, cls) {
  const a = ACTIVITIES[act];
  const best = getBestScore(unitId, act);
  const tile = el('div', { class: `activity-tile ${cls}`, onClick: () => startActivity(act) });
  tile.innerHTML = `<div class="icon"><i data-lucide="${a.icon}"></i></div><div class="name">${a.name}</div>` + (best > 0 ? `<div class="best">최고 ${best}점</div>` : '');
  return tile;
}

function startActivity(activity) {
  state.currentActivity = activity;
  state.view = 'student-activity';
  state.stats.streak = 0;
  initGame(activity);
  render();
}

/* =========================================================
   GAMES GAMEPLAY ENGINE
   ========================================================= */
function initGame(activity) {
  const unit = state.units.find(u => u.id === state.currentUnitId);
  state.game = { activity, unit, score: 0, combo: 0, maxCombo: 0, correct: 0, wrong: 0, index: 0, total: 0 };
  const g = state.game;

  if (activity === 'flashcard') {
    g.cards = shuffle(unit.vocabulary);
    g.total = g.cards.length;
    g.flipped = false;
  } else if (activity === 'quiz') {
    g.questions = generateQuizQuestions(unit.vocabulary);
    g.total = g.questions.length;
    g.timeLeft = 10;
  } else if (activity === 'matching') {
    g.pairs = unit.vocabulary.slice(0, 6);
    g.matched = new Set();
    g.selected = [];
    g.total = g.pairs.length;
  } else if (activity === 'linematch') {
    const vocab = shuffle(unit.vocabulary.slice()).slice(0, Math.min(6, unit.vocabulary.length));
    g.vocab = vocab;
    g.leftItems  = shuffle(vocab.map(v => ({ id: v.word, text: v.word })));
    g.rightItems = shuffle(vocab.map(v => ({ id: v.word, text: getTranslation(v.translations) })));
    g.connections = [];   // { id, leftEl, rightEl, lineEl }
    g.selectedLeft  = null;
    g.selectedRight = null;
    g.total = vocab.length;
    g.wrong = 0;
  } else if (activity === 'dictation') {
    g.cards = shuffle(unit.vocabulary.slice());
    g.total = g.cards.length;
    g.answer = '';
    g.revealed = false;
  } else if (activity === 'fillblank') {
    g.questions = generateFillBlankQuestions(unit);
    g.total = g.questions.length;
  } else if (activity === 'sentorder') {
    g.questions = generateSentenceOrderQuestions(unit);
    g.total = g.questions.length;
    g.initialized = false;
  } else if (activity === 'oxquiz') {
    g.questions = generateOXQuestions(unit);
    g.total = g.questions.length;
  } else if (activity === 'pdfquiz') {
    g.questions = shuffle((unit.quizzes || []).slice());
    g.total = g.questions.length;
  }
}

function generateQuizQuestions(vocab) {
  return shuffle(vocab).slice(0, Math.min(10, vocab.length)).map(v => {
    const wrongs = shuffle(vocab.filter(x => x.word !== v.word)).slice(0, 3);
    return { target: v, options: shuffle([v, ...wrongs]) };
  });
}

function findPatternBlankIdx(words, pattern) {
  const core = pattern.replace(/^[~\-]/, '').replace(/\s*\(.*\)/, '').split('/')[0].trim();
  if (core.length >= 2) {
    const idx = words.findIndex(w => w.replace(/[.,!?]/, '').endsWith(core));
    if (idx >= 0) return idx;
  }
  return Math.floor(words.length / 2);
}

function generateFillBlankQuestions(unit) {
  const qs = [];
  unit.grammar.forEach(g => {
    (g.examples || []).forEach(ex => {
      const words = ex.ko.split(' ');
      if (words.length < 2) return;
      const idx = findPatternBlankIdx(words, g.pattern);
      const answer = words[idx].replace(/[.,!?]/g, '');
      if (!answer) return;
      const display = words.map((w, i) => i === idx ? '___' : w).join(' ');
      const allWords = [];
      unit.grammar.forEach(gg => (gg.examples || []).forEach(e => e.ko.split(' ').forEach(w => {
        const cleaned = w.replace(/[.,!?]/g, '');
        if (cleaned && cleaned !== answer && cleaned.length > 0) allWords.push(cleaned);
      })));
      const distractors = shuffle([...new Set(allWords)]).slice(0, 3);
      while (distractors.length < 3) distractors.push('???' + distractors.length);
      const options = shuffle([answer, ...distractors]);
      qs.push({ display, answer, options, en: ex.en });
    });
  });
  return shuffle(qs).slice(0, Math.min(8, qs.length));
}

function generateSentenceOrderQuestions(unit) {
  const qs = [];
  unit.grammar.forEach(g => {
    (g.examples || []).forEach(ex => {
      const words = ex.ko.split(' ');
      if (words.length >= 3) qs.push({ words, original: ex.ko, en: ex.en });
    });
  });
  return shuffle(qs).slice(0, Math.min(6, qs.length));
}

function generateOXQuestions(unit) {
  const qs = [];
  unit.grammar.forEach(g => {
    (g.examples || []).forEach(ex => {
      qs.push({ sentence: ex.ko, en: ex.en, correct: true });
      const words = ex.ko.split(' ');
      if (words.length >= 2) {
        const shuffled = shuffle([...words]).join(' ');
        if (shuffled !== ex.ko) qs.push({ sentence: shuffled, en: ex.en, correct: false });
      }
    });
  });
  return shuffle(qs).slice(0, Math.min(8, qs.length));
}

function renderStudentActivity() {
  const root = el('div');
  const gh = el('div', { class: 'game-header' });
  gh.appendChild(el('button', { class: 'back-btn', onClick: exitGame }, '✕ 종료'));
  const progress = el('div', { class: 'game-progress' });
  const pct = state.game.total ? Math.min(100, (state.game.index / state.game.total) * 100) : 0;
  progress.appendChild(el('div', { class: 'game-progress-bar', style: `width:${pct}%` }));
  gh.appendChild(progress);
  gh.appendChild(el('div', { class: 'game-info' }, `${state.game.index}/${state.game.total} · ${state.game.score}점`));
  if (state.game.combo >= 3) gh.appendChild(el('div', { class: 'combo-display' }, `🔥 ${state.game.combo}x`));
  if (state.currentStudent) {
    gh.appendChild(el('div', { style: 'background:#ede9fe; color:#5b21b6; border-radius:20px; padding:4px 14px; font-weight:700; font-size:0.95rem; margin-top:6px; text-align:center' }, `🧑‍🎓 ${state.currentStudent}`));
  }
  root.appendChild(gh);

  const map = {
    flashcard: renderFlashcardGame, quiz: renderQuizGame, matching: renderMatchingGame,
    linematch: renderLineMatchGame, dictation: renderDictationGame,
    fillblank: renderFillBlankGame, sentorder: renderSentenceOrderGame, oxquiz: renderOXGame,
    pdfquiz: renderPdfQuizGame
  };
  if (map[state.currentActivity]) root.appendChild(map[state.currentActivity]());
  return root;
}

async function exitGame() {
  const ok = await showConfirm('게임 종료', '정말 종료하시겠습니까?\n\n진행 상황은 저장되지 않습니다.', true);
  if (!ok) return;
  state.view = 'student-unit';
  state.game = null;
  state.stats.streak = 0;
  persistStudent();
  render();
}

/* ---------- Flashcard ---------- */
function renderFlashcardGame() {
  const g = state.game;
  const card = g.cards[g.index];
  if (!card) { showResult(); return el('div'); }
  const root = el('div');
  const area = el('div', { class: 'fc-area' + (g.flipped ? ' flipped' : '') });
  const inner = el('div', { class: 'fc-inner' });
  const front = el('div', { class: 'fc-face' });
  front.appendChild(el('div', { class: 'fc-emoji' }, card.emoji));
  front.appendChild(el('div', { class: 'fc-word' }, card.word));
  front.appendChild(el('div', { class: 'fc-roman' }, card.romanization || ''));
  
  const back = el('div', { class: 'fc-face fc-back' });
  back.appendChild(el('div', { class: 'fc-meaning' }, getTranslation(card.translations)));
  back.appendChild(el('div', { class: 'fc-roman', style: 'margin-top:14px' }, `${card.word} · ${card.romanization || ''}`));
  inner.append(front, back);
  area.appendChild(inner);
  area.onclick = () => { g.flipped = !g.flipped; render(); };
  root.appendChild(area);

  const ctrl = el('div', { class: 'fc-controls' });
  
  const flipBtn = el('button', { class: 'btn btn-primary', style: 'display:inline-flex; align-items:center; justify-content:center; gap:6px', onClick: () => { g.flipped = !g.flipped; render(); } });
  flipBtn.appendChild(el('i', { 'data-lucide': 'refresh-cw', style: 'width:15px; height:15px; color:#fff;' }));
  flipBtn.appendChild(document.createTextNode('뒤집기'));
  ctrl.appendChild(flipBtn);
  
  const wrongBtn = el('button', { class: 'btn btn-danger', style: 'display:inline-flex; align-items:center; justify-content:center; gap:6px', onClick: () => { g.wrong++; g.combo = 0; nextFC(); } });
  wrongBtn.appendChild(el('i', { 'data-lucide': 'x', style: 'width:15px; height:15px; color:#fff;' }));
  wrongBtn.appendChild(document.createTextNode('몰라요'));
  ctrl.appendChild(wrongBtn);
  
  const rightBtn = el('button', { class: 'btn btn-success', style: 'display:inline-flex; align-items:center; justify-content:center; gap:6px', onClick: () => { g.correct++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); g.score += 10 + g.combo * 2; addXP(5); state.stats.streak++; nextFC(); } });
  rightBtn.appendChild(el('i', { 'data-lucide': 'check', style: 'width:15px; height:15px; color:#fff;' }));
  rightBtn.appendChild(document.createTextNode('알아요'));
  ctrl.appendChild(rightBtn);
  
  root.appendChild(ctrl);
  return root;
}
function nextFC() {
  state.game.index++;
  state.game.flipped = false;
  if (state.game.index >= state.game.total) showResult(); else render();
}

/* ---------- Quiz ---------- */
function renderQuizGame() {
  const g = state.game;
  const q = g.questions[g.index];
  if (!q) { showResult(); return el('div'); }
  const root = el('div');
  const tbar = el('div', { class: 'quiz-timer-bar' });
  tbar.innerHTML = '<div class="quiz-timer-fill" id="qtfill" style="width:100%"></div>';
  root.appendChild(tbar);

  const qbox = el('div', { class: 'quiz-question' });
  qbox.appendChild(el('div', { class: 'quiz-emoji' }, q.target.emoji));
  qbox.appendChild(el('div', { class: 'quiz-word' }, q.target.word));
  qbox.appendChild(el('div', { class: 'quiz-prompt' }, q.target.romanization || ''));
  root.appendChild(qbox);

  const opts = el('div', { class: 'quiz-options', id: 'quizopts' });
  q.options.forEach(opt => {
    opts.appendChild(el('button', { class: 'quiz-option', onClick: () => answerQuiz(opt, q) }, getTranslation(opt.translations)));
  });
  root.appendChild(opts);
  startQuizTimer();
  return root;
}
function startQuizTimer() {
  const g = state.game;
  if (g.timerInt) clearInterval(g.timerInt);
  g.timeLeft = 10;
  g.timerInt = setInterval(() => {
    g.timeLeft -= 0.1;
    const fill = $('#qtfill');
    if (fill) fill.style.width = (g.timeLeft / 10 * 100) + '%';
    if (g.timeLeft <= 0) { clearInterval(g.timerInt); answerQuiz(null, g.questions[g.index]); }
  }, 100);
}
function answerQuiz(selected, q) {
  const g = state.game;
  clearInterval(g.timerInt);
  const correct = selected && selected.word === q.target.word;
  document.querySelectorAll('#quizopts .quiz-option').forEach(b => {
    b.disabled = true;
    if (b.textContent === getTranslation(q.target.translations)) b.classList.add('correct');
    if (selected && b.textContent === getTranslation(selected.translations) && !correct) b.classList.add('wrong');
  });
  if (correct) {
    const points = 10 + Math.round(g.timeLeft * 2) + g.combo * 3;
    g.score += points; g.correct++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo);
    addXP(10); state.stats.streak++;
    toast(`+${points}점`, 'success');
  } else {
    g.wrong++; g.combo = 0; state.stats.streak = 0;
    toast('아쉬워요', 'danger');
  }
  setTimeout(() => { g.index++; if (g.index >= g.total) showResult(); else render(); }, 1400);
}

/* ---------- Matching ---------- */
function renderMatchingGame() {
  const g = state.game;
  const root = el('div');
  if (!g.cards) {
    const cards = [];
    g.pairs.forEach((v, i) => {
      cards.push({ id: 'ko_' + i, pair: i, text: v.word, type: 'ko', emoji: v.emoji });
      cards.push({ id: 'tr_' + i, pair: i, text: getTranslation(v.translations), type: 'tr' });
    });
    g.cards = shuffle(cards);
  }
  const grid = el('div', { class: 'match-grid' });
  g.cards.forEach(c => {
    const isMatched = g.matched.has(c.pair);
    const isSelected = g.selected.includes(c);
    const cls = 'match-card' + (isMatched ? ' matched' : '') + (isSelected ? ' selected' : '');
    const tile = el('div', { class: cls, onClick: () => selectMatchCard(c) });
    tile.innerHTML = c.type === 'ko' ? `<div><div style="font-size:1.4rem">${c.emoji}</div><div style="margin-top:4px">${c.text}</div></div>` : c.text;
    grid.appendChild(tile);
  });
  root.appendChild(grid);
  root.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; margin-top:14px' }, `${g.matched.size}/${g.pairs.length} 쌍 완료`));
  return root;
}
function selectMatchCard(c) {
  const g = state.game;
  if (g.matched.has(c.pair) || g.selected.includes(c) || g.selected.length >= 2) return;

  g.selected.push(c);
  if (g.selected.length === 2) {
    const [a, b] = g.selected;
    if (a.pair === b.pair && a.type !== b.type) {
      g.matched.add(a.pair);
      g.score += 20 + g.combo * 5; g.combo++; g.correct++; g.maxCombo = Math.max(g.maxCombo, g.combo);
      addXP(15); state.stats.streak++;
      g.selected = [];
      toast(`매칭! +${20 + g.combo * 5}`, 'success');
      if (g.matched.size === g.pairs.length) { setTimeout(showResult, 600); return; }
      render();
    } else {
      g.wrong++; g.combo = 0; state.stats.streak = 0;
      document.querySelectorAll('.match-card.selected').forEach(el => el.classList.add('wrong'));
      setTimeout(() => { g.selected = []; render(); }, 700);
    }
  } else render();
}

/* ---------- TTS 발음 엔진 (Web Speech + Google Translate 폴백) ---------- */
function speakKorean(word) {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(word);
      utt.lang = 'ko-KR';
      utt.rate = 0.85;
      const voices = window.speechSynthesis.getVoices();
      const ko = voices.find(v => v.lang.startsWith('ko'));
      if (ko) utt.voice = ko;
      utt.onerror = () => ttsGoogleFallback(word);
      let t = setTimeout(() => {
        if (!window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); ttsGoogleFallback(word); }
      }, 1200);
      utt.onstart = () => clearTimeout(t);
      window.speechSynthesis.speak(utt);
      return;
    } catch (e) {}
  }
  ttsGoogleFallback(word);
}
function ttsGoogleFallback(word) {
  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encodeURIComponent(word)}`;
    new Audio(url).play().catch(() => {});
  } catch (e) {}
}

/* ---------- SVG 선잇기 ---------- */
function renderLineMatchGame() {
  const g = state.game;
  const root = el('div');

  if (g.connections.length === g.total) { showResult(); return el('div'); }

  // wrap: flex row로 두 컬럼을 나란히 배치, SVG는 absolute로 그 위에 덮음
  const wrap = el('div', { style: 'position:relative; display:flex; flex-direction:row; gap:0; align-items:flex-start' });
  wrap.id = 'lm-wrap';

  // SVG 오버레이
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.id = 'lm-svg';
  svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1';
  wrap.appendChild(svg);

  const leftCol  = el('div', { style: 'flex:1;z-index:2;display:flex;flex-direction:column;gap:10px;position:relative' });
  const rightCol = el('div', { style: 'flex:1;z-index:2;display:flex;flex-direction:column;gap:10px;position:relative' });

  const ITEM_MIN_H = '52px'; // 좌우 높이 통일
  const makeItem = (item, side) => {
    const alreadyMatched = g.connections.some(c => c.id === item.id);
    const div = el('div', {
      class: 'lm-item' + (alreadyMatched ? ' lm-matched' : ''),
      style: `cursor:${alreadyMatched ? 'default' : 'pointer'};min-height:${ITEM_MIN_H};justify-content:${side === 'left' ? 'space-between' : 'flex-start'}`,
      onClick: () => {
        if (alreadyMatched) return;
        if (side === 'left') {
          document.querySelectorAll('.lm-item.lm-selected-left').forEach(e => e.classList.remove('lm-selected-left'));
          div.classList.toggle('lm-selected-left');
          g.selectedLeft = div.classList.contains('lm-selected-left') ? item : null;
        } else {
          document.querySelectorAll('.lm-item.lm-selected-right').forEach(e => e.classList.remove('lm-selected-right'));
          div.classList.toggle('lm-selected-right');
          g.selectedRight = div.classList.contains('lm-selected-right') ? item : null;
        }
        tryLineMatch(g);
      }
    });
    div.dataset.id  = item.id;
    div.dataset.side = side;

    if (side === 'left') {
      div.appendChild(document.createTextNode(item.text));
      const dot = el('span', { class: 'lm-dot lm-dot-right' });
      div.appendChild(dot);
    } else {
      const dot = el('span', { class: 'lm-dot lm-dot-left' });
      div.appendChild(dot);
      div.appendChild(document.createTextNode(item.text));
    }
    return div;
  };

  g.leftItems.forEach(item  => leftCol.appendChild(makeItem(item, 'left')));
  g.rightItems.forEach(item => rightCol.appendChild(makeItem(item, 'right')));

  wrap.appendChild(leftCol);
  wrap.appendChild(rightCol);
  root.appendChild(wrap);

  // 기존 연결선 복원
  setTimeout(() => {
    g.connections.forEach(conn => drawSVGLine(conn.leftEl, conn.rightEl, true));
  }, 50);

  root.appendChild(el('p', { class: 'text-muted', style: 'text-align:center;margin-top:12px' },
    `${g.connections.length}/${g.total} 완료`));
  return root;
}

function tryLineMatch(g) {
  if (!g.selectedLeft || !g.selectedRight) return;
  const lEl = document.querySelector(`.lm-item[data-id="${g.selectedLeft.id}"][data-side="left"]`);
  const rEl = document.querySelector(`.lm-item[data-id="${g.selectedRight.id}"][data-side="right"]`);
  if (!lEl || !rEl) return;

  if (g.selectedLeft.id === g.selectedRight.id) {
    // 정답
    lEl.classList.remove('lm-selected-left'); lEl.classList.add('lm-matched');
    rEl.classList.remove('lm-selected-right'); rEl.classList.add('lm-matched');
    const line = drawSVGLine(lEl, rEl, true);
    g.connections.push({ id: g.selectedLeft.id, leftEl: lEl, rightEl: rEl, lineEl: line });
    g.score += 20 + g.combo * 5; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); g.correct++;
    addXP(15); state.stats.streak++;
    const vocab = g.vocab.find(v => v.word === g.selectedLeft.id);
    if (vocab) speakKorean(vocab.word);
    toast(`연결! +${20 + g.combo * 5}`, 'success');
    if (g.connections.length === g.total) { setTimeout(showResult, 700); return; }
  } else {
    // 오답
    lEl.classList.add('lm-wrong'); rEl.classList.add('lm-wrong');
    const tmpLine = drawSVGLine(lEl, rEl, false);
    g.wrong++; g.combo = 0; state.stats.streak = 0;
    toast('틀렸습니다!', 'danger');
    setTimeout(() => {
      lEl.classList.remove('lm-wrong', 'lm-selected-left');
      rEl.classList.remove('lm-wrong', 'lm-selected-right');
      if (tmpLine) tmpLine.remove();
    }, 600);
  }
  g.selectedLeft = null; g.selectedRight = null;
  // progress 업데이트를 위해 re-render (선 유지)
  const prog = document.querySelector('[class="text-muted"]');
  if (prog) prog.textContent = `${g.connections.length}/${g.total} 완료`;
  if (window.lucide) window.lucide.createIcons();
}

function drawSVGLine(leftEl, rightEl, isPermanent) {
  const svg  = document.getElementById('lm-svg');
  const wrap = document.getElementById('lm-wrap');
  if (!svg || !wrap) return null;
  const wr   = wrap.getBoundingClientRect();
  const lDot = leftEl.querySelector('.lm-dot-right');
  const rDot = rightEl.querySelector('.lm-dot-left');
  if (!lDot || !rDot) return null;
  const lr = lDot.getBoundingClientRect();
  const rr = rDot.getBoundingClientRect();
  const x1 = lr.left + lr.width / 2 - wr.left;
  const y1 = lr.top  + lr.height / 2 - wr.top;
  const x2 = rr.left + rr.width / 2 - wr.left;
  const y2 = rr.top  + rr.height / 2 - wr.top;
  const ns   = 'http://www.w3.org/2000/svg';
  const line = document.createElementNS(ns, 'line');
  line.setAttribute('x1', x1); line.setAttribute('y1', y1);
  line.setAttribute('x2', x2); line.setAttribute('y2', y2);
  line.setAttribute('stroke', isPermanent ? '#10b981' : '#f59e0b');
  line.setAttribute('stroke-width', isPermanent ? '3' : '2');
  if (!isPermanent) line.setAttribute('stroke-dasharray', '5');
  line.setAttribute('stroke-linecap', 'round');
  svg.appendChild(line);
  return line;
}

/* ---------- 받아쓰기 ---------- */
function renderDictationGame() {
  const g = state.game;
  const card = g.cards[g.index];
  if (!card) { showResult(); return el('div'); }

  const root = el('div');

  // 발음 버튼
  const audioBox = el('div', { style: 'text-align:center; margin-bottom:20px' });
  const speakBtn = el('button', { class: 'btn btn-primary', style: 'font-size:1.3rem; padding:14px 28px', onClick: () => speakKorean(card.word) }, '🔊 발음 듣기');
  audioBox.appendChild(speakBtn);
  audioBox.appendChild(el('p', { class: 'text-muted', style: 'margin-top:8px; font-size:0.9rem' }, '발음을 듣고 한국어를 받아 적으세요'));
  root.appendChild(audioBox);

  // 뜻 힌트
  const hint = getTranslation(card.translations);
  if (hint) root.appendChild(el('p', { style: 'text-align:center; color:var(--muted); font-size:0.95rem; margin-bottom:16px' }, `💡 ${hint}`));

  // 입력창
  const inputRow = el('div', { style: 'display:flex; gap:8px' });
  const inputEl = el('input', { type: 'text', id: 'dictation-input', placeholder: '한국어로 입력하세요', style: 'flex:1; font-size:1.1rem; padding:12px 14px; border:2px solid var(--border); border-radius:var(--radius-md); font-family:inherit' });
  inputEl.autocomplete = 'off';

  if (g.revealed) {
    inputEl.style.borderColor = g.lastCorrect ? '#10b981' : '#f43f5e';
    inputEl.disabled = true;
  }

  const submitBtn = el('button', { class: 'btn btn-primary', style: 'padding:12px 18px; font-size:1rem', onClick: () => checkDictation(g, card, inputEl) }, '제출');
  inputRow.append(inputEl, submitBtn);
  root.appendChild(inputRow);

  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') submitBtn.click(); });

  // 정답/오답 후 다음 버튼
  if (g.revealed) {
    const ans = el('div', { style: `margin-top:14px; padding:12px; border-radius:10px; background:${g.lastCorrect ? '#d1fae5' : '#fee2e2'}; text-align:center; font-weight:600` },
      g.lastCorrect ? '✅ 정답!' : `❌ 정답: ${card.word}`);
    root.appendChild(ans);
    const nextBtn = el('button', { class: 'btn btn-primary btn-block', style: 'margin-top:12px', onClick: () => {
      g.index++; g.revealed = false; g.answer = '';
      if (g.index >= g.total) showResult(); else render();
    }}, '다음 →');
    root.appendChild(nextBtn);
  }

  // 자동 발음
  if (!g.revealed) setTimeout(() => speakKorean(card.word), 300);

  return root;
}

function checkDictation(g, card, inputEl) {
  if (g.revealed) return;
  const userText = (inputEl.value || '').trim();
  if (!userText) { toast('답을 입력하세요', 'danger'); return; }
  const sanitize = t => t.replace(/[.,?!]/g, '').replace(/\s/g, '');
  const correct = sanitize(userText) === sanitize(card.word);
  g.revealed = true;
  g.lastCorrect = correct;
  if (correct) {
    g.score += 20 + g.combo * 3; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); g.correct++;
    addXP(12); state.stats.streak++;
    toast(`정답! +${20 + g.combo * 3}`, 'success');
  } else {
    g.wrong++; g.combo = 0; state.stats.streak = 0;
    toast(`오답 — 정답: ${card.word}`, 'danger');
  }
  render();
}

/* ---------- Fill in blank (MULTIPLE CHOICE - no typing!) ---------- */
function renderFillBlankGame() {
  const g = state.game;
  const q = g.questions[g.index];
  if (!q) { showResult(); return el('div'); }
  const root = el('div');
  const sentence = el('div', { class: 'quiz-question' });
  const sentenceDiv = el('div', { class: 'quiz-sentence' });
  q.display.split('___').forEach((part, i, arr) => {
    sentenceDiv.appendChild(document.createTextNode(part));
    if (i < arr.length - 1) sentenceDiv.appendChild(el('span', { class: 'quiz-blank' }, '___'));
  });
  sentence.appendChild(sentenceDiv);
  sentence.appendChild(el('div', { class: 'quiz-hint' }, `💡 ${q.en}`));
  root.appendChild(sentence);

  const opts = el('div', { class: 'quiz-options', id: 'fbopts' });
  q.options.forEach(opt => {
    opts.appendChild(el('button', { class: 'quiz-option', style: 'text-align:center', onClick: () => answerFillBlank(opt, q) }, opt));
  });
  root.appendChild(opts);
  return root;
}
function answerFillBlank(selected, q) {
  const g = state.game;
  const correct = selected === q.answer;
  document.querySelectorAll('#fbopts .quiz-option').forEach(b => {
    b.disabled = true;
    if (b.textContent === q.answer) b.classList.add('correct');
    if (b.textContent === selected && !correct) b.classList.add('wrong');
  });
  if (correct) {
    const points = 15 + g.combo * 3;
    g.score += points; g.correct++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo);
    addXP(12); state.stats.streak++;
    toast(`정답! +${points}`, 'success');
  } else {
    g.wrong++; g.combo = 0; state.stats.streak = 0;
    toast(`오답: ${q.answer}`, 'danger');
  }
  setTimeout(() => { g.index++; if (g.index >= g.total) showResult(); else render(); }, 1500);
}

/* ---------- Sentence order ---------- */
function renderSentenceOrderGame() {
  const g = state.game;
  const q = g.questions[g.index];
  if (!q) { showResult(); return el('div'); }
  if (!g.initialized) { g.bank = shuffle(q.words.map((w, i) => ({ w, i }))); g.placed = []; g.initialized = true; }
  const root = el('div');
  root.appendChild(el('p', { class: 'quiz-hint', style: 'background:#fff; padding:14px; border-radius:12px; margin-bottom:14px; font-size:1.05rem' }, '💡 ' + q.en));

  const target = el('div', { class: 'so-target' });
  if (g.placed.length === 0) target.appendChild(el('span', { class: 'text-muted' }, '아래 단어를 순서대로 클릭하세요'));
  g.placed.forEach((p, i) => target.appendChild(el('div', { class: 'so-word', onClick: () => { g.placed.splice(i, 1); render(); }}, p.w)));
  root.appendChild(target);

  const bank = el('div', { class: 'so-bank' });
  g.bank.forEach(b => {
    const used = g.placed.includes(b);
    bank.appendChild(el('div', { class: 'so-word' + (used ? ' used' : ''), onClick: () => { if (!used) { g.placed.push(b); render(); }}}, b.w));
  });
  root.appendChild(bank);
  
  const submitBtn = el('button', { class: 'btn btn-primary btn-block btn-lg', style: 'margin-top:14px; display:flex; align-items:center; justify-content:center; gap:6px;', onClick: submitSO });
  submitBtn.appendChild(el('i', { 'data-lucide': 'check', style: 'width:18px; height:18px; color:#fff;' }));
  submitBtn.appendChild(document.createTextNode('제출'));
  root.appendChild(submitBtn);
  
  return root;
}
function submitSO() {
  const g = state.game;
  const q = g.questions[g.index];
  const made = g.placed.map(p => p.w).join(' ');
  const correct = made === q.original;
  if (correct) {
    const points = 25 + g.combo * 5;
    g.score += points; g.correct++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo);
    addXP(18); state.stats.streak++;
    toast(`완벽! +${points}`, 'success');
  } else {
    g.wrong++; g.combo = 0; state.stats.streak = 0;
    toast(`오답: ${q.original}`, 'danger');
  }
  setTimeout(() => { g.index++; g.initialized = false; if (g.index >= g.total) showResult(); else render(); }, 1800);
}

/* ---------- OX ---------- */
function renderOXGame() {
  const g = state.game;
  const q = g.questions[g.index];
  if (!q) { showResult(); return el('div'); }
  const root = el('div');
  const box = el('div', { class: 'ox-sentence' });
  box.appendChild(el('div', {}, q.sentence));
  box.appendChild(el('div', { class: 'text-muted', style: 'margin-top:10px; font-size:0.95rem' }, `힌트: ${q.en}`));
  root.appendChild(box);
  
  const btns = el('div', { class: 'ox-buttons' });
  
  const oBtn = el('button', { class: 'ox-btn o', style: 'display:flex; align-items:center; justify-content:center;', onClick: () => answerOX(true, q) });
  oBtn.appendChild(el('i', { 'data-lucide': 'check', style: 'width:48px; height:48px; color:#fff;' }));
  btns.appendChild(oBtn);
  
  const xBtn = el('button', { class: 'ox-btn x', style: 'display:flex; align-items:center; justify-content:center;', onClick: () => answerOX(false, q) });
  xBtn.appendChild(el('i', { 'data-lucide': 'x', style: 'width:48px; height:48px; color:#fff;' }));
  btns.appendChild(xBtn);
  
  root.appendChild(btns);
  return root;
}
function answerOX(userAns, q) {
  const g = state.game;
  const correct = userAns === q.correct;
  if (correct) {
    const points = 12 + g.combo * 3;
    g.score += points; g.correct++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo);
    addXP(8); state.stats.streak++;
    toast(`정답! +${points}`, 'success');
  } else {
    g.wrong++; g.combo = 0; state.stats.streak = 0;
    toast(q.correct ? '정답은 O입니다!' : '정답은 X입니다!', 'danger');
  }
  setTimeout(() => { g.index++; if (g.index >= g.total) showResult(); else render(); }, 1300);
}

/* ---------- PDF Quiz (multiple choice from PDF) ---------- */
function renderPdfQuizGame() {
  const g = state.game;
  const q = g.questions[g.index];
  if (!q) { showResult(); return el('div'); }
  const root = el('div');

  const sentence = el('div', { class: 'quiz-question' });
  const pdfSentDiv = el('div', { class: 'quiz-sentence' });
  q.question.split(/_+/).forEach((part, i, arr) => {
    pdfSentDiv.appendChild(document.createTextNode(part));
    if (i < arr.length - 1) pdfSentDiv.appendChild(el('span', { class: 'quiz-blank' }, '___'));
  });
  sentence.appendChild(pdfSentDiv);
  const hint = getTranslation(q.hint, '');
  if (hint) sentence.appendChild(el('div', { class: 'quiz-hint' }, `💡 ${hint}`));
  root.appendChild(sentence);

  const opts = el('div', { class: 'quiz-options', id: 'pdfopts' });
  q.options.forEach((opt, i) => {
    opts.appendChild(el('button', { class: 'quiz-option', style: 'text-align:center; font-size:1.15rem', onClick: () => answerPdfQuiz(i, q) }, opt));
  });
  root.appendChild(opts);
  return root;
}
function answerPdfQuiz(idx, q) {
  const g = state.game;
  const correct = idx === q.correct;
  document.querySelectorAll('#pdfopts .quiz-option').forEach((b, i) => {
    b.disabled = true;
    if (i === q.correct) b.classList.add('correct');
    if (i === idx && !correct) b.classList.add('wrong');
  });
  if (correct) {
    const points = 20 + g.combo * 4;
    g.score += points; g.correct++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo);
    addXP(15); state.stats.streak++;
    toast(`정답! +${points}`, 'success');
  } else {
    g.wrong++; g.combo = 0; state.stats.streak = 0;
    toast(`오답: ${q.options[q.correct]}`, 'danger');
  }
  setTimeout(() => { g.index++; if (g.index >= g.total) showResult(); else render(); }, 1700);
}

/* =========================================================
   RESULT SCREEN
   ========================================================= */
function showResult() {
  const g = state.game;
  const total = g.correct + g.wrong;
  const percent = total > 0 ? Math.round((g.correct / total) * 100) : 0;
  const stars = calcStars(percent);
  recordBestScore(g.unit.id, g.activity, g.score);
  const newBadges = checkBadges({ perfectScore: percent === 100, streak: g.maxCombo });
  g.finalStars = stars; g.finalPercent = percent; g.newBadges = newBadges;
  persistAll(true);
  state.view = 'student-result';
  render();
}

function renderStudentResult() {
  const g = state.game;
  const root = el('div');
  const card = el('div', { class: 'result-card' });
  
  const iconWrapper = el('div', { class: 'icon', style: 'margin-bottom:14px; display:flex; justify-content:center; align-items:center;' });
  let iconName = 'frown';
  let iconColor = 'var(--muted)';
  if (g.finalStars >= 3) { iconName = 'trophy'; iconColor = '#f59e0b'; }
  else if (g.finalStars >= 2) { iconName = 'award'; iconColor = '#4f46e5'; }
  else if (g.finalStars >= 1) { iconName = 'medal'; iconColor = '#10b981'; }
  
  iconWrapper.appendChild(el('i', { 'data-lucide': iconName, style: `width:64px; height:64px; color:${iconColor};` }));
  card.appendChild(iconWrapper);

  const title = g.finalStars >= 3 ? '완벽해요!' : g.finalStars >= 2 ? '잘했어요!' : g.finalStars >= 1 ? '좋아요!' : '다시 도전!';
  card.appendChild(el('div', { class: 'title' }, title));
  card.appendChild(el('div', { class: 'text-muted' }, `${ACTIVITIES[g.activity].name} 완료`));

  const stars = el('div', { class: 'stars', style: 'display:flex; justify-content:center; gap:8px; margin: 14px 0;' });
  for (let i = 0; i < 3; i++) {
    const isFilled = i < g.finalStars;
    stars.appendChild(el('i', {
      'data-lucide': 'star',
      class: isFilled ? 'filled' : 'empty',
      style: `width:32px; height:32px; ${isFilled ? 'fill:var(--accent); color:var(--accent);' : 'fill:transparent; color:#cbd5e1;'}`
    }));
  }
  card.appendChild(stars);

  const stats = el('div', { class: 'result-stats' });
  [['점수', g.score], ['정답률', g.finalPercent + '%'], ['최고 콤보', g.maxCombo + 'x']].forEach(([l, v]) => {
    const s = el('div', { class: 'result-stat' });
    s.innerHTML = `<div class="val">${v}</div><div class="lbl">${l}</div>`;
    stats.appendChild(s);
  });
  card.appendChild(stats);

  (g.newBadges || []).forEach(b => {
    const badgeDiv = el('div', { class: 'badge-earned', style: 'display:flex; align-items:center; justify-content:center; gap:6px; margin: 14px 0;' });
    badgeDiv.appendChild(el('i', { 'data-lucide': 'award', style: 'width:18px; height:18px; color:#92400e;' }));
    badgeDiv.appendChild(document.createTextNode(b.name));
    card.appendChild(badgeDiv);
  });

  const actions = el('div', { style: 'display:flex; gap:10px; margin-top:14px' });
  
  const toUnitBtn = el('button', { class: 'btn btn-ghost', style: 'flex:1; display:inline-flex; align-items:center; justify-content:center; gap:6px', onClick: () => { state.view = 'student-unit'; render(); } });
  toUnitBtn.appendChild(el('i', { 'data-lucide': 'book', style: 'width:15px; height:15px;' }));
  toUnitBtn.appendChild(document.createTextNode('단원으로'));
  actions.appendChild(toUnitBtn);
  
  const retryBtn = el('button', { class: 'btn btn-primary', style: 'flex:1; display:inline-flex; align-items:center; justify-content:center; gap:6px', onClick: () => startActivity(g.activity) });
  retryBtn.appendChild(el('i', { 'data-lucide': 'refresh-cw', style: 'width:15px; height:15px; color:#fff;' }));
  retryBtn.appendChild(document.createTextNode('다시'));
  actions.appendChild(retryBtn);
  
  card.appendChild(actions);
  root.appendChild(card);
  return root;
}

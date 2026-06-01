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
  panel.appendChild(el('h2', { style: 'margin-top:10px' }, '🧑‍🎓 학생 선택'));
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
      card.appendChild(el('div', { class: 'icon' }, '🧑‍🎓'));
      card.appendChild(el('h3', {}, name));
      grid.appendChild(card);
    });
    panel.appendChild(grid);
  }

  panel.appendChild(el('button', {
    class: 'btn btn-ghost btn-block',
    style: 'margin-top:16px',
    onClick: () => enterStudent('게스트')
  }, '👤 게스트로 시작'));

  root.appendChild(panel);
  return root;
}

function renderStudent() {
  if (!state.currentStudent) { state.view = 'student-select'; render(); return el('div'); }
  const root = el('div');
  const panel = el('div', { class: 'panel' });
  panel.appendChild(el('h2', {}, '📚 단원 선택 (Choose a Unit)'));
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
    grPanel.appendChild(el('h3', { style: 'margin-bottom:14px' }, '📖 오늘의 문법'));
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
  panel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:14px' }, '활동을 선택하세요. 게임마다 최고 점수가 기록됩니다 🏆'));

  if (unit.vocabulary.length > 0) {
    panel.appendChild(el('h3', { style: 'margin-top:12px' }, '📚 어휘'));
    const vg = el('div', { class: 'activity-grid' });
    ['flashcard', 'quiz', 'matching'].forEach(act => {
      if (act !== 'flashcard' && unit.vocabulary.length < 4) return;
      vg.appendChild(makeActivityTile(act, unit.id, 'vocab'));
    });
    panel.appendChild(vg);
  }

  if (unit.grammar.length > 0) {
    panel.appendChild(el('h3', { style: 'margin-top:18px' }, '📖 문법'));
    const gg = el('div', { class: 'activity-grid' });
    ['fillblank', 'sentorder', 'oxquiz'].forEach(act => {
      gg.appendChild(makeActivityTile(act, unit.id, 'grammar'));
    });
    panel.appendChild(gg);
  }

  if (unit.quizzes.length > 0) {
    panel.appendChild(el('h3', { style: 'margin-top:18px' }, '📝 학습지 퀴즈'));
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
  tile.innerHTML = `<div class="icon">${a.icon}</div><div class="name">${a.name}</div>` + (best > 0 ? `<div class="best">최고 ${best}점</div>` : '');
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
  ctrl.appendChild(el('button', { class: 'btn btn-primary', onClick: () => { g.flipped = !g.flipped; render(); }}, '🔄 뒤집기'));
  ctrl.appendChild(el('button', { class: 'btn btn-danger', onClick: () => { g.wrong++; g.combo = 0; nextFC(); }}, '❌ 몰라요'));
  ctrl.appendChild(el('button', { class: 'btn btn-success', onClick: () => { g.correct++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); g.score += 10 + g.combo * 2; addXP(5); state.stats.streak++; nextFC(); }}, '✅ 알아요'));
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
  root.appendChild(el('button', { class: 'btn btn-primary btn-block btn-lg', style: 'margin-top:14px', onClick: submitSO }, '✅ 제출'));
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
  btns.appendChild(el('button', { class: 'ox-btn o', onClick: () => answerOX(true, q) }, '⭕'));
  btns.appendChild(el('button', { class: 'ox-btn x', onClick: () => answerOX(false, q) }, '❌'));
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
    toast(q.correct ? '⭕ 정답!' : '❌ 정답!', 'danger');
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
  const icon = g.finalStars >= 3 ? '🏆' : g.finalStars >= 2 ? '🥈' : g.finalStars >= 1 ? '🥉' : '😢';
  const title = g.finalStars >= 3 ? '완벽해요!' : g.finalStars >= 2 ? '잘했어요!' : g.finalStars >= 1 ? '좋아요!' : '다시 도전!';
  card.innerHTML = `<div class="icon">${icon}</div><div class="title">${title}</div><div class="text-muted">${ACTIVITIES[g.activity].name} 완료</div>`;

  const stars = el('div', { class: 'stars' });
  for (let i = 0; i < 3; i++) stars.appendChild(el('span', { class: i < g.finalStars ? 'filled' : 'empty' }, '⭐'));
  card.appendChild(stars);

  const stats = el('div', { class: 'result-stats' });
  [['점수', g.score], ['정답률', g.finalPercent + '%'], ['최고 콤보', g.maxCombo + 'x']].forEach(([l, v]) => {
    const s = el('div', { class: 'result-stat' });
    s.innerHTML = `<div class="val">${v}</div><div class="lbl">${l}</div>`;
    stats.appendChild(s);
  });
  card.appendChild(stats);

  (g.newBadges || []).forEach(b => card.appendChild(el('div', { class: 'badge-earned' }, '🏅 ' + b.name)));

  const actions = el('div', { style: 'display:flex; gap:10px; margin-top:14px' });
  actions.appendChild(el('button', { class: 'btn btn-ghost', style: 'flex:1', onClick: () => { state.view = 'student-unit'; render(); }}, '단원으로'));
  actions.appendChild(el('button', { class: 'btn btn-primary', style: 'flex:1', onClick: () => startActivity(g.activity) }, '🔄 다시'));
  card.appendChild(actions);
  root.appendChild(card);
  return root;
}

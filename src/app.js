// GitHub Pages 환경에서 window.storage 대신 localStorage를 사용하는 폴리필
if (!window.storage) {
  window.storage = {
    get: (key) => Promise.resolve(
      localStorage.getItem(key) ? { value: localStorage.getItem(key) } : null
    ),
    set: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    delete: (key) => Promise.resolve(localStorage.removeItem(key))
  };
}

/* =========================================================
   CONFIG
   ========================================================= */
const LANGS = [
  { code: 'en', name: 'English', flag: '?��?��' },
  { code: 'zh', name: '�?��', flag: '?��?��' },
  { code: 'ja', name: '?�本�?, flag: '?��?��' },
  { code: 'th', name: 'ไท�?, flag: '?��?��' },
  { code: 'es', name: 'Español', flag: '?��?��' },
  { code: 'vi', name: 'Tiếng Việt', flag: '?��?��' }
];

const SAMPLE_UNIT = {
  id: 1,
  title: '9�?- 공원?�서 ?�책?�어??,
  vocabulary: [
    { word: '?�화관', romanization: 'yeong-hwa-gwan', emoji: '?��', translations: { en: 'movie theater', zh: '?�影??, ja: '?�画�?, th: 'โรงภาพยนตร�?, es: 'cine', vi: 'rạp chiếu phim' }},
    { word: '백화??, romanization: 'baek-hwa-jeom', emoji: '?��', translations: { en: 'department store', zh: '?�货�?, ja: '?�パ?�ト', th: 'ห้างสรรพสินค้า', es: 'grandes almacenes', vi: 'cửa hàng bách hóa' }},
    { word: '?�?�공??, romanization: 'no-ri-gong-won', emoji: '?��', translations: { en: 'amusement park', zh: '游乐??, ja: '?�園??, th: 'สวนสนุ�?, es: 'parque de atracciones', vi: 'công viên giải trí' }},
    { word: '?�서관', romanization: 'do-seo-gwan', emoji: '?��', translations: { en: 'library', zh: '?�书�?, ja: '?�書�?, th: 'ห้�?��สมุด', es: 'biblioteca', vi: 'thư viện' }},
    { word: '박물관', romanization: 'bak-mul-gwan', emoji: '?���?, translations: { en: 'museum', zh: '?�物�?, ja: '?�物�?, th: 'พิพิธภัณฑ์', es: 'museo', vi: 'bảo tàng' }},
    { word: '?�영??, romanization: 'su-yeong-jang', emoji: '?��', translations: { en: 'swimming pool', zh: '游泳�?, ja: '?�ー??, th: 'สระว่ายน้ำ', es: 'piscina', vi: 'h�?bơi' }},
    { word: '공원', romanization: 'gong-won', emoji: '?��', translations: { en: 'park', zh: '?�园', ja: '?�園', th: 'สวนสาธารณะ', es: 'parque', vi: 'công viên' }},
    { word: '?�책?�다', romanization: 'san-chae-ka-da', emoji: '?��', translations: { en: 'to take a walk', zh: '?��?', ja: '?��??�る', th: 'เดิน�?�?���?, es: 'pasear', vi: 'đi dạo' }},
    { word: '?�핑?�다', romanization: 'syo-ping-ha-da', emoji: '?���?, translations: { en: 'to shop', zh: '�?��', ja: '買い?�す??, th: 'ช้�?��ปิ้ง', es: 'comprar', vi: 'mua sắm' }},
    { word: '?�전거�? ?�??, romanization: 'ja-jeon-geo-reul ta-da', emoji: '?��', translations: { en: 'to ride a bike', zh: '骑自行车', ja: '?�転車に乗る', th: 'ขี่จักรยาน', es: 'andar en bici', vi: 'đi xe đạp' }}
  ],
  grammar: [
    {
      pattern: '~?�서 (?�소)',
      explanation: { en: 'Particle attached to a place noun, indicating where an action takes place.', zh: '?�加?�场?�?�词??表示?�作?�生?�地?��?, ja: '?��??�表?�名詞に付き?�動作が行わ?�る?��??�示?�ま?��?, th: '�?��ุภาคที่ติดกับคำนามสถานที�?บ่งบ�?��สถานที่ที่การกระทำเกิดขึ้�?, es: 'Partícula que se añade a un lugar para indicar dónde ocurre la acción.', vi: 'Tr�?t�?gắn với danh t�?ch�?nơi chốn, ch�?nơi hành động xảy ra.' },
      examples: [
        { ko: '집에??�?��?�요.', en: 'I clean at home.' },
        { ko: '?�사?�서 ?�해??', en: 'I work at the company.' },
        { ko: '공원?�서 ?�책?�요.', en: 'I walk in the park.' }
      ]
    },
    {
      pattern: '-???? (과거??',
      explanation: { en: 'Past tense marker attached to verbs/adjectives. Use ??after vowels ???? ??after others.', zh: '过去?�态标�??�加于动�?�?��?词。ㅏ/?�用???�他?�었??, ja: '?�詞?�形容詞??��?�形?�作?�語尾。ㅏ/???�は?�、そ?�以外は?��?, th: 'เครื่�?��หมาย�?��ีตติดกับกริย�?คุณศัพท์', es: 'Marca de pasado para verbos y adjetivos.', vi: 'Dấu hiệu quá kh�?gắn với động/tính t�?' },
      examples: [
        { ko: '?�서관?�서 책을 ?�었?�요.', en: 'I read a book at the library.' },
        { ko: '?�씨가 좋았?�요.', en: 'The weather was good.' },
        { ko: '친구�?만났?�요.', en: 'I met a friend.' }
      ]
    }
  ],
  quizzes: [
    { question: '?�서관 ___ 책을 ?�어??', options: ['?�서', '??, '??, '??], correct: 0, hint: { en: 'I read a book at the library.', zh: '?�在?�书馆看�?��?, ja: '?�書館で?�を�?��?�す??, th: 'ฉันอ่านหนังสือที่ห้องสมุ�?, es: 'Leo un libro en la biblioteca.', vi: 'Tôi đọc sách �?thư viện.' }},
    { question: '공원 ___ ?�책?�요.', options: ['??, '?�서', '�?, '??], correct: 1, hint: { en: 'I take a walk at the park.', zh: '?�在?�园?��???, ja: '?�園?�散歩し?�す??, th: 'ฉัน�?ดิน�?�?��นที่สว�?, es: 'Paseo en el parque.', vi: 'Tôi đi dạo �?công viên.' }},
    { question: '?�제 친구�?___.', options: ['만나??, '만났?�요', '만날 거예??, '만나'], correct: 1, hint: { en: 'I met a friend yesterday. (past tense)', zh: '?�昨天见了朋?��?, ja: '?�日?�達?�会?�ま?�た??, th: 'เมื่อวานฉันพบเพื่อ�?, es: 'Ayer vi a un amigo.', vi: 'Hôm qua tôi gặp bạn.' }},
    { question: '?�요?�에 ?�서관?�서 책을 ___.', options: ['?�어??, '?�을 거예??, '?�었?�요', '?�다'], correct: 2, hint: { en: 'I read a book at the library on Saturday. (past)', zh: '?�六?�在?�书馆看了书??, ja: '?�曜?�に?�書館で?�を�?��?�し?��?, th: 'วัน�?สาร์ฉันอ่านหนังสือที่ห้องสมุ�?, es: 'El sábado leí en la biblioteca.', vi: 'Th�?bảy tôi đọc sách �?thư viện.' }},
    { question: '?�씨가 ?�주 ___.', options: ['좋다', '좋아??, '좋았?�요', '좋을 거예??], correct: 2, hint: { en: 'The weather was very good. (past)', zh: '天气?�常好�?, ja: '天気?�と?�も??��?�た?�す??, th: '�?��กาศดีมาก', es: 'El tiempo estuvo muy bueno.', vi: 'Thời tiết rất đẹp.' }},
    { question: '백화??___ ?�핑?�어??', options: ['?�서', '??, '??, '??], correct: 0, hint: { en: 'I shopped at the department store.', zh: '?�在?�货?�店�?��了�?, ja: '?�パ?�ト?�買?�物?�ま?�た??, th: 'ฉันช้อปปิ้งที่ห้าง', es: 'Compré en la tienda.', vi: 'Tôi mua sắm �?cửa hàng.' }}
  ]
};

const ACTIVITIES = {
  flashcard: { name: 'Flashcards', icon: '?��', type: 'vocab', desc: '?�어 카드' },
  quiz: { name: '4지?�다 ?�즈', icon: '??, type: 'vocab', desc: '??맞히�? },
  matching: { name: '매칭 게임', icon: '?��', type: 'vocab', desc: '�?맞추�? },
  fillblank: { name: '빈칸 채우�?, icon: '?�️', type: 'grammar', desc: '문장 ?�성' },
  sentorder: { name: '문장 ?�서', icon: '??', type: 'grammar', desc: '?�어 배열' },
  oxquiz: { name: 'OX ?�즈', icon: '�?, type: 'grammar', desc: '문법 ?�단' },
  pdfquiz: { name: 'PDF ?�즈', icon: '?��', type: 'pdfquiz', desc: '?�습지 문제' }
};

const PROVIDERS = {
  anthropic: { name: 'Anthropic', icon: '🟠', models: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-7'], keyHint: 'sk-ant-api03-...' },
  openai:    { name: 'OpenAI',    icon: '🟢', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'], keyHint: 'sk-proj-...' },
  gemini:    { name: 'Gemini',    icon: '🔵', models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'], keyHint: 'AIzaSy...' },
  groq:      { name: 'Groq',      icon: '⚡', models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'], keyHint: 'gsk_...' }
};
function getProvider() { return localStorage.getItem('ai_provider') || 'anthropic'; }
function setProvider(p) { localStorage.setItem('ai_provider', p); }
function getApiKey(p) { return localStorage.getItem('ai_key_' + (p || getProvider())) || ''; }
function setApiKey(p, k) { if (k) localStorage.setItem('ai_key_' + p, k); else localStorage.removeItem('ai_key_' + p); }
function getModel(p) { const pr = p || getProvider(); return localStorage.getItem('ai_model_' + pr) || PROVIDERS[pr].models[0]; }
function setModel(p, m) { localStorage.setItem('ai_model_' + p, m); }

async function callAI(prompt) {
  const provider = getProvider();
  const key = getApiKey(provider);
  const model = getModel(provider);
  if (!key) throw new Error('API 키가 설정되지 않았습니다. 상단 버튼에서 설정하세요.');
  let text;
  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model, max_tokens: 1200, messages: [{ role: 'user', content: prompt }] })
    });
    if (!res.ok) throw new Error('AI 호출 실패: ' + res.status + (res.status === 401 ? ' (API 키 확인)' : ''));
    const data = await res.json();
    text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  } else if (provider === 'openai' || provider === 'groq') {
    const url = provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model, max_tokens: 1200, messages: [{ role: 'user', content: prompt }] })
    });
    if (!res.ok) throw new Error('AI 호출 실패: ' + res.status + (res.status === 401 ? ' (API 키 확인)' : ''));
    const data = await res.json();
    text = data.choices[0].message.content;
  } else if (provider === 'gemini') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!res.ok) throw new Error('AI 호출 실패: ' + res.status + (res.status === 400 ? ' (API 키/모델 확인)' : ''));
    const data = await res.json();
    text = data.candidates[0].content.parts[0].text;
  }
  if (!text || !text.trim()) throw new Error('AI 응답이 비어 있습니다.');
  return text;
}

let state = {
  view: 'home',
  language: 'en',
  units: [],
  currentUnitId: null,
  currentActivity: null,
  stats: { xp: 0, level: 1, streak: 0, badges: [], bestScores: {} },
  game: null
};

/* =========================================================
   STORAGE
   ========================================================= */
let _saveTimer = null, _saving = false, _storageOK = true;
const STORAGE_KEY = 'korean_app_v1';

async function _withRetry(fn, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) { lastErr = e; if (i < attempts - 1) await new Promise(r => setTimeout(r, 500 * Math.pow(2, i))); }
  }
  throw lastErr;
}

async function _doSave() {
  if (_saving) return;
  _saving = true;
  try {
    const payload = JSON.stringify({ units: state.units, stats: state.stats, settings: { language: state.language }});
    await _withRetry(() => window.storage.set(STORAGE_KEY, payload), 3);
    if (!_storageOK) { _storageOK = true; toast('?�� ?�??복구??, 'success'); }
  } catch (e) {
    if (_storageOK) { _storageOK = false; toast('?�️ ?�???�시 중단', 'accent'); }
    console.warn('Save failed:', e.message || e);
  } finally { _saving = false; }
}

async function persistAll(immediate = false) {
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
  if (immediate) await _doSave();
  else _saveTimer = setTimeout(_doSave, 700);
}

async function loadAll() {
  try {
    const r = await _withRetry(() => window.storage.get(STORAGE_KEY), 3);
    if (r && r.value) {
      const data = JSON.parse(r.value);
      state.units = data.units && data.units.length > 0 ? data.units : [SAMPLE_UNIT];
      state.stats = data.stats || { xp: 0, level: 1, streak: 0, badges: [], bestScores: {} };
      state.language = (data.settings && data.settings.language) || 'en';
      return;
    }
  } catch (e) {
    console.warn('Storage unavailable, using defaults');
    _storageOK = false;
    setTimeout(() => toast('?�️ ?�?�소 ?�시 ?�류 - 메모리에�??�?�됩?�다', 'accent'), 800);
  }
  if (!state.units || state.units.length === 0) state.units = [SAMPLE_UNIT];
  if (!state.stats) state.stats = { xp: 0, level: 1, streak: 0, badges: [], bestScores: {} };
}

/* =========================================================
   UTILITIES
   ========================================================= */
function $(s) { return document.querySelector(s); }
function el(tag, props = {}, children = []) {
  const e = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k === 'onClick') e.onclick = v;
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function toast(msg, type = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  setTimeout(() => t.className = '', 2200);
}
function getLangInfo() { return LANGS.find(l => l.code === state.language) || LANGS[0]; }
function getTranslation(obj, fallback = '') {
  if (!obj) return fallback;
  return obj[state.language] || obj.en || fallback;
}

function parseJSONSafe(text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.replace(/```json|```/g, '').trim();
  try { return JSON.parse(cleaned); } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch (_) { return null; }
  }
}

function validateExtractedText(pdfText) {
  if (!pdfText || !pdfText.trim()) {
    return 'PDF에서 텍스트를 추출하지 못했습니다.';
  }
  if (!/[\uac00-\ud7af]/.test(pdfText)) {
    return 'PDF에서 한글 텍스트를 찾을 수 없습니다. 이미지 기반 PDF일 수 있습니다. 이 경우 OCR 또는 직접 입력을 시도하세요.';
  }
  if (pdfText.trim().length < 50) {
    return '추출된 텍스트가 너무 짧습니다. 다른 PDF를 시도하거나 직접 입력하세요.';
  }
  return null;
}

function validateParsedUnit(parsed) {
  if (!parsed || typeof parsed !== 'object') return 'AI 응답이 유효한 JSON이 아닙니다.';
  if (!Array.isArray(parsed.vocab) && !Array.isArray(parsed.grammar) && !Array.isArray(parsed.quiz)) {
    return 'AI 결과에 vocab, grammar, quiz 항목이 모두 없습니다.';
  }
  return null;
}

/* =========================================================
   GAME MECHANICS
   ========================================================= */
function addXP(amount) {
  state.stats.xp += amount;
  const newLevel = Math.floor(state.stats.xp / 100) + 1;
  if (newLevel > state.stats.level) {
    state.stats.level = newLevel;
    toast(`?�� ?�벨 UP! Level ${newLevel}`, 'accent');
  }
}
function checkBadges(ctx) {
  const newBadges = [];
  const has = b => state.stats.badges.includes(b);
  if (ctx.perfectScore && !has('perfect')) newBadges.push({ id: 'perfect', name: '?�� ?�벽주의?? });
  if (ctx.streak >= 10 && !has('combo10')) newBadges.push({ id: 'combo10', name: '?�� 10?�속' });
  if (state.stats.xp >= 500 && !has('xp500')) newBadges.push({ id: 'xp500', name: '�?XP 500' });
  if (state.stats.level >= 5 && !has('level5')) newBadges.push({ id: 'level5', name: '?? Lv.5 ?�성' });
  newBadges.forEach(b => state.stats.badges.push(b.id));
  return newBadges;
}
function recordBestScore(unitId, activity, score) {
  const key = `${unitId}_${activity}`;
  if (!state.stats.bestScores[key] || score > state.stats.bestScores[key]) state.stats.bestScores[key] = score;
}
function getBestScore(unitId, activity) { return state.stats.bestScores[`${unitId}_${activity}`] || 0; }
function calcStars(percent) { return percent >= 90 ? 3 : percent >= 70 ? 2 : percent >= 50 ? 1 : 0; }

/* =========================================================
   ROUTER
   ========================================================= */
function render() {
  const app = $('#app');
  app.innerHTML = '';
  app.appendChild(renderTopbar());
  const v = state.view;
  const map = {
    'home': renderHome, 'teacher': renderTeacher, 'teacher-create': renderTeacherCreate,
    'teacher-edit': renderTeacherEdit, 'student': renderStudent, 'student-unit': renderStudentUnit,
    'student-activity': renderStudentActivity, 'student-result': renderStudentResult
  };
  if (map[v]) app.appendChild(map[v]());
}

function renderTopbar() {
  const bar = el('div', { class: 'topbar' });
  bar.appendChild(el('div', { class: 'logo' }, '?��?�� ?�국??));
  const stats = el('div', { class: 'stats-row' });
  if (state.view !== 'home') {
    stats.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: goHome }, '?��'));
  }
  const _pv = getProvider(); const _pk = !!getApiKey(_pv); const _pi = PROVIDERS[_pv];
  stats.appendChild(el('button', {
    class: 'btn btn-sm',
    style: `background:${_pk ? '#dcfce7' : '#fef2f2'}; color:${_pk ? '#166534' : '#991b1b'}; border:1.5px solid ${_pk ? '#86efac' : '#fca5a5'}`,
    onClick: showApiKeyModal
  }, _pk ? `${_pi.icon} ${_pi.name} ✓` : '⚠️ AI 설정'));
  const lang = getLangInfo();
  stats.appendChild(el('div', { class: 'stat-chip lang', onClick: showLangModal }, `${lang.flag} ${lang.code.toUpperCase()}`));
  stats.appendChild(el('div', { class: 'stat-chip level' }, `?? Lv.${state.stats.level}`));
  stats.appendChild(el('div', { class: 'stat-chip xp' }, `�?${state.stats.xp}`));
  if (state.stats.streak > 0) stats.appendChild(el('div', { class: 'stat-chip streak' }, `?�� ${state.stats.streak}`));
  bar.appendChild(stats);
  return bar;
}

function goHome() {
  state.view = 'home';
  state.currentUnitId = null;
  state.currentActivity = null;
  state.game = null;
  state.stats.streak = 0;
  persistAll(true);
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
    const desc = el('p', { style: 'color:#64748b; font-size:0.88rem; margin-bottom:12px; line-height:1.5' });
    desc.textContent = 'API 키는 이 기기의 localStorage에만 저장되며 외부로 전송되지 않습니다.';
    modal.appendChild(desc);

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
  modal.appendChild(el('h3', { style: 'margin-bottom:14px' }, '?�� ?�어 ?�택 (Choose Language)'));
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

/* =========================================================
   HOME
   ========================================================= */
function renderHome() {
  const root = el('div');

  const hero = el('div', { class: 'home-hero' });
  hero.appendChild(el('h1', {}, '?�국???�습 ?�구'));
  hero.appendChild(el('p', {}, 'Korean Learning App'));
  root.appendChild(hero);

  // Language selector
  const langPanel = el('div', { class: 'home-lang-panel' });
  langPanel.appendChild(el('h3', {}, '?�� ?�생 ?�어 ?�택 (Student\'s Language)'));
  langPanel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:14px' }, '?�업 ?�작 ???�생??�?��??맞는 ?�어�??�택?�세??'));
  const langGrid = el('div', { class: 'lang-grid' });
  LANGS.forEach(l => {
    const tile = el('div', {
      class: 'lang-tile' + (state.language === l.code ? ' active' : ''),
      onClick: () => { state.language = l.code; persistAll(); render(); }
    });
    tile.innerHTML = `<span class="flag">${l.flag}</span><div class="name">${l.name}</div>`;
    langGrid.appendChild(tile);
  });
  langPanel.appendChild(langGrid);
  root.appendChild(langPanel);

  // Mode selection
  const grid = el('div', { class: 'mode-grid' });
  const teacherCard = el('div', { class: 'mode-card', onClick: () => { state.view = 'teacher'; render(); }});
  teacherCard.innerHTML = '<div class="icon">?��?��?/div><h3>교사 모드</h3><p>Teacher Mode</p><p style="font-size:0.9rem; margin-top:8px; color:#94a3b8">?�원 관�?· PDF ?�동 변??/p>';

  const studentCard = el('div', { class: 'mode-card', onClick: () => { state.view = 'student'; render(); }});
  studentCard.innerHTML = '<div class="icon">?��</div><h3>?�생 모드</h3><p>Student Mode</p><p style="font-size:0.9rem; margin-top:8px; color:#94a3b8">게임?�로 ?�국??배우�?/p>';

  grid.append(teacherCard, studentCard);
  root.appendChild(grid);

  return root;
}

/* =========================================================
   TEACHER
   ========================================================= */
function renderTeacher() {
  const root = el('div');
  const panel = el('div', { class: 'panel' });
  const head = el('div', { class: 'row-between' });
  head.appendChild(el('h2', {}, '?�� ?�원 관�?));
  head.appendChild(el('button', { class: 'btn btn-primary', onClick: () => { state.view = 'teacher-create'; render(); }}, '+ ???�원'));
  panel.appendChild(head);
  panel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:14px' }, 'PDF ?�로???�는 직접 ?�력?�로 ?�원??만들�??�집?????�습?�다.'));

  if (state.units.length === 0) {
    panel.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; padding:24px' }, '?�직 ?�원???�습?�다.'));
  } else {
    const list = el('div', { class: 'unit-list' });
    state.units.forEach(u => {
      const item = el('div', { class: 'unit-item' });
      const info = el('div');
      info.appendChild(el('h4', {}, u.title));
      info.appendChild(el('div', { class: 'meta' }, `?�휘 ${u.vocabulary.length} · 문법 ${u.grammar.length} · ?�즈 ${(u.quizzes || []).length}`));
      const actions = el('div', { class: 'unit-actions' });
      actions.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: () => editUnit(u.id) }, '?�️ ?�집'));
      actions.appendChild(el('button', { class: 'btn btn-danger btn-sm', onClick: () => deleteUnit(u.id) }, '?���?));
      item.append(info, actions);
      list.appendChild(item);
    });
    panel.appendChild(list);
  }
  root.appendChild(panel);

  // Danger zone - reset all data
  const dangerPanel = el('div', { class: 'panel', style: 'border-left:4px solid var(--danger)' });
  dangerPanel.appendChild(el('h3', { style: 'color:var(--danger)' }, '?�️ ?�이??초기??));
  dangerPanel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:12px' }, '모든 ?�원, ?�수, ?�벨, 배�?�???��?�고 처음부???�시 ?�작?�니?? ?�플 ?�원(9�?- 공원?�서 ?�책?�어??�??�게 ?�니?? ?�돌�????�습?�다.'));
  dangerPanel.appendChild(el('button', { class: 'btn btn-danger', onClick: async () => {
    const ok1 = await showConfirm('?�️ ?�이??초기??, '?�말 모든 ?�이?��? ??��?�시겠습?�까?\n\n??모든 ?�원 ??��\n???�수/?�벨/배�? 초기??n???�플 ?�원�??�음\n\n???�업?�??�돌�????�습?�다.', true);
    if (!ok1) return;
    const ok2 = await showConfirm('마�?�??�인', '??�????�인?�니??\n?�말�?처음부???�시 ?�작?�시겠습?�까?', true);
    if (!ok2) return;
    try { await window.storage.delete(STORAGE_KEY); } catch (e) {}
    state.units = [SAMPLE_UNIT];
    state.stats = { xp: 0, level: 1, streak: 0, badges: [], bestScores: {} };
    state.language = 'en';
    state.view = 'home';
    state.currentUnitId = null;
    state.currentActivity = null;
    state.game = null;
    await persistAll(true);
    toast('??초기???�료. 처음부???�작?�니??, 'success');
    render();
  }}, '?���?모든 ?�이??초기?�하�?));
  root.appendChild(dangerPanel);

  return root;
}

function editUnit(id) { state.currentUnitId = id; state.view = 'teacher-edit'; render(); }
async function deleteUnit(id) {
  const unit = state.units.find(u => u.id === id);
  const ok = await showConfirm('?�원 ??��', `"${unit ? unit.title : '???�원'}"??�? ?�말 ??��?�시겠습?�까?\n\n?�함??모든 ?�휘, 문법, ?�즈가 ?�께 ??��?�니??`, true);
  if (!ok) return;
  state.units = state.units.filter(u => u.id !== id);
  await persistAll(true);
  toast('?�원 ??��??, 'danger');
  render();
}

function renderTeacherCreate() {
  const root = el('div');
  const panel = el('div', { class: 'panel' });
  panel.appendChild(el('button', { class: 'back-btn', onClick: () => { state.view = 'teacher'; render(); }}, '???�로'));
  panel.appendChild(el('h2', { style: 'margin-top:10px' }, '?????�원 만들�?));

  const opts = el('div', { class: 'create-options' });

  const pdfOpt = el('div', { class: 'option-card' });
  pdfOpt.innerHTML = '<div class="icon">?��</div><div class="label">PDF ?�동 변??/div><div class="desc">?�습지 PDF?�서 ?�휘·문법·?�즈�??�동 추출</div>';
  const fileInput = el('input', { type: 'file', accept: 'application/pdf', style: 'margin-top:10px; font-size:0.92rem' });
  fileInput.onchange = handlePDFUpload;
  pdfOpt.appendChild(fileInput);

  const manualOpt = el('div', { class: 'option-card', onClick: createBlankUnit });
  manualOpt.innerHTML = '<div class="icon">?�️</div><div class="label">직접 ?�력</div><div class="desc">�??�원??만들??직접 ?�력</div>';

  opts.append(pdfOpt, manualOpt);
  panel.appendChild(opts);
  panel.appendChild(el('div', { id: 'pdf-status', class: 'loading hidden' }));
  root.appendChild(panel);
  return root;
}

// Custom confirm/prompt dialogs (artifacts iframe blocks window.confirm/prompt)
function showConfirm(title, message, danger = false) {
  return new Promise(resolve => {
    const root = $('#modal-root');
    root.innerHTML = '';
    const backdrop = el('div', { class: 'modal-backdrop' });
    backdrop.onclick = (e) => { if (e.target === backdrop) { root.innerHTML = ''; resolve(false); } };
    const modal = el('div', { class: 'modal' });
    modal.appendChild(el('h3', { style: 'margin-bottom:10px' }, title));
    const msg = el('div', { style: 'white-space:pre-line; margin-bottom:18px; color:#475569; line-height:1.6' });
    msg.textContent = message;
    modal.appendChild(msg);
    const btns = el('div', { style: 'display:flex; gap:10px; justify-content:flex-end' });
    btns.appendChild(el('button', { class: 'btn btn-ghost', onClick: () => { root.innerHTML = ''; resolve(false); }}, '취소'));
    btns.appendChild(el('button', { class: danger ? 'btn btn-danger' : 'btn btn-primary', onClick: () => { root.innerHTML = ''; resolve(true); }}, danger ? '??��' : '?�인'));
    modal.appendChild(btns);
    backdrop.appendChild(modal);
    root.appendChild(backdrop);
  });
}

function showPrompt(title, placeholder = '') {
  return new Promise(resolve => {
    const root = $('#modal-root');
    root.innerHTML = '';
    const backdrop = el('div', { class: 'modal-backdrop' });
    backdrop.onclick = (e) => { if (e.target === backdrop) { root.innerHTML = ''; resolve(null); } };
    const modal = el('div', { class: 'modal' });
    modal.appendChild(el('h3', { style: 'margin-bottom:14px' }, title));
    const input = el('input', { type: 'text', placeholder, style: 'width:100%; margin-bottom:14px' });
    modal.appendChild(input);
    const btns = el('div', { style: 'display:flex; gap:10px; justify-content:flex-end' });
    btns.appendChild(el('button', { class: 'btn btn-ghost', onClick: () => { root.innerHTML = ''; resolve(null); }}, '취소'));
    const okBtn = el('button', { class: 'btn btn-primary', onClick: () => { const v = input.value.trim(); root.innerHTML = ''; resolve(v || null); }}, '?�인');
    btns.appendChild(okBtn);
    modal.appendChild(btns);
    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    setTimeout(() => input.focus(), 50);
    input.onkeydown = (e) => { if (e.key === 'Enter') okBtn.click(); };
  });
}

async function createBlankUnit() {
  const title = await showPrompt('???�원 만들�?, '?? 10�?- 가�?);
  if (!title) return;
  state.units.push({ id: Date.now(), title, vocabulary: [], grammar: [], quizzes: [] });
  await persistAll(true);
  state.currentUnitId = state.units[state.units.length - 1].id;
  state.view = 'teacher-edit';
  render();
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = () => rej(new Error('Read failed'));
    r.readAsDataURL(file);
  });
}

// PDF.js for text extraction (avoids 413 errors with large image-heavy PDFs)
async function loadPdfJs() {
  if (window.pdfjsLib) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('PDF.js 로딩 ?�패'));
    document.head.appendChild(s);
  });
  // Sandboxed iframe blocks external workers, so we don't set workerSrc.
  // PDF.js will show "Setting up fake worker" warning and run in main thread.
  // This is slower but functionally correct for text extraction.
}

async function extractPdfText(file) {
  await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += `--- Page ${i} ---\n` + content.items.map(item => item.str).join(' ') + '\n\n';
  }
  return fullText;
}

async function handlePDFUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!getApiKey(getProvider())) {
    toast('⚠️ AI 설정을 먼저 완료하세요 (상단 버튼)', 'danger');
    showApiKeyModal();
    return;
  }
  const status = $('#pdf-status');
  status.className = 'loading';

  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  status.innerHTML = `<span class="spinner"></span> PDF (${sizeMB}MB) 텍스트 추출 중...`;

  try {
    const pdfText = await extractPdfText(file);
    console.log('📄 PDF 추출된 텍스트 길이:', pdfText.length, '자');
    console.log('📄 첫 500자:', pdfText.slice(0, 500));

    const validationError = validateExtractedText(pdfText);
    if (validationError) throw new Error(validationError);

    const textForAI = pdfText.slice(0, 6000);
    const pInfo = PROVIDERS[getProvider()];
    status.innerHTML = `<span class="spinner"></span> ${pInfo.icon} ${pInfo.name} 분석 중... (${textForAI.length}자 / 한글 ✓)`;

    const prompt = `Below is text from a Korean language learning textbook. Extract content as JSON.\n\nOutput ONLY this JSON (no markdown, no extra text):\n{\n  \"title\": \"단원 제목 (찾을 수 없으면 추출된 첫 한글 구절)\",\n  \"vocab\": [{\"w\":\"한글단어\",\"r\":\"ro-ma-ni-za-tion\",\"e\":\"📝\",\"m\":\"English\"}],\n  \"grammar\": [{\"p\":\"~패턴\",\"x\":\"English\",\"ex\":[{\"k\":\"예문\",\"e\":\"English\"}]}],\n  \"quiz\": [{\"q\":\"문장 ___ 빈칸\",\"o\":[\"a\",\"b\",\"c\",\"d\"],\"c\":0,\"h\":\"English hint\"}]\n}\n\nRequirements:\n- Find ALL Korean vocabulary words/phrases in the text (장소, 동사, 명사 등)\n- Identify 1-3 grammar patterns mentioned\n- Create 5-6 fill-in-the-blank quiz questions with 4 options each\n- Keep strings short to fit budget\n- Output JSON only\n\nTEXT:\n${textForAI}`;

    const aiText = await callAI(prompt);
    console.log('🤖 AI 응답:', aiText);

    const parsed = parseJSONSafe(aiText);
    const parseError = validateParsedUnit(parsed);
    if (parseError) {
      console.error('AI 파싱 검증 실패:', parseError, aiText);
      throw new Error(`${parseError}\n\nAI 응답을 수동으로 확인하거나 직접 입력을 사용하세요.`);
    }

    const newUnit = {
      id: Date.now(),
      title: parsed.title || '새 단원',
      vocabulary: (parsed.vocab || []).map(v => ({
        word: v.w || '', romanization: v.r || '', emoji: v.e || '📝',
        translations: { en: v.m || '' }
      })).filter(v => v.word),
      grammar: (parsed.grammar || []).map(g => ({
        pattern: g.p || '',
        explanation: { en: g.x || '' },
        examples: (g.ex || []).map(ex => ({ ko: ex.k || '', en: ex.e || '' }))
      })).filter(g => g.pattern),
      quizzes: (parsed.quiz || []).map(q => ({
        question: q.q || '',
        options: q.o || [],
        correct: typeof q.c === 'number' ? q.c : 0,
        hint: { en: q.h || '' }
      })).filter(q => q.question && q.options && q.options.length === 4)
    };

    const totalCount = newUnit.vocabulary.length + newUnit.grammar.length + newUnit.quizzes.length;
    console.log('✅ 추출 결과:', { 어휘: newUnit.vocabulary.length, 문법: newUnit.grammar.length, 퀴즈: newUnit.quizzes.length });

    if (totalCount === 0) {
      throw new Error('추출된 콘텐츠가 없습니다. AI가 PDF 내용을 올바르게 인식하지 못했습니다. 수동 입력을 권장합니다.');
    }

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
    status.innerHTML = `❌ 오류: ${message.split('\\n')[0]}<br><small style="white-space:pre-line">${message.split('\\n').slice(1).join('\\n')}</small>`;
  }
}
function renderTeacherEdit() {
  const unit = state.units.find(u => u.id === state.currentUnitId);
  if (!unit) { state.view = 'teacher'; render(); return el('div'); }
  if (!unit.quizzes) unit.quizzes = [];
  const root = el('div');

  // Header
  const headPanel = el('div', { class: 'panel' });
  headPanel.appendChild(el('button', { class: 'back-btn', onClick: async () => { await persistAll(true); state.view = 'teacher'; render(); }}, '???�원 목록'));
  const titleInput = el('input', { type: 'text', value: unit.title, style: 'margin-top:10px; font-size:1.2rem; font-weight:700' });
  titleInput.oninput = () => { unit.title = titleInput.value; };
  headPanel.appendChild(el('label', { style: 'margin-top:10px' }, '?�원 ?�목'));
  headPanel.appendChild(titleInput);
  root.appendChild(headPanel);

  // Vocabulary
  const vocabPanel = el('div', { class: 'panel' });
  vocabPanel.appendChild(el('h2', {}, `?�� ?�휘 (${unit.vocabulary.length})`));

  const missingTrans = unit.vocabulary.filter(v => !v.translations || !v.translations.zh || !v.translations.ja).length;
  if (unit.vocabulary.length > 0 && missingTrans > 0) {
    vocabPanel.appendChild(el('button', { class: 'btn btn-accent btn-block', style: 'margin-bottom:12px', onClick: () => bulkTranslateVocab(unit) },
      `?�� 모든 ?�어 ?�동 번역 (${missingTrans}�?· 6�??�어)`));
  }

  unit.vocabulary.forEach((v, i) => {
    const item = el('div', { class: 'vocab-edit-item' });
    const grid = el('div', { class: 'vocab-edit-grid' });
    const emojiIn = el('input', { type: 'text', value: v.emoji || '', placeholder: '?��' });
    emojiIn.oninput = () => { v.emoji = emojiIn.value; };
    const wordIn = el('input', { type: 'text', value: v.word, placeholder: '?��?' });
    wordIn.oninput = () => { v.word = wordIn.value; };
    const romanIn = el('input', { type: 'text', value: v.romanization || '', placeholder: '발음' });
    romanIn.oninput = () => { v.romanization = romanIn.value; };
    const meaningIn = el('input', { type: 'text', value: (v.translations && v.translations.en) || '', placeholder: 'English' });
    meaningIn.oninput = () => { if (!v.translations) v.translations = {}; v.translations.en = meaningIn.value; };
    const delBtn = el('button', { class: 'btn btn-danger btn-sm', onClick: () => { unit.vocabulary.splice(i, 1); persistAll(); render(); }}, '?���?);
    grid.append(emojiIn, wordIn, romanIn, meaningIn, delBtn);
    item.appendChild(grid);
    item.appendChild(el('button', { class: 'btn btn-accent btn-sm', style: 'margin-top:8px', onClick: () => autoTranslateVocab(v) }, '?�� ?�동 번역'));
    vocabPanel.appendChild(item);
  });
  vocabPanel.appendChild(el('button', { class: 'btn btn-primary btn-block', style: 'margin-top:14px; padding:14px', onClick: () => addVocab(unit) }, '???�어 추�??�기'));
  root.appendChild(vocabPanel);

  // Grammar
  const grPanel = el('div', { class: 'panel' });
  grPanel.appendChild(el('h2', {}, `?�� 문법 (${unit.grammar.length})`));

  unit.grammar.forEach((g, i) => {
    const item = el('div', { class: 'grammar-edit-item' });
    const patIn = el('input', { type: 'text', value: g.pattern, placeholder: '?? ~?�서' });
    patIn.oninput = () => { g.pattern = patIn.value; };
    item.appendChild(el('label', {}, '?�턴'));
    item.appendChild(patIn);

    const expIn = el('textarea', { placeholder: '문법 ?�명 (English)' });
    expIn.value = (g.explanation && g.explanation.en) || '';
    expIn.oninput = () => { if (!g.explanation) g.explanation = {}; g.explanation.en = expIn.value; };
    item.appendChild(el('label', { style: 'margin-top:8px' }, '?�명 (English)'));
    item.appendChild(expIn);

    const exTa = el('textarea', { placeholder: '?�국??| English\n?? ?�서관?�서 책을 ?�어?? | I read at the library.' });
    exTa.value = (g.examples || []).map(e => `${e.ko} | ${e.en}`).join('\n');
    exTa.oninput = () => {
      g.examples = exTa.value.split('\n').filter(l => l.trim()).map(l => {
        const [ko, en] = l.split('|').map(s => (s || '').trim());
        return { ko, en };
      });
    };
    item.appendChild(el('label', { style: 'margin-top:8px' }, '?�문 (??줄에 ?�나)'));
    item.appendChild(exTa);
    item.appendChild(el('button', { class: 'btn btn-danger btn-sm', style: 'margin-top:8px', onClick: () => { unit.grammar.splice(i, 1); persistAll(); render(); }}, '?���???��'));
    grPanel.appendChild(item);
  });
  grPanel.appendChild(el('button', { class: 'btn btn-primary btn-block', style: 'margin-top:14px; padding:14px', onClick: () => addGrammar(unit) }, '??문법 추�??�기'));
  root.appendChild(grPanel);

  // Quizzes
  const qzPanel = el('div', { class: 'panel' });
  qzPanel.appendChild(el('h2', {}, `?�� PDF ?�즈 (${unit.quizzes.length})`));
  qzPanel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:12px' }, '?�습지?�서 ?�동 추출??객�???문제?�니?? ___ ?�리???�어�??�을 4�?보기?�서 ?�택?�는 ?�식.'));

  unit.quizzes.forEach((q, i) => {
    const item = el('div', { class: 'quiz-edit-item' });
    item.appendChild(el('label', {}, `Q${i + 1} 문제 (___ �?빈칸?�로 ?�용)`));
    const qIn = el('input', { type: 'text', value: q.question, placeholder: '?? ?�서관 ___ 책을 ?�어??' });
    qIn.oninput = () => { q.question = qIn.value; };
    item.appendChild(qIn);

    item.appendChild(el('label', { style: 'margin-top:8px' }, '4�?보기 (?�답 ?�디???�택)'));
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
    item.appendChild(el('label', { style: 'margin-top:8px' }, '?�트 (English)'));
    item.appendChild(hintIn);

    item.appendChild(el('button', { class: 'btn btn-danger btn-sm', style: 'margin-top:8px', onClick: () => { unit.quizzes.splice(i, 1); persistAll(); render(); }}, '?���???��'));
    qzPanel.appendChild(item);
  });
  qzPanel.appendChild(el('button', { class: 'btn btn-primary btn-block', style: 'margin-top:14px; padding:14px', onClick: () => addQuiz(unit) }, '???�즈 추�??�기'));
  root.appendChild(qzPanel);

  // Save
  const savePanel = el('div', { class: 'panel' });
  const vocabNeedCount = unit.vocabulary.filter(v => v.word && (!v.translations || !v.translations.zh)).length;
  const grammarNeedCount = unit.grammar.filter(g => g.explanation && g.explanation.en && (!g.explanation.zh)).length;
  const totalNeed = vocabNeedCount + grammarNeedCount;
  const btnLabel = totalNeed > 0
    ? `?�� ?�?�하�?+ ?�동 번역 (?�휘 ${vocabNeedCount} · 문법 ${grammarNeedCount})`
    : '?�� ?�?�하�?;
  savePanel.appendChild(el('button', { class: 'btn btn-success btn-block btn-lg', onClick: async () => { await saveWithAutoTranslate(unit); }}, btnLabel));
  if (totalNeed > 0) {
    savePanel.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; margin-top:10px; font-size:0.92rem' }, '?�� ?�????비어?�는 ?�국??번역??AI�??�동 채워집니??(?�어 ??중국???�본???�국???�페?�어/베트?�어)'));
  }
  root.appendChild(savePanel);

  return root;
}

function addVocab(unit) {
  unit.vocabulary.push({ word: '', romanization: '', emoji: '?�️', translations: {} });
  render();
  scrollToNewItem('.vocab-edit-item', 'input[placeholder="?��?"]');
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

async function autoTranslateVocab(v) {
  if (!v.word) { toast('먼�? ?��? ?�어 ?�력', 'danger'); return; }
  toast('?�� 번역 �?..', 'accent');
  try {
    const prompt = `For the Korean word "${v.word}", return ONLY JSON: {"romanization":"...","emoji":"X","translations":{"en":"...","zh":"...","ja":"...","th":"...","es":"...","vi":"..."}} - romanization with hyphens, ONE emoji.`;
    const text = await callAI(prompt);
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    v.romanization = parsed.romanization;
    v.emoji = parsed.emoji;
    v.translations = parsed.translations;
    await persistAll();
    toast('???�료', 'success');
    render();
  } catch (e) { console.error(e); toast('번역 ?�패', 'danger'); }
}

async function bulkTranslateVocab(unit) {
  const targets = unit.vocabulary.filter(v => v.word && (!v.translations || !v.translations.zh));
  if (targets.length === 0) { toast('번역???�어가 ?�습?�다', 'accent'); return; }
  const total = targets.length;
  let done = 0;
  toast(`?�� ${total}�?번역 ?�작...`, 'accent');
  const CHUNK = 5;
  for (let i = 0; i < targets.length; i += CHUNK) {
    const chunk = targets.slice(i, i + CHUNK);
    try {
      const list = chunk.map((v, idx) => `${idx + 1}. ${v.word}`).join('\n');
      const prompt = `For each Korean word below, return JSON array. Each item: {"r":"romanization","e":"emoji","t":{"en":"...","zh":"...","ja":"...","th":"...","es":"...","vi":"..."}}\n\nWords:\n${list}\n\nReturn ONLY a JSON array of ${chunk.length} items in same order.`;
      const text = await callAI(prompt);
      const arr = JSON.parse(text.replace(/```json|```/g, '').trim());
      chunk.forEach((v, idx) => {
        const it = arr[idx];
        if (!it) return;
        v.romanization = v.romanization || it.r;
        v.emoji = (v.emoji === '?��' || v.emoji === '?�️' || !v.emoji) ? it.e : v.emoji;
        // Preserve user-entered translations, only fill missing
        v.translations = v.translations || {};
        ['en','zh','ja','th','es','vi'].forEach(lang => {
          if (!v.translations[lang] && it.t && it.t[lang]) v.translations[lang] = it.t[lang];
        });
      });
      done += chunk.length;
      toast(`?�� ?�휘 ${done}/${total}`, 'accent');
      await persistAll();
      render();
    } catch (err) { console.error(err); }
  }
  toast(`???�휘 번역 ?�료 (${done}/${total})`, 'success');
}

async function bulkTranslateGrammar(unit) {
  const targets = unit.grammar.filter(g => g.explanation && g.explanation.en && (!g.explanation.zh || !g.explanation.ja));
  if (targets.length === 0) return 0;
  const total = targets.length;
  let done = 0;
  toast(`?�� 문법 ${total}�?번역 ?�작...`, 'accent');
  for (const g of targets) {
    try {
      const prompt = `Translate this Korean grammar explanation into 5 languages. Return ONLY JSON, no markdown:
{"zh":"�?�� explanation","ja":"?�本�?,"th":"ภาษาไท�?,"es":"Español","vi":"Tiếng Việt"}

Pattern: ${g.pattern}
English: ${g.explanation.en}

Keep translations concise and clear for Korean language learners.`;
      const text = await callAI(prompt);
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      ['zh','ja','th','es','vi'].forEach(lang => {
        if (!g.explanation[lang] && parsed[lang]) g.explanation[lang] = parsed[lang];
      });
      done++;
      toast(`?�� 문법 ${done}/${total}`, 'accent');
      await persistAll();
    } catch (e) { console.warn('Grammar translation failed:', e); }
  }
  return done;
}

async function saveWithAutoTranslate(unit) {
  // Count items needing translation
  const vocabNeed = unit.vocabulary.filter(v => v.word && (!v.translations || !v.translations.zh));
  const grammarNeed = unit.grammar.filter(g => g.explanation && g.explanation.en && (!g.explanation.zh));

  if (vocabNeed.length === 0 && grammarNeed.length === 0) {
    await persistAll(true);
    toast('???�???�료', 'success');
    return;
  }

  toast(`?�� ?�??+ ?�동 번역 ?�작... (?�휘 ${vocabNeed.length}, 문법 ${grammarNeed.length})`, 'accent');

  if (vocabNeed.length > 0) await bulkTranslateVocab(unit);
  if (grammarNeed.length > 0) await bulkTranslateGrammar(unit);

  await persistAll(true);
  toast('???�??+ ?�동 번역 ?�료!', 'success');
  render();
}

/* =========================================================
   STUDENT
   ========================================================= */
function renderStudent() {
  const root = el('div');
  const panel = el('div', { class: 'panel' });
  panel.appendChild(el('h2', {}, '?�� ?�원 ?�택 (Choose a Unit)'));
  const lang = getLangInfo();
  panel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:14px' }, `?�재 ?�어: ${lang.flag} ${lang.name} · 변경하?�면 ?�단 ${lang.code.toUpperCase()} 버튼 ?�릭`));

  if (state.units.length === 0) {
    panel.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; padding:20px' }, '?�직 ?�원???�습?�다. 교사 모드?�서 만들?�주?�요.'));
  } else {
    const grid = el('div', { class: 'unit-grid' });
    state.units.forEach((u, i) => {
      const tile = el('div', { class: 'unit-tile', onClick: () => { state.currentUnitId = u.id; state.view = 'student-unit'; render(); }});
      tile.innerHTML = `<div class="num">${i + 1}</div><div class="title">${u.title.replace(/^\d+(?�원|�?\s*-?\s*/, '')}</div><div class="progress">${u.vocabulary.length} ?�어 · ${u.grammar.length} 문법 · ${(u.quizzes || []).length} ?�즈</div>`;
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
  const panel = el('div', { class: 'panel' });
  panel.appendChild(el('button', { class: 'back-btn', onClick: () => { state.view = 'student'; render(); }}, '???�원 목록'));
  panel.appendChild(el('h2', { style: 'margin-top:10px' }, unit.title));
  panel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:14px' }, '?�동???�택?�세?? 게임마다 최고 ?�수가 기록?�니???��'));

  if (unit.vocabulary.length > 0) {
    panel.appendChild(el('h3', { style: 'margin-top:12px' }, '?�� ?�휘'));
    const vg = el('div', { class: 'activity-grid' });
    ['flashcard', 'quiz', 'matching'].forEach(act => {
      if (act !== 'flashcard' && unit.vocabulary.length < 4) return;
      vg.appendChild(makeActivityTile(act, unit.id, 'vocab'));
    });
    panel.appendChild(vg);
  }

  if (unit.grammar.length > 0) {
    panel.appendChild(el('h3', { style: 'margin-top:18px' }, '?�� 문법'));
    const gg = el('div', { class: 'activity-grid' });
    ['fillblank', 'sentorder', 'oxquiz'].forEach(act => {
      gg.appendChild(makeActivityTile(act, unit.id, 'grammar'));
    });
    panel.appendChild(gg);
  }

  if (unit.quizzes.length > 0) {
    panel.appendChild(el('h3', { style: 'margin-top:18px' }, '?�� ?�습지 ?�즈'));
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
  tile.innerHTML = `<div class="icon">${a.icon}</div><div class="name">${a.name}</div>` + (best > 0 ? `<div class="best">최고 ${best}??/div>` : '');
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
   GAMES
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

function generateFillBlankQuestions(unit) {
  const qs = [];
  unit.grammar.forEach(g => {
    (g.examples || []).forEach(ex => {
      const words = ex.ko.split(' ');
      if (words.length < 2) return;
      const idx = Math.floor(words.length / 2);
      const answer = words[idx].replace(/[.,!?]/g, '');
      if (!answer) return;
      const display = words.map((w, i) => i === idx ? '___' : w).join(' ');
      // Generate 3 distractors from other words in unit
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
  gh.appendChild(el('button', { class: 'back-btn', onClick: exitGame }, '??종료'));
  const progress = el('div', { class: 'game-progress' });
  const pct = state.game.total ? Math.min(100, (state.game.index / state.game.total) * 100) : 0;
  progress.appendChild(el('div', { class: 'game-progress-bar', style: `width:${pct}%` }));
  gh.appendChild(progress);
  gh.appendChild(el('div', { class: 'game-info' }, `${state.game.index}/${state.game.total} · ${state.game.score}??));
  if (state.game.combo >= 3) gh.appendChild(el('div', { class: 'combo-display' }, `?�� ${state.game.combo}x`));
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
  const ok = await showConfirm('게임 종료', '?�말 종료?�시겠습?�까?\n\n진행 ?�황?�??�?�되지 ?�습?�다.', true);
  if (!ok) return;
  state.view = 'student-unit';
  state.game = null;
  state.stats.streak = 0;
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
  front.innerHTML = `<div class="fc-emoji">${card.emoji}</div><div class="fc-word">${card.word}</div><div class="fc-roman">${card.romanization || ''}</div>`;
  const back = el('div', { class: 'fc-face fc-back' });
  back.innerHTML = `<div class="fc-meaning">${getTranslation(card.translations)}</div><div class="fc-roman" style="margin-top:14px">${card.word} · ${card.romanization || ''}</div>`;
  inner.append(front, back);
  area.appendChild(inner);
  area.onclick = () => { g.flipped = !g.flipped; render(); };
  root.appendChild(area);

  const ctrl = el('div', { class: 'fc-controls' });
  ctrl.appendChild(el('button', { class: 'btn btn-ghost', onClick: () => { g.flipped = !g.flipped; render(); }}, '?�� ?�집�?));
  ctrl.appendChild(el('button', { class: 'btn btn-danger', onClick: () => { g.wrong++; g.combo = 0; nextFC(); }}, '?�� ??공�?'));
  ctrl.appendChild(el('button', { class: 'btn btn-success', onClick: () => { g.correct++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); g.score += 10 + g.combo * 2; addXP(5); state.stats.streak++; nextFC(); }}, '?�� ?�다'));
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
  qbox.innerHTML = `<div class="quiz-emoji">${q.target.emoji}</div><div class="quiz-word">${q.target.word}</div><div class="quiz-prompt">${q.target.romanization || ''}</div>`;
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
    toast(`+${points}??`, 'success');
  } else {
    g.wrong++; g.combo = 0; state.stats.streak = 0;
    toast('?�쉬?�요', 'danger');
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
  root.appendChild(el('p', { class: 'text-muted', style: 'text-align:center; margin-top:14px' }, `${g.matched.size}/${g.pairs.length} �??�료`));
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
  sentence.innerHTML = `<div class="quiz-sentence">${q.display.replace('___', '<span class="quiz-blank">___</span>')}</div><div class="quiz-hint">?�� ${q.en}</div>`;
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
    toast(`?�답! +${points}??, 'success');
  } else {
    g.wrong++; g.combo = 0; state.stats.streak = 0;
    toast(`?�답: ${q.answer}`, 'danger');
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
  root.appendChild(el('p', { class: 'quiz-hint', style: 'background:#fff; padding:14px; border-radius:12px; margin-bottom:14px; font-size:1.05rem' }, '?�� ' + q.en));

  const target = el('div', { class: 'so-target' });
  if (g.placed.length === 0) target.appendChild(el('span', { class: 'text-muted' }, '?�래 ?�어�??�서?��??�릭?�세??));
  g.placed.forEach((p, i) => target.appendChild(el('div', { class: 'so-word', onClick: () => { g.placed.splice(i, 1); render(); }}, p.w)));
  root.appendChild(target);

  const bank = el('div', { class: 'so-bank' });
  g.bank.forEach(b => {
    const used = g.placed.includes(b);
    bank.appendChild(el('div', { class: 'so-word' + (used ? ' used' : ''), onClick: () => { if (!used) { g.placed.push(b); render(); }}}, b.w));
  });
  root.appendChild(bank);
  root.appendChild(el('button', { class: 'btn btn-primary btn-block btn-lg', style: 'margin-top:14px', onClick: submitSO }, '???�출'));
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
    toast(`?�벽! +${points}`, 'success');
  } else {
    g.wrong++; g.combo = 0; state.stats.streak = 0;
    toast(`?�답: ${q.original}`, 'danger');
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
  box.innerHTML = `<div>${q.sentence}</div><div class="text-muted" style="margin-top:10px; font-size:0.95rem">?�도: ${q.en}</div>`;
  root.appendChild(box);
  const btns = el('div', { class: 'ox-buttons' });
  btns.appendChild(el('button', { class: 'ox-btn o', onClick: () => answerOX(true, q) }, '�?));
  btns.appendChild(el('button', { class: 'ox-btn x', onClick: () => answerOX(false, q) }, '??));
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
    toast(`?�답! +${points}`, 'success');
  } else {
    g.wrong++; g.combo = 0; state.stats.streak = 0;
    toast(q.correct ? '?��? �? : '?��? ??, 'danger');
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
  const questionHtml = q.question.replace(/_+/, '<span class="quiz-blank">___</span>');
  const hint = getTranslation(q.hint, '');
  sentence.innerHTML = `<div class="quiz-sentence">${questionHtml}</div>` + (hint ? `<div class="quiz-hint">?�� ${hint}</div>` : '');
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
    toast(`?�답! +${points}??, 'success');
  } else {
    g.wrong++; g.combo = 0; state.stats.streak = 0;
    toast(`?�답: ${q.options[q.correct]}`, 'danger');
  }
  setTimeout(() => { g.index++; if (g.index >= g.total) showResult(); else render(); }, 1700);
}

/* =========================================================
   RESULT
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
  const icon = g.finalStars >= 3 ? '?��' : g.finalStars >= 2 ? '?��' : g.finalStars >= 1 ? '?��' : '?��';
  const title = g.finalStars >= 3 ? '?�벽?�요!' : g.finalStars >= 2 ? '?�했?�요!' : g.finalStars >= 1 ? '좋아??' : '?�시 ?�전!';
  card.innerHTML = `<div class="icon">${icon}</div><div class="title">${title}</div><div class="text-muted">${ACTIVITIES[g.activity].name} ?�료</div>`;

  const stars = el('div', { class: 'stars' });
  for (let i = 0; i < 3; i++) stars.appendChild(el('span', { class: i < g.finalStars ? 'filled' : 'empty' }, '??));
  card.appendChild(stars);

  const stats = el('div', { class: 'result-stats' });
  [['?�수', g.score], ['?�답�?, g.finalPercent + '%'], ['최고 콤보', g.maxCombo + 'x']].forEach(([l, v]) => {
    const s = el('div', { class: 'result-stat' });
    s.innerHTML = `<div class="val">${v}</div><div class="lbl">${l}</div>`;
    stats.appendChild(s);
  });
  card.appendChild(stats);

  (g.newBadges || []).forEach(b => card.appendChild(el('div', { class: 'badge-earned' }, '?���?' + b.name)));

  const actions = el('div', { style: 'display:flex; gap:10px; margin-top:14px' });
  actions.appendChild(el('button', { class: 'btn btn-ghost', style: 'flex:1', onClick: () => { state.view = 'student-unit'; render(); }}, '?�원?�로'));
  actions.appendChild(el('button', { class: 'btn btn-primary', style: 'flex:1', onClick: () => startActivity(g.activity) }, '?�� ?�시'));
  card.appendChild(actions);
  root.appendChild(card);
  return root;
}

/* =========================================================
   STARTUP
   ========================================================= */
(async function init() { await loadAll(); render(); })();
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
  { code: 'en', name: 'English',      flag: '🇺🇸' },
  { code: 'zh', name: '中文',         flag: '🇨🇳' },
  { code: 'ja', name: '日本語',       flag: '🇯🇵' },
  { code: 'th', name: 'ภาษาไทย',    flag: '🇹🇭' },
  { code: 'es', name: 'Español',     flag: '🇪🇸' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ne', name: 'नेपाली',      flag: '🇳🇵' },
  { code: 'hi', name: 'हिन्दी',      flag: '🇮🇳' }
];

const SAMPLE_UNIT = {
  id: 1,
  title: '9단원 - 공원에서 산책했어요',
  vocabulary: [
    { word: '영화관', romanization: 'yeong-hwa-gwan', emoji: '🎦', translations: { en: 'movie theater', zh: '电影院', ja: '映画館', th: 'โรงภาพยนตร์', es: 'cine', vi: 'rạp chiếu phim', ne: 'चलचित्र हल', hi: 'सिनेमा हॉल' }},
    { word: '백화점', romanization: 'baek-hwa-jeom', emoji: '🏬', translations: { en: 'department store', zh: '百货商店', ja: 'デパート', th: 'ห้างสรรพสินค้า', es: 'grandes almacenes', vi: 'cửa hàng bách hóa', ne: 'डिपार्टमेन्ट स्टोर', hi: 'डिपार्टमेंट स्टोर' }},
    { word: '놀이공원', romanization: 'no-ri-gong-won', emoji: '🎡', translations: { en: 'amusement park', zh: '游乐场', ja: '遊園地', th: 'สวนสนุก', es: 'parque de atracciones', vi: 'công viên giải trí', ne: 'मनोरञ्जन पार्क', hi: 'मनोरंजन पार्क' }},
    { word: '도서관', romanization: 'do-seo-gwan', emoji: '📚', translations: { en: 'library', zh: '图书馆', ja: '図書館', th: 'ห้องสมุด', es: 'biblioteca', vi: 'thư viện', ne: 'पुस्तकालय', hi: 'पुस्तकालय' }},
    { word: '박물관', romanization: 'bak-mul-gwan', emoji: '🏛', translations: { en: 'museum', zh: '博物馆', ja: '博物館', th: 'พิพิธภัณฑ์', es: 'museo', vi: 'bảo tàng', ne: 'संग्रहालय', hi: 'संग्रहालय' }},
    { word: '수영장', romanization: 'su-yeong-jang', emoji: '🏊', translations: { en: 'swimming pool', zh: '游泳池', ja: 'プール', th: 'สระว่ายน้ำ', es: 'piscina', vi: 'hồ bơi', ne: 'पौडी पोखरी', hi: 'तैराकी का तालाब' }},
    { word: '공원', romanization: 'gong-won', emoji: '🌿', translations: { en: 'park', zh: '公园', ja: '公園', th: 'สวนสาธารณะ', es: 'parque', vi: 'công viên', ne: 'बगैंचा', hi: 'पार्क' }},
    { word: '산책하다', romanization: 'san-chae-ka-da', emoji: '🚶', translations: { en: 'to take a walk', zh: '散步', ja: '散歩する', th: 'เดินเล่น', es: 'pasear', vi: 'đi dạo', ne: 'हिँड्न जानु', hi: 'टहलना' }},
    { word: '쇼핑하다', romanization: 'syo-ping-ha-da', emoji: '🛍', translations: { en: 'to shop', zh: '购物', ja: '買い物する', th: 'ช้อปปิ้ง', es: 'comprar', vi: 'mua sắm', ne: 'किनमेल गर्नु', hi: 'खरीदारी करना' }},
    { word: '자전거를 타다', romanization: 'ja-jeon-geo-reul ta-da', emoji: '🚴', translations: { en: 'to ride a bike', zh: '骑自行车', ja: '自転車に乗る', th: 'ขี่จักรยาน', es: 'andar en bici', vi: 'đi xe đạp', ne: 'साइकल चलाउनु', hi: 'साइकल चलाना' }}
  ],
  grammar: [
    {
      pattern: '~에서 (장소)',
      explanation: { en: 'Particle attached to a place noun, indicating where an action takes place.', zh: '附加在场所名词后，表示动作发生的地点。', ja: '場所を表す名詞に付き、動作が行われる場所を示します。', th: 'คำภาคีที่ติดกับคำนามสถานที่ บ่งบอกสถานที่ที่การกระทำเกิดขึ้น', es: 'Partícula que se añade a un lugar para indicar dónde ocurre la acción.', vi: 'Trợ từ gắn với danh từ chỉ nơi chốn.', ne: 'स्थान बताउने शब्दयोजी — क्रिया कहाँ हुन्छ भनी देखाउँछ।', hi: 'स्थान सूचक कण — बताता है कि क्रिया कहाँ होती है।' },
      examples: [
        { ko: '집에서 청소해요.', en: 'I clean at home.' },
        { ko: '회사에서 일해요.', en: 'I work at the company.' },
        { ko: '공원에서 산책해요.', en: 'I walk in the park.' }
      ]
    },
    {
      pattern: '-었/았 (과거형)',
      explanation: { en: 'Past tense marker attached to verbs/adjectives. Use 았 after vowels ㅏ/ㅗ, 었 after others.', zh: '过去时态标记，附加于动词和形容词。', ja: '動詞・形容詞の語幹に付く過去形語尾。', th: 'เครื่องหมายอดีตติดกับกริยา/คุณศัพท์', es: 'Marca de pasado para verbos y adjetivos.', vi: 'Dấu hiệu quá khứ gắn với động/tính từ.', ne: 'क्रिया/विशेषणमा लाग्ने भूतकालको प्रत्यय।', hi: 'क्रिया/विशेषण के साथ लगने वाला भूतकाल का प्रत्यय।' },
      examples: [
        { ko: '도서관에서 책을 읽었어요.', en: 'I read a book at the library.' },
        { ko: '날씨가 좋았어요.', en: 'The weather was good.' },
        { ko: '친구를 만났어요.', en: 'I met a friend.' }
      ]
    }
  ],
  quizzes: [
    { question: '도서관 ___ 책을 읽어요', options: ['에서', '이', '을', '은'], correct: 0, hint: { en: 'I read a book at the library.', zh: '我在图书馆看书。', ja: '図書館で本を読みます。', th: 'ฉันอ่านหนังสือที่ห้องสมุด', es: 'Leo un libro en la biblioteca.', vi: 'Tôi đọc sách ở thư viện.', ne: 'म पुस्तकालयमा किताब पढ्छु।', hi: 'मैं पुस्तकालय में किताब पढ़ता हूँ।' }},
    { question: '공원 ___ 산책해요.', options: ['이', '에서', '를', '은'], correct: 1, hint: { en: 'I take a walk at the park.', zh: '我在公园散步。', ja: '公園で散歩します。', th: 'ฉันเดินเล่นที่สวน', es: 'Paseo en el parque.', vi: 'Tôi đi dạo ở công viên.', ne: 'म बगैंचामा हिँड्छु।', hi: 'मैं पार्क में टहलता हूँ।' }},
    { question: '어제 친구를 ___.', options: ['만나요', '만났어요', '만날 거예요', '만나'], correct: 1, hint: { en: 'I met a friend yesterday. (past tense)', zh: '昨天见了朋友。', ja: '昨日友達に会いました。', th: 'เมื่อวานฉันพบเพื่อน', es: 'Ayer vi a un amigo.', vi: 'Hôm qua tôi gặp bạn.', ne: 'हिजो साथीलाई भेटें। (भूतकाल)', hi: 'कल मैं दोस्त से मिला। (भूतकाल)' }},
    { question: '토요일에 도서관에서 책을 ___.', options: ['읽어요', '읽을 거예요', '읽었어요', '읽다'], correct: 2, hint: { en: 'I read a book at the library on Saturday. (past)', zh: '星期六在图书馆看了书。', ja: '土曜日に図書館で本を読みました。', th: 'วันเสาร์ฉันอ่านหนังสือที่ห้องสมุด', es: 'El sábado leí en la biblioteca.', vi: 'Thứ bảy tôi đọc sách ở thư viện.', ne: 'शनिबार पुस्तकालयमा किताब पढें।', hi: 'शनिवार को पुस्तकालय में किताब पढ़ी।' }},
    { question: '날씨가 아주 ___.', options: ['좋다', '좋아요', '좋았어요', '좋을 거예요'], correct: 2, hint: { en: 'The weather was very good. (past)', zh: '天气非常好。', ja: '天気がとても良かったです。', th: 'อากาศดีมาก', es: 'El tiempo estuvo muy bueno.', vi: 'Thời tiết rất đẹp.' }},
    { question: '백화점 ___ 쇼핑했어요', options: ['에서', '이', '을', '은'], correct: 0, hint: { en: 'I shopped at the department store.', zh: '我在百货商店购物了。', ja: 'デパートで買い物しました。', th: 'ฉันช้อปปิ้งที่ห้าง', es: 'Compré en la tienda.', vi: 'Tôi mua sắm ở cửa hàng.' }}
  ]
};

const ACTIVITIES = {
  flashcard: { name: 'Flashcards',   icon: '📸', type: 'vocab',   desc: '단어 카드' },
  quiz:      { name: '4지선다 퀴즈', icon: '❓',      type: 'vocab',   desc: '답 맞히기' },
  matching:  { name: '매칭 게임',    icon: '🧩', type: 'vocab',   desc: '쌍 맞추기' },
  fillblank: { name: '빈칸 채우기',  icon: '✏️', type: 'grammar', desc: '문장 완성' },
  sentorder: { name: '문장 순서',    icon: '🔢', type: 'grammar', desc: '단어 배열' },
  oxquiz:    { name: 'OX 퀴즈',      icon: '⭕',      type: 'grammar', desc: '문법 판단' },
  pdfquiz:   { name: 'PDF 퀴즈',     icon: '📋', type: 'pdfquiz', desc: '학습지 문제' }
};

const PROVIDERS = {
  anthropic: { name: 'Anthropic', icon: '🟠', models: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-7'], keyHint: 'sk-ant-api03-...' },
  openai:    { name: 'OpenAI',    icon: '🟢', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'], keyHint: 'sk-proj-...' },
  gemini:    { name: 'Gemini',    icon: '🔵', models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'], keyHint: 'AIzaSy...' },
  groq:      { name: 'Groq',      icon: '⚡', models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'], keyHint: 'gsk_...' }
};
function getProvider() { return localStorage.getItem('ai_provider') || 'anthropic'; }
function setProvider(p) { localStorage.setItem('ai_provider', p); }
function getApiKey(p) { return localStorage.getItem('ai_key_' + (p || getProvider())) || ''; }
function setApiKey(p, k) { if (k) localStorage.setItem('ai_key_' + p, k); else localStorage.removeItem('ai_key_' + p); }
function getModel(p) { const pr = p || getProvider(); const saved = localStorage.getItem('ai_model_' + pr); return (saved && PROVIDERS[pr].models.includes(saved)) ? saved : PROVIDERS[pr].models[0]; }
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
    const geminiVersion = model.startsWith('gemini-1.5') ? 'v1' : 'v1beta';
    const res = await fetch(`https://generativelanguage.googleapis.com/${geminiVersion}/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!res.ok) {
      let errMsg = '';
      try { const e = await res.json(); errMsg = e?.error?.message || ''; } catch {}
      throw new Error(`Gemini 오류 ${res.status}: ${errMsg || res.statusText}`);
    }
    const data = await res.json();
    text = data.candidates[0].content.parts[0].text;
  }
  if (!text || !text.trim()) throw new Error('AI 응답이 비어 있습니다.');
  return text;
}

let state = {
  view: 'home',
  language: 'en',
  students: [],
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
    const payload = JSON.stringify({ units: state.units, stats: state.stats, settings: { language: state.language, students: state.students }});
    await _withRetry(() => window.storage.set(STORAGE_KEY, payload), 3);
    if (!_storageOK) { _storageOK = true; toast('저장 복구됨', 'success'); }
  } catch (e) {
    if (_storageOK) { _storageOK = false; toast('⚠️ 자동저장 일시 중단', 'accent'); }
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
      state.students = (data.settings && data.settings.students) || [];
      return;
    }
  } catch (e) {
    console.warn('Storage unavailable, using defaults');
    _storageOK = false;
    setTimeout(() => toast('⚠️ 저장소 접근 오류 - 메모리에 임시 저장됩니다', 'accent'), 800);
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
  return obj[state.language] || obj.en || obj.ko || fallback;
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
    return 'PDF에서 텍스트를 추출하지 못했습니다. 이미지 기반(스캔) PDF는 지원되지 않습니다. 직접 입력을 이용하세요.';
  }
  const contentOnly = pdfText.replace(/---\s*Page\s*\d+\s*---/g, '').trim();
  if (contentOnly.length < 20) {
    return 'PDF에서 텍스트를 읽을 수 없습니다. 이 PDF는 한국어 전용 폰트(CIDFont) 인코딩을 사용해 브라우저에서 텍스트 추출이 불가능합니다.\n\n해결 방법: 직접 입력 탭에서 단원 내용을 붙여넣기 하거나 수동으로 입력하세요.';
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
  bar.appendChild(el('div', { class: 'logo' }, '한국어 학습'));
  const stats = el('div', { class: 'stats-row' });
  if (state.view !== 'home') {
    stats.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: goHome }, '🏠'));
  }
  const _pv = getProvider(); const _pk = !!getApiKey(_pv); const _pi = PROVIDERS[_pv];
  stats.appendChild(el('button', {
    class: 'btn btn-sm',
    style: `background:${_pk ? '#dcfce7' : '#fef2f2'}; color:${_pk ? '#166534' : '#991b1b'}; border:1.5px solid ${_pk ? '#86efac' : '#fca5a5'}`,
    onClick: showApiKeyModal
  }, _pk ? `${_pi.icon} ${_pi.name} ✓` : '⚠️ AI 설정'));
  const lang = getLangInfo();
  stats.appendChild(el('div', { class: 'stat-chip lang', onClick: showLangModal }, `${lang.flag} ${lang.code.toUpperCase()}`));
  stats.appendChild(el('div', { class: 'stat-chip level' }, `⭐ Lv.${state.stats.level}`));
  stats.appendChild(el('div', { class: 'stat-chip xp' }, `✨${state.stats.xp}`));
  if (state.stats.streak > 0) stats.appendChild(el('div', { class: 'stat-chip streak' }, `🔥 ${state.stats.streak}`));
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

/* =========================================================
   HOME
   ========================================================= */
function renderHome() {
  const root = el('div');

  const hero = el('div', { class: 'home-hero' });
  hero.appendChild(el('h1', {}, '한국어 학습 도구'));
  hero.appendChild(el('p', {}, 'Korean Learning App'));
  root.appendChild(hero);

  // Language selector
  const langPanel = el('div', { class: 'home-lang-panel' });
  langPanel.appendChild(el('h3', {}, '🌍 학생 언어 선택 (Student\'s Language)'));
  langPanel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:14px' }, '수업 시작 전 학생이 사용하는 언어를 선택하세요.'));
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

  // Student roster
  const namePanel = el('div', { class: 'home-lang-panel', style: 'margin-top:12px' });
  namePanel.appendChild(el('h3', {}, '🧑‍🎓 학생 명단 (Students)'));
  namePanel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:10px' }, '게임 중 학생 이름이 문제와 함께 표시됩니다.'));

  const studentList = el('div', { style: 'display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px' });
  state.students.forEach((name, i) => {
    const chip = el('div', { style: 'display:flex; align-items:center; gap:6px; background:#ede9fe; border-radius:20px; padding:6px 14px; font-size:0.95rem; font-weight:600; color:#5b21b6' });
    chip.appendChild(el('span', {}, name));
    chip.appendChild(el('button', {
      style: 'background:none; border:none; cursor:pointer; color:#7c3aed; font-size:1rem; padding:0; line-height:1',
      onClick: () => { state.students.splice(i, 1); persistAll(); render(); }
    }, '✕'));
    studentList.appendChild(chip);
  });
  namePanel.appendChild(studentList);

  const addRow = el('div', { style: 'display:flex; gap:8px' });
  const addInput = el('input', {
    type: 'text',
    placeholder: '이름 입력 / Enter name',
    style: 'flex:1; padding:10px 14px; border-radius:10px; border:2px solid #e2e8f0; font-size:1rem; box-sizing:border-box;'
  });
  const doAdd = () => {
    const name = addInput.value.trim();
    if (!name || state.students.includes(name)) return;
    state.students.push(name);
    persistAll();
    render();
  };
  addInput.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });
  addRow.appendChild(addInput);
  addRow.appendChild(el('button', {
    class: 'btn btn-primary',
    onClick: doAdd
  }, '+ 추가'));
  namePanel.appendChild(addRow);
  root.appendChild(namePanel);

  // Mode selection
  const grid = el('div', { class: 'mode-grid' });
  const teacherCard = el('div', { class: 'mode-card', onClick: () => { state.view = 'teacher'; render(); }});
  teacherCard.innerHTML = '<div class="icon">📚✏️</div><h3>교사 모드</h3><p>Teacher Mode</p><p style="font-size:0.9rem; margin-top:8px; color:#94a3b8">단원 관리 · PDF 자동 변환</p>';

  const studentCard = el('div', { class: 'mode-card', onClick: () => { state.view = 'student'; render(); }});
  studentCard.innerHTML = '<div class="icon">🎓</div><h3>학생 모드</h3><p>Student Mode</p><p style="font-size:0.9rem; margin-top:8px; color:#94a3b8">게임으로 한국어 배우기</p>';

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
  head.appendChild(el('h2', {}, '단원 관리'));
  head.appendChild(el('button', { class: 'btn btn-primary', onClick: () => { state.view = 'teacher-create'; render(); }}, '+ 새 단원'));
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
      actions.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onClick: () => editUnit(u.id) }, '✏️ 편집'));
      actions.appendChild(el('button', { class: 'btn btn-danger btn-sm', onClick: () => deleteUnit(u.id) }, '🗑️'));
      item.append(info, actions);
      list.appendChild(item);
    });
    panel.appendChild(list);
  }
  root.appendChild(panel);

  // Danger zone - reset all data
  const dangerPanel = el('div', { class: 'panel', style: 'border-left:4px solid var(--danger)' });
  dangerPanel.appendChild(el('h3', { style: 'color:var(--danger)' }, '⚠️ 데이터 초기화'));
  dangerPanel.appendChild(el('p', { class: 'text-muted', style: 'margin-bottom:12px' }, '모든 단원, 점수, 레벨, 배지를 삭제하고 처음부터 다시 시작합니다. 샘플 단원으로 초기화되며 되돌릴 수 없습니다.'));
  dangerPanel.appendChild(el('button', { class: 'btn btn-danger', onClick: async () => {
    const ok1 = await showConfirm('⚠️ 데이터 초기화', '정말 모든 데이터를 삭제하시겠습니까?\n\n- 모든 단원 삭제\n- 점수/레벨/배지 초기화\n- 샘플 단원으로 초기화\n\n⚠️ 되돌릴 수 없습니다.', true);
    if (!ok1) return;
    const ok2 = await showConfirm('마지막 확인', '정말로 처음부터 다시 시작하시겠습니까?', true);
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
    toast('초기화 완료. 처음부터 시작합니다.', 'success');
    render();
  }}, '🗑️ 모든 데이터 초기화하기'));
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
  panel.appendChild(el('h2', { style: 'margin-top:10px' }, '새 단원 만들기'));

  const opts = el('div', { class: 'create-options' });

  const pdfOpt = el('div', { class: 'option-card' });
  pdfOpt.innerHTML = '<div class="icon">📄</div><div class="label">PDF 자동 변환</div><div class="desc">학습지 PDF에서 어휘·문법·퀴즈를 자동 추출</div>';
  const fileInput = el('input', { type: 'file', accept: 'application/pdf', style: 'margin-top:10px; font-size:0.92rem' });
  fileInput.onchange = handlePDFUpload;
  pdfOpt.appendChild(fileInput);

  const manualOpt = el('div', { class: 'option-card', onClick: createBlankUnit });
  manualOpt.innerHTML = '<div class="icon">✏️</div><div class="label">직접 입력</div><div class="desc">새 단원을 만들어 직접 입력</div>';

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
    btns.appendChild(el('button', { class: danger ? 'btn btn-danger' : 'btn btn-primary', onClick: () => { root.innerHTML = ''; resolve(true); }}, danger ? '삭제' : '확인'));
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
    const okBtn = el('button', { class: 'btn btn-primary', onClick: () => { const v = input.value.trim(); root.innerHTML = ''; resolve(v || null); }}, '확인');
    btns.appendChild(okBtn);
    modal.appendChild(btns);
    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    setTimeout(() => input.focus(), 50);
    input.onkeydown = (e) => { if (e.key === 'Enter') okBtn.click(); };
  });
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

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = () => rej(new Error('Read failed'));
    r.readAsDataURL(file);
  });
}

// Gemini File API: PDF를 직접 업로드해 CIDFont 한국어 PDF도 처리
async function uploadToGeminiFiles(file, key) {
  const boundary = 'boundary_' + Math.random().toString(36).slice(2);
  const metadata = JSON.stringify({ file: { display_name: file.name, mimeType: 'application/pdf' } });
  const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`;
  const endPart = `\r\n--${boundary}--`;
  const metaBytes = new TextEncoder().encode(metaPart);
  const endBytes = new TextEncoder().encode(endPart);
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  const body = new Uint8Array(metaBytes.length + fileBytes.length + endBytes.length);
  body.set(metaBytes, 0);
  body.set(fileBytes, metaBytes.length);
  body.set(endBytes, metaBytes.length + fileBytes.length);
  const res = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}`, 'X-Goog-Upload-Protocol': 'multipart' },
    body
  });
  if (!res.ok) {
    let msg = '';
    try { msg = (await res.json())?.error?.message || ''; } catch {}
    throw new Error(`PDF 업로드 실패 ${res.status}: ${msg}`);
  }
  return (await res.json()).file; // { name, uri, mimeType, ... }
}

async function callGeminiWithFile(fileUri, prompt, key, model) {
  const ver = model.startsWith('gemini-1.5') ? 'v1' : 'v1beta';
  const res = await fetch(`https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [
      { file_data: { mime_type: 'application/pdf', file_uri: fileUri } },
      { text: prompt }
    ] }] })
  });
  if (!res.ok) {
    let msg = '';
    try { msg = (await res.json())?.error?.message || ''; } catch {}
    throw new Error(`Gemini 오류 ${res.status}: ${msg}`);
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

function deleteGeminiFile(fileName, key) {
  fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${key}`, { method: 'DELETE' }).catch(() => {});
}

// PDF.js for text extraction (avoids 413 errors with large image-heavy PDFs)
async function loadPdfJs() {
  if (window.pdfjsLib) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('PDF.js 로딩 실패'));
    document.head.appendChild(s);
  });
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
  vocabPanel.appendChild(el('h2', {}, `📚 어휘 (${unit.vocabulary.length})`));

  const missingTrans = unit.vocabulary.filter(v => !v.translations || !v.translations.zh || !v.translations.ja).length;
  if (unit.vocabulary.length > 0 && missingTrans > 0) {
    vocabPanel.appendChild(el('button', { class: 'btn btn-accent btn-block', style: 'margin-bottom:12px', onClick: () => bulkTranslateVocab(unit) },
      `🌐 모든 단어 자동 번역 (${missingTrans}개 · 6개 언어)`));
  }

  unit.vocabulary.forEach((v, i) => {
    const item = el('div', { class: 'vocab-edit-item' });
    const grid = el('div', { class: 'vocab-edit-grid' });
    const emojiIn = el('input', { type: 'text', value: v.emoji || '', placeholder: '😀' });
    emojiIn.oninput = () => { v.emoji = emojiIn.value; };
    const wordIn = el('input', { type: 'text', value: v.word, placeholder: '한국어' });
    wordIn.oninput = () => { v.word = wordIn.value; };
    const romanIn = el('input', { type: 'text', value: v.romanization || '', placeholder: '발음' });
    romanIn.oninput = () => { v.romanization = romanIn.value; };
    const meaningIn = el('input', { type: 'text', value: (v.translations && v.translations.en) || '', placeholder: 'English' });
    meaningIn.oninput = () => { if (!v.translations) v.translations = {}; v.translations.en = meaningIn.value; };
    const delBtn = el('button', { class: 'btn btn-danger btn-sm', onClick: () => { unit.vocabulary.splice(i, 1); persistAll(); render(); }}, '🗑️');
    grid.append(emojiIn, wordIn, romanIn, meaningIn, delBtn);
    item.appendChild(grid);
    item.appendChild(el('button', { class: 'btn btn-accent btn-sm', style: 'margin-top:8px', onClick: () => autoTranslateVocab(v) }, '🌐 자동 번역'));
    vocabPanel.appendChild(item);
  });
  vocabPanel.appendChild(el('button', { class: 'btn btn-primary btn-block', style: 'margin-top:14px; padding:14px', onClick: () => addVocab(unit) }, '+ 단어 추가하기'));
  root.appendChild(vocabPanel);

  // Grammar
  const grPanel = el('div', { class: 'panel' });
  grPanel.appendChild(el('h2', {}, `📖 문법 (${unit.grammar.length})`));

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
    item.appendChild(el('button', { class: 'btn btn-danger btn-sm', style: 'margin-top:8px', onClick: () => { unit.grammar.splice(i, 1); persistAll(); render(); }}, '🗑️ 삭제'));
    grPanel.appendChild(item);
  });
  grPanel.appendChild(el('button', { class: 'btn btn-primary btn-block', style: 'margin-top:14px; padding:14px', onClick: () => addGrammar(unit) }, '+ 문법 추가하기'));
  root.appendChild(grPanel);

  // Quizzes
  const qzPanel = el('div', { class: 'panel' });
  qzPanel.appendChild(el('h2', {}, `📝 PDF 퀴즈 (${unit.quizzes.length})`));
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

    item.appendChild(el('button', { class: 'btn btn-danger btn-sm', style: 'margin-top:8px', onClick: () => { unit.quizzes.splice(i, 1); persistAll(); render(); }}, '🗑️ 삭제'));
    qzPanel.appendChild(item);
  });
  qzPanel.appendChild(el('button', { class: 'btn btn-primary btn-block', style: 'margin-top:14px; padding:14px', onClick: () => addQuiz(unit) }, '+ 퀴즈 추가하기'));
  root.appendChild(qzPanel);

  // Save
  const savePanel = el('div', { class: 'panel' });
  const vocabNeedCount = unit.vocabulary.filter(v => v.word && (!v.translations || !v.translations.zh)).length;
  const grammarNeedCount = unit.grammar.filter(g => g.explanation && g.explanation.en && (!g.explanation.zh)).length;
  const totalNeed = vocabNeedCount + grammarNeedCount;
  const btnLabel = totalNeed > 0
    ? `💾 저장하기 + 자동 번역 (어휘 ${vocabNeedCount} · 문법 ${grammarNeedCount})`
    : '저장하기';
  savePanel.appendChild(el('button', { class: 'btn btn-success btn-block btn-lg', onClick: async () => { await saveWithAutoTranslate(unit); }}, btnLabel));
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

async function autoTranslateVocab(v) {
  if (!v.word) { toast('먼저 한국어 단어 입력', 'danger'); return; }
  toast('🌐 번역 중..', 'accent');
  try {
    const prompt = `For the Korean word "${v.word}", return ONLY JSON: {"romanization":"...","emoji":"X","translations":{"en":"...","zh":"...","ja":"...","th":"...","es":"...","vi":"..."}} - romanization with hyphens, ONE emoji.`;
    const text = await callAI(prompt);
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
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
      const arr = JSON.parse(text.replace(/```json|```/g, '').trim());
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
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
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
   STUDENT
   ========================================================= */
function renderStudent() {
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
      tile.innerHTML = `<div class="num">${i + 1}</div><div class="title">${u.title.replace(/^\d+(?:단원|단)?\s*-?\s*/, '')}</div><div class="progress">${u.vocabulary.length} 단어 · ${u.grammar.length} 문법 · ${(u.quizzes || []).length} 퀴즈</div>`;
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
   GAMES
   ========================================================= */
function advanceStudent() {
  if (state.game && state.students.length > 1)
    state.game.currentStudentIdx = (state.game.currentStudentIdx + 1) % state.students.length;
}

function initGame(activity) {
  const unit = state.units.find(u => u.id === state.currentUnitId);
  state.game = { activity, unit, score: 0, combo: 0, maxCombo: 0, correct: 0, wrong: 0, index: 0, total: 0, currentStudentIdx: 0 };
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
  gh.appendChild(el('button', { class: 'back-btn', onClick: exitGame }, '✕ 종료'));
  const progress = el('div', { class: 'game-progress' });
  const pct = state.game.total ? Math.min(100, (state.game.index / state.game.total) * 100) : 0;
  progress.appendChild(el('div', { class: 'game-progress-bar', style: `width:${pct}%` }));
  gh.appendChild(progress);
  gh.appendChild(el('div', { class: 'game-info' }, `${state.game.index}/${state.game.total} · ${state.game.score}점`));
  if (state.game.combo >= 3) gh.appendChild(el('div', { class: 'combo-display' }, `🔥 ${state.game.combo}x`));
  if (state.students.length > 0) {
    const name = state.students[state.game.currentStudentIdx % state.students.length];
    gh.appendChild(el('div', { style: 'background:#ede9fe; color:#5b21b6; border-radius:20px; padding:4px 14px; font-weight:700; font-size:0.95rem; margin-top:6px; text-align:center' }, `🧑‍🎓 ${name}의 차례`));
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
  ctrl.appendChild(el('button', { class: 'btn btn-ghost', onClick: () => { g.flipped = !g.flipped; render(); }}, '뒤집기'));
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
    toast(`+${points}점`, 'success');
  } else {
    g.wrong++; g.combo = 0; state.stats.streak = 0;
    toast('아쉬워요', 'danger');
  }
  advanceStudent();
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
  sentence.innerHTML = `<div class="quiz-sentence">${q.display.replace('___', '<span class="quiz-blank">___</span>')}</div><div class="quiz-hint">💡 ${q.en}</div>`;
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
  advanceStudent();
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
  box.innerHTML = `<div>${q.sentence}</div><div class="text-muted" style="margin-top:10px; font-size:0.95rem">힌트: ${q.en}</div>`;
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
  advanceStudent();
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
  sentence.innerHTML = `<div class="quiz-sentence">${questionHtml}</div>` + (hint ? `<div class="quiz-hint">💡 ${hint}</div>` : '');
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
  advanceStudent();
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

/* =========================================================
   STARTUP
   ========================================================= */
(async function init() {
  try {
    await loadAll();
    render();
  } catch (e) {
    console.error('App init failed:', e);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '<div style="color:#fff;background:rgba(0,0,0,0.7);padding:24px;border-radius:12px;margin:20px;font-family:monospace;white-space:pre-wrap">Error: ' + e.message + '\n\n' + e.stack + '</div>';
    }
  }
})();
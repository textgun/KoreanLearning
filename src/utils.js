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

// 단원을 난이도 순서대로 묶는다. 단원이 없는 난이도는 결과에서 제외한다.
// 공용 단원 id는 원본 id에 접두어를 붙여 고정한다.
// 진도 기록이 `${unitId}_${activity}` 키라 id가 바뀌면 학생 진도가 초기화된다
const SHARED_UNIT_PREFIX = 'shared_';
function sharedIdOf(unitId) { return SHARED_UNIT_PREFIX + unitId; }
function isSharedUnit(unit) { return !!unit && String(unit.id).startsWith(SHARED_UNIT_PREFIX); }

// 화면에 보여줄 전체 단원. 공용 단원이 앞, 내 단원이 뒤다.
// state.units에 절대 합치지 않는다. 합치면 _doSaveTeacher가 state.units를
// 통째로 쓰기 때문에 공용 단원 전체가 교사 문서로 복사된다
function allUnits() {
  const shared = state.sharedUnits || [];
  // 발행한 관리자에게는 원본과 공용본이 둘 다 잡힌다. 원본만 남긴다
  const publishedFromMine = new Set(state.units.map(u => sharedIdOf(u.id)));
  return [...shared.filter(u => !publishedFromMine.has(u.id)), ...state.units];
}

// level이 없거나 아는 값이 아니면 기초로 본다.
// 모르는 값을 그냥 두면 어느 그룹에도 안 들어가 단원이 화면에서 사라진다
function groupUnitsByLevel(units) {
  const codes = LEVELS.map(l => l.code);
  const levelOf = u => (codes.includes(u.level) ? u.level : DEFAULT_LEVEL);
  return LEVELS
    .map(lv => ({ level: lv, units: units.filter(u => levelOf(u) === lv.code) }))
    .filter(g => g.units.length > 0);
}
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

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

// Firestore 오류를 교사가 읽고 조치할 수 있는 문장으로 바꾼다.
// permission-denied가 압도적으로 흔하다. firestore.rules는 저장소에 있을 뿐
// Firebase 콘솔에 직접 게시해야 적용되기 때문이다
function firestoreErrorText(err) {
  if (!err) return '알 수 없는 오류';
  if (err.code === 'permission-denied') return 'Firestore 접근 권한이 없습니다. Firebase 콘솔에 firestore.rules를 게시했는지 확인하세요.';
  if (err.code === 'unavailable') return '서버에 연결할 수 없습니다. 네트워크를 확인하세요.';
  if (err.code === 'unauthenticated') return '로그인이 만료되었습니다. 다시 로그인하세요.';
  return err.message || String(err);
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

// TTS (Text-to-Speech) 한국어 발음 재생 유틸리티
function speak(text) {
  if (!window.speechSynthesis) return;
  // 중복 재생 방지를 위해 기존 음성 취소
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 0.85; // 학습자를 위해 약간 느린 발음 속도 제공
  window.speechSynthesis.speak(u);
}

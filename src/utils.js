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

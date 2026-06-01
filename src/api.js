/* =========================================================
   AI CONFIG & CALL ACTIONS
   ========================================================= */
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

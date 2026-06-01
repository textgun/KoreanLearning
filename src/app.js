/* =========================================================
   STARTUP ENTRY POINT
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
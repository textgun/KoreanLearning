# 원본 HTML에서 CSS/JS/HTML 템플릿을 src/ 폴더로 분리하는 일회성 스크립트
import re
from pathlib import Path

SOURCE = Path("korean_learning_app.html")
SRC = Path("src")
SRC.mkdir(exist_ok=True)

html = SOURCE.read_text(encoding="utf-8")

# CSS 추출
css_match = re.search(r"<style>(.*?)</style>", html, re.DOTALL)
if not css_match:
    raise SystemExit("❌ <style> 블록을 찾을 수 없습니다.")
css = css_match.group(1).strip()

# JS 추출
js_match = re.search(r"<script>(.*?)</script>", html, re.DOTALL)
if not js_match:
    raise SystemExit("❌ <script> 블록을 찾을 수 없습니다.")
js = js_match.group(1).strip()

# window.storage → localStorage 폴리필 추가 (GitHub Pages용)
STORAGE_POLYFILL = """\
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
"""
js = STORAGE_POLYFILL + "\n" + js

# HTML 템플릿 생성 (CSS/JS 자리에 플레이스홀더 삽입)
template = re.sub(r"<style>.*?</style>", "<style>{{STYLE}}</style>", html, flags=re.DOTALL)
template = re.sub(r"<script>.*?</script>", "<script>{{SCRIPT}}</script>", template, flags=re.DOTALL)

(SRC / "style.css").write_text(css, encoding="utf-8")
(SRC / "app.js").write_text(js, encoding="utf-8")
(SRC / "index.html").write_text(template, encoding="utf-8")

print(f"[OK] 추출 완료")
print(f"   src/style.css  ({len(css):,} 자)")
print(f"   src/app.js     ({len(js):,} 자)")
print(f"   src/index.html (템플릿)")

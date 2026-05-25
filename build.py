# src/ 파일들을 합쳐서 GitHub Pages 배포용 dist/index.html을 생성하는 빌드 스크립트
from pathlib import Path
import sys

SRC = Path("src")
DIST = Path("dist")

def main():
    if not SRC.exists():
        print("[ERROR] src/ 폴더가 없습니다. 먼저 extract.py를 실행하세요.")
        sys.exit(1)

    for name in ("index.html", "style.css", "app.js"):
        if not (SRC / name).exists():
            print(f"[ERROR] src/{name} 파일이 없습니다.")
            sys.exit(1)

    DIST.mkdir(exist_ok=True)

    template = (SRC / "index.html").read_text(encoding="utf-8")
    style    = (SRC / "style.css").read_text(encoding="utf-8")
    script   = (SRC / "app.js").read_text(encoding="utf-8")

    output = (template
        .replace('<link rel="stylesheet" href="style.css">', f"<style>\n{style}\n</style>")
        .replace('<script src="app.js"></script>', f"<script>\n{script}\n</script>")
    )
    out_path = DIST / "index.html"
    out_path.write_text(output, encoding="utf-8")

    size_kb = out_path.stat().st_size / 1024
    print(f"[OK] 빌드 완료: dist/index.html ({size_kb:.1f} KB)")

if __name__ == "__main__":
    main()

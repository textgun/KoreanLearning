# src/ 파일들을 합쳐서 GitHub Pages 배포용 dist/index.html을 생성하는 빌드 스크립트
from pathlib import Path
import sys
import re

SRC = Path("src")
DIST = Path("dist")

# 모듈 병합 순서 정의
SCRIPTS = [
    "config.js",
    "storage.js",
    "api.js",
    "utils.js",
    "router.js",
    "views-teacher.js",
    "views-student.js",
    "firebase.js",
    "app.js"
]

def main():
    if not SRC.exists():
        print("[ERROR] src/ 폴더가 없습니다.")
        sys.exit(1)

    # 필수 소스파일 점검
    required_files = ["index.html", "style.css"] + SCRIPTS
    for name in required_files:
        if not (SRC / name).exists():
            print(f"[ERROR] src/{name} 파일이 없습니다.")
            sys.exit(1)

    DIST.mkdir(exist_ok=True)

    template = (SRC / "index.html").read_text(encoding="utf-8")
    style    = (SRC / "style.css").read_text(encoding="utf-8")

    # 모든 스크립트 파일을 순서대로 병합
    concatenated_js = ""
    for script_name in SCRIPTS:
        content = (SRC / script_name).read_text(encoding="utf-8")
        concatenated_js += f"\n// --- {script_name} ---\n{content}\n"

    # CSS 링크 태그 치환
    output = template.replace('<link rel="stylesheet" href="style.css">', f"<style>\n{style}\n</style>")

    # 다중 스크립트 로드 영역 검출 및 병합 스크립트 주입
    # <script src="config.js"></script> ~ <script src="app.js"></script> 까지 매칭
    script_pattern = r"<!-- 모듈화된 개별 스크립트 순차 로드 -->\s*<script src=\"config.js\"></script>.*?<script src=\"app.js\"></script>"
    
    replacement = f"<script>\n{concatenated_js}\n</script>"
    
    # 정규식 치환 (점(.)이 줄바꿈 문자도 매칭하도록 re.DOTALL 사용)
    output, count = re.subn(script_pattern, replacement, output, flags=re.DOTALL)
    
    if count == 0:
        # 정규식 치환에 실패했을 경우를 대비한 대체 치환
        print("[WARNING] 정규식 매칭 실패, 일반 치환을 시도합니다.")
        legacy_script_str = '\n'.join([f'<script src="{s}"></script>' for s in SCRIPTS])
        if legacy_script_str in output:
            output = output.replace(legacy_script_str, replacement)
        else:
            print("[ERROR] index.html의 스크립트 매핑 영역을 검출할 수 없습니다.")
            sys.exit(1)

    out_path = DIST / "index.html"
    out_path.write_text(output, encoding="utf-8")

    size_kb = out_path.stat().st_size / 1024
    print(f"[OK] 빌드 완료: dist/index.html ({size_kb:.1f} KB)")

if __name__ == "__main__":
    main()

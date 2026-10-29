# src/ 파일들을 합쳐서 GitHub Pages 배포용 dist/index.html을 생성하는 빌드 스크립트
from pathlib import Path
from datetime import datetime
import subprocess
import sys
import re
import shutil

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

def build_id():
    """빌드 시각 + 커밋 해시. 커밋 정보를 못 읽으면 시각만 쓴다."""
    stamp = datetime.now().strftime("%m-%d %H:%M")
    try:
        sha = subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                             capture_output=True, text=True, timeout=5)
        if sha.returncode == 0:
            return f"{stamp} ({sha.stdout.strip()})"
    except Exception:
        pass
    return stamp


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
    # 치환값을 람다로 넘긴다. 문자열로 넘기면 병합된 JS 안의 정규식 리터럴(\s, \d 등)을
    # 파이썬이 치환 템플릿의 이스케이프로 해석해 "bad escape" 오류가 난다
    output, count = re.subn(script_pattern, lambda m: replacement, output, flags=re.DOTALL)
    
    if count == 0:
        # 정규식 치환에 실패했을 경우를 대비한 대체 치환
        print("[WARNING] 정규식 매칭 실패, 일반 치환을 시도합니다.")
        legacy_script_str = '\n'.join([f'<script src="{s}"></script>' for s in SCRIPTS])
        if legacy_script_str in output:
            output = output.replace(legacy_script_str, replacement)
        else:
            print("[ERROR] index.html의 스크립트 매핑 영역을 검출할 수 없습니다.")
            sys.exit(1)

    # 빌드 식별자를 심는다. 브라우저가 옛 파일을 캐시하고 있으면
    # "고쳤는데 그대로다"의 원인을 찾는 데 시간이 통째로 날아간다.
    # 화면 왼쪽 아래에 작게 뜨고 콘솔에도 찍힌다
    # 앱 스크립트보다 먼저 실행돼야 하므로 <body> 바로 다음에 넣는다
    output = output.replace("<body>", f"<body>\n<script>window.BUILD_ID = {build_id()!r};</script>", 1)

    out_path = DIST / "index.html"
    out_path.write_text(output, encoding="utf-8")

    # 루트 사본도 함께 갱신한다.
    # 이 둘이 어긋나면 src/를 고쳐도 배포에 반영되지 않는 사고가 난다
    root_copy = Path("korean_learning_app.html")
    root_copy.write_text(output, encoding="utf-8")

    # 교사용 랜딩페이지 시안을 독립된 /teacher/ 경로로 배포한다.
    concept = Path("Concept")
    teacher_dist = DIST / "teacher"
    (teacher_dist / "charater").mkdir(parents=True, exist_ok=True)
    for source, target in [
        ("teacher-landing.html", "index.html"),
        ("teacher-landing.css", "teacher-landing.css"),
        ("apply.html", "apply.html"),
        ("apply.css", "apply.css"),
        ("apply.js", "apply.js"),
    ]:
        shutil.copy2(concept / source, teacher_dist / target)
    for photo in [
        "7c612a2bbebcbd73b882d6dd34dfbb82.jpg",
        "119e4b33766815aadf682f06cfff73b6.jpg",
        "f3744125a88d0ea0a9ee053987587382.jpg",
    ]:
        shutil.copy2(concept / "charater" / photo, teacher_dist / "charater" / photo)

    size_kb = out_path.stat().st_size / 1024
    print(f"[OK] 빌드 완료 ({size_kb:.1f} KB)")
    print(f"   dist/index.html")
    print(f"   korean_learning_app.html (루트 사본 동기화됨)")

if __name__ == "__main__":
    main()

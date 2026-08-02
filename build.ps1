# build.py를 부르는 Windows용 진입점. 빌드 로직은 build.py 한 곳에만 둔다
#
# 이전에는 이 파일이 별도의 빌드 구현을 갖고 있었다. build.py와 치환 방식이 달라
# 결과물이 미묘하게 갈라졌고, 어느 쪽으로 빌드했는지에 따라 배포물이 달라졌다.

$python = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { "py" }
& $python build.py
exit $LASTEXITCODE

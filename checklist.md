# 작업 체크리스트 — 데이터 계층 Firestore 이전 + 빌드 일원화

목표. localStorage에 흩어진 공유 데이터(단원, 학습 기록)를 Firestore로 옮겨
다기기 환경에서 정상 동작하게 만들고, 인증 우회 경로를 제거하고, 빌드 경로를 하나로 합친다.

---

## 0. 준비
- [x] 전체 코드 분석 및 영향 범위 파악
- [x] `node --check` 기준선 확보 (9개 파일 전부 통과)
- [x] checklist.md / context-notes.md 작성

## 1. ③ 인증 우회 제거 (최우선)
- [x] `app.js`의 비로그인 자동 진입 블록 제거 → 미로그인 시 항상 로그인 화면
- [x] 교사가 0명일 때만 가입 화면으로 유도하는 경로 유지
- [x] `firestore.rules` 작성 (교사는 본인 문서만, 학생은 담당 교사만, 관리자는 전체)
- [x] 검증. `grep`으로 `fbGetAllTeachers` 비로그인 호출 경로가 사라졌는지 확인

## 2. ① 학습 기록 Firestore 이전
- [x] `students/{id}` 문서에 `stats` 필드 추가 (xp, level, streak, badges, bestScores)
- [x] `state.currentStudentDoc` 도입 — 이름 대신 firestoreId로 기록을 식별
- [x] `persistStudent()` → `fbUpdateStudent(firestoreId, { stats })`
- [x] `loadStudentStats()` → Firestore에서 로드, 게스트는 localStorage 유지
- [x] 교사 진도 현황 `loadAllStudentProgress()` → Firestore 조회로 교체
- [x] 관리자 진도 `loadStudentsProgress()` → Firestore 조회로 교체
- [x] 리더보드 → Firestore에서 읽은 stats 사용 (localStorage 직접 접근 제거)
- [x] 기존 localStorage 기록 1회 자동 마이그레이션
- [x] 검증. `grep -rn "korean_student_"` 잔존 확인

## 3. ② 단원 Firestore 이전
- [x] `teachers/{uid}` 문서에 `units`, `language` 필드 추가
- [x] `persistTeacher()` → `fbSaveTeacher(uid, { units, language })`
- [x] `loadTeacher()` → 로그인한 교사 문서에서 로드
- [x] 로드 시점을 `loadAll()`(로그인 이전)에서 `onAuthLogin()`(로그인 이후)으로 이동
- [x] 기존 `korean_teacher_v1` 1회 자동 마이그레이션
- [x] 마이그레이션한 로컬 원본을 백업 키로 이동 (다음 교사가 물려받는 것 방지)
- [x] 데이터 초기화 버튼 동작 확인 (`persistTeacher`가 Firestore를 덮어쓰므로 수정 불필요)
- [x] 검증. 교사 전환 시 단원이 섞이지 않는 코드 경로 확인

## 4. ⑤ 빌드 일원화
- [x] **`build.py`가 애초에 실행되지 않던 버그 수정** (`re.subn` bad escape)
- [x] `build.py`가 `dist/index.html` + 루트 `korean_learning_app.html` 둘 다 생성
- [x] `build.ps1` → `build.py` 호출 래퍼로 축소 (로직 중복 제거)
- [x] `deploy.yml` → `python build.py` 실행 후 `dist/` 배포
- [x] 검증. `python3 build.py` 실행 후 산출물 크기·스크립트 병합 확인

## 5. 최종 검증
- [x] `node --check` 전체 통과
- [x] 빌드 산출물에서 JS 추출 후 `node --check` 통과
- [x] 번들에 9개 모듈이 순서대로 병합되었는지 확인
- [x] 루트 HTML과 dist 산출물이 동일한지 확인

---

## 이 작업으로 해결되지 않는 것
- Firestore 보안 규칙은 **Firebase 콘솔에 직접 배포**해야 적용된다. 저장소의
  `firestore.rules`는 파일일 뿐 자동 반영되지 않는다.
- API 키 localStorage 저장 문제(④)는 구조상 그대로다. 프록시 서버가 필요하다.
- `config.js` 샘플 데이터 인코딩 깨짐(⑦)은 이번 범위 밖이다.
- 실제 Firebase 연결 테스트는 수행하지 못했다. 자격 증명과 브라우저가 필요하다.

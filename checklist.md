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

---

# 2차 작업 — 역할 분리 + 단원 난이도 구분

목표. 학생 모드에서 교사·관리자 화면이 새어 나오지 않게 하고,
단원을 기초·중급·고급·마스터 4단계로 나눠 관리한다.

## 6. 관리자 교사 컨텍스트 복구 (선행 버그)
- [x] `onAuthLogin` 관리자 분기가 `state.currentTeacher`를 채우지 않던 문제 수정
- [x] 검증. 관리자로 로그인해 교사 모드에서 학생 명단이 보이는지

## 7. 학생 모드 UI 차단
- [x] `render()`에 관문 추가. 학생 활성 중에는 교사·관리자 화면 진입 차단
- [x] 상단바에서 관리자 버튼 숨김 (학생 활성 시)
- [x] 홈 버튼을 학생 단원 목록으로 (교사 화면으로 빠져나가지 않게)
- [x] 로그아웃 대신 '학생 모드 종료' 버튼 + 확인 대화상자
- [x] 검증. 학생 진입 후 교사·관리자 화면에 도달할 경로가 없는지

## 8. 단원 난이도 4단계
- [x] `config.js`에 `LEVELS` 정의 (기초·중급·고급·마스터)
- [x] `utils.js`에 `groupUnitsByLevel()` 헬퍼
- [x] 단원 생성 화면에 난이도 선택 (PDF 변환·직접 입력 모두 적용)
- [x] 단원 편집 화면에 난이도 변경 드롭다운
- [x] 교사 단원 목록을 난이도별로 묶어 표시
- [x] 학생 단원 선택 화면을 난이도별로 묶어 표시
- [x] 기존 단원은 `level` 필드가 없거나 모르는 값이면 '기초'로 취급
- [x] 검증. 잘못된 level 값에서 단원이 유실되지 않는지 실행 테스트

## 9. 계정 역할 정리 (사용자가 직접 할 콘솔 작업)
- [ ] `piction825@gmail.com` — 관리자 유지 (`isAdmin: true`, 이미 설정됨)
- [ ] `piction.claw@gmail.com` — 교사로 신규 가입 (`isAdmin: false` 자동)
- [x] 학생은 계정 없음. 교사 세션 안에서 이름 선택 (현행 유지)

---

---

# 3차 작업 — 학생 원격 접속 (코드 + PIN)

목표. 학생이 자기 기기에서 직접 접속해 학습하게 한다.
이메일 가입 없이, 서버 없이, 교사 계정을 공유하지 않고.

## 10. 단원 분리 (선행 필수)
- [x] `curricula/{teacherId}` 컬렉션 신설 (`units`, `language`)
- [x] `teachers/{uid}`에서 `units`·`language` 제거 (개인정보와 분리)
- [x] 로그인 시 1회 자동 이전 (교사 문서 → curricula), 성공 후 원본 필드 삭제
- [x] 검증. 교사 문서를 읽지 않고도 단원이 로드되는지

## 11. 역할 개념 도입
- [x] `state.role` = 'teacher' | 'student'
- [x] 로그인 시 학생 여부를 먼저 판정 (교사 문서 자동 생성보다 앞서야 함)
- [x] `studentIndex/{authUid}` — 규칙이 authUid → teacherId를 찾는 경로
- [x] 라우터 관문을 role 기준으로 확장

## 12. 학생 로그인
- [x] 로그인 화면에 교사/학생 탭
- [x] 학생 코드 + PIN 입력 → 합성 이메일로 Firebase 인증
- [x] 로그인 즉시 단원 목록으로 (학생 선택 화면 건너뜀)
- [x] 학생 세션에서는 '종료' 대신 '로그아웃'

## 13. 교사의 코드 발급
- [x] 학생 명단에 '원격 접속 발급' 버튼
- [x] 코드 + 6자리 PIN 자동 생성 (Firebase 최소 비밀번호 6자)
- [x] 보조 Firebase 앱 인스턴스로 계정 생성 (교사 세션 유지)
- [x] 발급 결과를 교사에게 표시, 재발급 지원
- [x] PIN 분실 = 재발급. 이전 계정은 연결이 끊겨 자동 무력화

## 14. 보안 규칙 재작성
- [x] `curricula` — 교사 본인·관리자·담당 학생만
- [x] `students` — 학생은 본인 `stats`만 수정 가능
- [x] `studentIndex` — 클라이언트 조회는 교사·관리자만
- [x] 리더보드 조회 실패 시 화면이 깨지지 않도록 방어

## 15. 검증
- [x] `node --check` 전체 통과
- [x] 순수 로직 실행 테스트 (코드 생성·이메일 변환)
- [x] 빌드 산출물 검증
- [ ] 규칙 놀이터로 학생/교사/관리자 접근 시나리오 확인 (사용자 직접)

---

## 이 작업으로 해결되지 않는 것
- Firestore 보안 규칙은 **Firebase 콘솔에 직접 배포**해야 적용된다. 저장소의
  `firestore.rules`는 파일일 뿐 자동 반영되지 않는다.
- API 키 localStorage 저장 문제(④)는 구조상 그대로다. 프록시 서버가 필요하다.
- `config.js` 샘플 데이터 인코딩 깨짐(⑦)은 이번 범위 밖이다.
- 실제 Firebase 연결 테스트는 수행하지 못했다. 자격 증명과 브라우저가 필요하다.

---

## 16. 학생 등록 모달 (2026-08-10)
- [x] 모달 바깥 클릭 시 즉시 닫히지 않고 "취소하겠습니까?" 확인창
- [x] 확인창은 뒤 모달 위에 겹쳐 띄워 입력값을 보존 (`confirmOverModal`)
- [x] `fbAddStudent` 실패를 `try/catch`로 잡아 토스트로 표시
- [x] 저장 중 추가·취소 버튼 비활성화 (연타 시 중복 문서 방지)
- [x] 이름/나이 입력에서 엔터로 등록
- [x] jsdom으로 모달 동작 검증

## 17. 나머지 학생 모달에도 같은 처리 (2026-08-10)
- [x] 학생 수정 — 바깥 클릭 확인창, 저장 실패 토스트, 저장 중 버튼 잠금, 엔터 저장
- [x] 학생 삭제 (교사 명단·관리자 상세 두 곳) — 실패 시 명단을 건드리지 않는다
- [x] 원격 접속 발급 — 발급 중·PIN 표시 중 바깥 클릭을 붙잡는다
- [x] `toastSaveError()`로 실패 표시를 한 곳에 모음
- [x] jsdom 33개 항목 검증 (전체 통과)


## 18. 진짜 원인 — 교사 컨텍스트 유실 (2026-08-10)
- [x] 재현. `state.currentTeacher`가 null이면 '추가'가 `teacher.students`에서
      TypeError로 죽는다. try/catch 이전이라 토스트도 버튼 잠금도 안 걸린다
- [x] `onAuthLogin` 순서 교정 — 단원·명단 조회보다 먼저 교사 컨텍스트를 세운다
- [x] 교사 문서 조회 실패와 그 이후 실패를 분리 처리
- [x] `state.loadError` + 교사 화면 상단 배너 (토스트는 2.2초 뒤 사라져 묻힌다)
- [x] 학생 추가·수정 모달에 교사 컨텍스트 가드
- [x] `firestoreErrorText()` — permission-denied를 조치 가능한 문장으로
- [x] jsdom 41개 항목 검증 (전체 통과)


## 19. 원인 확정 — studentIndex 규칙 미게시 (2026-08-10)
- [x] 빌드 식별자(`window.BUILD_ID`)를 화면 왼쪽 아래와 콘솔에 표시
- [x] 학생 등록은 성공, 원격 발급만 `permission-denied` 확인
- [x] 발급 실패 단계를 토스트에 표시 (studentIndex / students 구분)
- [x] **Firebase 콘솔에 `firestore.rules` 게시** (2026-08-10 완료)
- [x] **고아 인증 계정 3개 삭제** (2026-08-10 완료)
      `s-jhyt7255` / `s-dgkq9482` / `s-qnna6454` @student.korean-learning.app
- [ ] 게시 후 원격 발급 재시도 → 코드·PIN이 뜨는지 확인

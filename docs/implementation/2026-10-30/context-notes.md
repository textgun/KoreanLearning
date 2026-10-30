# 컨텍스트 노트

- 클로드 작업 e4f14b9~e637b96은 사진, 대비, 모바일 메뉴, 문구 개선이다. 신청은 여전히 저장되지 않는 화면이다.
- 사용자 승인 기준. 만 18세 이상 자기확인, 자격증 필수 아님, 한국어 설명 능력·자기소개 관리자 검토. 미승인 신청은 접수 후 90일, 승인 신청은 탈퇴 시까지 보관.
- 수신/문의 주소 piction825@gmail.com. 운영자 표시명은 말이음 운영팀으로 둔다. 변경은 functions/application-policy.json에서 관리하고 웹 빌드에도 같은 파일을 복사한다.
- Firebase CLI login:list 결과 No authorized accounts. 서버/규칙 배포는 현재 불가. SMTP 비밀정보도 제공되지 않았다. 이 사실을 숨기지 않고 접수 개시는 기본 비활성으로 둔다.
- 이메일은 개인정보 전체를 복사하지 않고 접수 식별자와 관리자 페이지 링크만 알린다. 메일 실패가 접수 성공을 되돌리지 않는다.
- 기존 공개 프로필과 신청 개인정보를 분리한다. 신청 승인만 기존 teachers 승인에 연결하며 공개 프로필 자동 공개는 하지 않는다.
- 만 18세 조건은 강사 모집에만 적용한다. 기존 학습자 만 14세 방침은 변경하지 않는다.

## Claude 이어받기 (Codex 중단 이후)

- Codex 미커밋 작업을 검토해 커밋 3개(서버 API, Firestore 규칙, 화면 연결)로 나눴다. 서버가 만드는 teachers 문서 필드는 기존 앱 가입 형식(src/firebase.js onAuthLogin)과 같다. 기존 앱에서 먼저 가입해 approved:false인 사람도 신청 승인 시 approved:true로 연결된다.
- 버그 수정. 접수가 열린 상태에서 로그인 중 '새로 작성하기'를 누르면 form.reset()이 읽기 전용 이메일 칸을 비워 다시 신청할 수 없었다. 재작성 시 계정 이메일을 다시 채운다. 접수 열림 흐름(미인증 차단, 동의 필수, 제출 내용, 접수 번호 표시, 재작성)을 jsdom 테스트로 추가했다.
- 검증. 서버 에뮬레이터 테스트 8/8, npm test 43/43, 신청 화면 2/2 통과. functions/index.js 로드 확인. 임시 빌드의 dist/teacher에서 신청·관리자·개인정보 화면 경로 모두 존재, 접수 닫힘 상태 화면이 기존과 같고 콘솔 오류 없음.
- 정책상 확인할 점. 반려된 신청도 같은 계정으로는 재신청할 수 없고(중복 처리), 90일 뒤 삭제되어야 다시 신청할 수 있다.

## 접수 개시 전 남은 관문 (사용자 작업)

1. Firebase CLI 로그인. `npx firebase login`. 저장소에 .firebaserc가 없어 명령마다 `--project korean-learning-fdaff`를 붙인다.
2. Firebase 요금제를 Blaze로 전환한다. Cloud Functions와 예약 작업(Cloud Scheduler)에 필요하다.
3. piction825@gmail.com에 2단계 인증을 켜고 Gmail 앱 비밀번호를 만든 뒤 `npx firebase functions:secrets:set SMTP_PASSWORD --project korean-learning-fdaff`로 등록한다.
4. 운영 규칙 확인 후 배포. `npx firebase deploy --only firestore:rules,functions:teacher-applications --project korean-learning-fdaff`. 규칙 배포는 운영 규칙을 로컬 firestore.rules로 덮어쓰므로, 콘솔의 현재 규칙이 로컬과 같은지(신규 teacherApplications 블록 제외) 먼저 비교한다.
5. Firebase 데이터 위치·국외 이전 등 전체 개인정보처리방침을 확인해 privacy.html을 보완한다.
6. functions/application-policy.json의 acceptingApplications를 true로 바꾸고 함수 재배포와 GitHub Pages 배포(push)를 함께 한다. 테스트 계정으로 가입·인증·제출·메일 수신·관리자 승인·기존 앱 로그인까지 확인한다.

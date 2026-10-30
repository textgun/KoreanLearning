# 강사 신청 구현 검토 결과

검토 대상은 36b8ce6이다. 서비스 코드는 수정·배포하지 않았다.

## P1. 관리자 계정의 지연 응답이 다른 계정 화면에 표시됨

- 위치. Concept/admin.js 49~52, 58~62.
- 관리자로 신청 목록을 요청한 직후 로그아웃하고 일반 계정으로 로그인한다. loading이 true라 새 계정 목록 요청은 생략되지만, workspace는 로그인 여부만으로 열린다. 이후 이전 관리자 요청이 완료되면 계정 확인 없이 이름·이메일·자기소개를 렌더링한다.
- jsdom 재현 결과. currentUid=ordinary, workspaceVisible=true, oldApplicantVisible=true.
- 서버 권한 우회는 아니지만 같은 브라우저에서 이전 관리자가 받아 온 개인정보가 다른 사용자에게 노출된다.
- 권고. 인증 세대/요청 ID를 관리해 계정 변경 전 응답과 finally 처리를 무시한다. 계정 전환 시 목록·커서·로딩 상태를 초기화하고, 관리자 조회 성공 후 작업 영역을 보여 준다. 신청 화면의 상태 조회에도 같은 방어가 필요하다.

## P2. 접수 종료 시 기존 신청자 상태 확인도 차단됨

- 위치. Concept/apply.js 36~45.
- acceptingApplications=false이면 인증 리스너를 등록하기 전에 반환하고 account-panel을 숨긴다. 기존 신청자가 로그인하거나 심사 상태를 확인할 수 없다.
- jsdom 재현 결과. accountPanelHidden=true, authListenerRegistered=false, statusCalls=0.
- 권고. 접수 개시 플래그는 신규 제출에만 적용하고 계정 로그인·기존 접수 조회는 모집 종료 이후에도 유지한다. 종료 상태에서 신규 제출이 차단되고 기존 심사 상태를 확인할 수 있는 테스트를 추가한다.

## 검증 결과

- 앞서 실행한 Firestore 에뮬레이터 테스트. 기존/권한/화면 43개 및 서버 8개 통과.
- 최신 HEAD 클라이언트·신청 화면 테스트 2개 파일 통과. 최신 신청 테스트에는 로그인 중 재작성 회귀 사례가 포함된다.
- 임시 전체 빌드 성공, 랜딩/신청/관리/개인정보 4개 페이지 자산 경로 검증 통과.
- functions/index.js 로드와 7개 함수 export 확인.
- 위 두 경계 사례는 기존 테스트에 포함되지 않아 통과 결과만으로 보호되지 않는다.

## 운영 상태

functions/application-policy.json의 acceptingApplications는 false다. Firebase 로그인, 서버/운영 규칙 배포, Gmail SMTP 비밀 등록, 전체 개인정보처리방침 확정, 실제 메일 수신 검증이 남아 있다. 공개 접수는 아직 시작하면 안 된다. 메일 발송 테스트는 SMTP 모의 응답 검증이며 실제 수신 증거는 아니다.

# Interview Mate

## 프로젝트 소개

Interview Mate는 개발자 면접 연습을 위한 웹 서비스입니다.  
사용자가 직무, 기술 스택, 난이도를 선택하면 서버가 세션을 생성하고 질문을 진행합니다.  
답변 제출 시 평가 점수와 코칭을 반환하며, 결과는 리포트/학습 화면에서 다시 확인할 수 있습니다.

## 이 프로젝트가 다루는 범위

- 면접 세션 시작/진행/종료 흐름
- 답변 평가 및 코칭 생성
- 꼬리질문과 다음 질문 보정
- 세션 리포트와 학습 화면
- 인증 기반 세션 재개 및 접근 제어

## 주요 기능

- 직무/스택/난이도 기반 면접 세션 시작
- 실시간 답변 제출 및 꼬리질문
- 캐릭터별 코치 톤(루나/제트/아이언)
- 세션 리포트/학습(Study) 흐름
- 세션 재개 및 인증 게이트

## 기술 스택

- Web
  - Next.js 14, React 18, TypeScript
  - Tailwind CSS, Framer Motion
  - Three.js, @react-three/fiber, @react-three/drei
- Server
  - Java 21, Spring Boot 3.2
  - Spring Web(MVC), WebFlux(WebClient)
  - Spring Security, Spring Data JPA, Validation
  - Caffeine Cache, PostgreSQL, Redis
- Test
  - Playwright(E2E)
  - JUnit 5, Spring Boot Test, Testcontainers

## 저장소 구조

```text
.
├── apps/
│   └── web/        # Next.js 프론트엔드 (3000)
├── server/         # Spring Boot 백엔드 (8080)
├── scripts/        # 로컬 실행/스모크/헬퍼 스크립트
└── tools/          # 개발 보조 도구
```

## 아키텍처 개요

### Web: FSD(Feature-Sliced Design)

`apps/web/src`는 FSD 구조를 기준으로 구성되어 있습니다.

- `app`: 라우팅, 페이지 엔트리, API route
- `widgets`: 페이지 단위 복합 UI(면접 셸 등)
- `features`: 사용자 시나리오 단위 기능(세션 시작, 리포트, 학습 등)
- `entities`: 도메인 개체 단위 UI/모델(아바타, 질문/답변 표현 등)
- `shared`: 공통 API 클라이언트, 유틸, UI 컴포넌트

### Server: 클린 아키텍처 지향 구조

`server/src/main/java/com/interviewmate`는 역할 분리를 기준으로 계층을 나눴습니다.

- `controller`: HTTP 요청/응답 처리
- `service`: 트랜잭션 경계와 유즈케이스 오케스트레이션
- `application`: 유즈케이스 및 포트(인터페이스)
- `domain`, `entity`: 도메인 규칙 및 영속 모델
- `repository`, `infrastructure`: DB/외부 연동 구현

### AI Layer

AI 관련 로직은 `application/ai`와 `infrastructure/ai`로 분리되어 있습니다.

- `application/ai/usecase/*`: 질문 생성, 꼬리질문 생성, 코칭 생성, 다음질문 보정, 답변 평가
- `application/ai/port/AiChatPort`: AI 호출 포트 인터페이스
- `infrastructure/ai/OpenAiChatAdapter`: OpenAI 연동 어댑터 구현
- `application/ai/prompt/InterviewerToneGuide`: 캐릭터별 톤 가이드

흐름은 `UseCase -> AiChatPort -> OpenAiChatAdapter` 순서로 동작하며, 비즈니스 규칙과 외부 API 연동 코드를 분리합니다.

## 사전 요구사항

- Node.js 18+
- npm 9+
- Java 21

## 빠른 시작

1. 의존성 설치

```bash
npm install
npm --prefix ./apps/web install
```

2. 백엔드 실행 (`:8080`)

```bash
npm run run:server
```

3. 프론트 실행 (`:3000`)

```bash
npm run dev:web
```

4. 접속

- Web: `http://localhost:3000`
- Backend health: `http://localhost:8080/health`

## 자주 쓰는 명령어

```bash
# 웹
npm run dev:web
npm run build:web
npm run lint

# 서버
npm run run:server
npm run test:server

# 스모크
npm run smoke:server
npm run smoke:interview-flow
```

## 테스트

```bash
# 서버 테스트
cd server && ./gradlew test

# 웹 빌드/린트
cd apps/web && npm run lint && npm run build

# E2E
cd apps/web && npx playwright test
```

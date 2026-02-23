# 🤖 AI Chatbot API Server

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.12-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)
[![Deployment](https://img.shields.io/badge/Live-Render-success.svg)](https://ai-chatbot-rs7c.onrender.com/health)

다양한 클라이언트(Web, Mobile)에서 즉시 연동 가능한 **엔터프라이즈급 AI 챗봇 REST API 서버**입니다. OpenAI GPT-4 모델을 활용한 지능형 대화와 실시간 스트리밍(SSE)을 지원하며, 상용 환경 배포를 위한 안정적인 인프라 설계를 포함합니다.

---

## 🚀 주요 기능 (Key Features)

- **Intelligent Conversation**: OpenAI GPT API 기반의 문맥 인지 대화
- **SSE Streaming**: `text/event-stream` 기반 실시간 토큰 전송 (사용자 경험 극대화)
- **Rate Limiting**: Redis 기반 실시간 트래픽 제어 (DoS 방지 및 비용 최적화)
- **Security**: API Key 기반 인증 및 필터 기반 로깅 시스템 (MDC 추적)
- **Robust Persistence**: PostgreSQL 기반 대화 이력 및 컨텍스트 관리 (기본 최근 10개 메시지 유지, 설정으로 조정 가능)

---

## 🛠 기술 스택 (Tech Stack)

### Backend
- **Core**: Spring Boot 3.2.12, Java 21 (LTS)
- **Security**: Spring Security 6 (API Key Auth)
- **Web**: Spring WebFlux (WebClient for Non-blocking API calls)
- **ORM**: Spring Data JPA (Hibernate)

### Infrastructure
- **Deployment**: **Render (Blueprints)**
- **Database**: Managed PostgreSQL 18
- **Cache**: Valkey 8 (Managed Redis Service)
- **Container**: Docker (Multi-stage, Layered JAR, JarLauncher)

---

## ☁️ 배포 아키텍처 (Deployment Details)

본 프로젝트는 **Render** 환경에 최적화되어 있으며, 다음의 기술적 난제를 해결하여 배포되었습니다:

- **JDBC URL Runtime assembly**: Render의 `connectionString`(`postgresql://`) 규격을 JDBC 표준(`jdbc:postgresql://`)으로 자동 변환하는 런타임 엔트리포인트 설계 (`entrypoint.sh`).
- **Region Optimized**: 서비스 지연 시간을 최소화하기 위한 인프라 리전 동기화 (Oregon US-West).
- **Zero-Config Blueprints**: `render.yaml` 작성을 통해 클릭 한 번으로 DB, Redis, Web Service를 자동 연계 생성.

---

## 🌐 실시간 서비스 확인
배포된 서버의 상태와 API 문서를 아래 링크를 통해 즉시 확인하실 수 있습니다.
*   **서버 상태 확인 (Health Check)**: [https://ai-chatbot-rs7c.onrender.com/health](https://ai-chatbot-rs7c.onrender.com/health)
    *   접속 시 `{"status": "UP", ...}` 메시지가 나오면 서버가 정상 가동 중입니다.
*   **인터랙티브 API 문서 (Swagger)**: [https://ai-chatbot-rs7c.onrender.com/swagger-ui.html](https://ai-chatbot-rs7c.onrender.com/swagger-ui.html)
    *   웹 브라우저에서 직접 API를 테스트해 볼 수 있습니다.

---

## 🔌 API 사용 안내

### 인증 방법
모든 API 호출 시 헤더에 서비스 등록된 `X-API-Key`를 포함해야 합니다.

- `OPENAI_API_KEY`: 서버가 OpenAI API를 호출할 때 사용하는 내부 키 (`.env`/서버 환경변수)
- `X-API-Key`: 클라이언트가 우리 서버를 호출할 때 보내는 사용자 인증 키 (`users.api_key`)
- `X-API-Key`에 `OPENAI_API_KEY(sk-...)`를 넣으면 인증 실패(`INVALID_API_KEY`)가 발생합니다.

```bash
curl -X POST https://ai-chatbot-rs7c.onrender.com/api/chat/completions \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "안녕?", "conversation_id": 1}'
```

### 주요 엔드포인트
- `POST /api/chat/completions`: 일반 대화 응답
- `POST /api/chat/completions/stream`: SSE 실시간 스트리밍 답변
- `GET /health`: 서버 및 DB 연결 상태 확인 (공개 경로)
- `GET /swagger-ui.html`: 인터랙티브 API 문서

---

## 🧪 로컬 개발 환경 구축

```bash
# 1. 소스코드 복제
git clone https://github.com/developer-kanghyun/ai-chatbot.git

# 2. .env 준비 (DB_PASSWORD, OPENAI_API_KEY 필수)
# 3. 인프라 + 서버 실행 (원클릭)
./scripts/dev-up.sh

# 종료
./scripts/dev-down.sh
```

로컬에서 `X-API-Key` 확인/생성 예시:
```bash
# 현재 등록된 사용자 키 조회
docker exec -it chatbot-db psql -U postgres -d chatbotdb -c "select id, api_key from users;"

# 테스트용 키 추가(없을 때)
docker exec -it chatbot-db psql -U postgres -d chatbotdb -c "insert into users (api_key, created_at, updated_at) values ('local-test-key', now(), now());"
```

---

## 🧪 테스트 (Testing)
통합 테스트를 통해 로직 무결성을 검증합니다.
```bash
./gradlew test
```
- `ChatStreamIntegrationTest`: SSE 스트리밍 검증
- `RateLimitIntegrationTest`: 속도 제한 로직 검증

---

## ✅ API 작동 테스트 (수동 검증)

아래 절차는 로컬/배포 환경에서 API가 실제로 정상 동작하는지 재현 가능하게 검증하기 위한 기준입니다.

### 1. Swagger UI에서 API 테스트 가능 여부
```bash
curl -i http://localhost:8080/swagger-ui.html
curl -i http://localhost:8080/v3/api-docs
```
- 기대 결과: 두 요청 모두 `200 OK`
- 판정 기준: Swagger UI 페이지가 열리고, OpenAPI JSON이 정상 반환되면 통과

### 2. `/health` 엔드포인트 동작 여부
```bash
curl -i http://localhost:8080/health
```
- 기대 결과: `200 OK`, 응답 JSON에 `"status":"UP"`
- 판정 기준: DB 연결 포함 헬스 상태가 `UP`이면 통과

### 3. 요청/응답 로그 출력 여부
```bash
# 서버 로그 확인 예시
tail -f /tmp/ai-chatbot-boot.log
```
- 기대 결과: 요청 시 `HttpLoggingFilter` 로그에 `METHOD`, `URI`, `status` 포함 출력
- 판정 기준: 요청/응답 로그가 식별 가능하면 통과

### 4. 인증 동작 및 에러 코드 검증
```bash
# 인증 헤더 없음
curl -i http://localhost:8080/api/conversations

# 인증 헤더 포함
curl -i -H "X-API-Key: YOUR_API_KEY" http://localhost:8080/api/conversations
```
- 기대 결과: 헤더 없음 `401`, 유효 헤더 `200`
- 판정 기준: API Key 기반 인증이 동작하면 통과

### 5. Rate Limiting 검증
```bash
for i in {1..4}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "X-API-Key: YOUR_API_KEY" \
    http://localhost:8080/api/conversations
done
```
- 기대 결과: 설정값이 `3회/60초`일 때 `200, 200, 200, 429`
- 판정 기준: 초과 요청에서 `429`와 `Retry-After` 헤더가 반환되면 통과

### 6. 채팅 API + DB 저장 검증
```bash
curl -i -X POST http://localhost:8080/api/chat/completions \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message":"안녕?","conversation_id":null}'
```
- 기대 결과: `200 OK`, 응답 JSON의 `success=true`, `data.message.role=assistant`
- 판정 기준: 응답 후 DB `conversations`, `messages` 레코드 증가가 확인되면 통과

### 7. SSE 스트리밍 검증
```bash
curl -N -X POST http://localhost:8080/api/chat/completions/stream \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message":"1부터 3까지 세어줘","conversation_id":null}'
```
- 기대 결과: `Content-Type: text/event-stream`, 토큰 이벤트 연속 수신, 마지막 `[DONE]` 이벤트 수신
- 판정 기준: 실시간 토큰 출력과 종료 이벤트 확인 시 통과

### 8. 배포 환경 외부 접근 검증 (Render)
```bash
curl -i https://ai-chatbot-rs7c.onrender.com/health
curl -i https://ai-chatbot-rs7c.onrender.com/swagger-ui.html
```
- 기대 결과: 외부에서 `200 OK`
- 판정 기준: 헬스체크/Swagger 접근 가능하면 통과

### 9. 테스트 스위트 실행 검증
```bash
./gradlew test
```
- 기대 결과: `BUILD SUCCESSFUL`
- 판정 기준: 주요 통합 테스트(`ChatStreamIntegrationTest`, `RateLimitIntegrationTest`) 통과 시 통과

---

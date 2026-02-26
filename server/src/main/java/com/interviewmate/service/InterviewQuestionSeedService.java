package com.interviewmate.service;

import com.interviewmate.entity.InterviewQuestion;
import com.interviewmate.repository.InterviewQuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@Profile("!test")
@ConditionalOnProperty(name = "app.interview.seed-enabled", havingValue = "true")
@RequiredArgsConstructor
public class InterviewQuestionSeedService implements CommandLineRunner {

    private final InterviewQuestionRepository interviewQuestionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedRoleQuestions("backend", backendQuestions());
        seedRoleQuestions("frontend", frontendQuestions());
    }

    private void seedRoleQuestions(String role, List<QuestionSeed> seeds) {
        long existingCount = interviewQuestionRepository.countByJobRoleAndIsActiveTrue(role);
        if (existingCount >= 7) {
            log.info("질문 시드 스킵: role={}, existingCount={}", role, existingCount);
            return;
        }

        for (QuestionSeed seed : seeds) {
            InterviewQuestion question = new InterviewQuestion();
            question.setJobRole(role);
            question.setQuestionCategory(seed.category());
            question.setDifficulty(seed.difficulty());
            question.setContent(seed.content());
            question.setActive(true);
            interviewQuestionRepository.save(question);
        }
        log.info("질문 시드 완료: role={}, inserted={}", role, seeds.size());
    }

    private List<QuestionSeed> backendQuestions() {
        List<QuestionSeed> baseQuestions = List.of(
                new QuestionSeed("cs", "easy", "트랜잭션의 ACID를 설명하고 각 속성이 실무에서 왜 필요한지 말해보세요."),
                new QuestionSeed("cs", "medium", "트랜잭션 격리 수준 4단계를 비교하고, 서비스에서 선택 기준을 설명해보세요."),
                new QuestionSeed("cs", "medium", "인덱스가 동작하는 원리와 잘못 설계된 인덱스로 발생하는 문제를 설명해보세요."),
                new QuestionSeed("cs", "medium", "동시성 이슈(경쟁 상태, 데드락)를 줄이기 위한 백엔드 전략을 설명해보세요."),
                new QuestionSeed("cs", "hard", "CAP 정리와 PACELC를 기준으로 분산 시스템 아키텍처 선택 경험을 설명해보세요."),
                new QuestionSeed("job", "easy", "REST API 설계 시 리소스/메서드/상태코드 설계 원칙을 설명해보세요."),
                new QuestionSeed("job", "medium", "Spring Boot에서 예외 처리 계층을 어떻게 나누고 표준 응답을 유지하는지 설명해보세요."),
                new QuestionSeed("job", "medium", "인증/인가(JWT, 세션, API Key) 방식별 장단점과 적용 시나리오를 설명해보세요."),
                new QuestionSeed("job", "medium", "캐시(로컬/분산)를 적용할 때 정합성 문제를 어떻게 다루는지 설명해보세요."),
                new QuestionSeed("job", "hard", "대규모 트래픽에서 병목을 찾기 위한 관측 지표와 튜닝 순서를 설명해보세요."),
                new QuestionSeed("system", "medium", "메시지 큐를 도입해야 하는 시점과 주문형 시스템 예시를 들어 설명해보세요."),
                new QuestionSeed("system", "hard", "무중단 배포(Blue/Green, Rolling, Canary) 중 하나를 선택해 설계해보세요."),
                new QuestionSeed("job", "medium", "Spring Security 필터 체인에서 인증/인가 흐름이 동작하는 순서를 설명해보세요."),
                new QuestionSeed("job", "medium", "JPA N+1 문제를 재현하고 해결하는 방법(fetch join, entity graph)을 설명해보세요."),
                new QuestionSeed("job", "hard", "대규모 배치 작업에서 트랜잭션 경계와 재시도 전략을 어떻게 설계하는지 설명해보세요."),
                new QuestionSeed("system", "medium", "API 게이트웨이와 BFF를 함께 쓸 때 역할 분리를 어떻게 하는지 설명해보세요."),
                new QuestionSeed("system", "hard", "멀티 리전 장애 복구 전략(RPO/RTO)을 서비스 특성에 맞춰 설계해보세요."),
                new QuestionSeed("cs", "medium", "낙관적 락과 비관적 락의 차이와 선택 기준을 설명해보세요."),
                new QuestionSeed("cs", "hard", "정렬/해시 기반 조인 방식의 차이와 실행 계획에서 확인할 포인트를 설명해보세요."),
                new QuestionSeed("job", "easy", "API 버전닝 전략(URI, Header, Media Type) 중 하나를 선택해 이유를 말해보세요.")
        );

        List<String> backendConcepts = List.of(
                "Connection Pool 튜닝",
                "CQRS 분리",
                "도메인 이벤트 설계",
                "SAGA 패턴",
                "분산 트랜잭션",
                "Idempotency Key",
                "Outbox 패턴",
                "Retry/Backoff",
                "Circuit Breaker",
                "Bulkhead",
                "Rate Limit",
                "API Throttling",
                "Kafka 파티션 전략",
                "Redis 캐시 무효화",
                "Read Replica 활용",
                "Shard 키 선정",
                "Database Migration",
                "Feature Toggle",
                "API Gateway 인증 위임",
                "Observability(로그/메트릭/트레이스)",
                "Dead Letter Queue",
                "멀티테넌시 설계",
                "Zero-downtime schema change",
                "데이터 정합성 검증 배치",
                "API 계약 테스트",
                "성능 테스트 전략",
                "비동기 작업 보상 처리",
                "Lock 경쟁 완화",
                "Graceful Shutdown",
                "백프레셔 처리"
        );
        return appendGeneratedQuestions(baseQuestions, backendConcepts, "backend");
    }

    private List<QuestionSeed> frontendQuestions() {
        List<QuestionSeed> baseQuestions = List.of(
                new QuestionSeed("cs", "easy", "브라우저 렌더링 파이프라인을 설명하고 성능 저하 지점을 말해보세요."),
                new QuestionSeed("cs", "medium", "이벤트 루프와 마이크로태스크/매크로태스크 차이를 설명해보세요."),
                new QuestionSeed("cs", "medium", "HTTP 캐시 정책(Cache-Control, ETag)이 프론트 성능에 미치는 영향을 설명해보세요."),
                new QuestionSeed("cs", "medium", "CORS가 발생하는 이유와 안전한 우회 방법을 설명해보세요."),
                new QuestionSeed("cs", "hard", "웹 보안(XSS/CSRF/클릭재킹) 대응 전략을 프론트 관점에서 설명해보세요."),
                new QuestionSeed("job", "easy", "React에서 상태를 로컬/전역/서버 상태로 분리하는 기준을 설명해보세요."),
                new QuestionSeed("job", "medium", "Next.js App Router에서 서버 컴포넌트와 클라이언트 컴포넌트 경계 설계를 설명해보세요."),
                new QuestionSeed("job", "medium", "폼 처리에서 유효성 검증, 에러 표시, 접근성을 함께 설계하는 방법을 설명해보세요."),
                new QuestionSeed("job", "medium", "성능 최적화를 위해 메모이제이션을 언제 쓰고 언제 쓰지 않는지 설명해보세요."),
                new QuestionSeed("job", "hard", "대규모 디자인 시스템을 운영할 때 토큰/컴포넌트 버전 관리 전략을 설명해보세요."),
                new QuestionSeed("system", "medium", "프론트엔드 에러 모니터링과 사용자 행동 분석을 연결해 개선 루프를 만드는 방법을 설명해보세요."),
                new QuestionSeed("system", "hard", "SSR/SSG/CSR 혼합 전략을 실서비스에서 어떻게 의사결정하는지 설명해보세요."),
                new QuestionSeed("job", "medium", "React Query/SWR 같은 서버 상태 라이브러리를 도입하는 기준을 설명해보세요."),
                new QuestionSeed("job", "medium", "상태 관리에서 불변성을 지키지 않았을 때 생기는 버그를 사례로 설명해보세요."),
                new QuestionSeed("job", "hard", "웹 성능 지표(LCP, CLS, INP)를 개선하기 위한 프론트 전략을 설명해보세요."),
                new QuestionSeed("system", "medium", "마이크로프론트엔드 도입 시 장단점과 실패 포인트를 설명해보세요."),
                new QuestionSeed("system", "hard", "CDN 캐시 무효화와 정적 자산 버전 전략을 실제 배포 흐름으로 설명해보세요."),
                new QuestionSeed("cs", "medium", "가상 DOM과 실제 DOM 업데이트 비용을 비교해 설명해보세요."),
                new QuestionSeed("cs", "hard", "메모리 누수(이벤트 리스너, 타이머, 클로저)를 탐지/해결하는 방법을 설명해보세요."),
                new QuestionSeed("job", "easy", "접근성(ARIA, 키보드 내비게이션, 대비)을 컴포넌트 설계에 반영하는 방법을 설명해보세요.")
        );

        List<String> frontendConcepts = List.of(
                "코드 스플리팅",
                "이미지 최적화",
                "폰트 로딩 전략",
                "Hydration mismatch 대응",
                "Streaming SSR",
                "Edge Rendering",
                "Service Worker 캐시",
                "오프라인 UX",
                "Design Token 운영",
                "컴포넌트 접근성 테스트",
                "E2E 테스트 안정화",
                "Visual Regression",
                "웹 바이탈 모니터링",
                "Lighthouse 자동화",
                "i18n 번들 분리",
                "다국어 라우팅",
                "에러 바운더리 설계",
                "Suspense 데이터 패턴",
                "Mutation 최적화",
                "Infinite Scroll 성능",
                "가상 리스트",
                "Drag & Drop 접근성",
                "Form 상태 동기화",
                "Client 캐시 무효화",
                "Micro Interaction 설계",
                "애니메이션 성능",
                "보안 헤더(CSP) 연동",
                "OAuth 프론트 플로우",
                "세션 만료 UX",
                "분석 이벤트 스키마"
        );
        return appendGeneratedQuestions(baseQuestions, frontendConcepts, "frontend");
    }

    private List<QuestionSeed> appendGeneratedQuestions(List<QuestionSeed> baseQuestions, List<String> concepts, String role) {
        List<QuestionSeed> result = new ArrayList<>(baseQuestions);
        List<String> categories = "backend".equals(role)
                ? List.of("job", "system", "cs")
                : List.of("job", "system", "cs");
        List<String> difficulties = List.of("easy", "medium", "hard");
        List<String> templates = List.of(
                "%s를 실무 서비스에 도입할 때 의사결정 기준과 실패 사례를 설명해보세요.",
                "%s 적용 시 성능/정합성/운영 비용 트레이드오프를 설명해보세요.",
                "%s를 팀 표준으로 정착시키기 위한 단계별 실행 계획을 설명해보세요."
        );

        for (int index = 0; index < concepts.size(); index++) {
            String concept = concepts.get(index);
            String category = categories.get(index % categories.size());
            String difficulty = difficulties.get(index % difficulties.size());
            String template = templates.get(index % templates.size());
            result.add(new QuestionSeed(category, difficulty, String.format(template, concept)));
        }
        return result;
    }

    private record QuestionSeed(String category, String difficulty, String content) {
    }
}

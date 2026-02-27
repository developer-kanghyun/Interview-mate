package com.interviewmate.application.ai.usecase;

import com.interviewmate.domain.ai.AnswerEvaluationResult;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EvaluateAnswerUseCaseTest {

    @Test
    void jobseekerThresholdUses2Point8ForFollowupDecision() {
        EvaluateAnswerUseCase useCase = new EvaluateAnswerUseCase();

        AnswerEvaluationResult result = useCase.execute(
                "트랜잭션을 설명해보세요.",
                "트랜잭션은 데이터 정합성을 위해 작업 단위를 묶는 방식입니다.",
                "jobseeker",
                "Spring Boot"
        );

        assertThat(result.getTotalScore()).isGreaterThanOrEqualTo(2.8);
        assertThat(result.isFollowupRequired()).isFalse();
    }

    @Test
    void juniorThresholdUses3Point0ForFollowupDecision() {
        EvaluateAnswerUseCase useCase = new EvaluateAnswerUseCase();

        AnswerEvaluationResult result = useCase.execute(
                "트랜잭션을 설명해보세요.",
                "트랜잭션은 작업 단위를 묶는 기능입니다.",
                "junior",
                "Spring Boot"
        );

        assertThat(result.getTotalScore()).isLessThan(3.0);
        assertThat(result.isFollowupRequired()).isTrue();
    }

    @Test
    void guaranteesAccuracyFloorWhenOneKeywordMatches() {
        EvaluateAnswerUseCase useCase = new EvaluateAnswerUseCase();

        AnswerEvaluationResult result = useCase.execute(
                "TypeScript의 장점을 설명해보세요.",
                "TypeScript를 쓰면 타입 기반으로 코드를 더 안전하게 유지할 수 있습니다.",
                "jobseeker",
                "TypeScript,React"
        );

        assertThat(result.getAccuracy()).isGreaterThanOrEqualTo(3.0);
    }

    @Test
    void guaranteesHigherAccuracyFloorWhenTwoKeywordsMatch() {
        EvaluateAnswerUseCase useCase = new EvaluateAnswerUseCase();

        AnswerEvaluationResult result = useCase.execute(
                "TypeScript 기반 상태 관리 전략을 설명해보세요.",
                "TypeScript로 타입 경계를 먼저 잡고 React 상태를 로컬과 전역으로 나눠 관리합니다.",
                "jobseeker",
                "TypeScript,React"
        );

        assertThat(result.getAccuracy()).isGreaterThanOrEqualTo(3.5);
    }

    @Test
    void rewardsLogicalConnectors() {
        EvaluateAnswerUseCase useCase = new EvaluateAnswerUseCase();

        AnswerEvaluationResult unstructured = useCase.execute(
                "캐시 전략을 설명해보세요.",
                "캐시는 읽기 성능을 높입니다 캐시 무효화가 중요합니다 트래픽이 많으면 도움이 됩니다",
                "junior",
                "Redis"
        );

        AnswerEvaluationResult structured = useCase.execute(
                "캐시 전략을 설명해보세요.",
                "첫째, 조회 빈도가 높은 데이터는 캐시합니다. 둘째, 만료시간과 무효화 정책을 함께 둡니다. 따라서 성능과 정합성의 균형을 맞춥니다.",
                "junior",
                "Redis"
        );

        assertThat(structured.getLogic()).isGreaterThan(unstructured.getLogic());
        assertThat(structured.getDelivery()).isGreaterThan(unstructured.getDelivery());
    }
}

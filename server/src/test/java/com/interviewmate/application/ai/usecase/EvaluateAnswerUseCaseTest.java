package com.interviewmate.application.ai.usecase;

import com.interviewmate.domain.ai.AnswerEvaluationResult;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EvaluateAnswerUseCaseTest {

    @Test
    void testExecuteReturnsLowScoreForShortAnswer() {
        EvaluateAnswerUseCase useCase = new EvaluateAnswerUseCase();

        AnswerEvaluationResult result = useCase.execute(
                "트랜잭션을 설명해보세요.",
                "잘 모르겠습니다."
        );

        assertThat(result.getTotalScore()).isLessThan(3.2);
        assertThat(result.isFollowupRequired()).isTrue();
        assertThat(result.getFollowupReason()).isNotBlank();
    }

    @Test
    void testExecuteReturnsHighScoreForDetailedAnswer() {
        EvaluateAnswerUseCase useCase = new EvaluateAnswerUseCase();

        AnswerEvaluationResult result = useCase.execute(
                "트랜잭션을 설명해보세요.",
                "트랜잭션은 ACID를 기반으로 데이터 정합성을 보장합니다. 원자성을 통해 전부 성공하거나 전부 실패하게 만들고, 격리 수준을 조정해 동시성 충돌을 완화하며, 커밋 이후 지속성을 보장합니다."
        );

        assertThat(result.getTotalScore()).isGreaterThanOrEqualTo(3.2);
        assertThat(result.isFollowupRequired()).isFalse();
    }

    @Test
    void testExecuteUsesConfiguredWeightedScoreRule() {
        EvaluateAnswerUseCase useCase = new EvaluateAnswerUseCase();

        AnswerEvaluationResult result = useCase.execute(
                "트랜잭션을 설명해보세요.",
                "잘 모르겠습니다."
        );

        // 4축 점수(2.2, 1.8, 1.6, 3.5)에 가중치(35/25/25/15)를 적용하면 2.145 -> 2.1
        assertThat(result.getAccuracy()).isEqualTo(2.2);
        assertThat(result.getLogic()).isEqualTo(1.8);
        assertThat(result.getDepth()).isEqualTo(1.6);
        assertThat(result.getDelivery()).isEqualTo(3.5);
        assertThat(result.getTotalScore()).isEqualTo(2.1);
    }

    @Test
    void testExecutePenalizesGenericLongAnswerWhenCoreKeywordMissing() {
        EvaluateAnswerUseCase useCase = new EvaluateAnswerUseCase();

        AnswerEvaluationResult result = useCase.execute(
                "트랜잭션의 ACID를 설명해보세요.",
                "트랜잭션은 중요한 개념입니다. 시스템의 안정성과 일관성을 위해 꼭 필요합니다. " +
                        "상황에 맞게 설계하면 품질을 높일 수 있고 운영 안정성에도 도움이 됩니다."
        );

        assertThat(result.getAccuracy()).isLessThanOrEqualTo(2.8);
        assertThat(result.isFollowupRequired()).isTrue();
    }

    @Test
    void testExecuteRewardsAnswerContainingCoreKeyword() {
        EvaluateAnswerUseCase useCase = new EvaluateAnswerUseCase();

        AnswerEvaluationResult result = useCase.execute(
                "트랜잭션의 ACID를 설명해보세요.",
                "트랜잭션은 ACID를 기반으로 동작합니다. 원자성은 전부 성공 또는 전부 롤백을 보장하고, " +
                        "일관성은 제약조건을 유지하며, 격리성은 동시성 충돌을 완화하고, 지속성은 커밋 이후 데이터를 보존합니다."
        );

        assertThat(result.getAccuracy()).isGreaterThanOrEqualTo(3.5);
        assertThat(result.isFollowupRequired()).isFalse();
    }

    @Test
    void testExecuteRewardsLogicalConnectorsInDeliveryAndLogic() {
        EvaluateAnswerUseCase useCase = new EvaluateAnswerUseCase();

        AnswerEvaluationResult unstructured = useCase.execute(
                "캐시 전략을 설명해보세요.",
                "캐시는 읽기 성능을 높입니다 캐시 무효화가 중요합니다 트래픽이 많으면 도움이 됩니다"
        );

        AnswerEvaluationResult structured = useCase.execute(
                "캐시 전략을 설명해보세요.",
                "첫째, 조회 빈도가 높은 데이터는 캐시로 분리합니다. 둘째, 만료시간과 무효화 정책을 함께 설계합니다. " +
                        "따라서 성능과 정합성의 균형을 유지할 수 있습니다."
        );

        assertThat(structured.getLogic()).isGreaterThan(unstructured.getLogic());
        assertThat(structured.getDelivery()).isGreaterThan(unstructured.getDelivery());
    }
}

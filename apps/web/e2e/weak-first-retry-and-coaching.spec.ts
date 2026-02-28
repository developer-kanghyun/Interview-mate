import { expect, test } from "@playwright/test";
import { enterInterviewFromSetup, roomSelectors } from "./helpers/interviewRoom";

const SOURCE_SESSION_ID = "901";
const RETRY_SESSION_ID = "902";

test("약점 재연습은 weak_first payload를 보내고 리포트/학습에 상세 코칭을 노출한다", async ({ page }) => {
  let startCallCount = 0;
  let retryStartPayload: Record<string, unknown> | null = null;

  await page.route("**/api/backend/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "UP",
        timestamp: "2026-02-28T00:00:00.000Z"
      })
    });
  });

  await page.route("**/api/backend/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user_id: "member-1",
          email: "member@example.com",
          name: "member"
        }
      })
    });
  });

  await page.route("**/api/backend/api/interview/sessions/start", async (route) => {
    startCallCount += 1;
    if (startCallCount === 1) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            session_id: SOURCE_SESSION_ID,
            started_at: "2026-02-28T00:00:00.000Z",
            job_role: "backend",
            interviewer_character: "jet",
            total_questions: 1,
            status: "in_progress",
            first_question: {
              question_id: "q-1",
              category: "job",
              difficulty: "jobseeker",
              content: "트랜잭션 전파를 설명해 주세요."
            }
          }
        })
      });
      return;
    }

    retryStartPayload = (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          session_id: RETRY_SESSION_ID,
          started_at: "2026-02-28T00:01:00.000Z",
          job_role: "backend",
          interviewer_character: "jet",
          total_questions: 1,
          status: "in_progress",
          first_question: {
            question_id: "q-9",
            category: "job",
            difficulty: "jobseeker",
            content: "재연습 질문입니다."
          }
        }
      })
    });
  });

  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream; charset=utf-8",
      body: "event: token\ndata: {\"text\":\"트랜잭션 전파를 설명해 주세요.\"}\n\nevent: done\ndata: [DONE]\n\n"
    });
  });

  await page.route(`**/api/backend/api/interview/sessions/${SOURCE_SESSION_ID}/answers`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          answer_id: "a-1",
          session_id: SOURCE_SESSION_ID,
          question_id: "q-1",
          input_type: "text",
          interviewer_character: "jet",
          evaluation: {
            accuracy: 2.5,
            logic: 2.4,
            depth: 2.2,
            delivery: 2.1,
            total_score: 2.3,
            followup_required: false,
            followup_reason: "none",
            followup_remaining: 0
          },
          coaching_message: "핵심 개념을 먼저 정의하세요.",
          followup_question: null,
          interviewer_emotion: "pressure",
          next_question: null,
          session_status: "completed",
          end_reason: "completed_all_questions",
          session_completed: true
        }
      })
    });
  });

  await page.route(`**/api/backend/api/interview/sessions/${SOURCE_SESSION_ID}/report`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          session_id: SOURCE_SESSION_ID,
          job_role: "backend",
          session_status: "completed",
          end_reason: "completed_all_questions",
          total_questions: 1,
          answered_questions: 1,
          performance_level: "needs_improvement",
          priority_focuses: ["정확성", "정확성", "논리성"],
          score_summary: {
            accuracy: 2.5,
            logic: 2.4,
            depth: 2.2,
            delivery: 2.1,
            total_score: 2.3
          },
          weak_keywords: ["정확성", "논리성"],
          generated_at: "2026-02-28T00:00:10.000Z",
          questions: [
            {
              question_id: "q-1",
              question_order: 1,
              question_content: "트랜잭션 전파를 설명해 주세요.",
              answer_text: "짧은 답변",
              interviewer_emotion: "pressure",
              coaching_message: "핵심 개념을 먼저 정의하세요.",
              model_answer: "트랜잭션 전파는 호출 관계에서 트랜잭션 경계를 제어하는 전략입니다. 실무에서는 REQUIRED를 기본값으로 두고 경계가 필요한 지점에서 REQUIRES_NEW를 선택합니다. 이렇게 하면 데이터 일관성과 롤백 범위를 예측 가능하게 유지할 수 있습니다.",
              score: {
                accuracy: 2.5,
                logic: 2.4,
                depth: 2.2,
                delivery: 2.1,
                total_score: 2.3
              },
              weak_points: ["정확성", "논리성"],
              weak_concept_keywords: ["핵심 개념 정의"],
              improvement_tip: "중복 가이드 문구",
              why_weak: "핵심 개념 정의가 빠져 근거가 약했습니다.",
              how_to_answer: "결론-근거-예시 순서로 답변하세요.",
              example_answer: "트랜잭션 전파는 호출 체인에서 트랜잭션을 이어갈지 분리할지 결정하는 정책입니다. 실무에서는 REQUIRED를 기본으로 두고, 외부 연동처럼 독립 롤백이 필요한 구간만 REQUIRES_NEW를 사용합니다."
            }
          ]
        }
      })
    });
  });

  await page.route("**/api/backend/api/interview/history**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          requested_days: 30,
          total_count: 0,
          items: []
        }
      })
    });
  });

  await enterInterviewFromSetup(page);
  await expect(roomSelectors.questionBanner(page)).toContainText("트랜잭션 전파를 설명해 주세요.");

  await roomSelectors.answerInput(page).fill("트랜잭션 전파는 호출 관계에서 트랜잭션 경계를 제어합니다.");
  await page.getByRole("button", { name: "답변 완료" }).click();

  await expect(page.getByRole("heading", { name: "면접 리포트" })).toBeVisible();
  await expect(page.getByText("왜 약한지")).toBeVisible();
  await expect(page.getByText("핵심 개념 정의가 빠져 근거가 약했습니다.")).toBeVisible();
  await expect(page.getByText("이렇게 답하면 됩니다")).toBeVisible();
  await expect(page.getByText("결론-근거-예시 순서로 답변하세요.")).toBeVisible();
  await expect(page.getByText("예시 답변")).toBeVisible();

  await page.getByRole("button", { name: "학습 보기" }).click();
  await expect(page.getByRole("heading", { name: "학습하기" })).toBeVisible();
  await expect(page.getByText("질문별 상세 가이드")).toBeVisible();
  await expect(page.getByText("중복 가이드 문구")).toHaveCount(1);

  await page.getByRole("button", { name: "약점 기반 다시 연습" }).click();

  await expect.poll(() => retryStartPayload?.retry_mode).toBe("weak_first");
  await expect.poll(() => retryStartPayload?.source_session_id).toBe(Number(SOURCE_SESSION_ID));
});

import { expect, test } from "@playwright/test";
import { enterInterviewFromSetup, roomSelectors } from "./helpers/interviewRoom";

const REPORT_SESSION_ID = "session-auth-1";

test("리포트 인증오류에서 헤더/본문 인증 액션은 로그인 중심으로 일관해야 한다", async ({ page }) => {
  await page.route("**/api/backend/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "UP",
        timestamp: "2026-02-26T00:00:00.000Z"
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
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          session_id: REPORT_SESSION_ID,
          started_at: "2026-02-24T00:00:00.000Z",
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
  });

  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream; charset=utf-8",
      body: "event: token\ndata: {\"text\":\"트랜잭션 전파를 설명해 주세요.\"}\n\nevent: done\ndata: [DONE]\n\n"
    });
  });

  await page.route(`**/api/backend/api/interview/sessions/${REPORT_SESSION_ID}/answers`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          answer_id: "a-1",
          session_id: REPORT_SESSION_ID,
          question_id: "q-1",
          input_type: "text",
          interviewer_character: "jet",
          evaluation: {
            accuracy: 2.5,
            logic: 2.6,
            depth: 2.2,
            delivery: 2.1,
            total_score: 2.4,
            followup_required: false,
            followup_reason: "none",
            followup_remaining: 0
          },
          coaching_message: "핵심 개념 정의를 먼저 정리하세요.",
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

  await page.route(`**/api/backend/api/interview/sessions/${REPORT_SESSION_ID}/report`, async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "인증이 필요한 서비스입니다."
        }
      })
    });
  });

  await page.route(`**/api/backend/api/interview/sessions/${REPORT_SESSION_ID}/end`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          session_id: REPORT_SESSION_ID,
          session_status: "completed",
          end_reason: "user_end",
          ended_at: "2026-02-26T00:00:00.000Z"
        }
      })
    });
  });

  await enterInterviewFromSetup(page);
  await expect(roomSelectors.questionBanner(page)).toContainText("트랜잭션 전파를 설명해 주세요.");

  const answerInput = roomSelectors.answerInput(page);
  await answerInput.fill("트랜잭션 전파는 호출 관계에 따라 트랜잭션 경계를 제어하는 방식입니다.");
  await page.getByRole("button", { name: "답변 완료" }).click();

  await expect(page.getByText("로그인이 필요합니다. 다시 로그인해 주세요.").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Google 로그인" })).toBeVisible();
  await expect(page.getByRole("button", { name: "설정으로 이동" })).toBeVisible();
  await expect(page.getByRole("button", { name: "로그아웃" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "다시 시도" })).toHaveCount(0);
});

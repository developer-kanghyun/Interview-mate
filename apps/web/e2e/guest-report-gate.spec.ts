import { test, expect } from "@playwright/test";

const REPORT_SESSION_ID = "session-1";

test("게스트 1문항 완료 후 로그인 유도 및 리포트 복귀", async ({ page }) => {
  await page.route("**/api/backend/api/auth/me", async (route) => {
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

  await page.route("**/api/backend/api/auth/guest", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user_id: "guest-1",
          trial_question_limit: 1
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

  let answerRequestCount = 0;
  await page.route(`**/api/backend/api/interview/sessions/${REPORT_SESSION_ID}/answers`, async (route) => {
    answerRequestCount += 1;
    if (answerRequestCount === 1) {
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
              followup_required: true,
              followup_reason: "missing_core_detail",
              followup_remaining: 1
            },
            coaching_message: "핵심 개념 정의를 먼저 정리하세요.",
            followup_question: "핵심 원리를 한 문장으로 다시 설명해 주세요.",
            interviewer_emotion: "pressure",
            next_question: null,
            session_status: "in_progress",
            end_reason: null,
            session_completed: false
          }
        })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          answer_id: "a-2",
          session_id: REPORT_SESSION_ID,
          question_id: "q-1",
          input_type: "text",
          interviewer_character: "jet",
          evaluation: {
            accuracy: 2.9,
            logic: 3.0,
            depth: 2.8,
            delivery: 2.7,
            total_score: 2.9,
            followup_required: false,
            followup_reason: "followup_limit_reached",
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

  await page.route("**/api/backend/api/auth/google/url", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          auth_url: `/auth/google/callback?code=fake-code&redirectTo=${encodeURIComponent(`/report/${REPORT_SESSION_ID}`)}`,
          state: "fake-state"
        }
      })
    });
  });

  await page.route("**/api/backend/api/auth/google/callback**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user_id: "1",
          email: "test@example.com",
          name: "tester",
          new_user: false
        }
      })
    });
  });

  await page.goto("/interview");

  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "면접 시작" }).click();

  await expect(page.getByText("Current Question")).toBeVisible();

  const answerInput = page.getByPlaceholder("답변을 입력하세요...");
  await answerInput.fill("트랜잭션 전파는 호출 관계에 따라 트랜잭션 경계를 제어하는 방식입니다.");
  await page.getByRole("button", { name: "답변 완료" }).click();
  await expect.poll(() => answerRequestCount).toBe(1);

  await answerInput.fill("핵심 원리는 전파 속성에 따라 기존 트랜잭션을 이어가거나 새로 시작하는 것입니다.");
  await page.getByRole("button", { name: "답변 완료" }).click();
  await expect.poll(() => answerRequestCount).toBe(2);

  const loginButtons = page.getByRole("button", { name: "Google 로그인" });
  await expect(loginButtons.last()).toBeVisible();
  await loginButtons.last().click();

  await expect(page).toHaveURL(new RegExp(`/report/${REPORT_SESSION_ID}$`));
});

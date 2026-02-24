import { expect, test } from "@playwright/test";

const SESSION_ID = "session-enter";

test("엔터 입력으로 답변 제출되고 Shift+Enter는 줄바꿈 유지", async ({ page }) => {
  let submittedAnswerText = "";
  let answerRequestCount = 0;

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
          session_id: SESSION_ID,
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

  await page.route(`**/api/backend/api/interview/sessions/${SESSION_ID}/answers`, async (route) => {
    answerRequestCount += 1;
    const payload = (await route.request().postDataJSON()) as {
      answer_text?: string;
    };
    submittedAnswerText = payload.answer_text ?? "";

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          answer_id: "a-1",
          session_id: SESSION_ID,
          question_id: "q-1",
          input_type: "text",
          interviewer_character: "jet",
          evaluation: {
            accuracy: 3.0,
            logic: 3.0,
            depth: 3.0,
            delivery: 3.0,
            total_score: 3.0,
            followup_required: false,
            followup_reason: "followup_limit_reached",
            followup_remaining: 0
          },
          coaching_message: "답변 구조를 잘 유지했습니다.",
          followup_question: null,
          interviewer_emotion: "neutral",
          next_question: null,
          session_status: "completed",
          end_reason: "completed_all_questions",
          session_completed: true
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
  await answerInput.fill("첫 줄");
  await answerInput.press("Shift+Enter");
  await answerInput.type("둘째 줄");

  await expect(answerInput).toHaveValue("첫 줄\n둘째 줄");

  await answerInput.press("Enter");

  await expect.poll(() => answerRequestCount).toBe(1);
  expect(submittedAnswerText).toBe("첫 줄\n둘째 줄");
});

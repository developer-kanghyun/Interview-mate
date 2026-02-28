import { expect, test } from "@playwright/test";
import { roomSelectors } from "./helpers/interviewRoom";

const SESSION_ID = "session-slow-start-1";

test("세션 시작 응답이 10초를 넘어도 면접방 진입이 되어야 한다", async ({ page }) => {
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
          user_id: "guest-start-timeout-1",
          trial_question_limit: 1
        }
      })
    });
  });

  await page.route("**/api/backend/api/interview/sessions/start", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      delay: 11_000,
      body: JSON.stringify({
        success: true,
        data: {
          session_id: SESSION_ID,
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
  });

  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream; charset=utf-8",
      body: "event: token\\ndata: {\"text\":\"트랜잭션 전파를 설명해 주세요.\"}\\n\\nevent: done\\ndata: [DONE]\\n\\n"
    });
  });

  await page.goto("/setup");
  await page.getByRole("button", { name: "다음" }).click();

  const stackCandidates = ["React", "Spring Boot", "Swift", "AWS", "Python", "Figma", "PRD"];
  for (const stackLabel of stackCandidates) {
    const stackButton = page.getByRole("button", { name: stackLabel, exact: true });
    if (await stackButton.isVisible()) {
      await stackButton.click();
      break;
    }
  }

  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "면접 시작" }).click();

  await expect(roomSelectors.questionBanner(page)).toContainText("트랜잭션 전파를 설명해 주세요.", {
    timeout: 20_000
  });
  await expect(page.getByText("요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.")).not.toBeVisible();
});

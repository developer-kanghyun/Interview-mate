import { expect, test } from "@playwright/test";
import { roomSelectors } from "./helpers/interviewRoom";

const SESSION_ID = "session-guest-cold-start-1";

test("게스트 인증 응답이 느려도 cold start 이후 면접 시작이 가능하다", async ({ page }) => {
  let guestAttemptCount = 0;

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
    guestAttemptCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      delay: 11_000,
      body: JSON.stringify({
        success: true,
        data: {
          user_id: "guest-cold-start-1",
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
          started_at: "2026-02-28T00:00:00.000Z",
          job_role: "backend",
          interviewer_character: "jet",
          total_questions: 1,
          status: "in_progress",
          first_question: {
            question_id: "q-1",
            category: "job",
            difficulty: "jobseeker",
            content: "의존성 주입의 장점을 설명해 주세요."
          }
        }
      })
    });
  });

  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream; charset=utf-8",
      body: "event: token\\ndata: {\"text\":\"의존성 주입의 장점을 설명해 주세요.\"}\\n\\nevent: done\\ndata: [DONE]\\n\\n"
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

  const startButton = page.getByRole("button", { name: "면접 시작" });
  await expect(startButton).toBeEnabled({ timeout: 40_000 });
  await startButton.click();

  await expect(roomSelectors.questionBanner(page)).toContainText("의존성 주입의 장점을 설명해 주세요.", {
    timeout: 20_000
  });

  expect(guestAttemptCount).toBe(1);
  await expect(page.getByText("게스트 인증 발급 실패")).not.toBeVisible();
});

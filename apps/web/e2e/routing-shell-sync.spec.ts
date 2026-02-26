import { expect, test } from "@playwright/test";
import { enterInterviewFromSetup, roomSelectors } from "./helpers/interviewRoom";

const SESSION_ID = "route-sync-session-1";

async function mockCommonApis(page: Parameters<typeof test>[0]["page"]) {
  await page.route("**/api/backend/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        timestamp: "2026-02-24T00:00:00.000Z"
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
          user_id: "user-1",
          email: "user@example.com",
          name: "user"
        }
      })
    });
  });
}

test("interview bare 경로는 setup 경로로 리다이렉트", async ({ page }) => {
  await mockCommonApis(page);

  await page.goto("/interview");

  await expect(page).toHaveURL(/\/setup$/);
});

test("setup에서 면접 시작 시 interview/{sessionId} 경로로 이동", async ({ page }) => {
  await mockCommonApis(page);

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
          total_questions: 2,
          status: "in_progress",
          first_question: {
            question_id: "q-1",
            category: "job",
            difficulty: "jobseeker",
            content: "트랜잭션 격리 수준을 설명해 주세요."
          }
        }
      })
    });
  });

  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream; charset=utf-8",
      body: "event: token\ndata: {\"text\":\"트랜잭션 격리 수준을 설명해 주세요.\"}\n\nevent: done\ndata: [DONE]\n\n"
    });
  });

  await enterInterviewFromSetup(page, "/setup");

  await expect(page).toHaveURL(new RegExp(`/interview/${SESSION_ID}$`));
  await expect(roomSelectors.questionBanner(page)).toContainText("트랜잭션 격리 수준을 설명해 주세요.");
});

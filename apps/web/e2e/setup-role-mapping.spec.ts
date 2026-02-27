import { expect, test } from "@playwright/test";

const SESSION_ID = "pm-role-session-1";

async function mockCommonApis(page: Parameters<typeof test>[0]["page"]) {
  await page.route("**/api/backend/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        timestamp: "2026-02-27T00:00:00.000Z"
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

test("setup에서 PM 선택 시 job_role=pm으로 시작 요청을 보낸다", async ({ page }) => {
  await mockCommonApis(page);

  let startRequestBody: Record<string, unknown> | null = null;

  await page.route("**/api/backend/api/interview/sessions/start", async (route) => {
    startRequestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          session_id: SESSION_ID,
          started_at: "2026-02-27T00:00:00.000Z",
          job_role: "pm",
          interviewer_character: "jet",
          total_questions: 7,
          status: "in_progress",
          first_question: {
            question_id: "q-1",
            category: "job",
            difficulty: "easy",
            content: "PM 관점에서 MVP 범위 산정 기준을 설명해 주세요."
          }
        }
      })
    });
  });

  await page.goto("/setup");

  await page.getByRole("button", { name: "PM" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "PRD" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "면접 시작" }).click();

  await expect(page).toHaveURL(new RegExp(`/interview/${SESSION_ID}$`));
  expect(startRequestBody?.job_role).toBe("pm");
});

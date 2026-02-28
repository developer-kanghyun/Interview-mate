import { expect, test } from "@playwright/test";
import { enterInterviewFromSetup } from "./helpers/interviewRoom";

test("auth/me가 5xx로 실패하면 guest 발급을 시도하지 않는다", async ({ page }) => {
  let profileAttemptCount = 0;
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
    profileAttemptCount += 1;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "프로필 조회 실패"
        }
      })
    });
  });

  await page.route("**/api/backend/api/auth/guest", async (route) => {
    guestAttemptCount += 1;
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

  await page.goto("/setup");

  await expect.poll(() => profileAttemptCount).toBeGreaterThan(0);
  await expect.poll(() => guestAttemptCount).toBe(0);
});

test("자동 인증 부트스트랩 실패는 사용자 조작 전 에러 토스트를 띄우지 않는다", async ({ page }) => {
  let profileAttemptCount = 0;

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
    profileAttemptCount += 1;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "프로필 조회 실패"
        }
      })
    });
  });

  await page.goto("/setup");

  await expect.poll(() => profileAttemptCount).toBeGreaterThan(1);
  await page.waitForTimeout(2500);
  await expect(page.getByTestId("toast-item")).toHaveCount(0);
});

test("사용자가 면접 시작을 눌렀을 때 인증 부트스트랩이 실패하면 에러 토스트를 노출한다", async ({ page }) => {
  let startAttemptCount = 0;

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
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "프로필 조회 실패"
        }
      })
    });
  });

  await page.route("**/api/backend/api/interview/sessions/start", async (route) => {
    startAttemptCount += 1;
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "세션 시작 실패"
        }
      })
    });
  });

  await enterInterviewFromSetup(page, "/setup");

  await expect(page.getByTestId("toast-item")).toContainText("서버 응답에 실패했습니다");
  await expect.poll(() => startAttemptCount).toBe(0);
});

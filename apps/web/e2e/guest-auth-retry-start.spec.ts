import { expect, test } from "@playwright/test";
import { enterInterviewFromSetup, roomSelectors } from "./helpers/interviewRoom";

const SESSION_ID = "session-guest-retry-1";

test("초기 게스트 인증 실패 후 시작 클릭 시 재시도로 입장된다", async ({ page }) => {
  let guestAttemptCount = 0;
  let guestIssued = false;
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
    if (guestAttemptCount === 1) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "UPSTREAM_UNAVAILABLE",
            message: "게스트 인증 발급 실패"
          }
        })
      });
      return;
    }

    guestIssued = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user_id: "guest-retry-1",
          trial_question_limit: 1
        }
      })
    });
  });

  await page.route("**/api/backend/api/interview/sessions/start", async (route) => {
    startAttemptCount += 1;
    if (!guestIssued) {
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
      return;
    }

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
      body: "event: token\ndata: {\"text\":\"의존성 주입의 장점을 설명해 주세요.\"}\n\nevent: done\ndata: [DONE]\n\n"
    });
  });

  await enterInterviewFromSetup(page);

  await expect(roomSelectors.questionBanner(page)).toContainText("의존성 주입의 장점을 설명해 주세요.");
  await expect.poll(() => guestAttemptCount).toBeGreaterThan(1);
  expect(startAttemptCount).toBe(1);
});

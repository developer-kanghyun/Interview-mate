import { expect, test } from "@playwright/test";

const MEMBER_SESSION_ID = "resume-member-1";
const GUEST_SESSION_ID = "resume-guest-1";
const DEEPLINK_SESSION_ID = "resume-deeplink-1";

function buildLatestActiveResponse(sessionId: string) {
  return {
    success: true,
    data: {
      has_active_session: true,
      session: {
        session_id: sessionId,
        status: "in_progress",
        end_reason: null,
        job_role: "backend",
        stack: "Spring Boot,Redis",
        difficulty: "junior",
        interviewer_character: "jet",
        total_questions: 3,
        answered_questions: 1,
        remaining_questions: 2,
        completion_rate: 33.3,
        updated_at: "2026-02-26T00:00:00.000Z",
        current_question: {
          question_id: "q-2",
          question_order: 2,
          category: "job",
          difficulty: "jobseeker",
          content: "인덱스 설계 시 고려할 점을 설명해 주세요.",
          followup_count: 0
        }
      }
    }
  };
}

function buildInvalidLatestActiveResponse(sessionId: string) {
  return {
    success: true,
    data: {
      has_active_session: true,
      session: {
        session_id: sessionId,
        status: "completed",
        end_reason: "completed",
        job_role: "backend",
        stack: "Spring Boot,Redis",
        difficulty: "junior",
        interviewer_character: "jet",
        total_questions: 3,
        answered_questions: 3,
        remaining_questions: 0,
        completion_rate: 100,
        updated_at: "2026-02-26T00:00:00.000Z",
        current_question: null
      }
    }
  };
}

async function mockHealth(page: Parameters<typeof test>[0]["page"]) {
  await page.route("**/api/backend/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        timestamp: "2026-02-26T00:00:00.000Z"
      })
    });
  });
}

async function mockLatestActive(page: Parameters<typeof test>[0]["page"], sessionId: string) {
  await page.route("**/api/backend/api/interview/sessions/latest-active", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildLatestActiveResponse(sessionId))
    });
  });

  await page.route(`**/api/backend/api/interview/sessions/${sessionId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: buildLatestActiveResponse(sessionId).data.session
      })
    });
  });
}

async function mockQuestionStream(page: Parameters<typeof test>[0]["page"]) {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream; charset=utf-8",
      body: "event: token\ndata: {\"text\":\"인덱스 설계 시 고려할 점을 설명해 주세요.\"}\n\nevent: done\ndata: [DONE]\n\n"
    });
  });
}

test("회원 사용자는 진행중 세션 발견 시 확인 모달에서 이어하기 선택 후 room으로 이동", async ({ page }) => {
  await mockHealth(page);
  await mockQuestionStream(page);
  await mockLatestActive(page, MEMBER_SESSION_ID);

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

  await page.goto("/setup");

  await expect(page.getByText("이전 세션을 이어할까요?")).toBeVisible();
  await page.getByRole("button", { name: "이어하기" }).click();

  await expect(page).toHaveURL(new RegExp(`/interview/${MEMBER_SESSION_ID}$`));
  await expect(page.getByText("인덱스 설계 시 고려할 점을 설명해 주세요.")).toBeVisible();
});

test("회원 사용자는 진행중 세션 모달에서 새 면접 시작을 선택하면 setup에 머문다", async ({ page }) => {
  await mockHealth(page);
  await mockLatestActive(page, MEMBER_SESSION_ID);

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

  await page.goto("/setup");

  await expect(page.getByText("이전 세션을 이어할까요?")).toBeVisible();
  await page.getByRole("button", { name: "새 면접 시작" }).click();

  await expect(page).toHaveURL(/\/setup$/);
  await expect(page.getByText("이전 세션을 이어할까요?")).not.toBeVisible();
});

test("회원 사용자는 latest-active가 종료/무효면 setup 유지 + 재개 불가 안내를 본다", async ({ page }) => {
  await mockHealth(page);

  await page.route("**/api/backend/api/interview/sessions/latest-active", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildInvalidLatestActiveResponse(MEMBER_SESSION_ID))
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

  await page.goto("/setup");

  await expect(page).toHaveURL(/\/setup$/);
  const resumeErrorToast = page.getByRole("alert").getByText("이전 세션은 재개할 수 없습니다. 새 면접을 시작해 주세요.");
  await expect(resumeErrorToast).toBeVisible();
  await page.getByRole("button", { name: "토스트 닫기" }).click();
  await expect(resumeErrorToast).not.toBeVisible();
  await expect(page.getByText("이전 세션을 이어할까요?")).not.toBeVisible();
});

test("room 딥링크(/interview/:id)로 들어오면 런타임이 비어있어도 복구 후 동작한다", async ({ page }) => {
  await mockHealth(page);
  await mockQuestionStream(page);
  await mockLatestActive(page, MEMBER_SESSION_ID);

  await page.route(`**/api/backend/api/interview/sessions/${DEEPLINK_SESSION_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: buildLatestActiveResponse(DEEPLINK_SESSION_ID).data.session
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

  await page.goto(`/interview/${DEEPLINK_SESSION_ID}`);

  await expect(page).toHaveURL(new RegExp(`/interview/${DEEPLINK_SESSION_ID}$`));
  await expect(page.getByText("인덱스 설계 시 고려할 점을 설명해 주세요.")).toBeVisible();
});

test("게스트 사용자는 진행중 세션 발견 시 로그인 후 이어하기로 복구된다", async ({ page }) => {
  await mockHealth(page);
  await mockQuestionStream(page);
  await mockLatestActive(page, GUEST_SESSION_ID);

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

  await page.route("**/api/backend/api/auth/google/url", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          auth_url: "/auth/google/callback?code=resume-code&state=resume-state",
          state: "resume-state"
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
          user_id: "member-1",
          email: "member@example.com",
          name: "member",
          new_user: false
        }
      })
    });
  });

  await page.goto("/setup");

  await expect(page.getByText("이전 세션을 이어할까요?")).toBeVisible();
  await page.getByRole("button", { name: "로그인 후 이어하기" }).click();

  await expect(page).toHaveURL(new RegExp(`/interview/${GUEST_SESSION_ID}$`));
  await expect(page.getByText("인덱스 설계 시 고려할 점을 설명해 주세요.")).toBeVisible();
});

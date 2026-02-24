import { expect, test } from "@playwright/test";

test("인사이트 로딩 중 액션 버튼을 비활성화한다", async ({ page }) => {
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

  await page.route("**/api/backend/api/interview/history?days=30", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          requested_days: 30,
          total_count: 1,
          items: [
            {
              session_id: "session-1",
              session_end_reason: "completed_all_questions",
              question_id: "q-1",
              question_order: 1,
              question_content: "질문",
              answer_text: "답변",
              input_type: "text",
              interviewer_emotion: "neutral",
              total_score: 3.6,
              followup_reason: "none",
              answered_at: "2026-02-24T00:00:00.000Z"
            }
          ]
        }
      })
    });
  });

  await page.route("**/api/backend/api/interview/sessions/session-1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          session_id: "session-1",
          status: "completed",
          end_reason: "completed_all_questions",
          job_role: "backend",
          interviewer_character: "jet",
          total_questions: 3,
          answered_questions: 3,
          remaining_questions: 0,
          completion_rate: 100,
          updated_at: "2026-02-24T00:00:00.000Z",
          current_question: null
        }
      })
    });
  });

  await page.goto("/interview");
  await page.getByRole("button", { name: "Insights" }).click();

  await expect(page.getByText("최근 30일 세션 기록을 불러오는 중입니다...")).toBeVisible();
  await expect(page.getByRole("button", { name: "면접 탭으로" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "약점 기반 다시 연습" })).toBeDisabled();
});

test("답변 제출 중에는 면접 종료 버튼을 비활성화한다", async ({ page }) => {
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

  await page.route("**/api/backend/api/interview/sessions/start", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          session_id: "session-2",
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

  await page.route("**/api/backend/api/interview/sessions/session-2/answers", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          answer_id: "a-1",
          session_id: "session-2",
          question_id: "q-1",
          input_type: "text",
          interviewer_character: "jet",
          evaluation: {
            accuracy: 3.1,
            logic: 3.2,
            depth: 2.9,
            delivery: 2.7,
            total_score: 3.0,
            followup_required: false,
            followup_reason: "none",
            followup_remaining: 2
          },
          coaching_message: "핵심 개념 설명은 좋았습니다.",
          followup_question: null,
          interviewer_emotion: "encourage",
          next_question: {
            question_id: "q-2",
            question_order: 2,
            category: "job",
            difficulty: "junior",
            content: "낙관적 락과 비관적 락 차이를 말해보세요."
          },
          session_status: "in_progress",
          end_reason: null,
          session_completed: false
        }
      })
    });
  });

  await page.goto("/interview");
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "면접 시작" }).click();

  await expect(page.getByText("Current Question")).toBeVisible();

  const answerInput = page.getByPlaceholder("답변을 입력하세요. (텍스트/음성 STT 연동 예정)");
  await answerInput.fill("트랜잭션 격리 수준은 동시에 접근할 때 일관성을 보장하는 단계입니다.");
  await page.getByRole("button", { name: "답변 완료" }).click();

  await expect(page.getByRole("button", { name: "답변 제출 중..." })).toBeDisabled();
  await expect(page.getByRole("button", { name: "면접 종료" })).toBeDisabled();
});

test("로그인 유도 모달에서 인증 요청 중 버튼 중복 클릭을 막는다", async ({ page }) => {
  const REPORT_SESSION_ID = "session-3";

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
            followup_remaining: 2
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
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          auth_url: "/auth/google/callback?code=fake-code",
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

  const answerInput = page.getByPlaceholder("답변을 입력하세요. (텍스트/음성 STT 연동 예정)");
  await answerInput.fill("트랜잭션 전파는 호출 관계에 따라 트랜잭션 경계를 제어하는 방식입니다.");
  await page.getByRole("button", { name: "답변 완료" }).click();

  await expect(page.getByRole("button", { name: "Google 로그인" })).toBeVisible();

  await page.getByRole("button", { name: "Google 로그인" }).click();

  await expect(page.getByRole("button", { name: "로그인 이동 중..." })).toBeDisabled();
  await expect(page.getByRole("button", { name: "닫기" })).toBeDisabled();
  await expect(page).toHaveURL(new RegExp(`/report/${REPORT_SESSION_ID}$`));
});

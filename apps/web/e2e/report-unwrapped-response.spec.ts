import { expect, test } from "@playwright/test";
import { enterInterviewFromSetup, roomSelectors } from "./helpers/interviewRoom";

const SESSION_ID = "session-unwrapped-report-1";

test("리포트 API가 unwrapped(200) 응답이어도 화면에 리포트를 렌더링한다", async ({ page }) => {
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
            accuracy: 2.5,
            logic: 2.6,
            depth: 2.2,
            delivery: 2.1,
            total_score: 2.4,
            followup_required: false,
            followup_reason: "none",
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

  await page.route(`**/api/backend/api/interview/sessions/${SESSION_ID}/report`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        session_id: SESSION_ID,
        job_role: "backend",
        session_status: "completed",
        end_reason: "completed_all_questions",
        total_questions: 1,
        answered_questions: 1,
        performance_level: "needs_improvement",
        priority_focuses: ["정확성"],
        score_summary: {
          accuracy: 2.5,
          logic: 2.6,
          depth: 2.2,
          delivery: 2.1,
          total_score: 2.4
        },
        weak_keywords: ["정확성"],
        generated_at: "2026-02-28T00:00:10.000Z",
        questions: [
          {
            question_id: "q-1",
            question_order: 1,
            question_content: "트랜잭션 전파를 설명해 주세요.",
            answer_text: "트랜잭션 전파는 호출 관계에 따라 트랜잭션 경계를 제어하는 방식입니다.",
            interviewer_emotion: "pressure",
            coaching_message: "핵심 개념 정의를 먼저 정리하세요.",
            model_answer: "모범답안",
            score: {
              accuracy: 2.5,
              logic: 2.6,
              depth: 2.2,
              delivery: 2.1,
              total_score: 2.4
            },
            weak_points: ["정확성"],
            weak_concept_keywords: ["핵심 개념 정의"],
            improvement_tip: "핵심 개념 정의를 먼저 정리하세요."
          }
        ]
      })
    });
  });

  await page.route("**/api/backend/api/interview/history**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          requested_days: 30,
          total_count: 0,
          items: []
        }
      })
    });
  });

  await enterInterviewFromSetup(page);
  await expect(roomSelectors.questionBanner(page)).toContainText("트랜잭션 전파를 설명해 주세요.");

  await roomSelectors.answerInput(page).fill("트랜잭션 전파는 호출 관계에 따라 트랜잭션 경계를 제어하는 방식입니다.");
  await page.getByRole("button", { name: "답변 완료" }).click();

  await expect(page.getByRole("heading", { name: "면접 리포트" })).toBeVisible();
  await expect(page.getByText("리포트 조회 실패")).not.toBeVisible();
});

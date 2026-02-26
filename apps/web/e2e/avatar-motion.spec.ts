import { expect, test, type Page } from "@playwright/test";
import { enterInterviewFromSetup, roomSelectors } from "./helpers/interviewRoom";

const SESSION_ID = "avatar-motion-session";

async function installBrowserMocks(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      writable: true,
      value: function play() {
        return Promise.resolve();
      }
    });

    class MockSpeechRecognition {
      lang = "ko-KR";
      interimResults = false;
      continuous = false;
      onresult: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
      onend: (() => void) | null = null;
      onstart: (() => void) | null = null;

      start() {
        this.onstart?.();
      }

      stop() {
        this.onend?.();
      }

      abort() {
        this.onend?.();
      }

      addEventListener(): void {}
      removeEventListener(): void {}
      dispatchEvent(): boolean {
        return true;
      }
    }

    const speechWindow = window as Window & {
      webkitSpeechRecognition?: any;
      SpeechRecognition?: any;
    };

    speechWindow.webkitSpeechRecognition = MockSpeechRecognition;
    speechWindow.SpeechRecognition = MockSpeechRecognition;
  });
}

async function mockCommonRoutes(page: Page) {
  await page.route("**/api/backend/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        timestamp: "2026-02-25T00:00:00.000Z"
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
          session_id: SESSION_ID,
          started_at: "2026-02-25T00:00:00.000Z",
          job_role: "backend",
          interviewer_character: "jet",
          total_questions: 3,
          status: "in_progress",
          first_question: {
            question_id: "q-1",
            category: "job",
            difficulty: "jobseeker",
            content: "React 상태 관리를 설명해 주세요."
          }
        }
      })
    });
  });

  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream; charset=utf-8",
      body:
        "event: token\n" +
        "data: {\"text\":\"React 상태 관리를 설명해 주세요.\"}\n\n" +
        "event: done\n" +
        "data: [DONE]\n\n"
    });
  });

  await page.route("**/api/tts", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "content-type": "audio/mpeg"
      },
      body: Buffer.from([0xff, 0xfb, 0x90, 0x64])
    });
  });
}

async function enterRoom(page: Page) {
  await enterInterviewFromSetup(page);
  const avatar = page.locator("[data-avatar-state]").first();
  await expect(avatar).toHaveAttribute("data-avatar-state", "asking");
  return avatar;
}

test("아바타가 follow-up 시 confused 단발 동작으로 전환된다", async ({ page }) => {
  await installBrowserMocks(page);
  await mockCommonRoutes(page);

  await page.route(`**/api/backend/api/interview/sessions/${SESSION_ID}/answers`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 220));
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
            accuracy: 1.8,
            logic: 1.9,
            depth: 1.8,
            delivery: 1.7,
            total_score: 1.8,
            followup_required: true,
            followup_reason: "missing_core_detail",
            followup_remaining: 1
          },
          coaching_message: "핵심 정의와 근거를 먼저 제시해 주세요.",
          followup_question: {
            question_id: "q-1-f1",
            question_order: 1,
            followup_count: 1,
            content: "구체 예시를 들어 보세요."
          },
          interviewer_emotion: "pressure",
          next_question: null,
          state: "fake-state",
          session_completed: false
        }
      })
    });
  });

  const avatar = await enterRoom(page);

  const voiceToggleButton = roomSelectors.voiceToggle(page);
  await expect(voiceToggleButton).toHaveText("음성 답변");
  await voiceToggleButton.click();
  await expect(avatar).toHaveAttribute("data-avatar-state", "listening");
  await expect(voiceToggleButton).toHaveText("녹음 종료");
  await voiceToggleButton.click();

  const submitButton = page.getByRole("button", { name: "답변 완료" });
  await page.getByLabel("면접 답변 입력").fill("상태는 로컬, 서버, 전역으로 분리합니다.");
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(avatar).toHaveAttribute("data-avatar-state", "thinking");
  await expect(avatar).toHaveAttribute("data-avatar-state", "confused");

  const cueToken = Number(await avatar.getAttribute("data-avatar-cue"));
  expect(cueToken).toBeGreaterThan(0);
});

test("아바타가 고득점 응답에서 celebrate 단발 동작으로 전환된다", async ({ page }) => {
  await installBrowserMocks(page);
  await mockCommonRoutes(page);

  await page.route(`**/api/backend/api/interview/sessions/${SESSION_ID}/answers`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 220));
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
            accuracy: 4.7,
            logic: 4.6,
            depth: 4.8,
            delivery: 4.4,
            total_score: 4.7,
            followup_required: false,
            followup_reason: "none",
            followup_remaining: 2
          },
          coaching_message: "좋습니다. 구조와 예시가 모두 명확합니다.",
          followup_question: null,
          interviewer_emotion: "encourage",
          next_question: {
            question_id: "q-2",
            question_order: 2,
            content: "렌더 최적화를 위해 어떤 전략을 쓰나요?"
          },
          state: "fake-state",
          session_completed: false
        }
      })
    });
  });

  const avatar = await enterRoom(page);

  const submitButton = page.getByRole("button", { name: "답변 완료" });
  await page.getByLabel("면접 답변 입력").fill("병목은 측정하고, 메모이제이션은 근거 기반으로 적용합니다.");
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(avatar).toHaveAttribute("data-avatar-state", "thinking");
  await expect(avatar).toHaveAttribute("data-avatar-state", "celebrate");

  const cueToken = Number(await avatar.getAttribute("data-avatar-cue"));
  expect(cueToken).toBeGreaterThan(0);
});

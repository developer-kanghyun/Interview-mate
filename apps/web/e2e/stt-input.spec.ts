import { expect, test } from "@playwright/test";
import { enterInterviewFromSetup, roomSelectors } from "./helpers/interviewRoom";

const SESSION_ID = "stt-session-1";

test("STT 미지원 브라우저에서 토스트 안내 후 재시도 가능", async ({ page }) => {
  await page.addInitScript(() => {
    const speechWindow = window as Window & {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    delete speechWindow.SpeechRecognition;
    delete speechWindow.webkitSpeechRecognition;
  });

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

  await enterInterviewFromSetup(page);
  await expect(roomSelectors.questionBanner(page)).toContainText("트랜잭션 격리 수준을 설명해 주세요.");

  const voiceButton = roomSelectors.voiceToggle(page);
  await expect(voiceButton).toHaveText("음성 답변");
  await expect(voiceButton).toBeVisible();
  await voiceButton.click();

  await expect(
    page.getByText("이 브라우저는 음성 인식을 지원하지 않습니다. 텍스트로 답변해 주세요.")
  ).toBeVisible();
});

test("STT 전사 후 자동 제출되지 않고 녹음 종료 클릭 시 음성 제출", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      writable: true,
      value: function play() {
        const target = this;
        setTimeout(() => {
          target.dispatchEvent(new Event("ended"));
        }, 0);
        return Promise.resolve();
      }
    });

    let startCount = 0;

    const runtimeWindow = window as Window & {
      __sttStartCount?: number;
    };
    runtimeWindow.__sttStartCount = 0;

    class MockSpeechRecognition {
      lang = "ko-KR";
      interimResults = false;
      continuous = false;
      onresult: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
      onend: (() => void) | null = null;
      onstart: (() => void) | null = null;
      onnomatch: (() => void) | null = null;
      onaudiostart: (() => void) | null = null;
      onaudioend: (() => void) | null = null;
      onsoundstart: (() => void) | null = null;
      onsoundend: (() => void) | null = null;
      onspeechstart: (() => void) | null = null;
      onspeechend: (() => void) | null = null;

      start() {
        startCount += 1;
        runtimeWindow.__sttStartCount = startCount;
        this.onstart?.();
        if (startCount === 1) {
          setTimeout(() => {
            this.onresult?.({
              results: [[{ transcript: "음성 수동 제출 테스트" }]]
            });
            this.onend?.();
          }, 50);
        } else if (startCount === 2) {
          setTimeout(() => {
            this.onresult?.({
              results: [[{ transcript: "상태 동기화 기준도 설명하겠습니다" }]]
            });
            this.onend?.();
          }, 50);
        }
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

  await page.route("**/api/tts", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "content-type": "audio/mpeg"
      },
      body: Buffer.from([0xff, 0xfb, 0x90, 0x64])
    });
  });

  let submittedInputType = "";
  let submittedAnswerText = "";
  let submitRequestCount = 0;

  await page.route(`**/api/backend/api/interview/sessions/${SESSION_ID}/answers`, async (route) => {
    submitRequestCount += 1;
    const payload = route.request().postDataJSON() as {
      input_type?: string;
      answer_text?: string;
    };
    submittedInputType = payload.input_type ?? "";
    submittedAnswerText = payload.answer_text ?? "";

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          answer_id: "a-1",
          session_id: SESSION_ID,
          question_id: "1",
          input_type: "voice",
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
          coaching_message: "핵심을 먼저 말하고 근거를 이어가세요.",
          followup_question: null,
          interviewer_emotion: "neutral",
          next_question: {
            question_id: "2",
            question_order: 2,
            content: "락 경합 발생 시 대응 전략을 말해 주세요."
          },
          session_status: "in_progress",
          end_reason: null,
          session_completed: false
        }
      })
    });
  });

  await enterInterviewFromSetup(page);
  await expect(roomSelectors.questionBanner(page)).toContainText("트랜잭션 격리 수준을 설명해 주세요.");

  const voiceButton = roomSelectors.voiceToggle(page);
  await expect(voiceButton).toHaveText("음성 답변");
  await voiceButton.click();

  await expect.poll(() => page.evaluate(() => (window as Window & { __sttStartCount?: number }).__sttStartCount ?? 0)).toBeGreaterThanOrEqual(2);
  await expect.poll(() => submitRequestCount).toBe(0);
  await expect(roomSelectors.answerInput(page)).toHaveValue("음성 수동 제출 테스트 상태 동기화 기준도 설명하겠습니다");

  await expect(voiceButton).toHaveText("녹음 종료");
  await voiceButton.click();

  await expect.poll(() => submitRequestCount).toBe(1);
  await expect.poll(() => submittedInputType).toBe("voice");
  await expect.poll(() => submittedAnswerText).toBe("음성 수동 제출 테스트 상태 동기화 기준도 설명하겠습니다");
  await expect(page.getByText("핵심을 먼저 말하고 근거를 이어가세요.")).toBeVisible();
});

test("STT 녹음 중지 토글 동작", async ({ page }) => {
  await page.addInitScript(() => {
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

  await enterInterviewFromSetup(page);
  await expect(roomSelectors.questionBanner(page)).toContainText("트랜잭션 격리 수준을 설명해 주세요.");

  const startButton = roomSelectors.voiceToggle(page);
  await expect(startButton).toHaveText("음성 답변");
  await expect(startButton).toBeEnabled();
  await startButton.click();

  const stopButton = roomSelectors.voiceToggle(page);
  await expect(stopButton).toHaveText("녹음 종료");
  await expect(stopButton).toBeVisible();
  await expect(stopButton).toBeEnabled();
  await stopButton.click();

  await expect(roomSelectors.voiceToggle(page)).toHaveText("음성 답변");
});

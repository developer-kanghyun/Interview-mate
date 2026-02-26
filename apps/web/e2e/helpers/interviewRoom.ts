import type { Locator, Page } from "@playwright/test";

export async function enterInterviewFromSetup(page: Page, startPath: "/interview" | "/setup" = "/interview") {
  await page.goto(startPath);
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "면접 시작" }).click();
}

export const roomSelectors = {
  questionBanner(page: Page): Locator {
    return page.getByTestId("room-question-banner");
  },
  answerInput(page: Page): Locator {
    return page.getByTestId("room-answer-input");
  },
  voiceToggle(page: Page): Locator {
    return page.getByTestId("room-voice-toggle");
  },
  submitAnswer(page: Page): Locator {
    return page.getByTestId("room-submit-answer");
  }
};

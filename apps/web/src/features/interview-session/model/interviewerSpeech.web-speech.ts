export async function speakWithWebSpeech(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";

  await new Promise<void>((resolve, reject) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error("speechSynthesis 재생 실패"));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

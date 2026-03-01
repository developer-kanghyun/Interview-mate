export function resetTtsAudioElement(audioElement: HTMLAudioElement | null) {
  if (!audioElement) {
    return;
  }

  audioElement.pause();
  audioElement.currentTime = 0;
  audioElement.removeAttribute("src");
  audioElement.load();
}

type PlayBlobWithAudioElementOptions = {
  audioElement: HTMLAudioElement;
  blob: Blob;
  signal: AbortSignal;
  onPlayed: () => void;
  onAutoplayBlocked: () => void;
};

export async function playBlobWithAudioElement({
  audioElement,
  blob,
  signal,
  onPlayed,
  onAutoplayBlocked
}: PlayBlobWithAudioElementOptions) {
  const objectUrl = URL.createObjectURL(blob);
  audioElement.src = objectUrl;

  try {
    await audioElement.play();
    onPlayed();
  } catch (error: any) {
    if (error.name === "NotAllowedError") {
      onAutoplayBlocked();
    }
    URL.revokeObjectURL(objectUrl);
    throw error;
  }

  await new Promise<void>((resolve, reject) => {
    const handleEnded = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error("TTS 오디오 재생에 실패했습니다."));
    };

    const handleAbort = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("error", handleError);
      signal.removeEventListener("abort", handleAbort);
    };

    audioElement.addEventListener("ended", handleEnded, { once: true });
    audioElement.addEventListener("error", handleError, { once: true });
    signal.addEventListener("abort", handleAbort, { once: true });
  });

  return objectUrl;
}

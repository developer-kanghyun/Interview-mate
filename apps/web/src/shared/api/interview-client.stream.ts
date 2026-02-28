export type SseHandlers = {
  onToken: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
  onActivity?: () => void;
};

export function parseApiErrorMessage(raw: string, status: number, authRequiredMessage: string) {
  if (status === 401 || status === 403) {
    return authRequiredMessage;
  }

  if (!raw) {
    return `질문 스트리밍 요청이 실패했습니다. (${status})`;
  }

  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string }; message?: string };
    return parsed.error?.message || parsed.message || raw;
  } catch {
    return raw;
  }
}

function parseTokenText(data: string) {
  if (!data || data === "[DONE]") {
    return "";
  }

  try {
    const parsed = JSON.parse(data) as {
      text?: string;
      token?: string;
      choices?: Array<{
        text?: string;
        delta?: { content?: string };
      }>;
    };
    if (typeof parsed.text === "string") {
      return parsed.text;
    }
    if (typeof parsed.token === "string") {
      return parsed.token;
    }
    const choice = parsed.choices?.[0];
    if (typeof choice?.delta?.content === "string") {
      return choice.delta.content;
    }
    if (typeof choice?.text === "string") {
      return choice.text;
    }
    return "";
  } catch {
    return data;
  }
}

function parseSseBlock(rawBlock: string) {
  const lines = rawBlock.split(/\r?\n/);
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  return {
    eventName,
    data: dataLines.join("\n")
  };
}

export async function consumeSseResponse(body: ReadableStream<Uint8Array>, handlers: SseHandlers) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let doneReceived = false;

  const handleBlock = (rawBlock: string) => {
    handlers.onActivity?.();
    const { eventName, data } = parseSseBlock(rawBlock);
    if (!data) {
      return;
    }

    if (eventName === "error") {
      handlers.onError(data);
      return;
    }

    if (eventName === "done" || data === "[DONE]") {
      doneReceived = true;
      handlers.onDone();
      return;
    }

    if (eventName === "token" || eventName === "message") {
      const tokenText = parseTokenText(data);
      if (tokenText) {
        handlers.onToken(tokenText);
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    handlers.onActivity?.();
    buffer += decoder.decode(value, { stream: true }).replaceAll("\r", "");
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      handleBlock(block);
      if (doneReceived) {
        return;
      }
    }
  }

  const tail = buffer.trim();
  if (tail) {
    handleBlock(tail);
  }

  if (!doneReceived) {
    handlers.onError("스트리밍이 비정상 종료되었습니다. 잠시 후 다시 시도해 주세요.");
  }
}

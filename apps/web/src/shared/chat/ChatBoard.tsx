"use client";

import { useEffect, useRef } from "react";
import { ChatBubble, type ChatBubbleProps } from "@/shared/chat/ChatBubble";

export type ChatMessage = ChatBubbleProps & {
  id: string;
};

type ChatBoardProps = {
  messages: ChatMessage[];
};

export function ChatBoard({ messages }: ChatBoardProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="grid gap-3 pb-1">
      {messages.map((message) => (
        <ChatBubble key={message.id} role={message.role} content={message.content} meta={message.meta} />
      ))}
      <div ref={endRef} />
    </div>
  );
}

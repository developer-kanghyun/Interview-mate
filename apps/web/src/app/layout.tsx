import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interview Mate",
  description: "개발자 AI 모의면접"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh overflow-x-hidden bg-white font-display text-im-text-main">
        {children}
      </body>
    </html>
  );
}

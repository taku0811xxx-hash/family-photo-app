import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutClient from "./LayoutClient";
import { AuthProvider } from "../lib/contexts/AuthContext"; // 🔥 追加

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// app/layout.tsx

export const metadata: Metadata = {
  title: "Family Album",
  description: "家族の思い出を、美しく残す場所",
  manifest: "/manifest.json", // ✨ これを追加！
  themeColor: "#1e293b",     // ✨ スマホのステータスバーの色
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", // ✨ ズーム防止（アプリ感を出すため）
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja" // 日本語に設定
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* 🔥 AuthProviderで全体を包む */}
        <AuthProvider>
          <LayoutClient>{children}</LayoutClient>
        </AuthProvider>
      </body>
    </html>
  );
}
import type { Metadata, Viewport } from "next"; // ✨ Viewport 型を追加
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutClient from "./LayoutClient";
import { AuthProvider } from "../lib/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ 1. メタデータ（タイトルや説明、マニフェストなど）
export const metadata: Metadata = {
  title: "Family Album",
  description: "家族の思い出を、美しく残す場所",
  manifest: "/manifest.json",
};

// ✅ 2. ビューポート設定（色やズーム設定など）を分離してエクスポート
export const viewport: Viewport = {
  themeColor: "#1e293b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // user-scalable: 0 は false と書きます
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <LayoutClient>{children}</LayoutClient>
        </AuthProvider>
      </body>
    </html>
  );
}
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../lib/contexts/AuthContext"; // 🔥 AuthProviderのフックを使う
import Header from "./components/Header";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, familyId, loading } = useAuth(); // 🔥 ログイン状態と家族ID、ロード中かを取得
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // ロード中はリダイレクト判定をしない
    if (loading) return;

    // 1. ログインしていない場合
    if (!user) {
      if (pathname !== "/login") {
        router.push("/login");
      }
      return;
    }

    // 2. ログインはしているが、家族(familyId)に属していない場合
    // ※セットアップ画面(/setup-family)自体にいる時はリダイレクトさせない
    if (!familyId && pathname !== "/setup-family") {
      console.log("家族未設定のためセットアップへ移動");
      router.push("/setup-family");
    }
    
    // 3. 家族に属しているのにセットアップ画面に居座ろうとした場合（おまけ）
    if (familyId && pathname === "/setup-family") {
      router.push("/");
    }

  }, [user, familyId, loading, pathname, router]);

  // ロード中の表示（一瞬真っ白になるのを防ぐ）
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <p className="text-slate-300 text-xs tracking-[0.3em] uppercase animate-pulse">Loading...</p>
      </div>
    );
  }

  // ログインしていない、かつログイン画面でもない場合は何も出さない（リダイレクト待ち）
  if (!user && pathname !== "/login") return null;

  return (
    <>
      {/* ログイン済み、かつ(家族設定済み OR セットアップ画面)の場合のみ表示 */}
      {user && <Header />}
      {children}
    </>
  );
}
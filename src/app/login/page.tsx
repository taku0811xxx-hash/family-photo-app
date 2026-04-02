"use client";

import { auth, provider } from "../../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../../lib/contexts/AuthContext";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  useEffect(() => {
    if (!loading && user) {
      router.push(returnTo);
    }
  }, [user, loading, router, returnTo]);

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-slate-800 font-sans relative overflow-hidden">
      
      {/* ☁️ 背景の装飾 */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-slate-100 rounded-full blur-3xl opacity-60 animate-pulse"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-slate-100 rounded-full blur-3xl opacity-60"></div>

      <div className="w-full max-w-sm space-y-16 text-center z-10 animate-in fade-in zoom-in-95 duration-1000">
        
        {/* ロゴ・タイトル */}
        <div className="space-y-6">
          <div className="w-20 h-20 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-center justify-center mx-auto mb-8 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
             <span className="text-3xl grayscale opacity-60">📸</span>
          </div>
          <h1 className="text-3xl font-serif tracking-[0.3em] text-slate-700 uppercase">
            Family<br/>Album
          </h1>
          <div className="h-px w-10 bg-slate-200 mx-auto"></div>
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.4em] font-light">
            Private & Minimal Memories
          </p>
        </div>

        {/* ログインボタン */}
        <div className="space-y-8">
          <button
            onClick={login}
            className="group relative w-full py-5 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold tracking-[0.2em] uppercase text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center justify-center gap-3">
              {/* Googleっぽいアイコン（SVG） */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </div>
          </button>

          <p className="text-[9px] text-slate-300 tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto">
            家族だけの安全な場所へ。<br/>
            Googleアカウントでログインしてください。
          </p>
        </div>

        {/* フッター */}
        <div className="pt-8">
           <span className="text-[9px] text-slate-200 uppercase tracking-[1em] font-extralight italic">2026 Studio</span>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../lib/contexts/AuthContext";
import { db } from "../../lib/firebase";
import { doc, setDoc, query, collection, where, getDocs } from "firebase/firestore";

export default function JoinPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [status, setStatus] = useState("Checking Invitation...");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const processJoin = async () => {
      if (!user) {
        // ログインしていない場合は戻り先を指定してログインへ
        router.push(`/login?returnTo=/join?code=${code}`);
        return;
      }

      if (!code) {
        setStatus("Invitation code not found.");
        setError(true);
        return;
      }

      try {
        // 家族グループの存在確認
        const q = query(collection(db, "users"), where("familyId", "==", code));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setStatus("This invitation link is invalid.");
          setError(true);
          return;
        }

        // 参加登録
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          displayName: user.displayName || "Family Member",
          familyId: code,
          role: "member",
          createdAt: new Date(),
        }, { merge: true });

        setStatus("Welcome to the Family!");
        setTimeout(() => (window.location.href = "/"), 2000);
      } catch (e) {
        setStatus("An error occurred. Please try again.");
        setError(true);
      }
    };

    processJoin();
  }, [user, authLoading, code, router]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
      
      {/* 🏷 装飾的な背景要素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-slate-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-slate-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="relative w-full max-w-sm space-y-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* アイコンエリア */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className={`absolute inset-0 border border-slate-200 rounded-full ${!error ? 'animate-ping' : ''} duration-[3s] opacity-20`}></div>
          <div className="w-20 h-20 bg-white border border-slate-50 rounded-[2.5rem] shadow-sm flex items-center justify-center">
            <span className="text-3xl grayscale opacity-40">{error ? "⚠️" : "✉️"}</span>
          </div>
        </div>

        {/* テキストエリア */}
        <div className="space-y-4">
          <h1 className="text-2xl font-serif tracking-[0.2em] text-slate-700 uppercase">
            {error ? "Invitation Error" : "Join Family"}
          </h1>
          <div className="h-px w-12 bg-slate-200 mx-auto"></div>
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.3em] leading-relaxed min-h-[3em]">
            {status}
          </p>
        </div>

        {/* エラー時のボタン */}
        {error && (
          <button
            onClick={() => router.push("/")}
            className="px-10 py-4 bg-slate-800 text-white rounded-full text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-slate-700 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            Back to Home
          </button>
        )}

        {/* 成功・読み込み時のアニメーションドット */}
        {!error && (
          <div className="flex justify-center gap-2 pt-4">
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce"></div>
          </div>
        )}
      </div>

      {/* コピーライト的な装飾 */}
      <footer className="fixed bottom-12 text-[9px] text-slate-300 uppercase tracking-[0.5em] font-light">
        Family Photo Album
      </footer>
    </div>
  );
}
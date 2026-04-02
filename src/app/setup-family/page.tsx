"use client";

import { useState } from "react";
import { db, auth } from "../../lib/firebase";
import { doc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { useAuth } from "../../lib/contexts/AuthContext";

export default function SetupFamilyPage() {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  
  // 成功時のステート
  const [successInfo, setSuccessInfo] = useState<{ id: string; type: "create" | "join" } | null>(null);
  const [copied, setCopied] = useState(false);

  // 招待URLを生成
  const getInviteUrl = (code: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/join?code=${code}`;
  };

  // URLをコピーする
  const handleCopyLink = async (code: string) => {
    const url = getInviteUrl(code);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 🏠 新規作成
  const createNewFamily = async () => {
    if (!user) return;
    setIsProcessing(true);
    setError("");
    try {
      const newFamilyId = Math.random().toString(36).substring(2, 5) + "-" + Math.random().toString(36).substring(2, 6);
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: user.displayName,
        familyId: newFamilyId,
        role: "admin",
        createdAt: new Date(),
      });
      setSuccessInfo({ id: newFamilyId, type: "create" });
    } catch (e) {
      setError("グループ作成に失敗しました。");
    } finally {
      setIsProcessing(false);
    }
  };

  // 📩 参加
  const joinFamily = async () => {
    const code = inviteCode.trim();
    if (!user || !code) return;
    setIsProcessing(true);
    setError("");
    try {
      const q = query(collection(db, "users"), where("familyId", "==", code));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setError("有効な招待IDではありません。");
        setIsProcessing(false);
        return;
      }
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: user.displayName,
        familyId: code,
        role: "member",
        createdAt: new Date(),
      });
      setSuccessInfo({ id: code, type: "join" });
    } catch (e) {
      setError("参加に失敗しました。IDを確認してください。");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* ロゴ・見出し */}
        <div className="text-center space-y-4">
          <div className="bg-white w-20 h-20 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl italic font-serif text-slate-700">f.</span>
          </div>
          <h1 className="text-2xl font-serif tracking-widest text-slate-800 uppercase">Welcome</h1>
          <p className="text-[10px] text-slate-400 tracking-[0.2em] uppercase leading-relaxed px-10">
            家族のアルバムを始めるために、<br />グループを作成するか招待IDを入力してください。
          </p>
        </div>

        <div className="space-y-8">
          {/* 新規作成セクション */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] text-center">New Family</h2>
            <button
              onClick={createNewFamily}
              disabled={isProcessing}
              className="w-full py-4 bg-slate-800 text-white rounded-2xl text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
            >
              家族グループを新規作成
            </button>
          </section>

          <div className="flex items-center gap-4 px-10">
            <div className="h-[1px] flex-1 bg-slate-100"></div>
            <span className="text-[10px] text-slate-200 font-bold uppercase tracking-widest">or</span>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          {/* 参加セクション */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] text-center">Join Family</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="招待IDを入力 (abc-1234)"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[16px] focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all text-center tracking-wider placeholder:text-slate-200"
              />
              <button
                onClick={joinFamily}
                disabled={isProcessing || !inviteCode}
                className="w-full py-4 bg-white text-slate-800 border border-slate-200 rounded-2xl text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-30"
              >
                グループに参加
              </button>
            </div>
          </section>
        </div>

        {error && <p className="text-rose-500 text-[10px] text-center tracking-widest uppercase animate-bounce">{error}</p>}

        <button 
          onClick={() => auth.signOut()}
          className="w-full text-[10px] text-slate-300 hover:text-slate-500 transition-colors tracking-[0.3em] uppercase"
        >
          Sign Out
        </button>
      </div>

      {/* --- ✨ 成功時カスタムモーダル --- */}
      {successInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
          
          <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center animate-in zoom-in-95 duration-500 overflow-hidden">
            {/* 装飾用の背景サークル */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-50 rounded-full opacity-50" />
            
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl animate-bounce relative z-10">
              ✓
            </div>
            
            <h3 className="text-slate-800 font-serif italic text-2xl mb-2 relative z-10">Success!</h3>
            <p className="text-slate-400 text-[10px] leading-relaxed mb-8 tracking-[0.2em] uppercase relative z-10">
              {successInfo.type === "create" ? "新しい家族グループが誕生しました" : "家族グループに参加しました"}
            </p>

            {successInfo.type === "create" && (
              <div className="mb-8 space-y-3 relative z-10">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:border-emerald-100">
                  <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] mb-2">招待コード</p>
                  <p className="text-2xl font-mono tracking-tighter text-slate-700 font-bold mb-4">{successInfo.id}</p>
                  
                  <button
                    onClick={() => handleCopyLink(successInfo.id)}
                    className={`w-full py-3 rounded-xl text-[9px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                      copied ? "bg-emerald-500 text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-800 hover:text-slate-800"
                    }`}
                  >
                    {copied ? "URL COPIED!" : "招待URLをコピーして送る"}
                  </button>
                </div>
                <p className="text-[9px] text-slate-300 italic">※このURLをLINEなどで家族に送ってください</p>
              </div>
            )}
            
            <button
              onClick={() => window.location.href = "/"}
              className="w-full py-5 bg-slate-800 text-white rounded-[1.5rem] text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-slate-700 transition-all shadow-xl shadow-slate-200 relative z-10"
            >
              アルバムを始める
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
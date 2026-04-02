"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../lib/contexts/AuthContext";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { familyId } = useAuth(); // ログイン中の家族IDを取得
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const linkStyle = (path: string) => ({
    marginRight: 20,
    cursor: "pointer",
    fontSize: "11px",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    fontWeight: pathname === path ? ("700" as const) : ("400" as const),
    color: pathname === path ? "#1e293b" : "#94a3b8",
    transition: "all 0.3s ease",
  });

  const handleCopyInvite = async () => {
    if (!familyId) return;
    const url = `${window.location.origin}/join?code=${familyId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header
        style={{
          padding: "20px 24px",
          backgroundColor: "rgba(250, 250, 250, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* 左：ナビゲーション */}
        <nav style={{ display: "flex", alignItems: "center" }}>
          <span style={linkStyle("/")} onClick={() => router.push("/")}>Home</span>
          <span style={linkStyle("/gallery")} onClick={() => router.push("/gallery")}>Gallery</span>
          <span style={linkStyle("/upload")} onClick={() => router.push("/upload")}>Upload</span>
        </nav>

        {/* 右：アクション */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* 招待ボタン */}
          {familyId && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-800 hover:text-white transition-all active:scale-95"
            >
              Invite
            </button>
          )}
          
          <button 
            onClick={() => auth.signOut()}
            className="text-[10px] text-slate-300 hover:text-rose-400 transition-colors uppercase tracking-widest"
          >
            Logout
          </button>
        </div>
      </header>

      {/* --- ✨ 招待用クイックモーダル --- */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
          
          <div className="relative bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowInviteModal(false)}
              className="absolute top-6 right-6 text-slate-300 hover:text-slate-500"
            >×</button>

            <h3 className="text-slate-800 font-serif italic text-lg mb-1">Invite Family</h3>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-6">家族をアルバムに招待</p>

            <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
              <p className="text-[8px] text-slate-300 uppercase tracking-widest mb-1">Your Family ID</p>
              <p className="text-xl font-mono font-bold text-slate-700 tracking-wider mb-4">{familyId}</p>
              
              <button
                onClick={handleCopyInvite}
                className={`w-full py-3 rounded-xl text-[9px] font-bold tracking-widest uppercase transition-all ${
                  copied ? "bg-emerald-500 text-white" : "bg-slate-800 text-white hover:opacity-90"
                }`}
              >
                {copied ? "URL COPIED!" : "招待URLをコピー"}
              </button>
            </div>

            <p className="text-[9px] text-slate-400 leading-relaxed px-4">
              コピーしたURLをLINEなどで家族に送ると、<br />このアルバムに参加できます。
            </p>
          </div>
        </div>
      )}
    </>
  );
}
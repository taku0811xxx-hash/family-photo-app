"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { useAuth } from "../../lib/contexts/AuthContext"; // 🔥 AuthContextを使う
import Comment from "../components/Comment";
import Like from "../components/Like";
import { useRouter } from "next/navigation";

type Post = {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  userName?: string;
};

export default function GalleryPage() {
  const router = useRouter();
  const { familyId, loading: authLoading } = useAuth(); // 🔥 家族IDを取得
  const [images, setImages] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true); // データ取得中フラグ

  useEffect(() => {
    // 家族IDが確定するまで待つ
    if (authLoading || !familyId) return;

    const fetchData = async () => {
      try {
        const q = query(
          collection(db, "posts"),
          where("familyId", "==", familyId), // 🔥 動的なfamilyIdで検索
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const list: Post[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            imageUrl: data.imageUrl,
            thumbnailUrl: data.thumbnailUrl || data.imageUrl,
            tags: data.tags || [],
            userName: data.userName || "名無し",
          });
        });
        setImages(list);
      } catch (error) {
        console.error("Error fetching gallery:", error);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [familyId, authLoading]);

  // キーボード操作（Escで閉じる）
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCurrentIndex(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ⌛️ ロード中の表示
  if (authLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <p className="text-[10px] text-slate-300 tracking-[0.3em] uppercase animate-pulse">Loading Gallery...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-32 text-slate-800 font-sans">
      <header className="pt-12 pb-8 px-6 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="text-slate-400 hover:text-slate-800 transition-colors text-sm tracking-widest uppercase font-medium">← Back</button>
        <h1 className="text-2xl font-serif tracking-[0.2em] text-slate-700 uppercase">Gallery</h1>
        <div className="w-12"></div>
      </header>

      {/* --- ✨ 写真が0件の時のオシャレな表示 --- */}
      {images.length === 0 ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 border border-slate-200 rounded-full animate-ping duration-[3s] opacity-20"></div>
            <div className="w-24 h-24 bg-white border border-slate-50 rounded-[2.5rem] shadow-sm flex items-center justify-center">
              <span className="text-3xl grayscale opacity-20">📸</span>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-serif italic text-slate-800 tracking-wide">No memories yet.</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
              まだ写真がありません。<br />
              家族の最初の思い出をアップロードしましょう。
            </p>
          </div>
          <button
            onClick={() => router.push("/upload")}
            className="px-10 py-4 bg-slate-800 text-white rounded-full text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-slate-700 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            Upload First Photo
          </button>
        </div>
      ) : (
        /* 🖼 Masonry Grid (既存のコード) */
        <div className="px-4 columns-2 md:columns-3 lg:columns-4 gap-4 space-y-6">
          {images.map((post, index) => (
            <div key={post.id} className="break-inside-avoid group cursor-pointer" onClick={() => setCurrentIndex(index)}>
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-1 border border-slate-100">
                <img src={post.thumbnailUrl} alt="" className="w-full h-auto block transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
              </div>
              <div className="mt-3 px-1">
                <div className="flex items-center justify-between mb-1">
                  <div onClick={(e) => e.stopPropagation()} className="transform scale-90 -ml-1"><Like postId={post.id} /></div>
                  {post.userName && post.userName !== "名無し" && <span className="text-[10px] text-slate-400 tracking-wider uppercase font-light font-sans">by {post.userName}</span>}
                </div>
                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  {post.tags?.map((tag, i) => (
                    <span key={i} className="text-[10px] font-medium text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" onClick={() => router.push(`/tag/${tag}`)}>#{tag}</span>
                  ))}
                </div>
                <div className="mt-2 opacity-70 scale-[0.85] origin-left border-t border-slate-50 pt-2" onClick={(e) => e.stopPropagation()}><Comment postId={post.id} /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🎭 フルスクリーン・モーダル (既存のコード) */}
      {currentIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-slate-900/98 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300" onClick={() => setCurrentIndex(null)}>
          <button className="absolute top-8 right-8 text-white/40 hover:text-white text-4xl font-extralight transition-colors">×</button>
          <div className="relative w-full h-[85vh] flex items-center justify-center p-6">
            <button onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : 0)); }} className="absolute left-6 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"><span className="text-2xl font-light">‹</span></button>
            <img src={images[currentIndex].imageUrl} alt="" className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded animate-in zoom-in-95 duration-500" onClick={(e) => e.stopPropagation()} />
            {/* 次へボタン */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // prev が null でないことを確認してから計算するように修正
                setCurrentIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0));
              }}
              className="absolute right-6 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
            >
              <span className="text-2xl font-light">›</span>
            </button>
          </div>
          <div className="mt-2 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs tracking-[0.3em] text-white/40 uppercase font-light">Photographed by {images[currentIndex].userName}</p>
          </div>
        </div>
      )}

      {/* 📱 下部ナビゲーション（ホーム画面と統一） */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl flex justify-around items-center py-4 px-6 z-50">
        <button onClick={() => router.push("/")} className="p-2 text-slate-300 hover:text-slate-800 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </button>
        <button
          onClick={() => router.push("/upload")}
          className="bg-slate-800 text-white w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transform -translate-y-2 hover:bg-slate-700 active:scale-95 transition-all"
        >
          <span className="text-2xl font-light">+</span>
        </button>
        <button onClick={() => router.push("/gallery")} className="p-2 text-slate-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </button>
      </nav>
    </div>
  );
}
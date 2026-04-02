"use client";

import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

export default function Home() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchImages = async () => {
      const snapshot = await getDocs(collection(db, "posts"));
      const list: string[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.imageUrl) list.push(data.imageUrl);
      });
      setImages(list);
    };
    fetchImages();
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [images]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? prev : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? prev : prev - 1));
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 flex flex-col font-sans">

      {/* 🏷 ヘッダー / タイトル */}
      <header className="pt-12 pb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-serif tracking-[0.2em] text-slate-700 uppercase">
          Family Photo
        </h1>
        <p className="text-xs text-slate-400 mt-2 tracking-widest uppercase">Our Precious Moments</p>
      </header>

      {/* 🖼 カルーセルエリア */}
      <div className="relative w-full h-[40vh] overflow-hidden flex items-center mb-8">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{
            transform: `translateX(calc(50vw - 16.66vw - (${currentIndex} * 33.33vw)))`,
          }}
        >
          {images.map((img, index) => {
            const isCenter = index === currentIndex;
            return (
              <div key={index} className="flex-shrink-0 w-[33.33vw] flex justify-center items-center">
                <div
                  className={`relative rounded-2xl flex items-center justify-center transition-all duration-700 overflow-hidden
                  ${isCenter
                      ? "w-[90%] h-[32vh] scale-110 opacity-100 shadow-2xl shadow-slate-300 bg-white"
                      : "w-[80%] h-[24vh] scale-90 opacity-20 blur-[1px] bg-white/40"
                    }`}
                >
                  {/* 修正箇所：imgタグのクラスを変更 */}
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-contain p-2 rounded-2xl"
                  />
                  {/* 中央の写真に薄いオーバーレイ（質感を出すため） */}
                  {isCenter && <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl"></div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* 矢印ボタン（デザインをよりミニマルに） */}
        <button
          onClick={prevSlide}
          className={`absolute left-6 z-20 w-11 h-11 rounded-full bg-white/90 shadow-sm border border-slate-100 flex items-center justify-center transition-all hover:bg-white active:scale-95 ${currentIndex === 0 ? "opacity-0" : "opacity-100"}`}
        >
          <span className="text-slate-400 text-sm">Prev</span>
        </button>
        <button
          onClick={nextSlide}
          className={`absolute right-6 z-20 w-11 h-11 rounded-full bg-white/90 shadow-sm border border-slate-100 flex items-center justify-center transition-all hover:bg-white active:scale-95 ${currentIndex === images.length - 1 ? "opacity-0" : "opacity-100"}`}
        >
          <span className="text-slate-400 text-sm">Next</span>
        </button>
      </div>

      {/* ✨ メインアクション */}
      <div className="flex flex-col items-center gap-5 mt-4 px-6">
        <button
          onClick={() => router.push("/upload")}
          className="bg-slate-800 text-white px-10 py-4 rounded-xl w-full max-w-xs font-medium tracking-wide shadow-lg shadow-slate-200 transition-all hover:bg-slate-700 active:scale-[0.98]"
        >
          写真をアップロード
        </button>

        <button
          onClick={() => router.push("/gallery")}
          className="bg-white text-slate-600 border border-slate-200 px-10 py-4 rounded-xl w-full max-w-xs font-medium tracking-wide transition-all hover:bg-slate-50 active:scale-[0.98]"
        >
          ギャラリーを表示
        </button>
      </div>

      {/* 📱 ボトムナビゲーション */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/80 backdrop-blur-lg border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-3xl flex justify-around items-center py-3 px-4 z-50">
        <button onClick={() => router.push("/")} className="p-2 text-slate-400 hover:text-slate-800 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </button>

        <button
          onClick={() => router.push("/upload")}
          className="bg-slate-800 text-white w-12 h-12 rounded-2xl shadow-md flex items-center justify-center transform -translate-y-2 hover:bg-slate-700 transition-all"
        >
          <span className="text-2xl font-light">+</span>
        </button>

        <button onClick={() => auth.signOut()} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </nav>
    </div>
  );
}
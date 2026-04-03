"use client";

import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
// ✅ FAMILY_IDの直接参照ではなく、AuthContextから取得するのが安全です
import { useAuth } from "../../../lib/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Like from "../../components/Like";

type Post = {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  userName?: string;
};

export default function TagPage() {
  const router = useRouter();
  const params = useParams();
  const { familyId, loading: authLoading } = useAuth(); // ✅ Contextから取得
  const tag = params.tag ? decodeURIComponent(params.tag as string) : ""; // ✅ デコード処理

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // familyId か tag がない場合は実行しない
    if (authLoading || !familyId || !tag) return;

    const fetchTaggedPosts = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "posts"),
          where("familyId", "==", familyId),
          where("tags", "array-contains", tag),
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
            userName: data.userName || "名無し",
          });
        });
        setPosts(list);
      } catch (error: any) {
        console.error("タグ取得エラー:", error);
        // 💡 ブラウザのコンソールに「The query requires an index...」というエラーとURLが出ていたら、そのURLをクリックしてインデックスを作成してください
      } finally {
        setLoading(false);
      }
    };

    fetchTaggedPosts();
  }, [tag, familyId, authLoading]);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-32 text-slate-800 font-sans">
      
      <header className="pt-12 pb-10 px-6 flex flex-col items-center gap-2">
        <button 
          onClick={() => router.back()}
          className="self-start text-slate-400 hover:text-slate-800 transition-colors text-sm tracking-widest uppercase font-medium mb-4"
        >
          ← Back
        </button>
        <div className="bg-slate-800 text-white px-6 py-1 rounded-full text-[10px] tracking-[0.3em] uppercase mb-2">
          Tag Album
        </div>
        <h1 className="text-3xl font-serif tracking-[0.1em] text-slate-700 italic">
          #{tag}
        </h1>
        <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-2">
          {posts.length} photos
        </p>
      </header>

      <main className="px-4 columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-300 text-[10px] tracking-[0.3em] uppercase animate-pulse">Loading album...</p>
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post.id}
              className="break-inside-avoid group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 transition-all duration-500 hover:shadow-xl"
            >
              <img
                src={post.thumbnailUrl}
                alt=""
                className="w-full h-auto block"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <div className="flex justify-between items-center text-white">
                  <div className="scale-75 origin-left" onClick={(e) => e.stopPropagation()}>
                    <Like postId={post.id} />
                  </div>
                  <span className="text-[8px] tracking-widest uppercase opacity-80">
                    by {post.userName}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-slate-400 text-xs tracking-widest uppercase italic">
            No photos found in this tag.
          </div>
        )}
      </main>

      {/* ナビゲーション */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl flex justify-around items-center py-4 px-6 z-50">
        <button onClick={() => router.push("/")} className="p-2 text-slate-300 hover:text-slate-800 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </button>
        <button onClick={() => router.push("/upload")} className="bg-slate-800 text-white w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transform -translate-y-2 hover:bg-slate-700 active:scale-95 transition-all">
          <span className="text-2xl font-light">+</span>
        </button>
        <button onClick={() => router.push("/gallery")} className="p-2 text-slate-300 hover:text-slate-800 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </button>
      </nav>
    </div>
  );
}
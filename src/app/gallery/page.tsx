"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, limit } from "firebase/firestore";
import { useAuth } from "../../lib/contexts/AuthContext";
import Comment from "../components/Comment"; 
import Like from "../components/Like";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Post = {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  userName?: string;
};

export default function GalleryPage() {
  const router = useRouter();
  const { familyId, loading: authLoading } = useAuth();
  const [images, setImages] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editTags, setEditTags] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");

  useEffect(() => {
    if (authLoading || !familyId) return;

    const fetchData = async () => {
      try {
        const q = query(
          collection(db, "posts"), 
          where("familyId", "==", familyId), 
          orderBy("createdAt", "desc"),
          limit(24) 
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

    const fetchAllTags = async () => {
      try {
        const q = query(collection(db, "tags"), where("familyId", "==", familyId));
        const snap = await getDocs(q);
        const tags = snap.docs.map(doc => doc.data().name);
        setAllTags(Array.from(new Set([...["旅行", "イベント", "家族", "子供", "記念日"], ...tags])));
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchData();
    fetchAllTags();
  }, [familyId, authLoading]);

  const openModal = (index: number) => {
    setCurrentIndex(index);
    setEditTags(images[index].tags?.join(", ") || "");
    setIsEditing(false);
    setNewTagInput("");
  };

  const toggleEditTag = (tagName: string) => {
    const currentTags = editTags.split(",").map(t => t.trim()).filter(t => t !== "");
    if (currentTags.includes(tagName)) {
      setEditTags(currentTags.filter(t => t !== tagName).join(", "));
    } else {
      setEditTags([...currentTags, tagName].join(", "));
    }
  };

  const createAndAddTag = async () => {
    const name = newTagInput.trim().toLowerCase();
    if (!name || allTags.includes(name)) return;
    try {
      await addDoc(collection(db, "tags"), {
        name: name,
        familyId: familyId,
        createdAt: serverTimestamp(),
      });
      setAllTags(prev => [...prev, name]);
      toggleEditTag(name);
      setNewTagInput("");
    } catch (e) {
      console.error("タグ作成エラー:", e);
    }
  };

  const handleUpdateTags = async () => {
    if (currentIndex === null) return;
    const postId = images[currentIndex].id;
    const newTagsArray = editTags.split(",").map(t => t.trim()).filter(t => t !== "");

    try {
      await updateDoc(doc(db, "posts", postId), { tags: newTagsArray });
      setImages(prev => prev.map(img => img.id === postId ? { ...img, tags: newTagsArray } : img));
      setIsEditing(false);
    } catch (e) {
      alert("タグの更新に失敗しました");
    }
  };

  const handleDeletePost = async () => {
    if (currentIndex === null) return;
    if (!confirm("この写真を削除してもよろしいですか？")) return;
    const postId = images[currentIndex].id;
    try {
      await deleteDoc(doc(db, "posts", postId));
      setImages(prev => prev.filter(img => img.id !== postId));
      setCurrentIndex(null);
    } catch (e) {
      alert("削除に失敗しました");
    }
  };

  if (authLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] pb-32">
        <header className="pt-12 pb-8 px-6 flex items-center justify-between opacity-30">
          <div className="w-12 h-4 bg-slate-200 rounded"></div>
          <div className="w-32 h-6 bg-slate-200 rounded"></div>
          <div className="w-12"></div>
        </header>
        <div className="px-4 grid grid-cols-3 md:grid-cols-4 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-2">
              <div className="w-full aspect-[3/4] bg-slate-100 animate-pulse rounded-lg"></div>
            </div>
          ))}
        </div>
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

      {images.length === 0 ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 border border-slate-200 rounded-full animate-ping duration-[3s] opacity-20"></div>
            <div className="w-24 h-24 bg-white border border-slate-50 rounded-[2.5rem] shadow-sm flex items-center justify-center">
              <span className="text-3xl grayscale opacity-20">📸</span>
            </div>
          </div>
          <button onClick={() => router.push("/upload")} className="px-10 py-4 bg-slate-800 text-white rounded-full text-[10px] font-bold tracking-[0.3em] uppercase">Upload First Photo</button>
        </div>
      ) : (
        /* ✅ grid-cols-3 で横並びの高さを統一 */
        <div className="px-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-2 gap-y-6">
          {images.map((post, index) => (
            <div key={post.id} className="flex flex-col group cursor-pointer relative" onClick={() => openModal(index)}>
              {/* 🖼 写真部分：aspect-[3/4] で比率を完全に固定 */}
              <div className="relative overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-500 border border-slate-100 aspect-[3/4]">
                <img 
                  src={post.thumbnailUrl} 
                  alt="" 
                  loading="lazy" 
                  className="w-full h-full object-cover block transition-all duration-700 opacity-0" 
                  onLoad={(e) => (e.currentTarget.style.opacity = "1")}
                />
              </div>

              {/* 📝 情報エリア */}
              <div className="mt-2 px-0.5">
                <div className="flex items-center justify-between mb-1">
                  {/* ✅ いいね：サイズを大きくし、z-30で最前面へ、stopPropagationを強化 */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                    }} 
                    className="relative z-30 transform scale-[1.3] -ml-0.5 origin-left active:scale-[1.5] transition-all pointer-events-auto"
                  >
                    <Like postId={post.id} />
                  </div>
                  <span className="text-[8px] text-slate-400 tracking-tighter uppercase font-light truncate max-w-[50%]">
                    {post.userName}
                  </span>
                </div>

                {/* タグ */}
                <div className="flex flex-wrap gap-1 mb-2 relative z-30">
                  {post.tags?.map((tag, i) => (
                    <Link
                      key={i}
                      href={`/tag/${tag}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-medium rounded-md hover:bg-slate-800 hover:text-white transition-all border border-slate-200"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>

                {/* コメント */}
                <div onClick={(e) => e.stopPropagation()} className="relative z-30 transform scale-90 origin-top-left opacity-90">
                  <Comment postId={post.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* モーダル */}
      {currentIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-slate-900/98 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300" onClick={() => setCurrentIndex(null)}>
          <div className="absolute top-8 right-8 flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleDeletePost} className="text-red-400/50 hover:text-red-400 text-[10px] tracking-[0.2em] uppercase font-bold transition-colors">Delete Photo</button>
            <button onClick={() => setCurrentIndex(null)} className="text-white/40 hover:text-white text-4xl font-extralight transition-colors">×</button>
          </div>

          <div className="relative w-full h-[60vh] flex items-center justify-center p-6">
            <button onClick={(e) => { e.stopPropagation(); openModal((currentIndex - 1 + images.length) % images.length); }} className="absolute left-6 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all">‹</button>
            <img src={images[currentIndex].imageUrl} alt="" className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded animate-in zoom-in-95 duration-500" onClick={(e) => e.stopPropagation()} />
            <button onClick={(e) => { e.stopPropagation(); openModal((currentIndex + 1) % images.length); }} className="absolute right-6 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all">›</button>
          </div>

          <div className="w-full max-w-md px-8 py-6 text-center space-y-6" onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 text-white">
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] mb-3">Selected</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {editTags.split(",").map(t => t.trim()).filter(t => t !== "").map((tag, i) => (
                      <span key={i} onClick={() => toggleEditTag(tag)} className="px-3 py-1 bg-blue-500 text-white text-[10px] rounded-full cursor-pointer hover:bg-rose-500 transition-all">#{tag} ×</span>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] mb-3">Create New Tag</p>
                  <div className="flex gap-2">
                    <input value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createAndAddTag()} placeholder="新しいタグ名..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-[10px] focus:outline-none" />
                    <button onClick={createAndAddTag} className="px-4 py-2 bg-white/10 text-white rounded-xl text-[10px]">作成</button>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] mb-3">Add from List</p>
                  <div className="flex flex-wrap justify-center gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {allTags.map((tag, i) => {
                      const isSelected = editTags.split(",").map(t => t.trim()).includes(tag);
                      return (
                        <button key={i} onClick={() => toggleEditTag(tag)} className={`px-3 py-1.5 rounded-xl text-[10px] border transition-all ${isSelected ? "bg-white/5 text-white/20 border-transparent pointer-events-none" : "bg-white/10 text-white/70 border-white/10 hover:bg-white/20"}`}>#{tag}</button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-center gap-6">
                  <button onClick={() => setIsEditing(false)} className="text-[9px] text-white/40 uppercase">Cancel</button>
                  <button onClick={handleUpdateTags} className="text-[9px] text-white hover:text-blue-400 font-bold uppercase">Save Changes</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap justify-center gap-3">
                  {images[currentIndex].tags?.map((tag, i) => (
                    <span key={i} className="text-[10px] text-white/60">#{tag}</span>
                  ))}
                  <button onClick={() => setIsEditing(true)} className="text-[10px] text-blue-400/80 font-bold ml-2 uppercase">＋ Edit Tags</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ナビゲーション */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl flex justify-around items-center py-4 px-6 z-50">
        <button onClick={() => router.push("/")} className="p-2 text-slate-300 hover:text-slate-800"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></button>
        <button onClick={() => router.push("/upload")} className="bg-slate-800 text-white w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transform -translate-y-2 hover:bg-slate-700 active:scale-95 transition-all"><span className="text-2xl font-light">+</span></button>
        <button onClick={() => router.push("/gallery")} className="p-2 text-slate-800"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
      </nav>
    </div>
  );
}
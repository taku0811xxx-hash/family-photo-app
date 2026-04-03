"use client";

import { useEffect, useState } from "react";
import { storage, db, auth } from "../../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/contexts/AuthContext";

type UploadItem = {
  id: string;
  file: File;
  preview: string;
  tags: string[];
};

type TagMaster = {
  id: string;
  name: string;
};

export default function UploadPage() {
  const router = useRouter();
  const { familyId, loading: authLoading } = useAuth(); 
  const [uploadList, setUploadList] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // ===== タグ管理システム =====
  const DEFAULT_TAGS = ["旅行", "イベント", "家族", "子供", "記念日"];
  const [existingTags, setExistingTags] = useState<TagMaster[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagToDelete, setTagToDelete] = useState<TagMaster | null>(null); // 削除確認用

  // 1. 既存タグを "tags" コレクションから取得
  useEffect(() => {
    if (authLoading || !familyId) return;
    const fetchTags = async () => {
      const q = query(collection(db, "tags"), where("familyId", "==", familyId));
      const snapshot = await getDocs(q);
      
      const loadedTags: TagMaster[] = [];
      const tagNames = new Set<string>();

      DEFAULT_TAGS.forEach(name => {
        loadedTags.push({ id: `default-${name}`, name });
        tagNames.add(name);
      });

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!tagNames.has(data.name)) {
          loadedTags.push({ id: doc.id, name: data.name });
          tagNames.add(data.name);
        }
      });
      setExistingTags(loadedTags);
    };
    fetchTags();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
        tags: [],
      }));
      setUploadList((prev) => [...prev, ...newFiles]);
    }
  };

  const createNewTag = async () => {
    const name = tagInput.trim().toLowerCase();
    if (!name || existingTags.some(t => t.name === name)) return;

    try {
      const docRef = await addDoc(collection(db, "tags"), {
        name: name,
        familyId: familyId,
        createdAt: serverTimestamp(),
      });
      setExistingTags((prev) => [...prev, { id: docRef.id, name }]);
      setTagInput("");
    } catch (e) {
      console.error("タグ保存エラー:", e);
    }
  };

  // 🔥 タグ削除の確認モーダルを開く
  const confirmDeleteTag = (e: React.MouseEvent, tag: TagMaster) => {
    e.stopPropagation();
    if (tag.id.startsWith("default-")) return; // デフォルトは無視
    setTagToDelete(tag);
  };

  // 🔥 実際にタグを削除する
  const execDeleteTag = async () => {
    if (!tagToDelete) return;
    try {
      await deleteDoc(doc(db, "tags", tagToDelete.id));
      setExistingTags((prev) => prev.filter((t) => t.id !== tagToDelete.id));
      setUploadList(prev => prev.map(item => ({
        ...item,
        tags: item.tags.filter(t => t !== tagToDelete.name)
      })));
    } catch (e) {
      console.error("削除エラー:", e);
    } finally {
      setTagToDelete(null);
    }
  };

  const toggleTagForItem = (itemId: string, tagName: string) => {
    setUploadList((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newTags = item.tags.includes(tagName)
          ? item.tags.filter((t) => t !== tagName)
          : item.tags.length < 10 ? [...item.tags, tagName] : item.tags;
        return { ...item, tags: newTags };
      })
    );
  };

  const handleUploadAll = async () => {
    if (uploadList.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < uploadList.length; i++) {
        const item = uploadList[i];
        setUploadProgress({ current: i + 1, total: uploadList.length });
        const fileName = `${Date.now()}_${item.file.name}`;

        const compressedFile = await imageCompression(item.file, { maxSizeMB: 1, maxWidthOrHeight: 1200 });
        const thumbnailFile = await imageCompression(item.file, { maxSizeMB: 0.2, maxWidthOrHeight: 400 });

        const mainRef = ref(storage, `images/${fileName}`);
        await uploadBytes(mainRef, compressedFile);
        const mainUrl = await getDownloadURL(mainRef);

        const thumbRef = ref(storage, `thumbs/${fileName}`);
        await uploadBytes(thumbRef, thumbnailFile);
        const thumbUrl = await getDownloadURL(thumbRef);

        await addDoc(collection(db, "posts"), {
          imageUrl: mainUrl,
          thumbnailUrl: thumbUrl,
          createdAt: serverTimestamp(),
          tags: item.tags,
          familyId: familyId,
          userName: auth.currentUser?.displayName || "名無し",
        });
      }
      router.push("/gallery");
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pb-44 text-slate-800 font-sans">
      <header className="pt-12 pb-6 px-6 flex items-center justify-between sticky top-0 bg-[#fafafa]/90 backdrop-blur-md z-40">
        <button onClick={() => router.push("/")} className="text-slate-400 text-sm tracking-widest uppercase font-medium">← Back</button>
        <h1 className="text-xl font-serif tracking-[0.2em] text-slate-700 uppercase">Upload</h1>
        <div className="w-12"></div>
      </header>

      <main className="max-w-2xl mx-auto px-6 space-y-10">
        
        {/* 📸 写真追加 */}
        <section>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-sm group">
            <span className="text-4xl text-slate-200 group-hover:text-slate-400 font-light transition-colors">+</span>
            <p className="text-[10px] text-slate-400 tracking-[0.2em] uppercase mt-1">Add Photos</p>
            <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
          </label>
        </section>

        {/* 🏷 タグ管理 */}
        <section className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Create New Tag</h3>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="新しいタグ名..."
                className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && createNewTag()}
              />
              <button onClick={createNewTag} className="px-6 py-3 bg-slate-800 text-white rounded-2xl text-xs font-medium hover:bg-slate-700 active:scale-95 transition-all">
                作成
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50">
            <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4 flex justify-between items-center">
              Existing Tags
              <span className="text-[9px] font-normal lowercase opacity-40">Click tag to view / × to delete</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {existingTags.map((tag) => (
                <div key={tag.id} className="relative group/tag">
                  <button
                    onClick={() => router.push(`/tag/${tag.name}`)}
                    className="pl-4 pr-9 py-2 rounded-full text-[11px] bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-800 hover:text-white transition-all duration-300"
                  >
                    #{tag.name}
                  </button>
                  {!tag.id.startsWith("default-") && (
                    <button
                      onClick={(e) => confirmDeleteTag(e, tag)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 🖼 プレビュー */}
        <section className="space-y-6">
          {uploadList.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 relative animate-in fade-in slide-in-from-bottom-3 duration-500">
              <button onClick={() => setUploadList(prev => prev.filter(i => i.id !== item.id))} className="absolute -top-2 -right-2 w-9 h-9 bg-white border border-slate-100 shadow-md rounded-full text-slate-300 flex items-center justify-center hover:text-rose-500 transition-all active:scale-90 z-10">×</button>
              <div className="w-full md:w-40 h-40 flex-shrink-0 relative group">
                <img src={item.preview} alt="" className="w-full h-full object-cover rounded-[2rem]" />
              </div>
              <div className="flex-1 space-y-5">
                <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                  {item.tags.map(t => (
                    <span key={t} onClick={() => toggleTagForItem(item.id, t)} className="px-3 py-1 bg-slate-800 text-white text-[10px] rounded-full cursor-pointer hover:bg-rose-500">#{t} ×</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                  {existingTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTagForItem(item.id, tag.name)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] border transition-all ${
                        item.tags.includes(tag.name) ? "bg-slate-100 text-slate-300 line-through border-slate-200" : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                      }`}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* 🚀 アップロード実行 */}
        {uploadList.length > 0 && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
            <button
              onClick={handleUploadAll}
              disabled={isUploading}
              className={`w-full py-5 rounded-[2.2rem] font-bold tracking-[0.3em] text-[10px] uppercase transition-all shadow-xl ${
                isUploading ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-slate-800 text-white hover:bg-slate-700 active:scale-95"
              }`}
            >
              {isUploading ? `${uploadProgress.total}枚中 ${uploadProgress.current}枚を保存中...` : `Post ${uploadList.length} Photos`}
            </button>
          </div>
        )}
      </main>

      {/* --- ✨ カスタム削除モーダル --- */}
      {tagToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setTagToDelete(null)} />
          <div className="relative bg-white w-full max-w-xs rounded-[3rem] p-8 shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-light">!</div>
            <h3 className="text-slate-800 font-bold text-lg mb-2">タグを削除しますか？</h3>
            <p className="text-slate-400 text-[10px] leading-relaxed mb-8 px-4 tracking-wider">
              タグ「#{tagToDelete.name}」を削除します。<br />過去の投稿からは消えませんが、リストからは選べなくなります。
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={execDeleteTag} className="w-full py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-bold tracking-[0.2em] hover:bg-rose-600 transition-colors shadow-lg shadow-rose-100">
                削除する
              </button>
              <button onClick={() => setTagToDelete(null)} className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-bold tracking-[0.2em] hover:bg-slate-100 transition-colors">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 📱 下部ナビゲーション (統一デザイン) */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl flex justify-around items-center py-4 px-6 z-50">
        <button onClick={() => router.push("/")} className="p-2 text-slate-300 hover:text-slate-800 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </button>
        <button
          onClick={() => router.push("/upload")}
          className="bg-slate-800 text-white w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transform -translate-y-2"
        >
          <span className="text-2xl font-light">+</span>
        </button>
        <button onClick={() => router.push("/gallery")} className="p-2 text-slate-300 hover:text-slate-800 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </button>
      </nav>
    </div>
  );
}
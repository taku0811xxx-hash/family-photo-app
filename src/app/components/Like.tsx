"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase"; 
import { doc, setDoc, deleteDoc, getDoc, collection, query, where, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../lib/contexts/AuthContext"; // 🔥 AuthContextをインポート

export default function Like({ postId }: { postId: string }) {
  const { familyId } = useAuth(); // ✨ 家族IDを取得
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [isAnimate, setIsAnimate] = useState(false);

  // 1. この投稿のいいね数カウント
  useEffect(() => {
    // 家族IDがない場合はエラーを避けるため実行しない
    if (!postId || !familyId) return;

    // 🔥 familyIdの条件を追加して、自分の家族圏内のいいねだけをカウントする
    const q = query(
      collection(db, "likes"), 
      where("postId", "==", postId),
      where("familyId", "==", familyId) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
    }, (err) => console.debug("Counting likes..."));

    return () => unsubscribe();
  }, [postId, familyId]);

  // 2. 自分のいいね状態の監視
  useEffect(() => {
    if (!postId || !auth.currentUser || !familyId) return;

    const likeDocId = `${postId}_${auth.currentUser.uid}`;
    const docRef = doc(db, "likes", likeDocId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      setLiked(docSnap.exists());
    }, (err) => {
      console.debug("Like status pending...");
    });

    return () => unsubscribe();
  }, [postId, auth.currentUser, familyId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!auth.currentUser || !familyId) return;

    const likeDocId = `${postId}_${auth.currentUser.uid}`;
    const likeRef = doc(db, "likes", likeDocId);

    try {
      const docSnap = await getDoc(likeRef);
      if (docSnap.exists()) {
        await deleteDoc(likeRef);
      } else {
        setIsAnimate(true);
        // 🔥 保存時にも familyId を含める
        await setDoc(likeRef, {
          postId: postId,
          userId: auth.currentUser.uid,
          familyId: familyId, // ✨ これが必須です
          createdAt: serverTimestamp(),
        });
        setTimeout(() => setIsAnimate(false), 1000);
      }
    } catch (error) {
      console.error("Like Action Error:", error);
    }
  };

  // --- 以下、表示部分は変更なし ---
  return (
    <div onClick={handleLike} style={{ cursor: "pointer", display: "flex", alignItems: "center", padding: "4px 6px", userSelect: "none", position: "relative", zIndex: 50 }}>
      <style>{`
        @keyframes heart-pop {
          0% { transform: scale(0.7); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1.1); }
        }
      `}</style>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={{
            fontSize: 18,
            color: liked ? "#ff4d94" : "#ccc",
            transition: "all 0.2s ease",
            animation: isAnimate ? "heart-pop 0.4s ease-out" : "none",
            display: "inline-block", lineHeight: 1
          }}>
          {liked ? "♥" : "♡"}
        </span>
      </div>
      <span style={{ marginLeft: 6, fontSize: 11, fontWeight: "bold", color: liked ? "#ff4d94" : "#666" }}>
        {count > 0 ? count : ""}
      </span>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase"; // authのインポート先を確認してください
import {
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot
} from "firebase/firestore";

export default function Like({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [isAnimate, setIsAnimate] = useState(false);

  // リアルタイムで「いいね」の状態を監視する（他人が押した時も即反映されます）
  useEffect(() => {
    if (!postId) return;

    const q = query(
      collection(db, "likes"),
      where("postId", "==", postId)
    );

    // getDocsではなくonSnapshotを使うことで、画面をリロードしなくても数字が変わります
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
      
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userLiked = snapshot.docs.some(doc => doc.data().userId === currentUser.uid);
        setLiked(userLiked);
      }
    });

    return () => unsubscribe();
  }, [postId]);

  // いいね押下
  const handleLike = async (e: React.MouseEvent) => {
    // ⚠️ これが重要！親の「モーダルを開く」イベントを完全にブロックします
    e.preventDefault();
    e.stopPropagation();

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("ログインが必要です");
      return;
    }

    const q = query(
      collection(db, "likes"),
      where("postId", "==", postId),
      where("userId", "==", currentUser.uid)
    );

    try {
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // 解除：見つかったドキュメントをすべて削除
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        // stateはonSnapshotが自動で更新してくれますが、念のため
        setLiked(false);
      } else {
        // 追加
        setIsAnimate(true);
        await addDoc(collection(db, "likes"), {
          postId,
          userId: currentUser.uid,
          createdAt: new Date(),
        });
        setLiked(true);
        // 1秒後にアニメーションフラグをオフにする
        setTimeout(() => setIsAnimate(false), 1000);
      }
    } catch (error) {
      console.error("Like Error:", error);
    }
  };

  return (
    <div
      onClick={handleLike}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        padding: "4px 6px", // 少しスリムに
        userSelect: "none",
        position: "relative",
        zIndex: 50
      }}
    >
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span
          style={{
            fontSize: 18, 
            color: liked ? "#ff4d94" : "#ccc",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            transform: isAnimate ? "scale(1.3)" : liked ? "scale(1.1)" : "scale(1)", 
            display: "inline-block",
            lineHeight: 1
          }}
        >
          {liked ? "♥" : "♡"}
        </span>
        
        {isAnimate && (
          <span style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1.5px solid #ff4d94", 
            animation: "ping 0.6s cubic-bezier(0, 0, 0.2, 1) forwards",
            opacity: 0
          }} />
        )}
      </div>

      <span style={{ 
        marginLeft: 6, 
        fontSize: 11, 
        fontWeight: "bold",
        color: liked ? "#ff4d94" : "#666",
        minWidth: "10px"
      }}>
        {count > 0 ? count : ""}
      </span>


      <style jsx>{`
        @keyframes ping {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
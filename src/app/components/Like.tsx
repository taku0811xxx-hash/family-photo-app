"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth } from "../../lib/firebase";

export default function Like({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  // 初期取得
  const fetchLikes = async () => {
    const q = query(
      collection(db, "likes"),
      where("postId", "==", postId)
    );

    const snapshot = await getDocs(q);

    setCount(snapshot.size);

    snapshot.forEach((doc) => {
      if (doc.data().userId === auth.currentUser?.uid) {
        setLiked(true);
      }
    });
  };

  useEffect(() => {
    fetchLikes();
  }, []);

  // いいね押下
  const handleLike = async () => {
    const q = query(
      collection(db, "likes"),
      where("postId", "==", postId),
      where("userId", "==", auth.currentUser?.uid)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // 解除
      await deleteDoc(snapshot.docs[0].ref);
      setLiked(false);
      setCount((c) => c - 1);
    } else {
      // 追加
      await addDoc(collection(db, "likes"), {
        postId,
        userId: auth.currentUser?.uid,
      });
      setLiked(true);
      setCount((c) => c + 1);
    };
  };

  return (
    <div
      onClick={handleLike}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        marginTop: 4,
      }}
    >
      {/* ハート */}
      <span
        style={{
          fontSize: 18,
          color: liked ? "hotpink" : "#ccc",
          transition: "0.2s",
          transform: liked ? "scale(1.2)" : "scale(1)",
        }}
      >
        ♥
      </span>

      {/* 数 */}
      <span style={{ marginLeft: 6, fontSize: 12 }}>{count}</span>
    </div>
  );
}
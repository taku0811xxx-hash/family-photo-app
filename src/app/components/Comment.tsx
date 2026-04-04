"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../../lib/contexts/AuthContext";

type CommentType = {
  id: string;
  text: string;
  userName: string;
  userId: string;
};

export default function Comment({ postId }: { postId: string }) {
  const { familyId } = useAuth();
  const [text, setText] = useState("");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 1. コメントのリアルタイム取得
  useEffect(() => {
    if (!postId || !familyId) return;

    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      where("familyId", "==", familyId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: CommentType[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          text: data.text || "",
          userName: data.userName || "名無し",
          userId: data.userId || "",
        });
      });
      setComments(list);
    }, (err) => console.debug("Comments pending..."));

    return () => unsubscribe();
  }, [postId, familyId]);

  // 2. コメント送信
  const handleSend = async () => {
    if (!text.trim() || !familyId) return;

    try {
      await addDoc(collection(db, "comments"), {
        postId: postId,
        familyId: familyId, // ✨ セキュリティルールを通すために必須
        text: text,
        userName: auth.currentUser?.displayName || "名無し",
        userId: auth.currentUser?.uid || "",
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (error) {
      console.error("Comment Send Error:", error);
    }
  };

  // 3. コメント削除
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, "comments", deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  return (
    <div className="transform scale-[0.4] md:scale-100 origin-top-left" style={{ marginTop: 4 }}>

      {/* 💬 コメント一覧 */}
      <div style={{ marginBottom: 4 }}>
        {comments.map((c) => (
          <div key={c.id} style={{
            fontSize: 8, // 少しフォントを小さく
            marginBottom: 3,
            background: "#f9f9f9",
            padding: "3px 6px", // パディングを詰める
            borderRadius: 6,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid #f0f0f0"
          }}>
            <div style={{ color: "#666", lineHeight: 1.2 }}>
              <b style={{ color: "#333" }}>{c.userName}</b> {c.text}
            </div>
            {c.userId === auth.currentUser?.uid && (
              <span onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }} style={{ marginLeft: 6, cursor: "pointer", color: "#ccc", fontSize: 10 }}> × </span>
            )}
          </div>
        ))}
      </div>

      {/* ⌨️ 入力エリア */}
      <div style={{ display: "flex", gap: 3 }} onClick={(e) => e.stopPropagation()}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="コメント..."
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          style={{
            flex: 1,
            padding: "4px 8px",
            borderRadius: 8,
            border: "1px solid #eee",
            outline: "none",
            fontSize: 9, // 入力文字も小さく
            background: "#fff",
            cursor: "text"
          }}
        />
        <button onClick={handleSend} style={{
          padding: "4px 10px",
          borderRadius: 8,
          border: "none",
          background: "#444",
          color: "#fff",
          fontSize: 9,
          fontWeight: "bold",
          cursor: "pointer"
        }}> 送信 </button>
      </div>

      {/* 🗑 削除モーダル */}
      {deleteId && (
        <div onClick={() => setDeleteId(null)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", padding: 20, borderRadius: 24, width: 260, textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <p style={{ marginBottom: 20, fontSize: 13, color: "#333" }}>コメントを削除しますか？</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: "#f5f5f5", color: "#999", fontSize: 11, cursor: "pointer" }}>やめる</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: "#ff4d6d", color: "#fff", fontSize: 11, fontWeight: "bold", cursor: "pointer" }}>削除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
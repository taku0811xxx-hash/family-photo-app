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

type CommentType = {
  id: string;
  text: string;
  userName: string;
  userId: string;
};

export default function Comment({ postId }: { postId: string }) {
  const [text, setText] = useState("");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
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
    });
    return () => unsubscribe();
  }, [postId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await addDoc(collection(db, "comments"), {
      postId,
      text,
      userName: auth.currentUser?.displayName || "名無し",
      userId: auth.currentUser?.uid || "",
      createdAt: serverTimestamp(),
    });
    setText("");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, "comments", deleteId));
    setDeleteId(null);
  };

  return (
    <div style={{ marginTop: 8 }}>
      {/* 💬 コメント一覧：背景を白に近く、文字を小さく */}
      <div style={{ marginBottom: 8 }}>
        {comments.map((c) => (
          <div
            key={c.id}
            style={{
              fontSize: 10, // 👈 12から10へ
              marginBottom: 4,
              background: "#f9f9f9",
              padding: "4px 8px", // 👈 余白を削る
              borderRadius: 6,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid #f0f0f0"
            }}
          >
            <div style={{ color: "#666" }}>
              <b style={{ color: "#333" }}>{c.userName}</b> {c.text}
            </div>

            {c.userId === auth.currentUser?.uid && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(c.id);
                }}
                style={{
                  marginLeft: 8,
                  cursor: "pointer",
                  color: "#ccc",
                  fontSize: 10,
                }}
              >
                ×
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ⌨️ 入力エリア：高さを抑えてコンパクトに */}
      <div
        style={{ display: "flex", gap: 4 }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="コメント..."
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          style={{
            flex: 1,
            padding: "5px 10px", // 👈 8から5へ
            borderRadius: 10,
            border: "1px solid #eee",
            outline: "none",
            fontSize: 10, // 👈 入力文字も小さく
            background: "#fff",
            cursor: "text",
          }}
        />

        <button
          onClick={handleSend}
          style={{
            padding: "5px 12px", // 👈 8から5へ
            borderRadius: 10,
            border: "none",
            background: "#444", // 👈 ピンクから落ち着いたグレーに変更（お好みで）
            color: "#fff",
            fontSize: 10, // 👈 ボタン文字も小さく
            fontWeight: "bold",
            cursor: "pointer",
            transition: "0.2s",
          }}
        >
          送信
        </button>
      </div>

      {/* 🗑 削除モーダル (変更なし) */}
      {deleteId && (
        <div
          onClick={() => setDeleteId(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 24,
              width: 260,
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <p style={{ marginBottom: 20, fontSize: 13, color: "#333" }}>
              コメントを削除しますか？
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 12,
                  border: "none",
                  background: "#f5f5f5",
                  color: "#999",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                やめる
              </button>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 12,
                  border: "none",
                  background: "#ff4d6d",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
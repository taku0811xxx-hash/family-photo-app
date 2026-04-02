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
  const [deleteId, setDeleteId] = useState<string | null>(null); // ←モーダル用

  // 🔥 リアルタイム取得
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

  // 送信
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

  // 削除確定
  const handleDelete = async () => {
    if (!deleteId) return;

    await deleteDoc(doc(db, "comments", deleteId));
    setDeleteId(null);
  };

  return (
    <div style={{ marginTop: 10 }}>
      {/* コメント一覧 */}
      <div style={{ marginBottom: 10 }}>
        {comments.map((c) => (
          <div
            key={c.id}
            style={{
              fontSize: 12,
              marginBottom: 6,
              background: "#f5f5f5",
              padding: "6px 8px",
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <b>{c.userName}</b>: {c.text}
            </div>

            {/* 自分だけ削除 */}
            {c.userId === auth.currentUser?.uid && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(c.id); // ←ここでモーダル開く
                }}
                style={{
                  marginLeft: 8,
                  cursor: "pointer",
                  color: "#999",
                  fontSize: 12,
                }}
              >
                🗑
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 入力エリア */}
      <div
        style={{ display: "flex", gap: 6 }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="コメントを書く..."
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #ddd",
            outline: "none",
            cursor: "text",
          }}
        />

        <button
          onClick={handleSend}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "none",
            background: "#ff8fb1",
            color: "#fff",
            cursor: "pointer",
            transition: "0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.opacity = "0.8")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.opacity = "1")
          }
        >
          送信
        </button>
      </div>

      {/* 🔥 カスタム削除モーダル */}
      {deleteId && (
        <div
          onClick={() => setDeleteId(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
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
              borderRadius: 12,
              width: 280,
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <p style={{ marginBottom: 20 }}>
              このコメントを削除しますか？
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  cursor: "pointer",
                }}
              >
                キャンセル
              </button>

              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 8,
                  border: "none",
                  background: "#ff4d6d",
                  color: "#fff",
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
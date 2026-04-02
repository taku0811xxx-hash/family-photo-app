"use client";

import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function TestPage() {
  const handleAdd = async () => {
    try {
      await addDoc(collection(db, "posts"), {
        text: "はじめての投稿！",
        createdAt: new Date(),
      });
      alert("保存できた！");
    } catch (error) {
      console.error(error);
      alert("エラー");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>テストページ</h1>
      <button onClick={handleAdd}>データ追加</button>
    </div>
  );
}
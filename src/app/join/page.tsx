"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../lib/contexts/AuthContext";
import { db } from "../../lib/firebase";
import { doc, setDoc, query, collection, where, getDocs } from "firebase/firestore";

export default function JoinPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code"); // URLから ?code=xxx を取得
  const { user, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState("招待を確認中...");

  useEffect(() => {
    if (loading) return;

    const processJoin = async () => {
      if (!user) {
        // ログインしてないなら、このURLを保持したままログインへ飛ばす
        router.push(`/login?returnTo=/join?code=${code}`);
        return;
      }

      if (!code) {
        setStatus("招待コードが見つかりません。");
        return;
      }

      try {
        // 家族IDの存在チェック
        const q = query(collection(db, "users"), where("familyId", "==", code));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setStatus("この招待リンクは無効です。");
          return;
        }

        // 家族グループに参加登録
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          displayName: user.displayName,
          familyId: code,
          role: "member",
          createdAt: new Date(),
        });

        setStatus("参加が完了しました！移動します...");
        setTimeout(() => (window.location.href = "/"), 1500);
      } catch (e) {
        setStatus("エラーが発生しました。");
      }
    };

    processJoin();
  }, [user, loading, code]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto"></div>
        <p className="text-[10px] text-slate-400 tracking-[0.2em] uppercase">{status}</p>
      </div>
    </div>
  );
}
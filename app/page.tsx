"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const project = await createProject({
        title,
        description: description || undefined,
      });

      // プロジェクト作成成功後、プロジェクトページに遷移
      if (project.id) {
        router.push(`/project?id=${project.id}`);
      }
    } catch (err) {
      setError((err as Error).message || "プロジェクト作成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900">
      <main className="w-full max-w-2xl px-6 py-12">
        {/* ヘッダー */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            撮影計画補助電算処理システム
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            映画の撮影計画をスマートに管理しましょう
          </p>
        </div>

        {/* フォームカード */}
        <div className="rounded-lg shadow-lg bg-white dark:bg-gray-800 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            新しいプロジェクトを作成
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* プロジェクト名入力 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                プロジェクト名 <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 秋の物語"
                required
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* 説明入力 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                説明
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="このプロジェクトの説明を入力してください（オプション）"
                disabled={isLoading}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "作成中..." : "プロジェクトを作成する"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}


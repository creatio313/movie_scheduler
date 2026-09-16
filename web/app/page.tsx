"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/api";
import { validateProjectTitle } from "@/lib/validators";
import { Notification } from "@/app/components/Notification";

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

    // バリデーション
    const titleValidation = validateProjectTitle(title);
    if (!titleValidation.isValid) {
      setError(titleValidation.error || "プロジェクト名が無効です。");
      setIsLoading(false);
      return;
    }

    try {
      const project = await createProject({
        title,
        description: description || undefined,
      });

      // プロジェクト作成成功後、プロジェクトページに遷移
      if (project.id) {
        router.push(`/project/?id=${project.id}&isNew=true`);
      }
    } catch (err) {
      setError((err as Error).message || "プロジェクト作成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Notification message={error} type="error" />
      <main className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      {/* ヘッダー */}
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h1 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
          撮影計画支援電算処理システム
        </h1>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* プロジェクト名入力 */}
          <div>
            <label htmlFor="title">
              プロジェクト名
            </label>
            <div className="mt-2">
              <input
                id="title"
                name="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：映画『未完成』制作委員会"
                required
                disabled={isLoading}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-red-500"
              />
            </div>
          </div>

          {/* 説明入力 */}
          <div>
            <label htmlFor="description">
              説明
            </label>
            <div className="mt-2">
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例：映画『未完成』の撮影調整用プロジェクト"
                disabled={isLoading}
                rows={4}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-red-500"
              />
            </div>
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isLoading || !title.trim()}
            className="flex w-full justify-center rounded-md bg-red-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-red-500 dark:shadow-none dark:hover:bg-red-400 dark:focus-visible:outline-red-500"
          >
            {isLoading ? "作成中..." : "プロジェクトを作成する"}
          </button>
        </form>
      </div>
      </main>
    </>
  );
}


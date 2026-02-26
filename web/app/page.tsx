"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/api";
import { validateProjectTitle } from "@/lib/validators";
import {
  FULLSCREEN_CENTERED_BG,
  PAGE_CONTAINER,
  PAGE_TITLE,
  PAGE_SUBTITLE,
  SECTION_TITLE,
  LABEL_TEXT,
  INPUT_FULL_WIDTH,
  TEXTAREA_BASE,
  BUTTON_PRIMARY_FULL,
  ALERT_ERROR,
  CARD_CONTAINER,
} from "@/lib/tailwind-classes";

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
      setError(titleValidation.error || "プロジェクト名が無効です");
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
        router.push(`/project.html?id=${project.id}&isNew=true`);
      }
    } catch (err) {
      setError((err as Error).message || "プロジェクト作成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={FULLSCREEN_CENTERED_BG}>
      <main className={PAGE_CONTAINER}>
        {/* ヘッダー */}
        <div className="mb-12 text-center">
          <h1 className={`${PAGE_TITLE} mb-4`}>
            撮影計画支援電算処理システム
          </h1>
          <p className={PAGE_SUBTITLE}>
            候補日時と役者のスケジュールから、シーン別の撮影可能日時を算出します。
          </p>
        </div>

        {/* フォームカード */}
        <div className={CARD_CONTAINER}>
          <h2 className={`${SECTION_TITLE} mb-6`}>
            新しいプロジェクトを作成
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* エラーメッセージ */}
            {error && (
              <div className={ALERT_ERROR}>
                <p className={`text-red-700 dark:text-red-300 text-sm`}>{error}</p>
              </div>
            )}

            {/* プロジェクト名入力 */}
            <div>
              <label htmlFor="title" className={`${LABEL_TEXT} mb-2`}>
                プロジェクト名 <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 映画『未完成』制作委員会"
                required
                disabled={isLoading}
                className={INPUT_FULL_WIDTH}
              />
            </div>

            {/* 説明入力 */}
            <div>
              <label htmlFor="description" className={`${LABEL_TEXT} mb-2`}>
                説明
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="このプロジェクトの説明を入力してください（オプション）"
                disabled={isLoading}
                rows={4}
                className={TEXTAREA_BASE}
              />
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className={BUTTON_PRIMARY_FULL}
            >
              {isLoading ? "作成中..." : "プロジェクトを作成する"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}


"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteProject, getProject, Project, updateProject } from "@/lib/api";

export default function ProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = useMemo(() => searchParams.get("id") || "", [searchParams]);

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setError("プロジェクトIDが指定されていません");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getProject(projectId);
        setProject(data);
        setDraftTitle(data.title || "");
        setDraftDescription(data.description || "");
      } catch (err) {
        setError((err as Error).message || "プロジェクトの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleSave = async () => {
    if (!projectId || !project) {
      return;
    }

    if (!draftTitle.trim()) {
      setError("プロジェクト名は必須です");
      return;
    }

    try {
      setError("");
      setIsSaving(true);
      const updated = await updateProject(projectId, {
        title: draftTitle.trim(),
        description: draftDescription.trim() ? draftDescription : "",
      });
      setProject(updated);
      setDraftTitle(updated.title || "");
      setDraftDescription(updated.description || "");
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    } catch (err) {
      setError((err as Error).message || "プロジェクトの更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelTitle = () => {
    setDraftTitle(project?.title || "");
    setIsEditingTitle(false);
  };

  const handleCancelDescription = () => {
    setDraftDescription(project?.description || "");
    setIsEditingDescription(false);
  };

  const handleDelete = async () => {
    if (!projectId) {
      return;
    }
    const confirmed = window.confirm("このプロジェクトを削除しますか？この操作は取り消せません。");
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setIsDeleting(true);
      await deleteProject(projectId);
      router.push("/");
    } catch (err) {
      setError((err as Error).message || "プロジェクトの削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border border-blue-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900">
        <div className="w-full max-w-2xl px-6">
          <div className="rounded-lg shadow-lg bg-white dark:bg-gray-800 p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              エラーが発生しました
            </h1>
            <p className="text-red-600 dark:text-red-400 mb-6">
              {error || "プロジェクトが見つかりません"}
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900">
      <main className="w-full max-w-4xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className="mb-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold flex items-center gap-2"
          >
            <span>←</span> ホームに戻る
          </button>
          <div className="flex flex-wrap items-center gap-3">
            {isEditingTitle ? (
              <>
                <input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  disabled={isSaving}
                  className="w-full max-w-lg rounded-lg border border-gray-300 bg-white px-4 py-2 text-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-green-600 hover:bg-green-50 disabled:opacity-50 dark:border-gray-600 dark:text-green-400 dark:hover:bg-green-900/20"
                    aria-label="保存"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleCancelTitle}
                    disabled={isSaving}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    aria-label="キャンセル"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12M18 6l-12 12" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  {project.title}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  aria-label="プロジェクト名を編集"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg shadow-lg bg-white dark:bg-gray-800 p-8">
          <div className="grid gap-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-2">
                プロジェクトID
              </h3>
              <p className="text-lg font-mono text-gray-900 dark:text-gray-100 break-all">
                {project.id}
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  説明
                </h3>
                {!isEditingDescription && (
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    aria-label="説明を編集"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                )}
              </div>

              {isEditingDescription ? (
                <div className="space-y-3">
                  <textarea
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    disabled={isSaving}
                    rows={5}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="このプロジェクトの説明を入力してください（オプション）"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-green-600 hover:bg-green-50 disabled:opacity-50 dark:border-gray-600 dark:text-green-400 dark:hover:bg-green-900/20"
                      aria-label="保存"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelDescription}
                      disabled={isSaving}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      aria-label="キャンセル"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l12 12M18 6l-12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : project.description ? (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {project.description}
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  説明はまだ登録されていません
                </p>
              )}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-4">
              アクション
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-colors"
              >
                新しいプロジェクトを作成
              </button>
              <button
                onClick={() => router.push(`/manage?projectId=${projectId}`)}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 font-semibold transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
              >
                管理
              </button>
              <button
                onClick={() => router.push(`/cast-schedule?projectId=${projectId}`)}
                className="px-4 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold transition-colors dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
              >
                予定入力
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 font-semibold transition-colors disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
              >
                {isDeleting ? "削除中..." : "プロジェクトを削除"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteProject, getProject, listCasts, listSceneAvailabilities, listSceneRequiredCasts, Project, SceneAvailabilityRow, updateProject } from "@/lib/api";
import { validateProjectTitle } from "@/lib/validators";
import {
  FULLSCREEN_CENTERED_BG,
  PAGE_CONTAINER,
  NARROW_CONTAINER,
  CARD_CONTAINER,
  SECTION_TITLE,
  LABEL_TEXT,
  INPUT_FULL_WIDTH,
  INPUT_LARGE_TITLE,
  BUTTON_ICON,
  BUTTON_SECONDARY_BLUE,
  BUTTON_SECONDARY_GREEN,
  ALERT_ERROR_WITH_MARGIN,
  LINK_BACK,
  SPINNER,
  HELPER_TEXT,
} from "@/lib/tailwind-classes";

function ProjectPageContent() {
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
  const [sceneAvailabilities, setSceneAvailabilities] = useState<SceneAvailabilityRow[]>([]);
  const [isLoadingScenes, setIsLoadingScenes] = useState(true);
  const [sceneRequiredRoles, setSceneRequiredRoles] = useState<Record<number, string[]>>({});
  const [copyFeedback, setCopyFeedback] = useState("");
  const [showCopyModal, setShowCopyModal] = useState(false);

  // 初回訪問時にモーダルを表示
  useEffect(() => {
    const isNew = searchParams.get("isNew") === "true";
    if (isNew && projectId) {
      const timer = setTimeout(() => {
        setShowCopyModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [projectId, searchParams]);

  const handleCopyModalUrl = async () => {
    try {
      const url = `${window.location.origin}/project.html?id=${projectId}`;
      await navigator.clipboard.writeText(url);
      setCopyFeedback("リンクをコピーしました");
      setTimeout(() => setCopyFeedback(""), 1500);
      setShowCopyModal(false);
    } catch (err) {
      console.error("Failed to copy URL", err);
      setCopyFeedback("コピーに失敗しました");
      setTimeout(() => setCopyFeedback(""), 1500);
    }
  };

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

  useEffect(() => {
    const fetchSceneAvailabilities = async () => {
      if (!projectId) {
        setIsLoadingScenes(false);
        return;
      }

      try {
        setIsLoadingScenes(true);
        const rows = await listSceneAvailabilities(projectId);
        setSceneAvailabilities(rows);
      } catch (err) {
        setError((err as Error).message || "シーンの撮影可能日時の読み込みに失敗しました");
      } finally {
        setIsLoadingScenes(false);
      }
    };

    fetchSceneAvailabilities();
  }, [projectId]);

  useEffect(() => {
    const fetchSceneRequiredRoles = async () => {
      if (!projectId) {
        return;
      }

      const sceneIds = Array.from(new Set(sceneAvailabilities.map((row) => row.scene_id)));
      if (sceneIds.length === 0) {
        setSceneRequiredRoles({});
        return;
      }

      try {
        const [casts, requiredLists] = await Promise.all([
          listCasts(projectId),
          Promise.all(sceneIds.map((sceneId) => listSceneRequiredCasts(sceneId))),
        ]);
        const castRoleMap = new Map(casts.map((cast) => [cast.id, cast.role_name || cast.name]));
        const rolesMap: Record<number, string[]> = {};
        sceneIds.forEach((sceneId, index) => {
          const required = requiredLists[index] || [];
          rolesMap[sceneId] = required
            .map((item) => castRoleMap.get(item.cast_id))
            .filter((name): name is string => Boolean(name));
        });
        setSceneRequiredRoles(rolesMap);
      } catch (err) {
        setError((err as Error).message || "シーン必要役者の読み込みに失敗しました");
      }
    };

    fetchSceneRequiredRoles();
  }, [projectId, sceneAvailabilities]);

  const sceneAvailabilityGroups = useMemo(() => {
    const map = new Map<number, { sceneName: string; items: SceneAvailabilityRow[] }>();
    sceneAvailabilities.forEach((row) => {
      const entry = map.get(row.scene_id) || { sceneName: row.scene_name, items: [] };
      entry.items.push(row);
      map.set(row.scene_id, entry);
    });
    return Array.from(map.entries()).map(([sceneId, entry]) => ({
      sceneId,
      sceneName: entry.sceneName,
      items: entry.items,
    }));
  }, [sceneAvailabilities]);

  const handleSave = async () => {
    if (!projectId || !project) {
      return;
    }

    if (!draftTitle.trim()) {
      setError("プロジェクト名は必須です");
      return;
    }

    // バリデーション
    const titleValidation = validateProjectTitle(draftTitle);
    if (!titleValidation.isValid) {
      setError(titleValidation.error || "プロジェクト名が無効です");
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

  const handleCopyLink = async () => {
    if (!projectId) {
      return;
    }
    try {
      const url = `${window.location.origin}/project.html?id=${projectId}`;
      await navigator.clipboard.writeText(url);
      setCopyFeedback("リンクをコピーしました");
      setTimeout(() => setCopyFeedback(""), 2000);
    } catch (err) {
      setCopyFeedback("コピーに失敗しました");
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className={FULLSCREEN_CENTERED_BG}>
        <div className="text-center">
          <div className={`${SPINNER} mx-auto mb-4`}></div>
          <p className={HELPER_TEXT}>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={FULLSCREEN_CENTERED_BG}>
        <div className={NARROW_CONTAINER}>
          <div className={CARD_CONTAINER}>
            <h1 className={`${SECTION_TITLE} mb-4`}>
              エラーが発生しました
            </h1>
            <p className="text-red-600 dark:text-red-400 mb-6">
              {error || "プロジェクトが見つかりません"}
            </p>
            <button
              onClick={() => router.push("/")}
              className={BUTTON_SECONDARY_BLUE}
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
      <main className={PAGE_CONTAINER}>
        {error && (
          <div className={ALERT_ERROR_WITH_MARGIN}>
            {error}
          </div>
        )}
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className={LINK_BACK}
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
                  className={INPUT_LARGE_TITLE}
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
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-3">
                共有用URL
              </h3>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-mono text-gray-900 dark:text-gray-100 break-all flex-1">
                  {`${window.location.origin}/project.html?id=${project.id}`}
                </p>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  aria-label="リンクをコピー"
                  title="プロジェクトリンクをコピー"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                </button>
                {copyFeedback && (
                  <div className="text-sm text-green-600 dark:text-green-400 ml-2">
                    {copyFeedback}
                  </div>
                )}
              </div>
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
                    className={INPUT_FULL_WIDTH}
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

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push(`/manage.html?projectId=${projectId}`)}
                  className={BUTTON_SECONDARY_GREEN}
                >
                  候補日時入力・シーン設定
                </button>
                <button
                  onClick={() => router.push(`/cast-schedule.html?projectId=${projectId}`)}
                  className={BUTTON_SECONDARY_BLUE}
                >
                  キャスト予定入力
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-3">
                シーン別の撮影可能日時
              </h3>
              {isLoadingScenes ? (
                <p className="text-gray-500 dark:text-gray-400">読み込み中...</p>
              ) : sceneAvailabilityGroups.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">撮影可能な日時がまだ登録されていません</p>
              ) : (
                <div className="space-y-6">
                  {sceneAvailabilityGroups.map((group) => (
                    <div key={group.sceneId} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {group.sceneName}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          必要役者: {sceneRequiredRoles[group.sceneId]?.join(" / ") || "未設定"}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-600 dark:text-gray-300">
                              <th className="py-2 pr-4">撮影候補日</th>
                              <th className="py-2">時間枠</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map((item, index) => (
                              <tr key={`${item.scene_id}-${item.time_slot_id}-${item.target_date}-${index}`} className="border-t border-gray-200 dark:border-gray-700">
                                <td className="py-2 pr-4 text-gray-900 dark:text-gray-100">{item.target_date}</td>
                                <td className="py-2 text-gray-700 dark:text-gray-300">
                                  {item.slot_name}
                                  <span className="text-gray-500 dark:text-gray-400"> ({item.start_time || "--:--"}-{item.end_time || "--:--"})</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
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
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 font-semibold transition-colors disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
              >
                {isDeleting ? "削除中..." : "プロジェクトを削除"}
              </button>
            </div>
          </div>
        </div>

        {/* 初回訪問時のモーダル */}
        {showCopyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-4 animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                プロジェクト作成完了！
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                プロジェクトを作成しました。下のボタンでURLをコピーして共有できます。
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 bg-gray-100 dark:bg-gray-700 p-3 rounded break-all">
                {`${window.location.origin}/project.html?id=${projectId}`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyModalUrl}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold transition-colors"
                >
                  コピー
                </button>
                <button
                  onClick={() => setShowCopyModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<div className={FULLSCREEN_CENTERED_BG}><div className="text-center"><div className={`${SPINNER} mx-auto mb-4`}></div><p className={HELPER_TEXT}>読み込み中...</p></div></div>}>
      <ProjectPageContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { CheckIcon, LinkIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { AdminHeader } from "@/app/components/AdminHeader";
import { Notification } from "@/app/components/Notification";
import { deleteProject, getProjectHome, Project, ProjectHomeScene, updateProject } from "@/lib/api";
import { validateProjectTitle } from "@/lib/validators";

function ProjectPageContent() {
  //プロジェクトIDを取得
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = useMemo(() => searchParams.get("id") || "", [searchParams]);

  // DBから取得したプロジェクト情報の状態管理
  const [project, setProject] = useState<Project | null>(null);

  // UIの状態管理
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [scenes, setScenes] = useState<ProjectHomeScene[]>([]);
  const [isLoadingScenes, setIsLoadingScenes] = useState(true);
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
      const url = `${window.location.origin}/project/?id=${projectId}`;
      await navigator.clipboard.writeText(url);
      setCopyFeedback("success");
      setTimeout(() => setCopyFeedback(""), 1500);
      setShowCopyModal(false);
    } catch (err) {
      console.error("URLのコピーに失敗しました。", err);
      setCopyFeedback("error");
      setTimeout(() => setCopyFeedback(""), 1500);
    }
  };

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchProjectHome = async () => {
      if (!projectId) {
        setError("プロジェクトIDが指定されていません。");
        setIsLoading(false);
        setIsLoadingScenes(false);
        return;
      }

      try {
        setIsLoading(true);
        setIsLoadingScenes(true);
        const data = await getProjectHome(projectId);
        if (!isCurrentRequest) return;
        setProject(data.project);
        setDraftTitle(data.project.title || "");
        setDraftDescription(data.project.description || "");
        setScenes(data.scenes);
      } catch (err) {
        if (isCurrentRequest) {
          setError((err as Error).message || "プロジェクトの読み込みに失敗しました。");
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
          setIsLoadingScenes(false);
        }
      }
    };

    fetchProjectHome();
    return () => {
      isCurrentRequest = false;
    };
  }, [projectId]);

  const sceneAvailabilityGroups = useMemo(() => {
    return scenes.map((item) => ({
      sceneId: item.scene.id || 0,
      sceneName: item.scene.scene_name,
      requiredRoles: item.required_casts.map((cast) => cast.role_name || cast.name),
      items: item.availabilities,
    }));
  }, [scenes]);

  const handleSave = async () => {
    if (!projectId || !project) {
      return;
    }

    if (!draftTitle.trim()) {
      setError("プロジェクト名は必須です。");
      return;
    }

    // バリデーション
    const titleValidation = validateProjectTitle(draftTitle);
    if (!titleValidation.isValid) {
      setError(titleValidation.error || "プロジェクト名が無効です。");
      return;
    }

    try {
      setError("");
      setIsSaving(true);
      const updated = await updateProject(projectId, {
        title: draftTitle.trim(),
        description: draftDescription.trim(),
      });
      setProject(updated);
      setDraftTitle(updated.title || "");
      setDraftDescription(updated.description || "");
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    } catch (err) {
      setError((err as Error).message || "プロジェクトの更新に失敗しました。");
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
      setError((err as Error).message || "プロジェクトの削除に失敗しました。");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!projectId) {
      return;
    }
    try {
      const url = `${window.location.origin}/project/?id=${projectId}`;
      await navigator.clipboard.writeText(url);
      setCopyFeedback("success");
      setTimeout(() => setCopyFeedback(""), 1500);
    } catch {
      setCopyFeedback("error");
      setTimeout(() => setCopyFeedback(""), 1500);
    }
  };

  if (isLoading) {
    return (
      <>
        <AdminHeader projectId={projectId} />
        <main><p>読み込み中...</p></main>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <AdminHeader projectId={projectId} />
        <Notification message={error || "プロジェクトが見つかりません。"} />
        <main>
          <h1>プロジェクトを表示できません。</h1>
          <p>{error || "プロジェクトが見つかりません。"}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader projectId={projectId} />
      <Notification
        message={
          error ||
          (copyFeedback === "success"
            ? "リンクをコピーしました。"
            : copyFeedback === "error"
            ? "コピーに失敗しました。"
            : "")
        }
        type={error || copyFeedback === "error" ? "error" : "success"}
      />
      <main className="mx-auto w-full max-w-7xl">
        <h1 className="sr-only">プロジェクトホーム</h1>
        <div className="divide-y divide-gray-200 dark:divide-white/10">
          <section className="px-4 py-8 sm:px-6 lg:px-8">
            <div>
              <div>
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} disabled={isSaving} aria-label="プロジェクト名" />
                    <IconButton label="プロジェクト名を保存" onClick={handleSave} disabled={isSaving || !draftTitle.trim()} tone="save"><CheckIcon className="size-5" /></IconButton>
                    <IconButton label="プロジェクト名の編集をキャンセル" onClick={handleCancelTitle} disabled={isSaving}><XMarkIcon className="size-5" /></IconButton>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <h2 className="min-w-0 flex-1 text-base font-semibold text-gray-900 dark:text-white">{project.title}</h2>
                    <IconButton label="プロジェクト名を編集" onClick={() => setIsEditingTitle(true)}><PencilSquareIcon className="size-5" /></IconButton>
                  </div>
                )}

                {isEditingDescription ? (
                  <div className="mt-4">
                    <textarea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} disabled={isSaving} rows={4} aria-label="プロジェクト説明" placeholder="プロジェクトの説明を入力" />
                    <div className="mt-3 flex justify-end gap-2">
                      <IconButton label="プロジェクト説明を保存" onClick={handleSave} disabled={isSaving} tone="save"><CheckIcon className="size-5" /></IconButton>
                      <IconButton label="プロジェクト説明の編集をキャンセル" onClick={handleCancelDescription} disabled={isSaving}><XMarkIcon className="size-5" /></IconButton>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-start gap-2">
                    <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm/6 text-gray-500 dark:text-gray-400">{project.description || "説明はまだ登録されていません。"}</p>
                    <IconButton label="プロジェクト説明を編集" onClick={() => setIsEditingDescription(true)}><PencilSquareIcon className="size-5" /></IconButton>
                  </div>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleCopyLink} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" aria-label="プロジェクトリンクをコピー" title="プロジェクトリンクをコピー">
                    <LinkIcon aria-hidden="true" className="size-5" />
                  </button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">プロジェクトを共有</span>
                </div>
                <button type="button" onClick={handleDelete} disabled={isDeleting} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20" aria-label="プロジェクトを削除" title="プロジェクトを削除"><TrashIcon aria-hidden="true" className="size-5" /></button>
              </div>
            </div>
          </section>

          <section className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex justify-center">
              <div className="isolate flex w-full flex-col rounded-md shadow-xs sm:inline-flex sm:w-auto sm:flex-row dark:shadow-none">
                <StepButton onClick={() => router.push(`/manage/?projectId=${projectId}`)} position="first">STEP 1：候補日時設定</StepButton>
                <StepButton onClick={() => router.push(`/cast-schedule/?projectId=${projectId}`)} position="middle">STEP 2：キャスト設定</StepButton>
                <StepButton onClick={() => router.push(`/scenes/?projectId=${projectId}`)} position="last">STEP 3：シーン設定</StepButton>
              </div>
            </div>
          </section>

          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div>
              {isLoadingScenes ? (
                <p className="text-sm/6 text-gray-500 dark:text-gray-400">読み込み中...</p>
              ) : scenes.length === 0 ? (
                <p className="text-sm/6 text-gray-500 dark:text-gray-400">シーンがまだ登録されていません。</p>
              ) : (
                <ul role="list" className="space-y-6">
                  {sceneAvailabilityGroups.map((group) => (
                    <li key={group.sceneId} className="overflow-hidden rounded-md border border-gray-300 dark:border-white/20">
                      <div className="flex flex-col gap-1 border-b border-gray-300 bg-gray-50 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6 dark:border-white/20 dark:bg-white/5">
                        <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">{group.sceneName}</h3>
                        <p className="text-xs/5 text-gray-500 sm:text-right dark:text-gray-400">必要な役者：{group.requiredRoles.join(" / ") || "未設定"}</p>
                      </div>
                      {group.items.length === 0 ? (
                        <p className="px-4 py-5 text-sm/6 text-gray-500 dark:text-gray-400">撮影可能な日時はありません。</p>
                      ) : (
                        <div className="overflow-x-auto px-4 pb-2">
                          <table>
                            <thead><tr><th scope="col">撮影候補日</th><th scope="col">時間枠</th></tr></thead>
                            <tbody>
                              {group.items.map((item, index) => (
                                <tr key={`${item.scene_id}-${item.time_slot_id}-${item.target_date}-${index}`}>
                                  <td>{item.target_date}</td>
                                  <td>{item.slot_name}<span className="ml-2 text-xs text-gray-400">{item.start_time || "--:--"} - {item.end_time || "--:--"}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>

      <Dialog open={showCopyModal} onClose={() => setShowCopyModal(false)} className="relative z-10">
        <DialogBackdrop transition className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 dark:bg-gray-900/50" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
            <DialogPanel transition className="relative w-full max-w-sm transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 sm:my-8 data-closed:sm:translate-y-0 data-closed:sm:scale-95 dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10">
              <div className="flex items-start justify-between gap-4">
                <DialogTitle as="h2" className="text-base font-semibold text-gray-900 dark:text-white">プロジェクトを作成しました</DialogTitle>
                <IconButton label="閉じる" onClick={() => setShowCopyModal(false)}><XMarkIcon className="size-5" /></IconButton>
              </div>
              <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-400">プロジェクトのリンクを保存してください。</p>
              <div className="mt-6 flex justify-end">
                <button type="button" onClick={handleCopyModalUrl} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-xs hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-red-500 dark:hover:bg-red-400" aria-label="プロジェクトリンクをコピー"><LinkIcon aria-hidden="true" className="size-5" /></button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function IconButton({ label, onClick, disabled = false, tone = "default", children }: { label: string; onClick: () => void; disabled?: boolean; tone?: "default" | "save"; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:border-gray-600 dark:hover:bg-gray-700 ${tone === "save" ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-300"}`} aria-label={label} title={label}>{children}</button>;
}

function StepButton({ onClick, position, children }: { onClick: () => void; position: "first" | "middle" | "last"; children: React.ReactNode }) {
  const corners = position === "first" ? "rounded-t-md sm:rounded-t-none sm:rounded-l-md" : position === "last" ? "rounded-b-md sm:rounded-b-none sm:rounded-r-md" : "";
  return <button type="button" onClick={onClick} className={`relative inline-flex items-center justify-center bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 focus:z-10 focus-visible:outline-2 focus-visible:outline-red-600 sm:justify-start ${position === "first" ? "" : "-mt-px sm:mt-0 sm:-ml-px"} ${corners} dark:bg-white/10 dark:text-white dark:inset-ring-gray-700 dark:hover:bg-white/20`}>{children}</button>;
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <ProjectPageContent />
    </Suspense>
  );
}

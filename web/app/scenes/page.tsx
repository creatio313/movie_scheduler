"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CheckIcon as SelectedIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { AdminHeader } from "@/app/components/AdminHeader";
import { Notification } from "@/app/components/Notification";
import {
  Cast,
  Scene,
  TimeSlotDef,
  createScene,
  createSceneAllowedTimeSlot,
  createSceneRequiredCast,
  deleteScene,
  deleteSceneAllowedTimeSlot,
  deleteSceneRequiredCast,
  getProject,
  listCasts,
  listSceneAllowedTimeSlots,
  listSceneRequiredCasts,
  listScenes,
  listTimeSlotsDef,
  updateScene,
} from "@/lib/api";
import { validateSceneName } from "@/lib/validators";

type CheckboxItem = { id?: number; label: string; detail: string };

function ScenesPageContent() {
  // プロジェクトIDを取得
  const searchParams = useSearchParams();
  const projectId = useMemo(() => searchParams.get("projectId") || "", [searchParams]);

  // DBから取得するデータの状態管理
  const [projectName, setProjectName] = useState("");
  const [casts, setCasts] = useState<Cast[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotDef[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<number | null>(null);
  const [sceneName, setSceneName] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");

  // 画面状態管理
  const [selectedCastIds, setSelectedCastIds] = useState<Set<number>>(new Set());
  const [selectedTimeSlotIds, setSelectedTimeSlotIds] = useState<Set<number>>(new Set());
  const [isSceneDialogOpen, setIsSceneDialogOpen] = useState(false);
  const [newSceneName, setNewSceneName] = useState("");
  const [newSceneDescription, setNewSceneDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingScene, setIsLoadingScene] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sceneDetailsVersion, setSceneDetailsVersion] = useState(0);
  const [error, setError] = useState("");

  const availableTimeSlotIds = useMemo(
    () => timeSlots.map((slot) => slot.id).filter((id): id is number => typeof id === "number"),
    [timeSlots]
  );
  const selectedScene = useMemo(
    () => scenes.find((scene) => scene.id === selectedSceneId) || null,
    [scenes, selectedSceneId]
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) {
        setError("プロジェクトIDが指定されていません。");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const [project, castList, slots, sceneList] = await Promise.all([
          getProject(projectId), listCasts(projectId), listTimeSlotsDef(projectId), listScenes(projectId),
        ]);
        setProjectName(project.title || "");
        setCasts(castList);
        setTimeSlots(slots);
        setScenes(sceneList);
        setSelectedSceneId(sceneList[0]?.id || null);
      } catch (err) {
        setError((err as Error).message || "シーンデータの読み込みに失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (!selectedScene) {
      return;
    }

    let isCurrentRequest = true;
    const fetchSceneDetails = async () => {
      try {
        setIsLoadingScene(true);
        setError("");
        const [required, allowed] = await Promise.all([
          listSceneRequiredCasts(projectId, selectedScene.id!),
          listSceneAllowedTimeSlots(projectId, selectedScene.id!),
        ]);
        if (!isCurrentRequest) return;
        setSceneName(selectedScene.scene_name || "");
        setSceneDescription(selectedScene.description || "");
        setSelectedCastIds(new Set(required.map((item) => item.cast_id)));
        setSelectedTimeSlotIds(new Set(allowed.map((item) => item.time_slot_id)));
      } catch (err) {
        if (isCurrentRequest) setError((err as Error).message || "シーン情報の読み込みに失敗しました。");
      } finally {
        if (isCurrentRequest) setIsLoadingScene(false);
      }
    };
    fetchSceneDetails();
    return () => { isCurrentRequest = false; };
  }, [projectId, selectedScene, availableTimeSlotIds, sceneDetailsVersion]);

  const toggleSetValue = (current: Set<number>, value: number) => {
    const next = new Set(current);
    if (next.has(value)) next.delete(value); else next.add(value);
    return next;
  };

  const handleSaveScene = async () => {
    if (!projectId || !selectedSceneId || !sceneName.trim()) {
      setError("シーン名は必須です。");
      return;
    }
    const validation = validateSceneName(sceneName.trim());
    if (!validation.isValid) {
      setError(validation.error || "シーン名が無効です。");
      return;
    }
    try {
      setIsSaving(true);
      setError("");
      const updated = await updateScene(projectId, selectedSceneId, {
        scene_name: sceneName.trim(),
        description: sceneDescription.trim() ? sceneDescription : "",
      });
      const [currentRequired, currentAllowed] = await Promise.all([
        listSceneRequiredCasts(projectId, selectedSceneId),
        listSceneAllowedTimeSlots(projectId, selectedSceneId),
      ]);
      await Promise.all([
        ...Array.from(selectedCastIds).filter((id) => !currentRequired.some((item) => item.cast_id === id)).map((id) => createSceneRequiredCast(projectId, selectedSceneId, id)),
        ...currentRequired.filter((item) => !selectedCastIds.has(item.cast_id)).map((item) => deleteSceneRequiredCast(projectId, selectedSceneId, item.cast_id)),
        ...Array.from(selectedTimeSlotIds).filter((id) => !currentAllowed.some((item) => item.time_slot_id === id)).map((id) => createSceneAllowedTimeSlot(projectId, selectedSceneId, id)),
        ...currentAllowed.filter((item) => !selectedTimeSlotIds.has(item.time_slot_id)).map((item) => deleteSceneAllowedTimeSlot(projectId, selectedSceneId, item.time_slot_id)),
      ]);
      setScenes((prev) => prev.map((scene) => scene.id === updated.id ? updated : scene));
    } catch (err) {
      setError((err as Error).message || "シーンの更新に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddScene = async () => {
    if (!projectId || !newSceneName.trim()) return;
    const validation = validateSceneName(newSceneName.trim());
    if (!validation.isValid) {
      setError(validation.error || "シーン名が無効です。");
      return;
    }
    try {
      setIsSaving(true);
      setError("");
      const created = await createScene(projectId, {
        scene_name: newSceneName.trim(),
        description: newSceneDescription.trim() ? newSceneDescription : "",
      });
      setScenes((prev) => [...prev, created]);
      setSelectedSceneId(created.id || null);
      setNewSceneName("");
      setNewSceneDescription("");
      setIsSceneDialogOpen(false);
    } catch (err) {
      setError((err as Error).message || "シーンの追加に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteScene = async (sceneId?: number) => {
    if (!sceneId || !window.confirm("このシーンを削除しますか？")) return;
    try {
      setIsSaving(true);
      setError("");
      await deleteScene(projectId, sceneId);
      const remaining = scenes.filter((scene) => scene.id !== sceneId);
      setScenes(remaining);
      if (selectedSceneId === sceneId) setSelectedSceneId(remaining[0]?.id || null);
    } catch (err) {
      setError((err as Error).message || "シーンの削除に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const openAddSceneDialog = () => {
    setNewSceneName("");
    setNewSceneDescription("");
    setIsSceneDialogOpen(true);
  };

  if (isLoading) return <><AdminHeader projectId={projectId} /><main><p>読み込み中...</p></main></>;

  return (
    <>
      <AdminHeader projectId={projectId} />
      <main className="mx-auto w-full max-w-7xl">
        <Notification message={error} />
        <h1 className="sr-only">シーン設定</h1>
        <section className="grid grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">シーン</h2>
              <button type="button" onClick={openAddSceneDialog} disabled={isSaving} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-xs hover:bg-red-500 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-400" aria-label="シーンを追加">
                <PlusIcon aria-hidden="true" className="size-5" />
              </button>
            </div>
            <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">{projectName}のシーンを選択して時間・役者の要件を設定します。</p>
            {scenes.length === 0 ? <p className="mt-6 py-5 text-sm text-gray-500 dark:text-gray-400 md:hidden">シーンがまだ登録されていません。</p> : (
              <div className="mt-6 md:hidden">
                <Listbox value={selectedSceneId} onChange={setSelectedSceneId}>
                  <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-md bg-white py-2 pr-2 pl-3 text-left text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus-visible:outline-red-500">
                    <span className="col-start-1 row-start-1 flex min-w-0 flex-col pr-7">
                      <span className="truncate text-sm font-semibold">{selectedScene?.scene_name || "シーンを選択"}</span>
                      {selectedScene && <span className="truncate text-xs text-gray-500 dark:text-gray-400">{selectedScene.description || "説明なし"}</span>}
                    </span>
                    <ChevronUpDownIcon aria-hidden="true" className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 dark:text-gray-400" />
                  </ListboxButton>
                  <ListboxOptions transition anchor="bottom" className="z-20 mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline-1 outline-black/5 transition duration-100 ease-in data-closed:opacity-0 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
                    {scenes.map((scene) => (
                      <ListboxOption key={scene.id} value={scene.id} className="group relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none data-focus:bg-red-600 data-focus:text-white dark:text-white dark:data-focus:bg-red-500">
                        <span className="block truncate text-sm font-normal group-data-selected:font-semibold">{scene.scene_name}</span>
                        <span className="block truncate text-xs text-gray-500 group-data-focus:text-red-100 dark:text-gray-400 dark:group-data-focus:text-red-100">{scene.description || "説明なし"}</span>
                        <span className="absolute inset-y-0 right-0 hidden items-center pr-3 text-red-600 group-data-selected:flex group-data-focus:text-white dark:text-red-400">
                          <SelectedIcon aria-hidden="true" className="size-5" />
                        </span>
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Listbox>
                {selectedScene && <div className="mt-3 flex justify-end">
                  <button type="button" onClick={() => handleDeleteScene(selectedScene.id)} disabled={isSaving} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20" aria-label={`${selectedScene.scene_name}を削除`}><TrashIcon aria-hidden="true" className="size-5" /></button>
                </div>}
              </div>
            )}
            <ul role="list" className="mt-6 hidden divide-y divide-gray-100 md:block dark:divide-white/5">
              {scenes.length === 0 ? <li className="py-5 text-sm text-gray-500">シーンがまだ登録されていません。</li> : scenes.map((scene) => (
                <li key={scene.id} role="button" tabIndex={0} aria-pressed={selectedSceneId === scene.id} onClick={() => scene.id && setSelectedSceneId(scene.id)} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && scene.id) { event.preventDefault(); setSelectedSceneId(scene.id); } }} className={`flex cursor-pointer items-center gap-x-4 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${selectedSceneId === scene.id ? "bg-red-50/70 dark:bg-red-950/20" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm/6 font-semibold text-gray-900 dark:text-white">{scene.scene_name}</p>
                    <p className="mt-1 truncate text-xs/5 text-gray-500 dark:text-gray-400">{scene.description || "説明なし"}</p>
                  </div>
                  <button type="button" onClick={(event) => { event.stopPropagation(); handleDeleteScene(scene.id); }} disabled={isSaving} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20" aria-label={`${scene.scene_name}を削除`}>
                    <TrashIcon aria-hidden="true" className="size-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">シーン詳細</h2>
            <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">{selectedScene ? `${selectedScene.scene_name}の設定を編集します。` : "シーンを選択してください。"}</p>
            {!selectedScene ? <p className="mt-6 text-sm/6 text-gray-500 dark:text-gray-400">左側の追加ボタンからシーンを登録してください。</p> : isLoadingScene ? <p className="mt-6 text-sm/6 text-gray-500 dark:text-gray-400">読み込み中...</p> : <div className="mt-6 space-y-8">
              <div><label htmlFor="sceneName">シーン名</label><input id="sceneName" value={sceneName} onChange={(event) => setSceneName(event.target.value)} disabled={isSaving} className="mt-2" /></div>
              <div><label htmlFor="sceneDescription">シーン説明</label><textarea id="sceneDescription" value={sceneDescription} onChange={(event) => setSceneDescription(event.target.value)} disabled={isSaving} rows={4} className="mt-2" /></div>
              <CheckboxGroup title="撮影可能な時間" emptyMessage="時間枠が登録されていません。" items={timeSlots.map((slot) => ({ id: slot.id, label: slot.slot_name, detail: `${slot.start_time || "--:--"} - ${slot.end_time || "--:--"}` }))} selected={selectedTimeSlotIds} onToggle={(id) => setSelectedTimeSlotIds((current) => toggleSetValue(current, id))} disabled={isSaving} />
              <CheckboxGroup title="必要な役者" emptyMessage="キャストが登録されていません。" items={casts.map((cast) => ({ id: cast.id, label: cast.name, detail: cast.role_name || "役名なし" }))} selected={selectedCastIds} onToggle={(id) => setSelectedCastIds((current) => toggleSetValue(current, id))} disabled={isSaving} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={handleSaveScene} disabled={isSaving || !sceneName.trim()} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-green-600 hover:bg-green-50 disabled:opacity-50 dark:border-gray-600 dark:text-green-400 dark:hover:bg-green-900/20" aria-label="シーンを更新">
                  <CheckIcon aria-hidden="true" className="size-5" />
                </button>
                <button type="button" onClick={() => setSceneDetailsVersion((version) => version + 1)} disabled={isSaving} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" aria-label="編集をキャンセル">
                  <XMarkIcon aria-hidden="true" className="size-5" />
                </button>
              </div>
            </div>}
          </div>
        </section>
      </main>

      <Dialog open={isSceneDialogOpen} onClose={() => !isSaving && setIsSceneDialogOpen(false)} className="relative z-10">
        <DialogBackdrop transition className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 dark:bg-gray-900/50" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto"><div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0"><DialogPanel transition className="relative w-full max-w-sm transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10">
          <div className="flex items-start justify-between gap-4"><DialogTitle as="h3" className="text-base font-semibold text-gray-900 dark:text-white">シーンを追加</DialogTitle><button type="button" onClick={() => setIsSceneDialogOpen(false)} disabled={isSaving} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700" aria-label="閉じる"><XMarkIcon aria-hidden="true" className="size-5" /></button></div>
          <div className="mt-5 space-y-4"><label>シーン名<input type="text" value={newSceneName} onChange={(event) => setNewSceneName(event.target.value)} disabled={isSaving} className="mt-2" /></label><label>シーン説明<textarea value={newSceneDescription} onChange={(event) => setNewSceneDescription(event.target.value)} disabled={isSaving} rows={4} className="mt-2" /></label></div>
          <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={handleAddScene} disabled={isSaving || !newSceneName.trim()} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-green-600 hover:bg-green-50 disabled:opacity-50 dark:border-gray-600 dark:text-green-400 dark:hover:bg-green-900/20" aria-label="シーンを保存"><CheckIcon aria-hidden="true" className="size-5" /></button><button type="button" onClick={() => setIsSceneDialogOpen(false)} disabled={isSaving} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" aria-label="キャンセル"><XMarkIcon aria-hidden="true" className="size-5" /></button></div>
        </DialogPanel></div></div>
      </Dialog>
    </>
  );
}

function CheckboxGroup({ title, emptyMessage, items, selected, onToggle, disabled }: { title: string; emptyMessage: string; items: CheckboxItem[]; selected: Set<number>; onToggle: (id: number) => void; disabled: boolean }) {
  return <div><h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">{title}</h3>{items.length === 0 ? <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-400">{emptyMessage}</p> : <div className="mt-3 grid gap-2 sm:grid-cols-2">{items.map((item) => item.id ? <label key={item.id} className="group flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 px-3 py-2 dark:border-white/10"><span className="grid size-5 shrink-0 place-items-center"><input type="checkbox" checked={selected.has(item.id)} onChange={() => onToggle(item.id!)} disabled={disabled} className="col-start-1 row-start-1 !size-5 appearance-none !rounded-full border border-gray-300 bg-white !p-0 checked:border-red-600 checked:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:checked:border-red-500 dark:checked:bg-red-500 dark:disabled:bg-white/10 forced-colors:appearance-auto" /><svg fill="none" viewBox="0 0 14 14" className="pointer-events-none col-start-1 row-start-1 size-3.5 stroke-white group-has-disabled:stroke-gray-950/25 dark:group-has-disabled:stroke-white/25" aria-hidden="true"><path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-has-checked:opacity-100" /></svg></span><span className="min-w-0 text-sm text-gray-900 dark:text-gray-100"><span className="block truncate">{item.label}</span><span className="block truncate text-xs text-gray-500 dark:text-gray-400">{item.detail}</span></span></label> : null)}</div>}</div>;
}

export default function ScenesPage() {
  return <Suspense fallback={<p>読み込み中...</p>}><ScenesPageContent /></Suspense>;
}

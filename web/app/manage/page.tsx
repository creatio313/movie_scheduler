"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Cast,
  CandidateDate,
  Scene,
  TimeSlotDef,
  createCandidateDate,
  createScene,
  createSceneAllowedTimeSlot,
  createSceneRequiredCast,
  createTimeSlotDef,
  deleteCandidateDate,
  deleteScene,
  deleteSceneAllowedTimeSlot,
  deleteSceneRequiredCast,
  deleteTimeSlotDef,
  getProject,
  listCandidateDates,
  listCasts,
  listSceneAllowedTimeSlots,
  listSceneRequiredCasts,
  listScenes,
  listTimeSlotsDef,
  updateCandidateDate,
  updateScene,
  updateTimeSlotDef,
} from "@/lib/api";

export default function ManagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = useMemo(() => searchParams.get("projectId") || "", [searchParams]);

  const [projectName, setProjectName] = useState("");
  const [candidateDates, setCandidateDates] = useState<CandidateDate[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotDef[]>([]);
  const [casts, setCasts] = useState<Cast[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newSlotName, setNewSlotName] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [editingDateId, setEditingDateId] = useState<number | null>(null);
  const [editingDateValue, setEditingDateValue] = useState("");
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editingSlotName, setEditingSlotName] = useState("");
  const [editingSlotStart, setEditingSlotStart] = useState("");
  const [editingSlotEnd, setEditingSlotEnd] = useState("");
  const [sceneName, setSceneName] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [editingSceneId, setEditingSceneId] = useState<number | null>(null);
  const [selectedCastIds, setSelectedCastIds] = useState<Set<number>>(new Set());
  const [selectedTimeSlotIds, setSelectedTimeSlotIds] = useState<Set<number>>(new Set());
  const [isSceneFormInitialized, setIsSceneFormInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDate, setIsSavingDate] = useState(false);
  const [isSavingSlot, setIsSavingSlot] = useState(false);
  const [isSavingScene, setIsSavingScene] = useState(false);
  const [error, setError] = useState("");

  const availableTimeSlotIds = useMemo(
    () => timeSlots.map((slot) => slot.id).filter((id): id is number => typeof id === "number"),
    [timeSlots]
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) {
        setError("プロジェクトIDが指定されていません");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        const [project, dates, slots, castList, sceneList] = await Promise.all([
          getProject(projectId),
          listCandidateDates(projectId),
          listTimeSlotsDef(projectId),
          listCasts(projectId),
          listScenes(projectId),
        ]);
        setProjectName(project.title || "");
        setCandidateDates(dates);
        setTimeSlots(slots);
        setCasts(castList);
        setScenes(sceneList);
      } catch (err) {
        setError((err as Error).message || "管理データの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (isSceneFormInitialized || availableTimeSlotIds.length === 0) {
      return;
    }
    setSelectedTimeSlotIds(new Set(availableTimeSlotIds));
    setIsSceneFormInitialized(true);
  }, [availableTimeSlotIds, isSceneFormInitialized]);

  const handleAddDate = async () => {
    if (!projectId || !newDate) {
      return;
    }

    try {
      setIsSavingDate(true);
      setError("");
      const created = await createCandidateDate({
        project_id: projectId,
        target_date: newDate,
      });
      setCandidateDates((prev) => [...prev, created]);
      setNewDate("");
    } catch (err) {
      setError((err as Error).message || "候補日の追加に失敗しました");
    } finally {
      setIsSavingDate(false);
    }
  };

  const handleEditDate = (item: CandidateDate) => {
    setEditingDateId(item.id || null);
    setEditingDateValue(item.target_date || "");
  };

  const handleSaveDate = async () => {
    if (!projectId || editingDateId === null) {
      return;
    }

    try {
      setIsSavingDate(true);
      setError("");
      const updated = await updateCandidateDate(editingDateId, {
        project_id: projectId,
        target_date: editingDateValue,
      });
      setCandidateDates((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingDateId(null);
      setEditingDateValue("");
    } catch (err) {
      setError((err as Error).message || "候補日の更新に失敗しました");
    } finally {
      setIsSavingDate(false);
    }
  };

  const handleDeleteDate = async (id?: number) => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm("この候補日を削除しますか？");
    if (!confirmed) {
      return;
    }

    try {
      setIsSavingDate(true);
      setError("");
      await deleteCandidateDate(id);
      setCandidateDates((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError((err as Error).message || "候補日の削除に失敗しました");
    } finally {
      setIsSavingDate(false);
    }
  };

  const handleAddSlot = async () => {
    if (!projectId || !newSlotName.trim()) {
      return;
    }

    try {
      setIsSavingSlot(true);
      setError("");
      const created = await createTimeSlotDef({
        project_id: projectId,
        slot_name: newSlotName.trim(),
        start_time: newStartTime || undefined,
        end_time: newEndTime || undefined,
      });
      setTimeSlots((prev) => [...prev, created]);
      setNewSlotName("");
      setNewStartTime("");
      setNewEndTime("");
    } catch (err) {
      setError((err as Error).message || "時間枠の追加に失敗しました");
    } finally {
      setIsSavingSlot(false);
    }
  };

  const handleEditSlot = (item: TimeSlotDef) => {
    setEditingSlotId(item.id || null);
    setEditingSlotName(item.slot_name || "");
    setEditingSlotStart(item.start_time || "");
    setEditingSlotEnd(item.end_time || "");
  };

  const handleSaveSlot = async () => {
    if (!projectId || editingSlotId === null || !editingSlotName.trim()) {
      return;
    }

    try {
      setIsSavingSlot(true);
      setError("");
      const updated = await updateTimeSlotDef(editingSlotId, {
        project_id: projectId,
        slot_name: editingSlotName.trim(),
        start_time: editingSlotStart || undefined,
        end_time: editingSlotEnd || undefined,
      });
      setTimeSlots((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingSlotId(null);
      setEditingSlotName("");
      setEditingSlotStart("");
      setEditingSlotEnd("");
    } catch (err) {
      setError((err as Error).message || "時間枠の更新に失敗しました");
    } finally {
      setIsSavingSlot(false);
    }
  };

  const handleDeleteSlot = async (id?: number) => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm("この時間枠を削除しますか？");
    if (!confirmed) {
      return;
    }

    try {
      setIsSavingSlot(true);
      setError("");
      await deleteTimeSlotDef(id);
      setTimeSlots((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError((err as Error).message || "時間枠の削除に失敗しました");
    } finally {
      setIsSavingSlot(false);
    }
  };

  const resetSceneForm = () => {
    setSceneName("");
    setSceneDescription("");
    setEditingSceneId(null);
    setSelectedCastIds(new Set());
    setSelectedTimeSlotIds(new Set(availableTimeSlotIds));
  };

  const handleToggleCastSelection = (castId: number) => {
    setSelectedCastIds((prev) => {
      const next = new Set(prev);
      if (next.has(castId)) {
        next.delete(castId);
      } else {
        next.add(castId);
      }
      return next;
    });
  };

  const handleToggleTimeSlotSelection = (slotId: number) => {
    setSelectedTimeSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        next.add(slotId);
      }
      return next;
    });
  };

  const handleEditScene = async (scene: Scene) => {
    if (!scene.id) {
      return;
    }

    try {
      setIsSavingScene(true);
      setError("");
      const [required, allowed] = await Promise.all([
        listSceneRequiredCasts(scene.id),
        listSceneAllowedTimeSlots(scene.id),
      ]);
      setSceneName(scene.scene_name || "");
      setSceneDescription(scene.description || "");
      setEditingSceneId(scene.id);
      setSelectedCastIds(new Set(required.map((item) => item.cast_id)));
      setSelectedTimeSlotIds(new Set(allowed.map((item) => item.time_slot_id)));
    } catch (err) {
      setError((err as Error).message || "シーン情報の読み込みに失敗しました");
    } finally {
      setIsSavingScene(false);
    }
  };

  const handleSaveScene = async () => {
    if (!projectId || !sceneName.trim()) {
      setError("シーン名は必須です");
      return;
    }

    try {
      setIsSavingScene(true);
      setError("");

      let savedScene: Scene;
      if (editingSceneId) {
        savedScene = await updateScene(editingSceneId, {
          project_id: projectId,
          scene_name: sceneName.trim(),
          description: sceneDescription.trim() ? sceneDescription : "",
        });
        setScenes((prev) => prev.map((item) => (item.id === savedScene.id ? savedScene : item)));
      } else {
        savedScene = await createScene({
          project_id: projectId,
          scene_name: sceneName.trim(),
          description: sceneDescription.trim() ? sceneDescription : "",
        });
        setScenes((prev) => [...prev, savedScene]);
      }

      if (!savedScene.id) {
        return;
      }

      const [currentRequired, currentAllowed] = await Promise.all([
        listSceneRequiredCasts(savedScene.id),
        listSceneAllowedTimeSlots(savedScene.id),
      ]);
      const currentRequiredIds = new Set(currentRequired.map((item) => item.cast_id));
      const currentAllowedIds = new Set(currentAllowed.map((item) => item.time_slot_id));

      const requiredAdds = Array.from(selectedCastIds).filter((id) => !currentRequiredIds.has(id));
      const requiredRemoves = currentRequired.filter((item) => !selectedCastIds.has(item.cast_id));
      const allowedAdds = Array.from(selectedTimeSlotIds).filter((id) => !currentAllowedIds.has(id));
      const allowedRemoves = currentAllowed.filter((item) => !selectedTimeSlotIds.has(item.time_slot_id));

      await Promise.all([
        ...requiredAdds.map((castId) => createSceneRequiredCast({ scene_id: savedScene.id!, cast_id: castId })),
        ...requiredRemoves.map((item) => deleteSceneRequiredCast(item.id!)),
        ...allowedAdds.map((slotId) => createSceneAllowedTimeSlot({ scene_id: savedScene.id!, time_slot_id: slotId })),
        ...allowedRemoves.map((item) => deleteSceneAllowedTimeSlot(item.id!)),
      ]);

      resetSceneForm();
    } catch (err) {
      setError((err as Error).message || "シーンの保存に失敗しました");
    } finally {
      setIsSavingScene(false);
    }
  };

  const handleDeleteScene = async (sceneId?: number) => {
    if (!sceneId) {
      return;
    }

    const confirmed = window.confirm("このシーンを削除しますか？");
    if (!confirmed) {
      return;
    }

    try {
      setIsSavingScene(true);
      setError("");
      await deleteScene(sceneId);
      setScenes((prev) => prev.filter((item) => item.id !== sceneId));
      if (editingSceneId === sceneId) {
        resetSceneForm();
      }
    } catch (err) {
      setError((err as Error).message || "シーンの削除に失敗しました");
    } finally {
      setIsSavingScene(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900">
      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              onClick={() => router.push(`/project?id=${projectId}`)}
              className="mb-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold flex items-center gap-2"
            >
              <span>←</span> プロジェクトに戻る
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">管理: {projectName}</h1>
          </div>
          <div className="rounded-full bg-gray-900 text-white px-4 py-2 text-sm font-semibold dark:bg-gray-100 dark:text-gray-900">
            制作者用設定
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">撮影候補日</h2>
            <div className="flex flex-wrap gap-3 mb-6">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="flex-1 min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleAddDate}
                disabled={!newDate || isSavingDate}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                追加
              </button>
            </div>

            <div className="space-y-3">
              {candidateDates.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400">候補日がまだ登録されていません</p>
              )}
              {candidateDates.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
                >
                  {editingDateId === item.id ? (
                    <input
                      type="date"
                      value={editingDateValue}
                      onChange={(e) => setEditingDateValue(e.target.value)}
                      className="flex-1 min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <span className="text-gray-900 dark:text-gray-100 font-semibold">{item.target_date}</span>
                  )}

                  <div className="flex items-center gap-2">
                    {editingDateId === item.id ? (
                      <>
                        <button
                          onClick={handleSaveDate}
                          disabled={isSavingDate}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-green-600 hover:bg-green-50 disabled:opacity-50 dark:border-gray-600 dark:text-green-400 dark:hover:bg-green-900/20"
                          aria-label="保存"
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingDateId(null)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          aria-label="キャンセル"
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l12 12M18 6l-12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditDate(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          aria-label="編集"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteDate(item.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                          aria-label="削除"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" />
                            <path d="M8 6v12" />
                            <path d="M16 6v12" />
                            <path d="M5 6l1-2h12l1 2" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">撮影候補時間</h2>
            <div className="grid gap-3 mb-6">
              <input
                type="text"
                value={newSlotName}
                onChange={(e) => setNewSlotName(e.target.value)}
                placeholder="時間枠名"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                  開始時間
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                  終了時間
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>
              </div>
              <button
                onClick={handleAddSlot}
                disabled={!newSlotName.trim() || isSavingSlot}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                追加
              </button>
            </div>

            <div className="space-y-3">
              {timeSlots.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400">時間枠がまだ登録されていません</p>
              )}
              {timeSlots.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
                >
                  {editingSlotId === item.id ? (
                    <div className="flex flex-1 flex-col gap-2">
                      <input
                        value={editingSlotName}
                        onChange={(e) => setEditingSlotName(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                          開始時間
                          <input
                            type="time"
                            value={editingSlotStart}
                            onChange={(e) => setEditingSlotStart(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                          終了時間
                          <input
                            type="time"
                            value={editingSlotEnd}
                            onChange={(e) => setEditingSlotEnd(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-gray-900 dark:text-gray-100 font-semibold">{item.slot_name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.start_time || "--:--"} - {item.end_time || "--:--"}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {editingSlotId === item.id ? (
                      <>
                        <button
                          onClick={handleSaveSlot}
                          disabled={isSavingSlot}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-green-600 hover:bg-green-50 disabled:opacity-50 dark:border-gray-600 dark:text-green-400 dark:hover:bg-green-900/20"
                          aria-label="保存"
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingSlotId(null)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          aria-label="キャンセル"
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l12 12M18 6l-12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditSlot(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          aria-label="編集"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(item.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                          aria-label="削除"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" />
                            <path d="M8 6v12" />
                            <path d="M16 6v12" />
                            <path d="M5 6l1-2h12l1 2" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">シーン管理</h2>
              <p className="text-gray-600 dark:text-gray-400">必要な役者と撮影可能な時間枠を設定します</p>
            </div>
            <button
              onClick={resetSceneForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              入力をクリア
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  シーン名 <span className="text-red-500">*</span>
                </label>
                <input
                  value={sceneName}
                  onChange={(e) => setSceneName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="例: 屋上の対話"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">シーン説明</label>
                <textarea
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="シーンの内容を簡単に記述してください（任意）"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">必要な役者</h3>
                {casts.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">キャストが登録されていません</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {casts.map((cast) => (
                      <label key={cast.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                        <input
                          type="checkbox"
                          checked={cast.id ? selectedCastIds.has(cast.id) : false}
                          onChange={() => cast.id && handleToggleCastSelection(cast.id)}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {cast.name} <span className="text-gray-500">({cast.role_name || "役名なし"})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">撮影可能な候補時間</h3>
                {timeSlots.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">時間枠が登録されていません</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {timeSlots.map((slot) => (
                      <label key={slot.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                        <input
                          type="checkbox"
                          checked={slot.id ? selectedTimeSlotIds.has(slot.id) : false}
                          onChange={() => slot.id && handleToggleTimeSlotSelection(slot.id)}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {slot.slot_name}
                          <span className="text-gray-500">
                            {" "}
                            ({slot.start_time || "--:--"}-{slot.end_time || "--:--"})
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSaveScene}
                  disabled={!sceneName.trim() || isSavingScene}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingSceneId ? "更新する" : "シーンを追加"}
                </button>
                {editingSceneId && (
                  <button
                    onClick={resetSceneForm}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    キャンセル
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">登録済みシーン</h3>
              {scenes.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">シーンがまだ登録されていません</p>
              ) : (
                <div className="space-y-3">
                  {scenes.map((scene) => (
                    <div key={scene.id} className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-gray-900 dark:text-gray-100 font-semibold">{scene.scene_name}</div>
                          {scene.description ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                              {scene.description}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 mt-1">説明なし</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditScene(scene)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            aria-label="編集"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteScene(scene.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                            aria-label="削除"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18" />
                              <path d="M8 6v12" />
                              <path d="M16 6v12" />
                              <path d="M5 6l1-2h12l1 2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

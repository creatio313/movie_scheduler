"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CandidateDate,
  TimeSlotDef,
  createCandidateDate,
  createTimeSlotDef,
  deleteCandidateDate,
  deleteTimeSlotDef,
  getProject,
  listCandidateDates,
  listTimeSlotsDef,
  updateTimeSlotDef,
} from "@/lib/api";
import {
  validateCandidateDate,
  validateTimeSlotName,
  validateTimeRange,
  normalizeTime,
} from "@/lib/validators";
import {
  FULLSCREEN_CENTERED_BG,
  INPUT_BASE,
  INPUT_DATE,
  INPUT_TIME,
  BUTTON_PRIMARY,
  SPINNER,
  HELPER_TEXT,
  GRID_2COL,
  SPACE_Y_3,
  LIST_ITEM,
} from "@/lib/tailwind-classes";

function ManagePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = useMemo(() => searchParams.get("projectId") || "", [searchParams]);

  const [projectName, setProjectName] = useState("");
  const [candidateDates, setCandidateDates] = useState<CandidateDate[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotDef[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newSlotName, setNewSlotName] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editingSlotName, setEditingSlotName] = useState("");
  const [editingSlotStart, setEditingSlotStart] = useState("");
  const [editingSlotEnd, setEditingSlotEnd] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDate, setIsSavingDate] = useState(false);
  const [isSavingSlot, setIsSavingSlot] = useState(false);
  const [error, setError] = useState("");

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
        const [project, dates, slots] = await Promise.all([
          getProject(projectId),
          listCandidateDates(projectId),
          listTimeSlotsDef(projectId),
        ]);
        setProjectName(project.title || "");
        setCandidateDates(dates);
        setTimeSlots(slots);
      } catch (err) {
        setError((err as Error).message || "管理データの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const handleAddDate = async () => {
    if (!projectId || !newDate) {
      return;
    }

    // バリデーション
    const dateValidation = validateCandidateDate(newDate);
    if (!dateValidation.isValid) {
      setError(dateValidation.error || "候補日の形式が無効です");
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

    // バリデーション
    const slotNameValidation = validateTimeSlotName(newSlotName.trim());
    if (!slotNameValidation.isValid) {
      setError(slotNameValidation.error || "時間枠名が無効です");
      return;
    }

    if (newStartTime && newEndTime) {
      const rangeValidation = validateTimeRange(newStartTime, newEndTime);
      if (!rangeValidation.isValid) {
        setError(rangeValidation.error || "時間範囲が無効です");
        return;
      }
    }

    try {
      setIsSavingSlot(true);
      setError("");
      const created = await createTimeSlotDef({
        project_id: projectId,
        slot_name: newSlotName.trim(),
        start_time: normalizeTime(newStartTime) || undefined,
        end_time: normalizeTime(newEndTime) || undefined,
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

    // バリデーション
    const slotNameValidation = validateTimeSlotName(editingSlotName.trim());
    if (!slotNameValidation.isValid) {
      setError(slotNameValidation.error || "時間枠名が無効です");
      return;
    }

    if (editingSlotStart && editingSlotEnd) {
      const rangeValidation = validateTimeRange(editingSlotStart, editingSlotEnd);
      if (!rangeValidation.isValid) {
        setError(rangeValidation.error || "時間範囲が無効です");
        return;
      }
    }

    try {
      setIsSavingSlot(true);
      setError("");
      const updated = await updateTimeSlotDef(editingSlotId, {
        project_id: projectId,
        slot_name: editingSlotName.trim(),
        start_time: normalizeTime(editingSlotStart) || undefined,
        end_time: normalizeTime(editingSlotEnd) || undefined,
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
              onClick={() => router.push(`/project.html?id=${projectId}`)}
              className="mb-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold flex items-center gap-2"
            >
              <span>←</span> プロジェクトに戻る
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">候補日時入力: {projectName}</h1>
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
                className={INPUT_DATE}
              />
              <button
                onClick={handleAddDate}
                disabled={!newDate || isSavingDate}
                className={BUTTON_PRIMARY}
              >
                追加
              </button>
            </div>

            <div className={SPACE_Y_3}>
              {candidateDates.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400">候補日がまだ登録されていません</p>
              )}
              {candidateDates.map((item) => (
                <div
                  key={item.id}
                  className={LIST_ITEM}
                >
                  <span className="text-gray-900 dark:text-gray-100 font-semibold">{item.target_date}</span>

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
                className={INPUT_BASE}
              />
              <div className={GRID_2COL}>
                <label className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                  開始時間
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className={INPUT_TIME}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                  終了時間
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className={INPUT_TIME}
                  />
                </label>
              </div>
              <button
                onClick={handleAddSlot}
                disabled={!newSlotName.trim() || isSavingSlot}
                className={BUTTON_PRIMARY}
              >
                追加
              </button>
            </div>

            <div className={SPACE_Y_3}>
              {timeSlots.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400">時間枠がまだ登録されていません</p>
              )}
              {timeSlots.map((item) => (
                <div
                  key={item.id}
                  className={LIST_ITEM}
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

      </main>
    </div>
  );
}

export default function ManagePage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <ManagePageContent />
    </Suspense>
  );
}

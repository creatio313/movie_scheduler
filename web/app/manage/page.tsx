"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { AdminHeader } from "@/app/components/AdminHeader";
import { Notification } from "@/app/components/Notification";
import {
  CandidateDate,
  TimeSlotDef,
  createCandidateDate,
  createTimeSlotDef,
  deleteCandidateDate,
  deleteTimeSlotDef,
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
function ManagePageContent() {
  //プロジェクトIDの取得
  const searchParams = useSearchParams();
  const projectId = useMemo(() => searchParams.get("projectId") || "", [searchParams]);

  //データベースから取得した候補日時
  const [candidateDates, setCandidateDates] = useState<CandidateDate[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotDef[]>([]);

  //新規追加用の状態管理
  const [newDate, setNewDate] = useState("");
  const [newSlotName, setNewSlotName] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");

  //編集用の状態管理
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
        setError("プロジェクトIDが指定されていません。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        const [dates, slots] = await Promise.all([
          listCandidateDates(projectId),
          listTimeSlotsDef(projectId),
        ]);
        setCandidateDates(dates);
        setTimeSlots(slots);
      } catch (err) {
        setError((err as Error).message || "候補日時データの読み込みに失敗しました。");
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
      setError(dateValidation.error || "候補日の形式が無効です。");
      return;
    }

    try {
      setIsSavingDate(true);
      setError("");
      const created = await createCandidateDate(projectId, {
        target_date: newDate,
      });
      setCandidateDates((prev) => [...prev, created]);
      setNewDate("");
    } catch (err) {
      setError((err as Error).message || "候補日の追加に失敗しました。");
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
      await deleteCandidateDate(projectId, id);
      setCandidateDates((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError((err as Error).message || "候補日の削除に失敗しました。");
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
      setError(slotNameValidation.error || "時間枠名が無効です。");
      return;
    }

    if (newStartTime && newEndTime) {
      const rangeValidation = validateTimeRange(newStartTime, newEndTime);
      if (!rangeValidation.isValid) {
        setError(rangeValidation.error || "時間範囲が無効です。");
        return;
      }
    }

    try {
      setIsSavingSlot(true);
      setError("");
      const created = await createTimeSlotDef(projectId, {
        slot_name: newSlotName.trim(),
        start_time: normalizeTime(newStartTime) || undefined,
        end_time: normalizeTime(newEndTime) || undefined,
      });
      setTimeSlots((prev) => [...prev, created]);
      setNewSlotName("");
      setNewStartTime("");
      setNewEndTime("");
    } catch (err) {
      setError((err as Error).message || "時間枠の追加に失敗しました。");
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
      setError(slotNameValidation.error || "時間枠名が無効です。");
      return;
    }

    if (editingSlotStart && editingSlotEnd) {
      const rangeValidation = validateTimeRange(editingSlotStart, editingSlotEnd);
      if (!rangeValidation.isValid) {
        setError(rangeValidation.error || "時間範囲が無効です。");
        return;
      }
    }

    try {
      setIsSavingSlot(true);
      setError("");
      const updated = await updateTimeSlotDef(projectId, editingSlotId, {
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
      setError((err as Error).message || "時間枠の更新に失敗しました。");
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
      await deleteTimeSlotDef(projectId, id);
      setTimeSlots((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError((err as Error).message || "時間枠の削除に失敗しました。");
    } finally {
      setIsSavingSlot(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <AdminHeader projectId={projectId} />
        <main>
          <p>読み込み中...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader projectId={projectId} />
      <main className="mx-auto w-full max-w-7xl">
        <Notification message={error} />
        <h1 className="sr-only">候補日時設定</h1>
        <div className="divide-y divide-gray-200 dark:divide-white/10">
          <section className="grid grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
            <div>
              <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">撮影候補日</h2>
              <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">
                撮影候補日を管理します。参加可否確認に使われます。
              </p>
            </div>
            <div className="md:col-span-2">
            <div className="mb-6 max-w-3xl">
              <label htmlFor="newDate">
                追加する候補日
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="newDate"
                  name="newDate"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  disabled={isSavingDate}
                  className="block min-w-0 flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-red-500 dark:[color-scheme:dark]"
                />
                <button
                  type="button"
                  onClick={handleAddDate}
                  disabled={!newDate || isSavingDate}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-xs hover:bg-red-500 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-red-500 dark:shadow-none dark:hover:bg-red-400 dark:focus-visible:outline-red-500"
                  aria-label="候補日を追加"
                >
                  <PlusIcon aria-hidden="true" className="size-5" />
                </button>
              </div>
            </div>

            <div className="flow-root max-w-3xl">
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">候補日</th>
                      <th scope="col" className="py-3.5 pr-4 pl-3 sm:pr-0">
                        <span className="sr-only">操作</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidateDates.length === 0 ? (
                      <tr>
                        <td colSpan={2}>
                          候補日がまだ登録されていません。
                        </td>
                      </tr>
                    ) : (
                      candidateDates.map((item) => (
                        <tr key={item.id}>
                          <td>{item.target_date}</td>
                          <td className="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                            <button
                              type="button"
                              onClick={() => handleDeleteDate(item.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                              aria-label={`${item.target_date}を削除`}
                            >
                              <TrashIcon aria-hidden="true" className="size-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
            <div>
              <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">撮影候補時間</h2>
              <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">
                1日の撮影時間枠を登録します。開始・終了時間は任意で設定できます。参加可否確認およびシーン撮影可能日時の設定に使われます。
              </p>
            </div>
            <div className="md:col-span-2">
            <div className="mb-6 sm:max-w-3xl">
              <label htmlFor="newSlotName">
                追加する時間枠
              </label>
              <div className="mt-2">
                <input
                  id="newSlotName"
                  name="newSlotName"
                  type="text"
                  value={newSlotName}
                  onChange={(e) => setNewSlotName(e.target.value)}
                  placeholder="時間枠名"
                  disabled={isSavingSlot}
                />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label>
                  開始時間
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    disabled={isSavingSlot}
                    className="mt-2 block min-w-0 flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-red-500 dark:[color-scheme:dark]"
                  />
                </label>
                <label>
                  終了時間
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    disabled={isSavingSlot}
                    className="mt-2 block min-w-0 flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-red-500 dark:[color-scheme:dark]"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleAddSlot}
                  disabled={!newSlotName.trim() || isSavingSlot}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-xs hover:bg-red-500 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-red-500 dark:shadow-none dark:hover:bg-red-400 dark:focus-visible:outline-red-500"
                  aria-label="時間枠を追加"
                >
                  <PlusIcon aria-hidden="true" className="size-5" />
                </button>
              </div>
            </div>

            <div className="flow-root max-w-3xl">
              <div className="overflow-x-auto">
                <table className="table-fixed">
                  <thead>
                    <tr>
                      <th scope="col">時間枠名</th>
                      <th scope="col">開始時間</th>
                      <th scope="col">終了時間</th>
                      <th scope="col" className="w-24 py-3.5 pr-0 pl-3 text-right">
                        <span className="sr-only">操作</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          時間枠がまだ登録されていません。
                        </td>
                      </tr>
                    ) : (
                      timeSlots.map((item) => (
                        <tr key={item.id}>
                          {editingSlotId === item.id ? (
                            <>
                              <td>
                                <input
                                  value={editingSlotName}
                                  onChange={(e) => setEditingSlotName(e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="time"
                                  value={editingSlotStart}
                                  onChange={(e) => setEditingSlotStart(e.target.value)}
                                  className="block min-w-0 flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-red-500 dark:[color-scheme:dark]"
                                  aria-label="開始時間"
                                />
                              </td>
                              <td>
                                <input
                                  type="time"
                                  value={editingSlotEnd}
                                  onChange={(e) => setEditingSlotEnd(e.target.value)}
                                  className="block min-w-0 flex-1 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-red-500 dark:[color-scheme:dark]"
                                  aria-label="終了時間"
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              <td>{item.slot_name}</td>
                              <td>{item.start_time || "--:--"}</td>
                              <td>{item.end_time || "--:--"}</td>
                            </>
                          )}
                          <td className="w-24 py-4 pr-0 pl-3 text-right text-sm font-medium whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              {editingSlotId === item.id ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={handleSaveSlot}
                                    disabled={isSavingSlot}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-green-600 hover:bg-green-50 disabled:opacity-50 dark:border-gray-600 dark:text-green-400 dark:hover:bg-green-900/20"
                                    aria-label="保存"
                                  >
                                    <CheckIcon aria-hidden="true" className="size-5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSlotId(null)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                    aria-label="キャンセル"
                                  >
                                    <XMarkIcon aria-hidden="true" className="size-5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleEditSlot(item)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                    aria-label={`${item.slot_name}を編集`}
                                  >
                                    <PencilSquareIcon aria-hidden="true" className="size-5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSlot(item.id)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                                    aria-label={`${item.slot_name}を削除`}
                                  >
                                    <TrashIcon aria-hidden="true" className="size-5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          </section>
        </div>

      </main>
    </>
  );
}

export default function ManagePage() {
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <ManagePageContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CandidateDate,
  Cast,
  CastAvailability,
  TimeSlotDef,
  createCast,
  createCastAvailability,
  deleteCast,
  getProject,
  listCandidateDates,
  listCastAvailabilities,
  listCasts,
  listTimeSlotsDef,
  updateCast,
  updateCastAvailability,
} from "@/lib/api";
import { validateCastName, validateCastRole } from "@/lib/validators";
import {
  FULLSCREEN_CENTERED_BG,
  INPUT_FULL_WIDTH,
  SPINNER,
  HELPER_TEXT,
  SPACE_Y_3,
} from "@/lib/tailwind-classes";

function CastSchedulePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = useMemo(() => searchParams.get("projectId") || "", [searchParams]);

  const [projectName, setProjectName] = useState("");
  const [casts, setCasts] = useState<Cast[]>([]);
  const [candidateDates, setCandidateDates] = useState<CandidateDate[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotDef[]>([]);
  const [selectedCastId, setSelectedCastId] = useState<number | null>(null);
  const [availabilities, setAvailabilities] = useState<CastAvailability[]>([]);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, CastAvailability>>({});
  const selectedCast = useMemo(
    () => casts.find((cast) => cast.id === selectedCastId) || null,
    [casts, selectedCastId]
  );

  const [newCastName, setNewCastName] = useState("");
  const [newCastRole, setNewCastRole] = useState("");
  const [editingCastId, setEditingCastId] = useState<number | null>(null);
  const [editingCastName, setEditingCastName] = useState("");
  const [editingCastRole, setEditingCastRole] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInitial = async () => {
      if (!projectId) {
        setError("プロジェクトIDが指定されていません");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        const [project, castList, dates, slots] = await Promise.all([
          getProject(projectId),
          listCasts(projectId),
          listCandidateDates(projectId),
          listTimeSlotsDef(projectId),
        ]);
        setProjectName(project.title || "");
        setCasts(castList);
        setCandidateDates(dates);
        setTimeSlots(slots);
      } catch (err) {
        setError((err as Error).message || "予定入力データの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitial();
  }, [projectId]);

  useEffect(() => {
    const fetchAvailabilities = async () => {
      if (!selectedCastId) {
        setAvailabilities([]);
        setAvailabilityMap({});
        return;
      }

      try {
        setError("");
        const list = await listCastAvailabilities(selectedCastId);
        setAvailabilities(list);
        const map: Record<string, CastAvailability> = {};
        list.forEach((item) => {
          map[`${item.candidate_date_id}-${item.time_slot_id}`] = item;
        });
        setAvailabilityMap(map);
      } catch (err) {
        setError((err as Error).message || "可用性の読み込みに失敗しました");
      }
    };

    fetchAvailabilities();
  }, [selectedCastId]);

  const handleAddCast = async () => {
    if (!projectId || !newCastName.trim()) {
      return;
    }

    // バリデーション
    const nameValidation = validateCastName(newCastName.trim());
    if (!nameValidation.isValid) {
      setError(nameValidation.error || "キャスト名が無効です");
      return;
    }

    if (newCastRole.trim()) {
      const roleValidation = validateCastRole(newCastRole.trim());
      if (!roleValidation.isValid) {
        setError(roleValidation.error || "役名が無効です");
        return;
      }
    }

    try {
      setIsSaving(true);
      setError("");
      const created = await createCast({
        project_id: projectId,
        name: newCastName.trim(),
        role_name: newCastRole.trim(),
      });
      setCasts((prev) => [...prev, created]);
      setNewCastName("");
      setNewCastRole("");
      if (created.id) {
        setSelectedCastId(created.id);
      }
    } catch (err) {
      setError((err as Error).message || "キャストの追加に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCast = (cast: Cast) => {
    setEditingCastId(cast.id || null);
    setEditingCastName(cast.name || "");
    setEditingCastRole(cast.role_name || "");
  };

  const handleSaveCast = async () => {
    if (!projectId || editingCastId === null || !editingCastName.trim()) {
      return;
    }

    // バリデーション
    const nameValidation = validateCastName(editingCastName.trim());
    if (!nameValidation.isValid) {
      setError(nameValidation.error || "キャスト名が無効です");
      return;
    }

    if (editingCastRole.trim()) {
      const roleValidation = validateCastRole(editingCastRole.trim());
      if (!roleValidation.isValid) {
        setError(roleValidation.error || "役名が無効です");
        return;
      }
    }

    try {
      setIsSaving(true);
      setError("");
      const updated = await updateCast(editingCastId, {
        project_id: projectId,
        name: editingCastName.trim(),
        role_name: editingCastRole.trim(),
      });
      setCasts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCastId(null);
      setEditingCastName("");
      setEditingCastRole("");
    } catch (err) {
      setError((err as Error).message || "キャストの更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCast = async (id?: number) => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm("このキャストを削除しますか？");
    if (!confirmed) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await deleteCast(id);
      setCasts((prev) => prev.filter((c) => c.id !== id));
      if (selectedCastId === id) {
        setSelectedCastId(null);
      }
    } catch (err) {
      setError((err as Error).message || "キャストの削除に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailability = async (dateId: number, slotId: number, checked: boolean) => {
    if (!selectedCastId) {
      return;
    }

    const key = `${dateId}-${slotId}`;
    const existing = availabilityMap[key];

    try {
      setIsSaving(true);
      setError("");
      if (existing?.id) {
        const updated = await updateCastAvailability(existing.id, {
          candidate_date_id: dateId,
          time_slot_id: slotId,
          cast_id: selectedCastId,
          is_available: checked ? 1 : 0,
        });
        setAvailabilities((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setAvailabilityMap((prev) => ({ ...prev, [key]: updated }));
      } else if (checked) {
        const created = await createCastAvailability({
          candidate_date_id: dateId,
          time_slot_id: slotId,
          cast_id: selectedCastId,
          is_available: 1,
        });
        setAvailabilities((prev) => [...prev, created]);
        setAvailabilityMap((prev) => ({ ...prev, [key]: created }));
      }
    } catch (err) {
      setError((err as Error).message || "可用性の更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-slate-50 to-sky-50 dark:from-black dark:via-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border border-blue-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-sky-50 dark:from-black dark:via-slate-950 dark:to-slate-900">
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">予定入力: {projectName}</h1>
            <p className="text-gray-600 dark:text-gray-400">候補日と時間枠に対して出演可能な日時を登録します</p>
          </div>
          <div className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-semibold shadow-lg">
            Cast Scheduler
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <section className="rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">キャスト一覧</h2>

            <div className="space-y-3 mb-6">
              <input
                type="text"
                value={newCastName}
                onChange={(e) => setNewCastName(e.target.value)}
                placeholder="氏名"
                className={INPUT_FULL_WIDTH}
              />
              <input
                type="text"
                value={newCastRole}
                onChange={(e) => setNewCastRole(e.target.value)}
                placeholder="役名"
                className={INPUT_FULL_WIDTH}
              />
              <button
                onClick={handleAddCast}
                disabled={!newCastName.trim() || isSaving}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                キャストを追加
              </button>
            </div>

            <div className={SPACE_Y_3}>
              {casts.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400">キャストがまだ登録されていません</p>
              )}
              {casts.map((cast) => (
                <div
                  key={cast.id}
                  onClick={() => cast.id && setSelectedCastId(cast.id)}
                  className={`rounded-xl border px-4 py-3 transition cursor-pointer ${
                    selectedCastId === cast.id
                      ? "border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {editingCastId === cast.id ? (
                    <div className={SPACE_Y_3}>
                      <input
                        value={editingCastName}
                        onChange={(e) => setEditingCastName(e.target.value)}
                        className={INPUT_FULL_WIDTH}
                      />
                      <input
                        value={editingCastRole}
                        onChange={(e) => setEditingCastRole(e.target.value)}
                        className={INPUT_FULL_WIDTH}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveCast();
                          }}
                          disabled={isSaving}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-green-600 hover:bg-green-50 disabled:opacity-50 dark:border-gray-600 dark:text-green-400 dark:hover:bg-green-900/20"
                          aria-label="保存"
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCastId(null);
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          aria-label="キャンセル"
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l12 12M18 6l-12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <div className="text-gray-900 dark:text-gray-100 font-semibold">{cast.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{cast.role_name || "役名なし"}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCast(cast);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          aria-label="編集"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCast(cast.id);
                          }}
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
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">出演可能日時</h2>
              {selectedCast && (
                <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white dark:bg-gray-100 dark:text-gray-900">
                  {selectedCast.role_name || "役名なし"}
                </span>
              )}
            </div>

            {candidateDates.length === 0 || timeSlots.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                候補日または時間枠が未設定です。制作者ページで先に登録してください。
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-white dark:bg-gray-800 text-left px-4 py-3 text-gray-600 dark:text-gray-300">
                        候補日
                      </th>
                      {timeSlots.map((slot) => (
                        <th
                          key={slot.id}
                          className="px-4 py-3 text-center text-gray-600 dark:text-gray-300 font-semibold"
                        >
                          <div className="text-gray-900 dark:text-gray-100">{slot.slot_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {(slot.start_time || "--:--") + " - " + (slot.end_time || "--:--")}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {candidateDates.map((date) => (
                      <tr key={date.id} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="sticky left-0 bg-white dark:bg-gray-800 px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          {date.target_date}
                        </td>
                        {timeSlots.map((slot) => {
                          const key = `${date.id}-${slot.id}`;
                          const availability = availabilityMap[key];
                          const checked = availability?.is_available === 1;
                          return (
                            <td key={slot.id} className="px-4 py-3 text-center">
                              <label className="inline-flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={!selectedCastId || isSaving}
                                  onChange={(e) => handleToggleAvailability(date.id || 0, slot.id || 0, e.target.checked)}
                                  className="h-5 w-5 accent-blue-600"
                                />
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function CastSchedulePage() {
  return (
    <Suspense fallback={<div className={FULLSCREEN_CENTERED_BG}><div className="text-center"><div className={`${SPINNER} mx-auto mb-4`}></div><p className={HELPER_TEXT}>読み込み中...</p></div></div>}>
      <CastSchedulePageContent />
    </Suspense>
  );
}

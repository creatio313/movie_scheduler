"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, PencilSquareIcon, TrashIcon, UserPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CheckIcon as SelectedIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { AdminHeader } from "@/app/components/AdminHeader";
import { Notification } from "@/app/components/Notification";
import {
  CandidateDate,
  Cast,
  CastAvailability,
  TimeSlotDef,
  createCast,
  createCastAvailability,
  deleteCast,
  listCandidateDates,
  listCastAvailabilities,
  listCasts,
  listTimeSlotsDef,
  updateCast,
  updateCastAvailability,
} from "@/lib/api";
import { validateCastName, validateCastRole } from "@/lib/validators";

function CastSchedulePageContent() {
  // プロジェクトIDを取得
  const searchParams = useSearchParams();
  const projectId = useMemo(() => searchParams.get("projectId") || "", [searchParams]);

  // DBから取得するデータの状態を管理
  const [casts, setCasts] = useState<Cast[]>([]);
  const [candidateDates, setCandidateDates] = useState<CandidateDate[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotDef[]>([]);
  const [selectedCastId, setSelectedCastId] = useState<number | null>(null);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, CastAvailability>>({});

  // 選択中のキャスト
  const selectedCast = useMemo(
    () => casts.find((cast) => cast.id === selectedCastId) || null,
    [casts, selectedCastId]
  );

  // 新規キャスト追加
  const [newCastName, setNewCastName] = useState("");
  const [newCastRole, setNewCastRole] = useState("");

  // キャスト追加・編集用の状態管理
  const [isCastDialogOpen, setIsCastDialogOpen] = useState(false);
  const [editingCastId, setEditingCastId] = useState<number | null>(null);
  const [editingCastName, setEditingCastName] = useState("");
  const [editingCastRole, setEditingCastRole] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInitial = async () => {
      if (!projectId) {
        setError("プロジェクトIDが指定されていません。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        const [castList, dates, slots] = await Promise.all([
          listCasts(projectId),
          listCandidateDates(projectId),
          listTimeSlotsDef(projectId),
        ]);
        setCasts(castList);
        setCandidateDates(dates);
        setTimeSlots(slots);
      } catch (err) {
        setError((err as Error).message || "予定入力データの読み込みに失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitial();
  }, [projectId]);

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchAvailabilities = async () => {
      if (!selectedCastId) {
        setAvailabilityMap({});
        return;
      }

      try {
        setError("");
        setAvailabilityMap({});
        const list = await listCastAvailabilities(projectId, selectedCastId);
        if (!isCurrentRequest) {
          return;
        }

        const map: Record<string, CastAvailability> = {};
        list.forEach((item) => {
          map[`${item.candidate_date_id}-${item.time_slot_id}`] = item;
        });
        setAvailabilityMap(map);
      } catch (err) {
        if (!isCurrentRequest) {
          return;
        }
        setError((err as Error).message || "参加可否の読み込みに失敗しました。");
      }
    };

    fetchAvailabilities();
    return () => {
      isCurrentRequest = false;
    };
  }, [projectId, selectedCastId]);

  const handleAddCast = async () => {
    if (!projectId || !newCastName.trim()) {
      return;
    }

    // バリデーション
    const nameValidation = validateCastName(newCastName.trim());
    if (!nameValidation.isValid) {
      setError(nameValidation.error || "役者名が無効です。");
      return;
    }

    const roleValidation = validateCastRole(newCastRole.trim());
    if (!roleValidation.isValid) {
      setError(roleValidation.error || "役名が無効です。");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const created = await createCast(projectId, {
        name: newCastName.trim(),
        role_name: newCastRole.trim(),
      });
      setCasts((prev) => [...prev, created]);
      setNewCastName("");
      setNewCastRole("");
      setIsCastDialogOpen(false);
      if (created.id) {
        setSelectedCastId(created.id);
      }
    } catch (err) {
      setError((err as Error).message || "キャストの追加に失敗しました。");
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
      setError(nameValidation.error || "役者名が無効です。");
      return;
    }

    const roleValidation = validateCastRole(editingCastRole.trim());
    if (!roleValidation.isValid) {
      setError(roleValidation.error || "役名が無効です。");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const updated = await updateCast(projectId, editingCastId, {
        name: editingCastName.trim(),
        role_name: editingCastRole.trim(),
      });
      setCasts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCastId(null);
      setEditingCastName("");
      setEditingCastRole("");
      setIsCastDialogOpen(false);
    } catch (err) {
      setError((err as Error).message || "キャストの更新に失敗しました。");
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
      await deleteCast(projectId, id);
      setCasts((prev) => prev.filter((c) => c.id !== id));
      if (selectedCastId === id) {
        setSelectedCastId(null);
      }
    } catch (err) {
      setError((err as Error).message || "キャストの削除に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const openAddCastDialog = () => {
    setEditingCastId(null);
    setNewCastName("");
    setNewCastRole("");
    setIsCastDialogOpen(true);
  };

  const openEditCastDialog = (cast: Cast) => {
    handleEditCast(cast);
    setIsCastDialogOpen(true);
  };

  const closeCastDialog = () => {
    if (isSaving) {
      return;
    }
    setIsCastDialogOpen(false);
    setEditingCastId(null);
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
        const updated = await updateCastAvailability(projectId, {
          candidate_date_id: dateId,
          time_slot_id: slotId,
          cast_id: selectedCastId,
          is_available: checked ? 1 : 0,
        });
        setAvailabilityMap((prev) => ({ ...prev, [key]: updated }));
      } else if (checked) {
        const created = await createCastAvailability(projectId, {
          candidate_date_id: dateId,
          time_slot_id: slotId,
          cast_id: selectedCastId,
          is_available: 1,
        });
        setAvailabilityMap((prev) => ({ ...prev, [key]: created }));
      }
    } catch (err) {
      setError((err as Error).message || "参加可否の更新に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAllAvailabilities = async () => {
    if (!selectedCastId) {
      return;
    }

    const unavailableSlots = candidateDates.flatMap((date) =>
      timeSlots
        .filter((slot) => !availabilityMap[`${date.id}-${slot.id}`]?.is_available)
        .map((slot) => ({
          dateId: date.id,
          slotId: slot.id,
          availability: availabilityMap[`${date.id}-${slot.id}`],
        }))
    );

    if (unavailableSlots.length === 0) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const created = await Promise.all(
        unavailableSlots.map(({ dateId, slotId, availability }) => {
          const data = {
            candidate_date_id: dateId || 0,
            time_slot_id: slotId || 0,
            cast_id: selectedCastId,
            is_available: 1 as const,
          };
          return availability?.id
            ? updateCastAvailability(projectId, data)
            : createCastAvailability(projectId, data);
        })
      );
      setAvailabilityMap((prev) => ({
        ...prev,
        ...Object.fromEntries(created.map((item) => [`${item.candidate_date_id}-${item.time_slot_id}`, item])),
      }));
    } catch (err) {
      setError((err as Error).message || "出演可能日時の全選択に失敗しました。");
    } finally {
      setIsSaving(false);
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
        <h1 className="sr-only">キャスト設定</h1>
        <section className="grid grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">キャスト</h2>
              <button type="button" onClick={openAddCastDialog} disabled={isSaving} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-xs hover:bg-red-500 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-red-500 dark:hover:bg-red-400" aria-label="キャストを追加">
                <UserPlusIcon aria-hidden="true" className="size-5" />
              </button>
            </div>
            <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">キャストを選択して出演可能日時を設定します。</p>
            {casts.length === 0 ? <p className="mt-6 py-5 text-sm text-gray-500 dark:text-gray-400 md:hidden">キャストがまだ登録されていません。</p> : (
              <div className="mt-6 md:hidden">
                <Listbox value={selectedCastId} onChange={setSelectedCastId}>
                  <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-md bg-white py-2 pr-2 pl-3 text-left text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus-visible:outline-red-500">
                    <span className="col-start-1 row-start-1 flex min-w-0 flex-col pr-7">
                      <span className="truncate text-sm font-semibold">{selectedCast?.name || "キャストを選択"}</span>
                      {selectedCast && <span className="truncate text-xs text-gray-500 dark:text-gray-400">{selectedCast.role_name || "役名なし"}</span>}
                    </span>
                    <ChevronUpDownIcon aria-hidden="true" className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 dark:text-gray-400" />
                  </ListboxButton>
                  <ListboxOptions transition anchor="bottom" className="z-20 mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline-1 outline-black/5 transition duration-100 ease-in data-closed:opacity-0 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
                    {casts.map((cast) => (
                      <ListboxOption key={cast.id} value={cast.id} className="group relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none data-focus:bg-red-600 data-focus:text-white dark:text-white dark:data-focus:bg-red-500">
                        <span className="block truncate text-sm font-normal group-data-selected:font-semibold">{cast.name}</span>
                        <span className="block truncate text-xs text-gray-500 group-data-focus:text-red-100 dark:text-gray-400 dark:group-data-focus:text-red-100">{cast.role_name || "役名なし"}</span>
                        <span className="absolute inset-y-0 right-0 hidden items-center pr-3 text-red-600 group-data-selected:flex group-data-focus:text-white dark:text-red-400">
                          <SelectedIcon aria-hidden="true" className="size-5" />
                        </span>
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Listbox>
                {selectedCast && <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => openEditCastDialog(selectedCast)} disabled={isSaving} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" aria-label={`${selectedCast.name}を編集`}><PencilSquareIcon aria-hidden="true" className="size-5" /></button>
                  <button type="button" onClick={() => handleDeleteCast(selectedCast.id)} disabled={isSaving} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20" aria-label={`${selectedCast.name}を削除`}><TrashIcon aria-hidden="true" className="size-5" /></button>
                </div>}
              </div>
            )}
            <ul role="list" className="mt-6 hidden divide-y divide-gray-100 md:block dark:divide-white/5">
              {casts.length === 0 ? <li className="py-5">キャストがまだ登録されていません。</li> : casts.map((cast) => (
                <li
                  key={cast.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedCastId === cast.id}
                  onClick={() => cast.id && setSelectedCastId(cast.id)}
                  onKeyDown={(event) => {
                    if ((event.key === "Enter" || event.key === " ") && cast.id) {
                      event.preventDefault();
                      setSelectedCastId(cast.id);
                    }
                  }}
                  className={`flex cursor-pointer items-center gap-x-4 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${selectedCastId === cast.id ? "bg-red-50/70 dark:bg-red-950/20" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm/6 font-semibold text-gray-900 dark:text-white">{cast.name}</p>
                    <p className="mt-1 truncate text-xs/5 text-gray-500 dark:text-gray-400">{cast.role_name || "役名なし"}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={(event) => { event.stopPropagation(); openEditCastDialog(cast); }} disabled={isSaving} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" aria-label={`${cast.name}を編集`}><PencilSquareIcon aria-hidden="true" className="size-5" /></button>
                    <button type="button" onClick={(event) => { event.stopPropagation(); handleDeleteCast(cast.id); }} disabled={isSaving} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20" aria-label={`${cast.name}を削除`}><TrashIcon aria-hidden="true" className="size-5" /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">出演可能日時</h2>
              <button type="button" onClick={handleSelectAllAvailabilities} disabled={!selectedCastId || isSaving || candidateDates.length === 0 || timeSlots.length === 0} className="shrink-0 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-red-500 dark:hover:bg-red-400" aria-label="出演可能日時を全選択">
                全選択
              </button>
            </div>
            <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">{selectedCast ? `${selectedCast.name}（${selectedCast.role_name || "役名なし"}）の出演可能日時を選択します。` : "キャストを選択してください。"}</p>
            {candidateDates.length === 0 || timeSlots.length === 0 ? <p className="mt-6 text-sm/6 text-gray-500 dark:text-gray-400">候補日または時間枠が未設定です。候補日時設定で先に登録してください。</p> : (
              <div className="mt-6 flow-root">
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">候補日</th>
                        {timeSlots.map((slot) => <th key={slot.id} scope="col" className="text-center">
                          <span className="block">{slot.slot_name}</span>
                          <span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">
                            {slot.start_time || "--:--"} - {slot.end_time || "--:--"}
                          </span>
                        </th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {candidateDates.map((date) => 
                      <tr key={date.id}>
                        <td>{date.target_date}</td>
                        {timeSlots.map((slot) => { const availability = availabilityMap[`${date.id}-${slot.id}`]; return <td key={slot.id} className="!p-0 text-center">
                          <label className="group !grid place-items-center">
                            <input type="checkbox" checked={availability?.is_available === 1} disabled={!selectedCastId || isSaving} onChange={(event) => handleToggleAvailability(date.id || 0, slot.id || 0, event.target.checked)} className="col-start-1 row-start-1 !size-5 shrink-0 appearance-none !rounded-full border border-gray-300 bg-white !p-0 checked:border-red-600 checked:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:checked:border-red-500 dark:checked:bg-red-500 dark:focus-visible:outline-red-500 dark:disabled:border-white/5 dark:disabled:bg-white/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto" aria-label={`${date.target_date} ${slot.slot_name}に出演可能`} />
                            <svg fill="none" viewBox="0 0 14 14" className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25 dark:group-has-disabled:stroke-white/25" aria-hidden="true">
                              <path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-has-checked:opacity-100" />
                              <path d="M3 7H11" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-has-indeterminate:opacity-100" />
                            </svg>
                          </label>
                        </td>; })}
                      </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Dialog open={isCastDialogOpen} onClose={closeCastDialog} className="relative z-10">
        <DialogBackdrop transition className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in dark:bg-gray-900/50" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
            <DialogPanel transition className="relative w-full max-w-sm transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 sm:my-8 data-closed:sm:translate-y-0 data-closed:sm:scale-95 dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10">
              <div className="flex items-start justify-between gap-4">
                <DialogTitle as="h3" className="text-base font-semibold text-gray-900 dark:text-white">{editingCastId === null ? "キャストを追加" : "キャストを編集"}</DialogTitle>
                <button type="button" onClick={closeCastDialog} disabled={isSaving} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700" aria-label="閉じる">
                  <XMarkIcon aria-hidden="true" className="size-5" />
                </button>
              </div>
              <div className="mt-5 space-y-4">
                <label>役者名
                  <input type="text" value={editingCastId === null ? newCastName : editingCastName} onChange={(event) => editingCastId === null ? setNewCastName(event.target.value) : setEditingCastName(event.target.value)} disabled={isSaving} className="mt-2" /></label><label>役名<input type="text" value={editingCastId === null ? newCastRole : editingCastRole} onChange={(event) => editingCastId === null ? setNewCastRole(event.target.value) : setEditingCastRole(event.target.value)} disabled={isSaving} className="mt-2" />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={editingCastId === null ? handleAddCast : handleSaveCast} disabled={isSaving || !(editingCastId === null ? newCastName : editingCastName).trim() || !(editingCastId === null ? newCastRole : editingCastRole).trim()} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-green-600 hover:bg-green-50 disabled:opacity-50 dark:border-gray-600 dark:text-green-400 dark:hover:bg-green-900/20" aria-label="保存">
                  <CheckIcon aria-hidden="true" className="size-5" />
                </button>
                <button type="button" onClick={closeCastDialog} disabled={isSaving} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" aria-label="キャンセル">
                  <XMarkIcon aria-hidden="true" className="size-5" />
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default function CastSchedulePage() {
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <CastSchedulePageContent />
    </Suspense>
  );
}

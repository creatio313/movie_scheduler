// API ベースURL（環境変数から取得、デフォルトはlocalhost:8080）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export interface Project {
  id?: string;
  title: string;
  description?: string;
}

export interface Cast {
  id?: number;
  project_id: string;
  name: string;
  role_name: string;
  created_at?: string;
}

export interface CandidateDate {
  id?: number;
  project_id: string;
  target_date: string;
}

export interface TimeSlotDef {
  id?: number;
  project_id: string;
  slot_name: string;
  start_time?: string;
  end_time?: string;
}

export interface CastAvailability {
  id?: number;
  candidate_date_id: number;
  time_slot_id: number;
  cast_id: number;
  is_available: number;
}

export interface Scene {
  id?: number;
  project_id: string;
  scene_name: string;
  description?: string;
}

export interface SceneRequiredCast {
  id?: number;
  scene_id: number;
  cast_id: number;
}

export interface SceneAllowedTimeSlot {
  id?: number;
  scene_id: number;
  time_slot_id: number;
}

export interface SceneAvailabilityRow {
  scene_id: number;
  scene_name: string;
  target_date: string;
  time_slot_id: number;
  slot_name: string;
  start_time?: string;
  end_time?: string;
}

/**
 * プロジェクトを作成します
 */
export async function createProject(data: Project): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create project: ${response.statusText}`);
  }

  return response.json();
}

/**
 * プロジェクト ID からプロジェクト詳細を取得します
 */
export async function getProject(id: string): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch project: ${response.statusText}`);
  }

  return response.json();
}

/**
 * プロジェクトを更新します
 */
export async function updateProject(id: string, data: Project): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update project: ${response.statusText}`);
  }

  return response.json();
}

/**
 * プロジェクトを削除します
 */
export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete project: ${response.statusText}`);
  }
}

/**
 * プロジェクトのキャスト一覧を取得します
 */
export async function listCasts(projectId: string): Promise<Cast[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/casts`);

  if (!response.ok) {
    throw new Error(`Failed to fetch casts: ${response.statusText}`);
  }

  return response.json();
}

/**
 * キャストを作成します
 */
export async function createCast(data: Cast): Promise<Cast> {
  const response = await fetch(`${API_BASE_URL}/api/casts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create cast: ${response.statusText}`);
  }

  return response.json();
}

/**
 * キャストを更新します
 */
export async function updateCast(id: number, data: Cast): Promise<Cast> {
  const response = await fetch(`${API_BASE_URL}/api/casts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update cast: ${response.statusText}`);
  }

  return response.json();
}

/**
 * キャストを削除します
 */
export async function deleteCast(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/casts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete cast: ${response.statusText}`);
  }
}

/**
 * プロジェクトのシーン一覧を取得します
 */
export async function listScenes(projectId: string): Promise<Scene[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/scenes`);

  if (!response.ok) {
    throw new Error(`Failed to fetch scenes: ${response.statusText}`);
  }

  return response.json();
}

/**
 * シーンを作成します
 */
export async function createScene(data: Scene): Promise<Scene> {
  const response = await fetch(`${API_BASE_URL}/api/scenes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create scene: ${response.statusText}`);
  }

  return response.json();
}

/**
 * シーンを更新します
 */
export async function updateScene(id: number, data: Scene): Promise<Scene> {
  const response = await fetch(`${API_BASE_URL}/api/scenes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update scene: ${response.statusText}`);
  }

  return response.json();
}

/**
 * シーンを削除します
 */
export async function deleteScene(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/scenes/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete scene: ${response.statusText}`);
  }
}

/**
 * プロジェクト内のシーン撮影可能日時を取得します
 */
export async function listSceneAvailabilities(projectId: string): Promise<SceneAvailabilityRow[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/scene_availabilities`);

  if (!response.ok) {
    throw new Error(`Failed to fetch scene availabilities: ${response.statusText}`);
  }

  return response.json();
}

/**
 * シーンに必要な役者一覧を取得します
 */
export async function listSceneRequiredCasts(sceneId: number): Promise<SceneRequiredCast[]> {
  const response = await fetch(`${API_BASE_URL}/api/scenes/${sceneId}/scene_required_casts`);

  if (!response.ok) {
    throw new Error(`Failed to fetch scene required casts: ${response.statusText}`);
  }

  return response.json();
}

/**
 * シーンに必要な役者を追加します
 */
export async function createSceneRequiredCast(data: SceneRequiredCast): Promise<SceneRequiredCast> {
  const response = await fetch(`${API_BASE_URL}/api/scene_required_casts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create scene required cast: ${response.statusText}`);
  }

  return response.json();
}

/**
 * シーンに必要な役者を削除します
 */
export async function deleteSceneRequiredCast(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/scene_required_casts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete scene required cast: ${response.statusText}`);
  }
}

/**
 * シーンで撮影可能な時間枠一覧を取得します
 */
export async function listSceneAllowedTimeSlots(sceneId: number): Promise<SceneAllowedTimeSlot[]> {
  const response = await fetch(`${API_BASE_URL}/api/scenes/${sceneId}/scene_allowed_time_slots`);

  if (!response.ok) {
    throw new Error(`Failed to fetch scene allowed time slots: ${response.statusText}`);
  }

  return response.json();
}

/**
 * シーンで撮影可能な時間枠を追加します
 */
export async function createSceneAllowedTimeSlot(data: SceneAllowedTimeSlot): Promise<SceneAllowedTimeSlot> {
  const response = await fetch(`${API_BASE_URL}/api/scene_allowed_time_slots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create scene allowed time slot: ${response.statusText}`);
  }

  return response.json();
}

/**
 * シーンで撮影可能な時間枠を削除します
 */
export async function deleteSceneAllowedTimeSlot(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/scene_allowed_time_slots/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete scene allowed time slot: ${response.statusText}`);
  }
}

/**
 * プロジェクトの候補日一覧を取得します
 */
export async function listCandidateDates(projectId: string): Promise<CandidateDate[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/candidate_dates`);

  if (!response.ok) {
    throw new Error(`Failed to fetch candidate dates: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 候補日を作成します
 */
export async function createCandidateDate(data: CandidateDate): Promise<CandidateDate> {
  const response = await fetch(`${API_BASE_URL}/api/candidate_dates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create candidate date: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 候補日を更新します
 */
export async function updateCandidateDate(id: number, data: CandidateDate): Promise<CandidateDate> {
  const response = await fetch(`${API_BASE_URL}/api/candidate_dates/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update candidate date: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 候補日を削除します
 */
export async function deleteCandidateDate(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/candidate_dates/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete candidate date: ${response.statusText}`);
  }
}

/**
 * キャストの可用性一覧を取得します
 */
export async function listCastAvailabilities(castId: number): Promise<CastAvailability[]> {
  const response = await fetch(`${API_BASE_URL}/api/casts/${castId}/cast_availabilities`);

  if (!response.ok) {
    throw new Error(`Failed to fetch cast availabilities: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 可用性を作成します
 */
export async function createCastAvailability(data: CastAvailability): Promise<CastAvailability> {
  const response = await fetch(`${API_BASE_URL}/api/cast_availabilities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create cast availability: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 可用性を更新します
 */
export async function updateCastAvailability(id: number, data: CastAvailability): Promise<CastAvailability> {
  const response = await fetch(`${API_BASE_URL}/api/cast_availabilities/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update cast availability: ${response.statusText}`);
  }

  return response.json();
}

/**
 * プロジェクトの時間枠一覧を取得します
 */
export async function listTimeSlotsDef(projectId: string): Promise<TimeSlotDef[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/time_slots_def`);

  if (!response.ok) {
    throw new Error(`Failed to fetch time slots: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 時間枠を作成します
 */
export async function createTimeSlotDef(data: TimeSlotDef): Promise<TimeSlotDef> {
  const response = await fetch(`${API_BASE_URL}/api/time_slots_def`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create time slot: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 時間枠を更新します
 */
export async function updateTimeSlotDef(id: number, data: TimeSlotDef): Promise<TimeSlotDef> {
  const response = await fetch(`${API_BASE_URL}/api/time_slots_def/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update time slot: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 時間枠を削除します
 */
export async function deleteTimeSlotDef(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/time_slots_def/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete time slot: ${response.statusText}`);
  }
}

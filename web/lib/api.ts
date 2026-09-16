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

export interface Scene {
  id?: number;
  project_id: string;
  scene_name: string;
  description?: string;
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

export interface SceneAllowedTimeSlot {
  id?: number;
  scene_id: number;
  time_slot_id: number;
}

export interface SceneRequiredCast {
  id?: number;
  scene_id: number;
  cast_id: number;
}

export interface CastAvailability {
  id?: number;
  candidate_date_id: number;
  time_slot_id: number;
  cast_id: number;
  is_available: number;
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

export interface ProjectHomeScene {
  scene: Scene;
  required_casts: Cast[];
  availabilities: SceneAvailabilityRow[];
}

export interface ProjectHome {
  project: Project;
  scenes: ProjectHomeScene[];
}

type ProjectInput = Pick<Project, "title" | "description">;
type CastInput = Pick<Cast, "name" | "role_name">;
type SceneInput = Pick<Scene, "scene_name" | "description">;
type CandidateDateInput = Pick<CandidateDate, "target_date">;
type TimeSlotDefInput = Pick<TimeSlotDef, "slot_name" | "start_time" | "end_time">;
type CastAvailabilityInput = Pick<CastAvailability, "candidate_date_id" | "time_slot_id" | "cast_id" | "is_available">;

async function throwApiError(response: Response, message: string): Promise<never> {
  const detail = (await response.text()).trim();
  throw new Error(detail || message);
}

/**
 * プロジェクトを作成します
 */
export async function createProject(data: ProjectInput): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response, "プロジェクト作成に失敗しました。");
  }

  return response.json();
}

/**
 * プロジェクト ID からプロジェクト詳細を取得します
 */
export async function getProject(id: string): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`);

  if (!response.ok) {
    return throwApiError(response, "プロジェクト取得に失敗しました。");
  }

  return response.json();
}

/**
 * プロジェクトホーム画面に必要な情報を取得します
 */
export async function getProjectHome(id: string): Promise<ProjectHome> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}/home`);

  if (!response.ok) {
    return throwApiError(response, "プロジェクトホーム取得に失敗しました。");
  }

  return response.json();
}

/**
 * プロジェクトを更新します
 */
export async function updateProject(id: string, data: ProjectInput): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response, "プロジェクト更新に失敗しました。");
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
    return throwApiError(response, "プロジェクト削除に失敗しました。");
  }
}

/**
 * プロジェクトのキャスト一覧を取得します
 */
export async function listCasts(projectId: string): Promise<Cast[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/casts`);

  if (!response.ok) {
    return throwApiError(response, "キャスト一覧取得に失敗しました。");
  }

  return response.json();
}

/**
 * キャストを作成します
 */
export async function createCast(projectId: string, data: CastInput): Promise<Cast> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/casts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response, "キャスト作成に失敗しました。");
  }

  return response.json();
}

/**
 * キャストを更新します
 */
export async function updateCast(projectId: string, id: number, data: CastInput): Promise<Cast> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/casts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response, "キャスト更新に失敗しました。");
  }

  return response.json();
}

/**
 * キャストを削除します
 */
export async function deleteCast(projectId: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/casts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    return throwApiError(response, "キャスト削除に失敗しました。");
  }
}

/**
 * プロジェクトのシーン一覧を取得します
 */
export async function listScenes(projectId: string): Promise<Scene[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/scenes`);

  if (!response.ok) {
    return throwApiError(response, "シーン一覧の取得に失敗しました。");
  }

  return response.json();
}

/**
 * シーンを作成します
 */
export async function createScene(projectId: string, data: SceneInput): Promise<Scene> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/scenes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response, "シーン作成に失敗しました。");
  }

  return response.json();
}

/**
 * シーンを更新します
 */
export async function updateScene(projectId: string, id: number, data: SceneInput): Promise<Scene> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/scenes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response, "シーン更新に失敗しました。");
  }

  return response.json();
}

/**
 * シーンを削除します
 */
export async function deleteScene(projectId: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/scenes/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    return throwApiError(response, "シーン削除に失敗しました。");
  }
}

/**
 * プロジェクトの候補日一覧を取得します
 */
export async function listCandidateDates(projectId: string): Promise<CandidateDate[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/candidate-dates`);

  if (!response.ok) {
    return throwApiError(response, "候補日一覧の取得に失敗しました。");
  }

  return response.json();
}

/**
 * 候補日を作成します
 */
export async function createCandidateDate(projectId: string, data: CandidateDateInput): Promise<CandidateDate> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/candidate-dates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response, "候補日作成に失敗しました。");
  }

  return response.json();
}

/**
 * 候補日を削除します
 */
export async function deleteCandidateDate(projectId: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/candidate-dates/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    return throwApiError(response, "候補日削除に失敗しました。");
  }
}

/**
 * プロジェクトの時間枠一覧を取得します
 */
export async function listTimeSlotsDef(projectId: string): Promise<TimeSlotDef[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/time-slots`);

  if (!response.ok) {
    return throwApiError(response, "時間枠一覧の取得に失敗しました。");
  }

  return response.json();
}

/**
 * 時間枠を作成します
 */
export async function createTimeSlotDef(projectId: string, data: TimeSlotDefInput): Promise<TimeSlotDef> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/time-slots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response, "時間枠作成に失敗しました。");
  }

  return response.json();
}

/**
 * 時間枠を更新します
 */
export async function updateTimeSlotDef(projectId: string, id: number, data: TimeSlotDefInput): Promise<TimeSlotDef> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/time-slots/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response, "時間枠更新に失敗しました。");
  }

  return response.json();
}

/**
 * 時間枠を削除します
 */
export async function deleteTimeSlotDef(projectId: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/time-slots/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    return throwApiError(response, "時間枠削除に失敗しました。");
  }
}

/**
 * シーンで撮影可能な時間枠一覧を取得します
 */
export async function listSceneAllowedTimeSlots(projectId: string, sceneId: number): Promise<SceneAllowedTimeSlot[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/scenes/${sceneId}/allowed-time-slots`);

  if (!response.ok) {
    return throwApiError(response, "シーン許可時間枠一覧の取得に失敗しました。");
  }

  return response.json();
}

/**
 * シーンで撮影可能な時間枠を追加します
 */
export async function createSceneAllowedTimeSlot(projectId: string, sceneId: number, timeSlotId: number): Promise<SceneAllowedTimeSlot> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/scenes/${sceneId}/allowed-time-slots/${timeSlotId}`, {
    method: "PUT",
  });

  if (!response.ok) {
    return throwApiError(response, "シーン許可時間枠作成に失敗しました。");
  }

  return response.json();
}

/**
 * シーンで撮影可能な時間枠を削除します
 */
export async function deleteSceneAllowedTimeSlot(projectId: string, sceneId: number, timeSlotId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/scenes/${sceneId}/allowed-time-slots/${timeSlotId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    return throwApiError(response, "シーン許可時間枠削除に失敗しました。");
  }
}

/**
 * シーンに必要な役者一覧を取得します
 */
export async function listSceneRequiredCasts(projectId: string, sceneId: number): Promise<SceneRequiredCast[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/scenes/${sceneId}/required-casts`);

  if (!response.ok) {
    return throwApiError(response, "シーン必要キャスト一覧の取得に失敗しました。");
  }

  return response.json();
}

/**
 * シーンに必要な役者を追加します
 */
export async function createSceneRequiredCast(projectId: string, sceneId: number, castId: number): Promise<SceneRequiredCast> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/scenes/${sceneId}/required-casts/${castId}`, {
    method: "PUT",
  });

  if (!response.ok) {
    return throwApiError(response, "シーン必要キャスト作成に失敗しました。");
  }

  return response.json();
}

/**
 * シーンに必要な役者を削除します
 */
export async function deleteSceneRequiredCast(projectId: string, sceneId: number, castId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/scenes/${sceneId}/required-casts/${castId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    return throwApiError(response, "シーン必要キャスト削除に失敗しました。");
  }
}

/**
 * キャストの参加可否一覧を取得します
 */
export async function listCastAvailabilities(projectId: string, castId: number): Promise<CastAvailability[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/casts/${castId}/availabilities`);

  if (!response.ok) {
    return throwApiError(response, "キャスト参加可否一覧の取得に失敗しました。");
  }

  return response.json();
}

/**
 * 参加可否を登録します
 */
export async function createCastAvailability(projectId: string, data: CastAvailabilityInput): Promise<CastAvailability> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/casts/${data.cast_id}/availabilities/${data.candidate_date_id}/${data.time_slot_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_available: data.is_available }),
  });

  if (!response.ok) {
    return throwApiError(response, "キャスト参加可否更新に失敗しました。");
  }

  return response.json();
}

/**
 * 参加可否を更新します
 */
export async function updateCastAvailability(projectId: string, data: CastAvailabilityInput): Promise<CastAvailability> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/casts/${data.cast_id}/availabilities/${data.candidate_date_id}/${data.time_slot_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_available: data.is_available }),
  });

  if (!response.ok) {
    return throwApiError(response, "キャスト参加可否更新に失敗しました。");
  }

  return response.json();
}

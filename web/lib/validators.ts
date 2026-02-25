/**
 * フォーム入力値のバリデーションユーティリティ
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * プロジェクト名を検証します
 * - 必須
 * - 255文字以内
 */
export function validateProjectTitle(title: string): ValidationResult {
  if (!title || title.trim() === "") {
    return { isValid: false, error: "プロジェクト名は必須です" };
  }
  if (title.length > 255) {
    return { isValid: false, error: "プロジェクト名は255文字以内で入力してください" };
  }
  return { isValid: true };
}

/**
 * キャスト名を検証します
 * - 必須
 * - 100文字以内
 */
export function validateCastName(name: string): ValidationResult {
  if (!name || name.trim() === "") {
    return { isValid: false, error: "役者名は必須です" };
  }
  if (name.length > 100) {
    return { isValid: false, error: "役者名は100文字以内で入力してください" };
  }
  return { isValid: true };
}

/**
 * キャスト役名を検証します
 * - 必須
 * - 100文字以内
 */
export function validateCastRole(role: string): ValidationResult {
  if (!role || role.trim() === "") {
    return { isValid: false, error: "役名は必須です" };
  }
  if (role.length > 100) {
    return { isValid: false, error: "役名は100文字以内で入力してください" };
  }
  return { isValid: true };
}

/**
 * シーン名を検証します
 * - 必須
 * - 20文字以内
 */
export function validateSceneName(name: string): ValidationResult {
  if (!name || name.trim() === "") {
    return { isValid: false, error: "シーン名は必須です" };
  }
  if (name.length > 20) {
    return { isValid: false, error: "シーン名は20文字以内で入力してください" };
  }
  return { isValid: true };
}

/**
 * 候補日を検証します
 * - 必須
 * - YYYY-MM-DD形式
 */
export function validateCandidateDate(date: string): ValidationResult {
  if (!date || date.trim() === "") {
    return { isValid: false, error: "候補日は必須です" };
  }
  // YYYY-MM-DD形式チェック
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { isValid: false, error: "候補日はYYYY-MM-DD形式で入力してください" };
  }
  // 有効な日付かチェック
  const parsedDate = new Date(date + "T00:00:00");
  if (isNaN(parsedDate.getTime())) {
    return { isValid: false, error: "有効な日付を入力してください" };
  }
  return { isValid: true };
}

/**
 * 時間枠名を検証します
 * - 必須
 * - 50文字以内
 */
export function validateTimeSlotName(name: string): ValidationResult {
  if (!name || name.trim() === "") {
    return { isValid: false, error: "時間枠名は必須です" };
  }
  if (name.length > 50) {
    return { isValid: false, error: "時間枠名は50文字以内で入力してください" };
  }
  return { isValid: true };
}

/**
 * 時刻を検証します
 * - オプショナル（空でもOK）
 * - HH:MM または HH:MM:SS形式
 * - HH:MM形式の場合は秒を00として扱う
 */
export function validateTime(time: string): ValidationResult {
  if (!time || time.trim() === "") {
    return { isValid: true }; // 空でもOK
  }
  
  // HH:MM または HH:MM:SS形式チェック
  const timeWithSecondsRegex = /^\d{2}:\d{2}:\d{2}$/;
  const timeWithoutSecondsRegex = /^\d{2}:\d{2}$/;
  
  let hours: number, minutes: number, seconds: number = 0;
  
  if (timeWithSecondsRegex.test(time)) {
    // HH:MM:SS形式
    [hours, minutes, seconds] = time.split(":").map(Number);
  } else if (timeWithoutSecondsRegex.test(time)) {
    // HH:MM形式（秒は00とする）
    [hours, minutes] = time.split(":").map(Number);
    seconds = 0;
  } else {
    return { isValid: false, error: "時刻はHH:MM形式で入力してください" };
  }
  
  // 有効な時刻かチェック
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return { isValid: false, error: "有効な時刻を入力してください" };
  }
  return { isValid: true };
}

/**
 * 時刻をHH:MM:SS形式に正規化します
 * - HH:MM形式の場合は:00を追加
 * - 既にHH:MM:SS形式の場合はそのまま
 */
export function normalizeTime(time: string): string {
  if (!time || time.trim() === "") {
    return "";
  }
  // HH:MM形式の場合は:00を追加
  if (/^\d{2}:\d{2}$/.test(time)) {
    return time + ":00";
  }
  return time;
}

/**
 * 時間枠の開始時刻と終了時刻を検証します
 * - 両方空でOK
 * - 片方だけ入力されている場合OK
 * - 開始時刻 < 終了時刻であることを確認（両方入力されている場合）
 */
export function validateTimeRange(startTime: string, endTime: string): ValidationResult {
  // 両方空 → OK
  if ((!startTime || startTime.trim() === "") && (!endTime || endTime.trim() === "")) {
    return { isValid: true };
  }

  // 片方が入力されている場合、その値の形式を検証
  if (startTime && startTime.trim() !== "") {
    const startValidation = validateTime(startTime);
    if (!startValidation.isValid) {
      return startValidation;
    }
  }

  if (endTime && endTime.trim() !== "") {
    const endValidation = validateTime(endTime);
    if (!endValidation.isValid) {
      return endValidation;
    }
  }

  // 両方入力されている場合、開始時刻 < 終了時刻をチェック
  if (startTime && startTime.trim() !== "" && endTime && endTime.trim() !== "") {
    if (startTime >= endTime) {
      return { isValid: false, error: "開始時刻は終了時刻より前である必要があります" };
    }
  }

  return { isValid: true };
}

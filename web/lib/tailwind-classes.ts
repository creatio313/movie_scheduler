/**
 * Tailwind CSS class constants
 * 共通スタイルパターンを集約して保守性を向上させる
 */

// ===========================
// Layout & Container
// ===========================

/** フルスクリーンのローディング画面背景 */
export const FULLSCREEN_CENTERED_BG =
  "flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900";

/** ページメインコンテナ */
export const PAGE_CONTAINER = "w-full max-w-4xl mx-auto px-6 py-12";

/** 狭いコンテナ（モーダルやエラー表示用） */
export const NARROW_CONTAINER = "w-full max-w-2xl px-6";

/** カードコンテナ */
export const CARD_CONTAINER = "rounded-lg shadow-lg bg-white dark:bg-gray-800 p-8";

/** セクション/パネル（白背景） */
export const SECTION_PANEL = "rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800";

// ===========================
// Typography
// ===========================

/** ページタイトル */
export const PAGE_TITLE = "text-4xl font-bold tracking-tight text-gray-900 dark:text-white";

/** ページサブタイトル */
export const PAGE_SUBTITLE = "text-lg text-gray-600 dark:text-gray-400";

/** セクションタイトル */
export const SECTION_TITLE = "text-2xl font-semibold text-gray-900 dark:text-white";

/** サブセクションタイトル */
export const SUBSECTION_TITLE = "text-xl font-semibold text-gray-900 dark:text-white";

/** ラベルテキスト */
export const LABEL_TEXT = "block text-sm font-medium text-gray-700 dark:text-gray-300";

/** ヘルパーテキスト（グレー） */
export const HELPER_TEXT = "text-sm text-gray-500 dark:text-gray-400";

/** エラーテキスト */
export const ERROR_TEXT = "text-sm text-red-700 dark:text-red-300";

// ===========================
// Form Inputs
// ===========================

/** 全幅フォーム入力フィールド */
export const INPUT_FULL_WIDTH =
  "w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed";

/** フォーム入力フィールド（標準） */
export const INPUT_BASE =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white";

/** テキストエリア */
export const TEXTAREA_BASE =
  "w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none";

/** 日付入力フィールド */
export const INPUT_DATE =
  "flex-1 min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white";

/** 時刻入力フィールド */
export const INPUT_TIME =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white";

/** 大型タイトル入力フィールド */
export const INPUT_LARGE_TITLE =
  "w-full max-w-lg rounded-lg border border-gray-300 bg-white px-4 py-2 text-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white";

// ===========================
// Buttons
// ===========================

/** プライマリボタン（フルウィズ） */
export const BUTTON_PRIMARY_FULL =
  "w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

/** プライマリボタン（標準） */
export const BUTTON_PRIMARY =
  "rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50";

/** セカンダリボタン（アウトライン） */
export const BUTTON_OUTLINE =
  "px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700";

/** アイコンボタン */
export const BUTTON_ICON =
  "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700";

/** セカンダリボタン（青系） */
export const BUTTON_SECONDARY_BLUE =
  "px-4 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold transition-colors dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20";

/** セカンダリボタン（緑系） */
export const BUTTON_SECONDARY_GREEN =
  "px-4 py-2 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 font-semibold transition-colors dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20";

// ===========================
// Messages & Alerts
// ===========================

/** エラーメッセージボックス */
export const ALERT_ERROR =
  "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4";

/** エラーメッセージボックス（マージン付き） */
export const ALERT_ERROR_WITH_MARGIN =
  "mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300";

// ===========================
// List & Items
// ===========================

/** リストアイテム（枠線付き） */
export const LIST_ITEM =
  "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700";

/** リストアイテム（選択可能） */
export const LIST_ITEM_SELECTABLE =
  "rounded-xl border px-4 py-3 transition cursor-pointer";

/** チェックボックスラベル */
export const CHECKBOX_LABEL = "flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700";

/** テーブル */
export const TABLE_BASE = "min-w-full text-sm";

// ===========================
// Grid & Spacing
// ===========================

/** 2カラムグリッド（レスポンシブ） */
export const GRID_2COL = "grid gap-2 sm:grid-cols-2";

/** 2カラムレイアウト（アスペクト比あり） */
export const GRID_2COL_LAYOUT = "grid gap-8 lg:grid-cols-2";

/** スペース垂直 */
export const SPACE_Y_3 = "space-y-3";

/** スペース垂直（大） */
export const SPACE_Y_4 = "space-y-4";

/** スペース垂直（最大） */
export const SPACE_Y_6 = "space-y-6";

// ===========================
// Utility Classes
// ===========================

/** リンク前戻りボタン */
export const LINK_BACK =
  "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold flex items-center gap-2";

/** テキスト中央配置 */
export const TEXT_CENTER = "text-center";

/** フレックス棘用 */
export const FLEX_CENTER = "flex items-center justify-center";

/** アニメーション：ローディングスピナー */
export const SPINNER = "animate-spin rounded-full h-12 w-12 border border-blue-300 border-t-blue-600";

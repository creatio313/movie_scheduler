package handlers

import (
	"database/sql"
	"log/slog"
	"net/http"

	"github.com/creatio313/movie_scheduler/internal/models"
	"github.com/creatio313/movie_scheduler/internal/response"
)

// [PUT] /api/projects/{projectId}/scenes/{sceneId}/allowed-time-slots/{timeSlotId} : シーン許可時間枠の追加
func HandleCreateSceneAllowedTimeSlot(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		sceneID, err := parsePathID(r.PathValue("sceneId"))
		if err != nil {
			http.Error(w, "シーンIDの形式が不正です。", http.StatusBadRequest)
			return
		}
		timeSlotID, err := parsePathID(r.PathValue("timeSlotId"))
		if err != nil {
			http.Error(w, "時間枠IDの形式が不正です。", http.StatusBadRequest)
			return
		}

		query := `
INSERT IGNORE INTO scene_allowed_time_slots (scene_id, time_slot_id)
SELECT s.id, ts.id
FROM scenes s
JOIN time_slots_def ts ON ts.id = ? AND ts.project_id = s.project_id
WHERE s.id = ? AND s.project_id = ?`
		_, err = db.ExecContext(r.Context(), query, timeSlotID, sceneID, projectID)
		if err != nil {
			slog.Error("シーン許可時間枠作成に失敗しました。", "error", err, "scene_id", sceneID, "time_slot_id", timeSlotID)
			http.Error(w, "シーン許可時間枠作成に失敗しました。", http.StatusInternalServerError)
			return
		}

		// ID付きで確実に返すため、SELECTで再取得する
		var s models.SceneAllowedTimeSlot
		err = db.QueryRowContext(r.Context(), `
SELECT sats.id, sats.scene_id, sats.time_slot_id
FROM scene_allowed_time_slots sats
JOIN scenes sc ON sc.id = sats.scene_id
JOIN time_slots_def ts ON ts.id = sats.time_slot_id AND ts.project_id = sc.project_id
WHERE sats.scene_id = ? AND sats.time_slot_id = ? AND sc.project_id = ?`, sceneID, timeSlotID, projectID).
			Scan(&s.ID, &s.SceneID, &s.TimeSlotID)
		if err == sql.ErrNoRows {
			http.Error(w, "シーンまたは時間枠が見つかりません。", http.StatusNotFound)
			return
		} else if err != nil {
			slog.Error("シーン許可時間枠取得に失敗しました。", "error", err, "scene_id", sceneID, "time_slot_id", timeSlotID)
			http.Error(w, "サーバー内部でエラーが発生しました。", http.StatusInternalServerError)
			return
		}

		slog.Info("シーン許可時間枠が作成されました。", "id", s.ID, "scene_id", s.SceneID, "time_slot_id", s.TimeSlotID)
		response.RespondJSON(w, http.StatusOK, s)
	}
}

// [DELETE] /api/projects/{projectId}/scenes/{sceneId}/allowed-time-slots/{timeSlotId} : シーン許可時間枠の削除
func HandleDeleteSceneAllowedTimeSlot(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		sceneID, err := parsePathID(r.PathValue("sceneId"))
		if err != nil {
			http.Error(w, "シーンIDの形式が不正です。", http.StatusBadRequest)
			return
		}
		timeSlotID, err := parsePathID(r.PathValue("timeSlotId"))
		if err != nil {
			http.Error(w, "時間枠IDの形式が不正です。", http.StatusBadRequest)
			return
		}

		query := `
DELETE sats FROM scene_allowed_time_slots sats
JOIN scenes s ON s.id = sats.scene_id
JOIN time_slots_def ts ON ts.id = sats.time_slot_id AND ts.project_id = s.project_id
WHERE sats.scene_id = ? AND sats.time_slot_id = ? AND s.project_id = ?`
		result, err := db.ExecContext(r.Context(), query, sceneID, timeSlotID, projectID)
		if err != nil {
			slog.Error("シーン許可時間枠削除に失敗しました。", "error", err, "scene_id", sceneID, "time_slot_id", timeSlotID)
			http.Error(w, "シーン許可時間枠削除に失敗しました。", http.StatusInternalServerError)
			return
		}
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			http.Error(w, "シーン許可時間枠削除に失敗しました。", http.StatusInternalServerError)
			return
		}
		if rowsAffected == 0 {
			http.Error(w, "シーン許可時間枠が見つかりません。", http.StatusNotFound)
			return
		}

		slog.Info("シーン許可時間枠が削除されました。", "scene_id", sceneID, "time_slot_id", timeSlotID)
		w.WriteHeader(http.StatusNoContent)
	}
}

// [GET] /api/projects/{projectId}/scenes/{sceneId}/allowed-time-slots : シーンで撮影可能な時間枠一覧
func HandleListSceneAllowedTimeSlotsByScene(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		sceneID, err := parsePathID(r.PathValue("sceneId"))
		if err != nil {
			http.Error(w, "シーンIDの形式が不正です。", http.StatusBadRequest)
			return
		}

		query := `
SELECT sats.id, sats.scene_id, sats.time_slot_id
FROM scene_allowed_time_slots sats
JOIN scenes s ON s.id = sats.scene_id
JOIN time_slots_def ts ON ts.id = sats.time_slot_id AND ts.project_id = s.project_id
WHERE sats.scene_id = ? AND s.project_id = ?
ORDER BY sats.id`
		rows, err := db.QueryContext(r.Context(), query, sceneID, projectID)
		if err != nil {
			slog.Error("シーン許可時間枠一覧取得に失敗しました。", "error", err, "scene_id", sceneID)
			http.Error(w, "シーン許可時間枠一覧取得に失敗しました。", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		items := make([]models.SceneAllowedTimeSlot, 0)
		for rows.Next() {
			var s models.SceneAllowedTimeSlot
			if err := rows.Scan(&s.ID, &s.SceneID, &s.TimeSlotID); err != nil {
				http.Error(w, "シーン許可時間枠一覧の読み取りに失敗しました。", http.StatusInternalServerError)
				return
			}
			items = append(items, s)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, "シーン許可時間枠一覧の読み取りに失敗しました。", http.StatusInternalServerError)
			return
		}

		response.RespondJSON(w, http.StatusOK, items)
	}
}

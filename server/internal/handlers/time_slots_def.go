package handlers

import (
	"database/sql"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/creatio313/movie_scheduler/internal/models"
	"github.com/creatio313/movie_scheduler/internal/response"
	"github.com/creatio313/movie_scheduler/internal/validators"
)

// [POST] /api/projects/{projectId}/time-slots : 時間枠の作成
func HandleCreateTimeSlotDef(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		var t models.TimeSlotDef
		if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
			http.Error(w, "無効な要求様式です。", http.StatusBadRequest)
			return
		}

		// 入力バリデーション
		if err := validators.ValidateTimeSlotDef(t); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		var startArg interface{}
		var endArg interface{}
		if t.StartTime != "" {
			startArg = t.StartTime
		}
		if t.EndTime != "" {
			endArg = t.EndTime
		}

		query := "INSERT INTO time_slots_def (project_id, slot_name, start_time, end_time) VALUES (?, ?, ?, ?) RETURNING id"
		err := db.QueryRowContext(r.Context(), query, projectID, t.SlotName, startArg, endArg).Scan(&t.ID)
		if err != nil {
			slog.Error("時間枠作成に失敗しました。", "error", err, "project_id", projectID)
			http.Error(w, "時間枠作成に失敗しました。", http.StatusInternalServerError)
			return
		}
		t.ProjectID = projectID

		// 監査ログ
		slog.Info("時間枠が作成されました。", "time_slot_id", t.ID, "slot_name", t.SlotName, "project_id", projectID)
		response.RespondJSON(w, http.StatusCreated, t)
	}
}

// [PUT] /api/projects/{projectId}/time-slots/{timeSlotId} : 時間枠の更新
func HandleUpdateTimeSlotDef(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		id, err := parsePathID(r.PathValue("timeSlotId"))
		if err != nil {
			http.Error(w, "時間枠IDの形式が不正です。", http.StatusBadRequest)
			return
		}
		var t models.TimeSlotDef
		if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
			http.Error(w, "無効な要求様式です。", http.StatusBadRequest)
			return
		}

		// 入力バリデーション
		if err := validators.ValidateTimeSlotDef(t); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		var startArg interface{}
		var endArg interface{}
		if t.StartTime != "" {
			startArg = t.StartTime
		}
		if t.EndTime != "" {
			endArg = t.EndTime
		}

		result, err := db.ExecContext(r.Context(), "UPDATE time_slots_def SET slot_name = ?, start_time = ?, end_time = ? WHERE id = ? AND project_id = ?", t.SlotName, startArg, endArg, id, projectID)
		if err != nil {
			slog.Error("時間枠更新に失敗しました。", "error", err, "time_slot_id", id)
			http.Error(w, "時間枠更新に失敗しました。", http.StatusInternalServerError)
			return
		}
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			http.Error(w, "時間枠更新に失敗しました。", http.StatusInternalServerError)
			return
		}
		if rowsAffected == 0 {
			var exists bool
			if err := db.QueryRowContext(r.Context(), "SELECT EXISTS(SELECT 1 FROM time_slots_def WHERE id = ? AND project_id = ?)", id, projectID).Scan(&exists); err != nil {
				http.Error(w, "時間枠更新に失敗しました。", http.StatusInternalServerError)
				return
			}
			if !exists {
				http.Error(w, "時間枠定義が見つかりません。", http.StatusNotFound)
				return
			}
		}

		// 監査ログ
		slog.Info("時間枠が更新されました。", "time_slot_id", id, "slot_name", t.SlotName)
		t.ID = id
		t.ProjectID = projectID
		response.RespondJSON(w, http.StatusOK, t)
	}
}

// [DELETE] /api/projects/{projectId}/time-slots/{timeSlotId} : 時間枠の削除
func HandleDeleteTimeSlotDef(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		id, err := parsePathID(r.PathValue("timeSlotId"))
		if err != nil {
			http.Error(w, "時間枠IDの形式が不正です。", http.StatusBadRequest)
			return
		}

		result, err := db.ExecContext(r.Context(), "DELETE FROM time_slots_def WHERE id = ? AND project_id = ?", id, projectID)
		if err != nil {
			slog.Error("時間枠削除に失敗しました。", "error", err, "time_slot_id", id)
			http.Error(w, "時間枠削除に失敗しました。", http.StatusInternalServerError)
			return
		}
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			http.Error(w, "時間枠削除に失敗しました。", http.StatusInternalServerError)
			return
		}
		if rowsAffected == 0 {
			http.Error(w, "時間枠定義が見つかりません。", http.StatusNotFound)
			return
		}

		// 監査ログ
		slog.Info("時間枠が削除されました。", "time_slot_id", id)
		w.WriteHeader(http.StatusNoContent)
	}
}

// [GET] /api/projects/{projectId}/time-slots : プロジェクトの時間枠一覧
func HandleListTimeSlotsDefByProject(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")

		rows, err := db.QueryContext(r.Context(), "SELECT id, project_id, slot_name, start_time, end_time FROM time_slots_def WHERE project_id = ? ORDER BY start_time", projectID)
		if err != nil {
			slog.Error("時間枠一覧取得に失敗しました。", "error", err, "project_id", projectID)
			http.Error(w, "時間枠一覧取得に失敗しました。", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		items := make([]models.TimeSlotDef, 0)
		for rows.Next() {
			var t models.TimeSlotDef
			var startTime, endTime sql.NullString
			if err := rows.Scan(&t.ID, &t.ProjectID, &t.SlotName, &startTime, &endTime); err != nil {
				http.Error(w, "時間枠一覧の読み取りに失敗しました。", http.StatusInternalServerError)
				return
			}
			t.StartTime = startTime.String
			t.EndTime = endTime.String
			items = append(items, t)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, "時間枠一覧の読み取りに失敗しました。", http.StatusInternalServerError)
			return
		}

		response.RespondJSON(w, http.StatusOK, items)
	}
}

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

// [PUT] /api/projects/{projectId}/casts/{castId}/availabilities/{candidateDateId}/{timeSlotId} : 可用性の作成・更新
func HandleUpdateCastAvailability(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		castID, err := parsePathID(r.PathValue("castId"))
		if err != nil {
			http.Error(w, "キャストIDの形式が不正です。", http.StatusBadRequest)
			return
		}
		candidateDateID, err := parsePathID(r.PathValue("candidateDateId"))
		if err != nil {
			http.Error(w, "候補日IDの形式が不正です。", http.StatusBadRequest)
			return
		}
		timeSlotID, err := parsePathID(r.PathValue("timeSlotId"))
		if err != nil {
			http.Error(w, "時間枠IDの形式が不正です。", http.StatusBadRequest)
			return
		}
		var c models.CastAvailability
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			http.Error(w, "無効な要求様式です。", http.StatusBadRequest)
			return
		}

		if err := validators.ValidateCastAvailability(c); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		query := `
INSERT INTO cast_availabilities (candidate_date_id, time_slot_id, cast_id, is_available)
SELECT cd.id, ts.id, c.id, ?
FROM candidate_dates cd
JOIN time_slots_def ts ON ts.id = ? AND ts.project_id = cd.project_id
JOIN casts c ON c.id = ? AND c.project_id = cd.project_id
WHERE cd.id = ? AND cd.project_id = ?
ON DUPLICATE KEY UPDATE is_available = VALUES(is_available)`
		_, err = db.ExecContext(r.Context(), query, c.IsAvailable, timeSlotID, castID, candidateDateID, projectID)
		if err != nil {
			slog.Error("キャスト参加可否更新に失敗しました。", "error", err, "cast_id", castID)
			http.Error(w, "キャスト参加可否更新に失敗しました。", http.StatusInternalServerError)
			return
		}

		err = db.QueryRowContext(r.Context(), `
SELECT ca.id, ca.candidate_date_id, ca.time_slot_id, ca.cast_id, ca.is_available
FROM cast_availabilities ca
JOIN candidate_dates cd ON cd.id = ca.candidate_date_id
JOIN time_slots_def ts ON ts.id = ca.time_slot_id AND ts.project_id = cd.project_id
JOIN casts c ON c.id = ca.cast_id AND c.project_id = cd.project_id
WHERE ca.candidate_date_id = ? AND ca.time_slot_id = ? AND ca.cast_id = ? AND cd.project_id = ?`, candidateDateID, timeSlotID, castID, projectID).
			Scan(&c.ID, &c.CandidateDateID, &c.TimeSlotID, &c.CastID, &c.IsAvailable)
		if err == sql.ErrNoRows {
			http.Error(w, "キャスト、候補日、または時間枠が見つかりません。", http.StatusNotFound)
			return
		} else if err != nil {
			slog.Error("キャスト参加可否取得に失敗しました。", "error", err, "cast_id", castID)
			http.Error(w, "サーバー内部でエラーが発生しました。", http.StatusInternalServerError)
			return
		}

		slog.Info("キャスト参加可否が更新されました。", "availability_id", c.ID, "is_available", c.IsAvailable)
		response.RespondJSON(w, http.StatusOK, c)
	}
}

// [GET] /api/projects/{projectId}/casts/{castId}/availabilities : 役者の可用性一覧
func HandleListCastAvailabilitiesByCast(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		castID, err := parsePathID(r.PathValue("castId"))
		if err != nil {
			http.Error(w, "キャストIDの形式が不正です。", http.StatusBadRequest)
			return
		}

		query := `
SELECT ca.id, ca.candidate_date_id, ca.time_slot_id, ca.cast_id, ca.is_available
FROM cast_availabilities ca
JOIN candidate_dates cd ON cd.id = ca.candidate_date_id
JOIN time_slots_def ts ON ts.id = ca.time_slot_id AND ts.project_id = cd.project_id
JOIN casts c ON c.id = ca.cast_id AND c.project_id = cd.project_id
WHERE ca.cast_id = ? AND c.project_id = ?
ORDER BY ca.candidate_date_id, ca.time_slot_id`
		rows, err := db.QueryContext(r.Context(), query, castID, projectID)
		if err != nil {
			slog.Error("キャスト参加可否一覧取得に失敗しました。", "error", err, "cast_id", castID)
			http.Error(w, "キャスト参加可否一覧取得に失敗しました。", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		items := make([]models.CastAvailability, 0)
		for rows.Next() {
			var c models.CastAvailability
			if err := rows.Scan(&c.ID, &c.CandidateDateID, &c.TimeSlotID, &c.CastID, &c.IsAvailable); err != nil {
				http.Error(w, "キャスト参加可否一覧の読み取りに失敗しました。", http.StatusInternalServerError)
				return
			}
			items = append(items, c)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, "キャスト参加可否一覧の読み取りに失敗しました。", http.StatusInternalServerError)
			return
		}

		response.RespondJSON(w, http.StatusOK, items)
	}
}

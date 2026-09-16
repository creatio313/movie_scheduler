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

// [POST] /api/projects/{projectId}/candidate-dates : 候補日の作成
func HandleCreateCandidateDate(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		var cd models.CandidateDate
		if err := json.NewDecoder(r.Body).Decode(&cd); err != nil {
			http.Error(w, "無効な要求様式です。", http.StatusBadRequest)
			return
		}

		// 入力バリデーション
		if err := validators.ValidateCandidateDate(cd); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		query := "INSERT INTO candidate_dates (project_id, target_date) VALUES (?, ?) RETURNING id"
		err := db.QueryRowContext(r.Context(), query, projectID, cd.TargetDate).Scan(&cd.ID)
		if err != nil {
			slog.Error("候補日作成に失敗しました。", "error", err, "project_id", projectID)
			http.Error(w, "候補日作成に失敗しました。", http.StatusInternalServerError)
			return
		}
		cd.ProjectID = projectID

		// 監査ログ
		slog.Info("候補日が作成されました。", "candidate_date_id", cd.ID, "target_date", cd.TargetDate, "project_id", projectID)
		response.RespondJSON(w, http.StatusCreated, cd)
	}
}

// [DELETE] /api/projects/{projectId}/candidate-dates/{candidateDateId} : 候補日の削除
func HandleDeleteCandidateDate(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		id, err := parsePathID(r.PathValue("candidateDateId"))
		if err != nil {
			http.Error(w, "候補日IDの形式が不正です。", http.StatusBadRequest)
			return
		}

		result, err := db.ExecContext(r.Context(), "DELETE FROM candidate_dates WHERE id = ? AND project_id = ?", id, projectID)
		if err != nil {
			slog.Error("候補日削除に失敗しました。", "error", err, "candidate_date_id", id)
			http.Error(w, "候補日削除に失敗しました。", http.StatusInternalServerError)
			return
		}
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			http.Error(w, "候補日削除に失敗しました。", http.StatusInternalServerError)
			return
		}
		if rowsAffected == 0 {
			http.Error(w, "候補日が見つかりません。", http.StatusNotFound)
			return
		}

		// 監査ログ
		slog.Info("候補日が削除されました。", "candidate_date_id", id)
		w.WriteHeader(http.StatusNoContent)
	}
}

// [GET] /api/projects/{projectId}/candidate-dates : プロジェクトの候補日一覧
func HandleListCandidateDatesByProject(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")

		rows, err := db.QueryContext(r.Context(), "SELECT id, project_id, target_date FROM candidate_dates WHERE project_id = ? ORDER BY target_date", projectID)
		if err != nil {
			slog.Error("候補日一覧取得に失敗しました。", "error", err, "project_id", projectID)
			http.Error(w, "候補日一覧取得に失敗しました。", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		items := make([]models.CandidateDate, 0)
		for rows.Next() {
			var cd models.CandidateDate
			if err := rows.Scan(&cd.ID, &cd.ProjectID, &cd.TargetDate); err != nil {
				http.Error(w, "候補日一覧の読み取りに失敗しました。", http.StatusInternalServerError)
				return
			}
			items = append(items, cd)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, "候補日一覧の読み取りに失敗しました。", http.StatusInternalServerError)
			return
		}

		response.RespondJSON(w, http.StatusOK, items)
	}
}

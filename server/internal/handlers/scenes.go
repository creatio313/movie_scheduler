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

// [POST] /api/projects/{projectId}/scenes : シーンの作成
func HandleCreateScene(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		var s models.Scene
		if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
			http.Error(w, "無効な要求様式です。", http.StatusBadRequest)
			return
		}

		// 入力バリデーション
		if err := validators.ValidateScene(s); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		query := "INSERT INTO scenes (project_id, scene_name, description) VALUES (?, ?, ?) RETURNING id"
		err := db.QueryRowContext(r.Context(), query, projectID, s.SceneName, s.Description).Scan(&s.ID)
		if err != nil {
			slog.Error("シーン作成に失敗しました。", "error", err, "project_id", projectID)
			http.Error(w, "シーン作成に失敗しました。", http.StatusInternalServerError)
			return
		}
		s.ProjectID = projectID

		// 監査ログ
		slog.Info("シーンが作成されました。", "scene_id", s.ID, "scene_name", s.SceneName, "project_id", projectID)
		response.RespondJSON(w, http.StatusCreated, s)
	}
}

// [PUT] /api/projects/{projectId}/scenes/{sceneId} : シーンの更新
func HandleUpdateScene(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		id, err := parsePathID(r.PathValue("sceneId"))
		if err != nil {
			http.Error(w, "シーンIDの形式が不正です。", http.StatusBadRequest)
			return
		}
		var s models.Scene
		if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
			http.Error(w, "無効な要求様式です。", http.StatusBadRequest)
			return
		}

		// 入力バリデーション
		if err := validators.ValidateScene(s); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		result, err := db.ExecContext(r.Context(), "UPDATE scenes SET scene_name = ?, description = ? WHERE id = ? AND project_id = ?", s.SceneName, s.Description, id, projectID)
		if err != nil {
			slog.Error("シーン更新に失敗しました。", "error", err, "scene_id", id)
			http.Error(w, "シーン更新に失敗しました。", http.StatusInternalServerError)
			return
		}
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			http.Error(w, "シーン更新に失敗しました。", http.StatusInternalServerError)
			return
		}
		if rowsAffected == 0 {
			var exists bool
			if err := db.QueryRowContext(r.Context(), "SELECT EXISTS(SELECT 1 FROM scenes WHERE id = ? AND project_id = ?)", id, projectID).Scan(&exists); err != nil {
				http.Error(w, "シーン更新に失敗しました。", http.StatusInternalServerError)
				return
			}
			if !exists {
				http.Error(w, "シーンが見つかりません。", http.StatusNotFound)
				return
			}
		}

		// 監査ログ
		slog.Info("シーンが更新されました。", "scene_id", id, "scene_name", s.SceneName)
		s.ID = id
		s.ProjectID = projectID
		response.RespondJSON(w, http.StatusOK, s)
	}
}

// [DELETE] /api/projects/{projectId}/scenes/{sceneId} : シーンの削除
func HandleDeleteScene(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		id, err := parsePathID(r.PathValue("sceneId"))
		if err != nil {
			http.Error(w, "シーンIDの形式が不正です。", http.StatusBadRequest)
			return
		}

		result, err := db.ExecContext(r.Context(), "DELETE FROM scenes WHERE id = ? AND project_id = ?", id, projectID)
		if err != nil {
			slog.Error("シーン削除に失敗しました。", "error", err, "scene_id", id)
			http.Error(w, "シーン削除に失敗しました。", http.StatusInternalServerError)
			return
		}
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			http.Error(w, "シーン削除に失敗しました。", http.StatusInternalServerError)
			return
		}
		if rowsAffected == 0 {
			http.Error(w, "シーンが見つかりません。", http.StatusNotFound)
			return
		}

		// 監査ログ
		slog.Info("シーンが削除されました。", "scene_id", id)
		w.WriteHeader(http.StatusNoContent)
	}
}

// [GET] /api/projects/{projectId}/scenes : プロジェクトのシーン一覧
func HandleListScenesByProject(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")

		rows, err := db.QueryContext(r.Context(), "SELECT id, project_id, scene_name, description FROM scenes WHERE project_id = ? ORDER BY id", projectID)
		if err != nil {
			slog.Error("シーン一覧取得に失敗しました。", "error", err, "project_id", projectID)
			http.Error(w, "シーン一覧取得に失敗しました。", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		items := make([]models.Scene, 0)
		for rows.Next() {
			var s models.Scene
			var desc sql.NullString
			if err := rows.Scan(&s.ID, &s.ProjectID, &s.SceneName, &desc); err != nil {
				http.Error(w, "シーン一覧の読み取りに失敗しました。", http.StatusInternalServerError)
				return
			}
			s.Description = desc.String
			items = append(items, s)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, "シーン一覧の読み取りに失敗しました。", http.StatusInternalServerError)
			return
		}

		response.RespondJSON(w, http.StatusOK, items)
	}
}

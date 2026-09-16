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

// [POST] /api/projects/{projectId}/casts : キャストの作成
func HandleCreateCast(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		var c models.Cast
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			http.Error(w, "無効な要求様式です。", http.StatusBadRequest)
			return
		}

		// 入力バリデーション
		if err := validators.ValidateCast(c); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		query := "INSERT INTO casts (project_id, name, role_name) VALUES (?, ?, ?) RETURNING id, created_at"
		err := db.QueryRowContext(r.Context(), query, projectID, c.Name, c.RoleName).Scan(&c.ID, &c.CreatedAt)
		if err != nil {
			slog.Error("キャスト作成に失敗しました。", "error", err, "project_id", projectID)
			http.Error(w, "キャスト作成に失敗しました。", http.StatusInternalServerError)
			return
		}
		c.ProjectID = projectID

		// 監査ログ
		slog.Info("キャストが作成されました。", "cast_id", c.ID, "name", c.Name, "role_name", c.RoleName, "project_id", projectID)
		response.RespondJSON(w, http.StatusCreated, c)
	}
}

// [PUT] /api/projects/{projectId}/casts/{castId} : キャストの更新
func HandleUpdateCast(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		id, err := parsePathID(r.PathValue("castId"))
		if err != nil {
			http.Error(w, "キャストIDの形式が不正です。", http.StatusBadRequest)
			return
		}
		var c models.Cast
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			http.Error(w, "無効な要求様式です。", http.StatusBadRequest)
			return
		}

		// 入力バリデーション
		if err := validators.ValidateCast(c); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		result, err := db.ExecContext(r.Context(), "UPDATE casts SET name = ?, role_name = ? WHERE id = ? AND project_id = ?", c.Name, c.RoleName, id, projectID)
		if err != nil {
			slog.Error("キャスト更新に失敗しました。", "error", err, "cast_id", id)
			http.Error(w, "キャスト更新に失敗しました。", http.StatusInternalServerError)
			return
		}
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			http.Error(w, "キャスト更新に失敗しました。", http.StatusInternalServerError)
			return
		}
		if rowsAffected == 0 {
			var exists bool
			if err := db.QueryRowContext(r.Context(), "SELECT EXISTS(SELECT 1 FROM casts WHERE id = ? AND project_id = ?)", id, projectID).Scan(&exists); err != nil {
				http.Error(w, "キャスト更新に失敗しました。", http.StatusInternalServerError)
				return
			}
			if !exists {
				http.Error(w, "キャストが見つかりません。", http.StatusNotFound)
				return
			}
		}

		// 監査ログ
		slog.Info("キャストが更新されました。", "cast_id", id, "name", c.Name, "role_name", c.RoleName)
		c.ID = id
		c.ProjectID = projectID
		response.RespondJSON(w, http.StatusOK, c)
	}
}

// [DELETE] /api/projects/{projectId}/casts/{castId} : キャストの削除
func HandleDeleteCast(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		id, err := parsePathID(r.PathValue("castId"))
		if err != nil {
			http.Error(w, "キャストIDの形式が不正です。", http.StatusBadRequest)
			return
		}

		result, err := db.ExecContext(r.Context(), "DELETE FROM casts WHERE id = ? AND project_id = ?", id, projectID)
		if err != nil {
			slog.Error("キャスト削除に失敗しました。", "error", err, "cast_id", id)
			http.Error(w, "キャスト削除に失敗しました。", http.StatusInternalServerError)
			return
		}
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			http.Error(w, "キャスト削除に失敗しました。", http.StatusInternalServerError)
			return
		}
		if rowsAffected == 0 {
			http.Error(w, "キャストが見つかりません。", http.StatusNotFound)
			return
		}

		// 監査ログ
		slog.Info("キャストが削除されました。", "cast_id", id)
		w.WriteHeader(http.StatusNoContent)
	}
}

// [GET] /api/projects/{projectId}/casts : プロジェクトのキャスト一覧
func HandleListCastsByProject(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")

		rows, err := db.QueryContext(r.Context(), "SELECT id, project_id, name, role_name, created_at FROM casts WHERE project_id = ? ORDER BY created_at, id", projectID)
		if err != nil {
			slog.Error("キャスト一覧取得に失敗しました。", "error", err, "project_id", projectID)
			http.Error(w, "キャスト一覧取得に失敗しました。", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		items := make([]models.Cast, 0)
		for rows.Next() {
			var c models.Cast
			if err := rows.Scan(&c.ID, &c.ProjectID, &c.Name, &c.RoleName, &c.CreatedAt); err != nil {
				http.Error(w, "キャスト一覧の読み取りに失敗しました。", http.StatusInternalServerError)
				return
			}
			items = append(items, c)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, "キャスト一覧の読み取りに失敗しました。", http.StatusInternalServerError)
			return
		}

		response.RespondJSON(w, http.StatusOK, items)
	}
}

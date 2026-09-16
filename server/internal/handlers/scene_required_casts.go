package handlers

import (
	"database/sql"
	"log/slog"
	"net/http"

	"github.com/creatio313/movie_scheduler/internal/models"
	"github.com/creatio313/movie_scheduler/internal/response"
)

// [PUT] /api/projects/{projectId}/scenes/{sceneId}/required-casts/{castId} : シーン必要役者の追加
func HandleCreateSceneRequiredCast(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		sceneID, err := parsePathID(r.PathValue("sceneId"))
		if err != nil {
			http.Error(w, "シーンIDの形式が不正です。", http.StatusBadRequest)
			return
		}
		castID, err := parsePathID(r.PathValue("castId"))
		if err != nil {
			http.Error(w, "キャストIDの形式が不正です。", http.StatusBadRequest)
			return
		}

		query := `
INSERT IGNORE INTO scene_required_casts (scene_id, cast_id)
SELECT s.id, c.id
FROM scenes s
JOIN casts c ON c.id = ? AND c.project_id = s.project_id
WHERE s.id = ? AND s.project_id = ?`
		_, err = db.ExecContext(r.Context(), query, castID, sceneID, projectID)
		if err != nil {
			slog.Error("シーン必要キャスト作成に失敗しました。", "error", err, "scene_id", sceneID, "cast_id", castID)
			http.Error(w, "シーン必要キャスト作成に失敗しました。", http.StatusInternalServerError)
			return
		}

		// ID付きで確実に返すため、SELECTで再取得する
		var s models.SceneRequiredCast
		err = db.QueryRowContext(r.Context(), `
SELECT src.id, src.scene_id, src.cast_id
FROM scene_required_casts src
JOIN scenes sc ON sc.id = src.scene_id
JOIN casts c ON c.id = src.cast_id AND c.project_id = sc.project_id
WHERE src.scene_id = ? AND src.cast_id = ? AND sc.project_id = ?`, sceneID, castID, projectID).
			Scan(&s.ID, &s.SceneID, &s.CastID)
		if err == sql.ErrNoRows {
			http.Error(w, "シーンまたはキャストが見つかりません。", http.StatusNotFound)
			return
		} else if err != nil {
			slog.Error("シーン必要キャスト取得に失敗しました。", "error", err, "scene_id", sceneID, "cast_id", castID)
			http.Error(w, "サーバー内部でエラーが発生しました。", http.StatusInternalServerError)
			return
		}

		slog.Info("シーン必要キャストが作成されました。", "id", s.ID, "scene_id", s.SceneID, "cast_id", s.CastID)
		response.RespondJSON(w, http.StatusOK, s)
	}
}

// [DELETE] /api/projects/{projectId}/scenes/{sceneId}/required-casts/{castId} : シーン必要役者の削除
func HandleDeleteSceneRequiredCast(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		sceneID, err := parsePathID(r.PathValue("sceneId"))
		if err != nil {
			http.Error(w, "シーンIDの形式が不正です。", http.StatusBadRequest)
			return
		}
		castID, err := parsePathID(r.PathValue("castId"))
		if err != nil {
			http.Error(w, "キャストIDの形式が不正です。", http.StatusBadRequest)
			return
		}

		query := `
DELETE src FROM scene_required_casts src
JOIN scenes s ON s.id = src.scene_id
JOIN casts c ON c.id = src.cast_id AND c.project_id = s.project_id
WHERE src.scene_id = ? AND src.cast_id = ? AND s.project_id = ?`
		result, err := db.ExecContext(r.Context(), query, sceneID, castID, projectID)
		if err != nil {
			slog.Error("シーン必要キャスト削除に失敗しました。", "error", err, "scene_id", sceneID, "cast_id", castID)
			http.Error(w, "シーン必要キャスト削除に失敗しました。", http.StatusInternalServerError)
			return
		}
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			http.Error(w, "シーン必要キャスト削除に失敗しました。", http.StatusInternalServerError)
			return
		}
		if rowsAffected == 0 {
			http.Error(w, "シーン必要キャストが見つかりません。", http.StatusNotFound)
			return
		}

		slog.Info("シーン必要キャストが削除されました。", "scene_id", sceneID, "cast_id", castID)
		w.WriteHeader(http.StatusNoContent)
	}
}

// [GET] /api/projects/{projectId}/scenes/{sceneId}/required-casts : シーンに必要な役者一覧
func HandleListSceneRequiredCastsByScene(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")
		sceneID, err := parsePathID(r.PathValue("sceneId"))
		if err != nil {
			http.Error(w, "シーンIDの形式が不正です。", http.StatusBadRequest)
			return
		}

		query := `
SELECT src.id, src.scene_id, src.cast_id
FROM scene_required_casts src
JOIN scenes s ON s.id = src.scene_id
JOIN casts c ON c.id = src.cast_id AND c.project_id = s.project_id
WHERE src.scene_id = ? AND s.project_id = ?
ORDER BY src.id`
		rows, err := db.QueryContext(r.Context(), query, sceneID, projectID)
		if err != nil {
			slog.Error("シーン必要キャスト一覧取得に失敗しました。", "error", err, "scene_id", sceneID)
			http.Error(w, "シーン必要キャスト一覧取得に失敗しました。", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		items := make([]models.SceneRequiredCast, 0)
		for rows.Next() {
			var s models.SceneRequiredCast
			if err := rows.Scan(&s.ID, &s.SceneID, &s.CastID); err != nil {
				http.Error(w, "シーン必要キャスト一覧の読み取りに失敗しました。", http.StatusInternalServerError)
				return
			}
			items = append(items, s)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, "シーン必要キャスト一覧の読み取りに失敗しました。", http.StatusInternalServerError)
			return
		}

		response.RespondJSON(w, http.StatusOK, items)
	}
}

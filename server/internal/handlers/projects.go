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

// [POST] /api/projects : プロジェクトの作成
func HandleCreateProject(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var p models.Project
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			http.Error(w, "無効な要求様式です。", http.StatusBadRequest)
			return
		}

		// 入力バリデーション
		if err := validators.ValidateProject(p); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// MariaDBの RETURNING 句を使って、生成されたUUIDとタイムスタンプを取得する
		query := "INSERT INTO projects (title, description) VALUES (?, ?) RETURNING id"
		err := db.QueryRowContext(r.Context(), query, p.Title, p.Description).Scan(&p.ID)
		if err != nil {
			slog.Error("プロジェクト作成に失敗しました。", "error", err, "title", p.Title)
			http.Error(w, "プロジェクト作成に失敗しました。", http.StatusInternalServerError)
			return
		}

		// 監査ログ
		slog.Info("プロジェクトが作成されました。", "project_id", p.ID, "title", p.Title)
		response.RespondJSON(w, http.StatusCreated, p)
	}
}

// [GET] /api/projects/{projectId} : プロジェクト1件取得
func HandleGetProject(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("projectId")

		var p models.Project
		var desc sql.NullString
		err := db.QueryRowContext(r.Context(), "SELECT id, title, description FROM projects WHERE id = ?", id).
			Scan(&p.ID, &p.Title, &desc)

		if err == sql.ErrNoRows {
			http.Error(w, "プロジェクトが見つかりません。", http.StatusNotFound)
			return
		} else if err != nil {
			slog.Error("プロジェクト取得に失敗しました。", "error", err, "project_id", id)
			http.Error(w, "プロジェクト取得に失敗しました。", http.StatusInternalServerError)
			return
		}
		//説明はNULL許容のため、sql.NullStringから文字列に変換して設定する
		p.Description = desc.String
		response.RespondJSON(w, http.StatusOK, p)
	}
}

// [GET] /api/projects/{projectId}/home : プロジェクトホーム画面に必要な情報を取得
func HandleGetProjectHome(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := r.PathValue("projectId")

		var home models.ProjectHome
		var description sql.NullString
		err := db.QueryRowContext(r.Context(), "SELECT id, title, description FROM projects WHERE id = ?", projectID).
			Scan(&home.Project.ID, &home.Project.Title, &description)
		if err == sql.ErrNoRows {
			http.Error(w, "プロジェクトが見つかりません。", http.StatusNotFound)
			return
		}
		if err != nil {
			slog.Error("プロジェクトホーム取得に失敗しました。", "error", err, "project_id", projectID)
			http.Error(w, "プロジェクトホーム取得に失敗しました。", http.StatusInternalServerError)
			return
		}
		home.Project.Description = description.String

		sceneRows, err := db.QueryContext(r.Context(), "SELECT id, project_id, scene_name, description FROM scenes WHERE project_id = ? ORDER BY id", projectID)
		if err != nil {
			slog.Error("プロジェクトホームのシーン取得に失敗しました。", "error", err, "project_id", projectID)
			http.Error(w, "プロジェクトホームのシーン取得に失敗しました。", http.StatusInternalServerError)
			return
		}
		defer sceneRows.Close()

		sceneIndex := make(map[int]int)
		home.Scenes = make([]models.ProjectHomeScene, 0)
		for sceneRows.Next() {
			var scene models.Scene
			var sceneDescription sql.NullString
			if err := sceneRows.Scan(&scene.ID, &scene.ProjectID, &scene.SceneName, &sceneDescription); err != nil {
				http.Error(w, "プロジェクトホームのシーン読み取りに失敗しました。", http.StatusInternalServerError)
				return
			}
			scene.Description = sceneDescription.String
			sceneIndex[scene.ID] = len(home.Scenes)
			home.Scenes = append(home.Scenes, models.ProjectHomeScene{
				Scene:          scene,
				RequiredCasts:  make([]models.Cast, 0),
				Availabilities: make([]models.SceneAvailabilityRow, 0),
			})
		}
		if err := sceneRows.Err(); err != nil {
			http.Error(w, "プロジェクトホームのシーン読み取りに失敗しました。", http.StatusInternalServerError)
			return
		}

		requiredRows, err := db.QueryContext(r.Context(), `
SELECT src.scene_id, c.id, c.project_id, c.name, c.role_name, c.created_at
FROM scene_required_casts src
JOIN scenes s ON s.id = src.scene_id AND s.project_id = ?
JOIN casts c ON c.id = src.cast_id AND c.project_id = s.project_id
ORDER BY src.scene_id, src.id`, projectID)
		if err != nil {
			slog.Error("プロジェクトホームの必要キャスト取得に失敗しました。", "error", err, "project_id", projectID)
			http.Error(w, "プロジェクトホームの必要キャスト取得に失敗しました。", http.StatusInternalServerError)
			return
		}
		defer requiredRows.Close()
		for requiredRows.Next() {
			var sceneID int
			var cast models.Cast
			if err := requiredRows.Scan(&sceneID, &cast.ID, &cast.ProjectID, &cast.Name, &cast.RoleName, &cast.CreatedAt); err != nil {
				http.Error(w, "プロジェクトホームの必要キャスト読み取りに失敗しました。", http.StatusInternalServerError)
				return
			}
			if index, ok := sceneIndex[sceneID]; ok {
				home.Scenes[index].RequiredCasts = append(home.Scenes[index].RequiredCasts, cast)
			}
		}
		if err := requiredRows.Err(); err != nil {
			http.Error(w, "プロジェクトホームの必要キャスト読み取りに失敗しました。", http.StatusInternalServerError)
			return
		}

		availabilityRows, err := db.QueryContext(r.Context(), `
SELECT
	 sc.id, sc.scene_name, cd.target_date, tsd.id, tsd.slot_name, tsd.start_time, tsd.end_time
FROM scenes sc
JOIN candidate_dates cd ON cd.project_id = sc.project_id
JOIN time_slots_def tsd ON tsd.project_id = sc.project_id
JOIN scene_allowed_time_slots sats ON sats.scene_id = sc.id AND sats.time_slot_id = tsd.id
JOIN scene_required_casts src ON src.scene_id = sc.id
JOIN cast_availabilities ca
	ON ca.candidate_date_id = cd.id
	AND ca.time_slot_id = tsd.id
	AND ca.cast_id = src.cast_id
	AND ca.is_available = 1
WHERE sc.project_id = ?
GROUP BY sc.id, cd.id, tsd.id
HAVING COUNT(DISTINCT ca.cast_id) = (
	SELECT COUNT(*) FROM scene_required_casts WHERE scene_id = sc.id
)
ORDER BY sc.id, cd.target_date, tsd.start_time`, projectID)
		if err != nil {
			slog.Error("プロジェクトホームの撮影可能日時取得に失敗しました。", "error", err, "project_id", projectID)
			http.Error(w, "プロジェクトホームの撮影可能日時取得に失敗しました。", http.StatusInternalServerError)
			return
		}
		defer availabilityRows.Close()
		for availabilityRows.Next() {
			var sceneID int
			var row models.SceneAvailabilityRow
			var startTime, endTime sql.NullString
			if err := availabilityRows.Scan(&sceneID, &row.SceneName, &row.TargetDate, &row.TimeSlotID, &row.SlotName, &startTime, &endTime); err != nil {
				http.Error(w, "プロジェクトホームの撮影可能日時読み取りに失敗しました。", http.StatusInternalServerError)
				return
			}
			row.SceneID = sceneID
			row.StartTime = startTime.String
			row.EndTime = endTime.String
			if index, ok := sceneIndex[sceneID]; ok {
				home.Scenes[index].Availabilities = append(home.Scenes[index].Availabilities, row)
			}
		}
		if err := availabilityRows.Err(); err != nil {
			http.Error(w, "プロジェクトホームの撮影可能日時読み取りに失敗しました。", http.StatusInternalServerError)
			return
		}

		response.RespondJSON(w, http.StatusOK, home)
	}
}

// [PUT] /api/projects/{projectId} : プロジェクトの更新
func HandleUpdateProject(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("projectId")
		var p models.Project
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			http.Error(w, "無効な要求様式です。", http.StatusBadRequest)
			return
		}

		// 入力バリデーション
		if err := validators.ValidateProject(p); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		_, err := db.ExecContext(r.Context(), "UPDATE projects SET title = ?, description = ? WHERE id = ?", p.Title, p.Description, id)
		if err != nil {
			slog.Error("プロジェクト更新に失敗しました。", "error", err, "project_id", id)
			http.Error(w, "プロジェクト更新に失敗しました。", http.StatusInternalServerError)
			return
		}

		// 監査ログ
		slog.Info("プロジェクトが更新されました。", "project_id", id, "title", p.Title)
		p.ID = id
		response.RespondJSON(w, http.StatusOK, p)
	}
}

// [DELETE] /api/projects/{projectId} : プロジェクトの削除
func HandleDeleteProject(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("projectId")

		// CASCADE制約があるため、関連するキャストやシーン情報も自動的に削除されます
		_, err := db.ExecContext(r.Context(), "DELETE FROM projects WHERE id = ?", id)
		if err != nil {
			slog.Error("プロジェクト削除に失敗しました。", "error", err, "project_id", id)
			http.Error(w, "プロジェクト削除に失敗しました。", http.StatusInternalServerError)
			return
		}

		// 監査ログ
		slog.Info("プロジェクトが削除されました。", "project_id", id)
		w.WriteHeader(http.StatusNoContent)
	}
}

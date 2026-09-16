package server

import (
	"database/sql"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/creatio313/movie_scheduler/internal/handlers"
	"github.com/creatio313/movie_scheduler/internal/middleware"
)

const DefaultPort = "8080"

// 振り分けを設定する
func SetupRouter(db *sql.DB) http.Handler {
	mux := http.NewServeMux()

	// ヘルスチェック用エンドポイント
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// API用エンドポイント
	// プロジェクトのCRUD
	mux.HandleFunc("POST /api/projects", handlers.HandleCreateProject(db))
	mux.HandleFunc("GET /api/projects/{projectId}", handlers.HandleGetProject(db))
	mux.HandleFunc("GET /api/projects/{projectId}/home", handlers.HandleGetProjectHome(db))
	mux.HandleFunc("PUT /api/projects/{projectId}", handlers.HandleUpdateProject(db))
	mux.HandleFunc("DELETE /api/projects/{projectId}", handlers.HandleDeleteProject(db))

	// キャストのCRUD
	mux.HandleFunc("POST /api/projects/{projectId}/casts", handlers.HandleCreateCast(db))
	mux.HandleFunc("GET /api/projects/{projectId}/casts", handlers.HandleListCastsByProject(db))
	mux.HandleFunc("PUT /api/projects/{projectId}/casts/{castId}", handlers.HandleUpdateCast(db))
	mux.HandleFunc("DELETE /api/projects/{projectId}/casts/{castId}", handlers.HandleDeleteCast(db))

	// シーンのCRUD
	mux.HandleFunc("POST /api/projects/{projectId}/scenes", handlers.HandleCreateScene(db))
	mux.HandleFunc("GET /api/projects/{projectId}/scenes", handlers.HandleListScenesByProject(db))
	mux.HandleFunc("PUT /api/projects/{projectId}/scenes/{sceneId}", handlers.HandleUpdateScene(db))
	mux.HandleFunc("DELETE /api/projects/{projectId}/scenes/{sceneId}", handlers.HandleDeleteScene(db))

	// 候補日のCRUD
	mux.HandleFunc("POST /api/projects/{projectId}/candidate-dates", handlers.HandleCreateCandidateDate(db))
	mux.HandleFunc("GET /api/projects/{projectId}/candidate-dates", handlers.HandleListCandidateDatesByProject(db))
	mux.HandleFunc("DELETE /api/projects/{projectId}/candidate-dates/{candidateDateId}", handlers.HandleDeleteCandidateDate(db))

	// 時間枠定義のCRUD
	mux.HandleFunc("POST /api/projects/{projectId}/time-slots", handlers.HandleCreateTimeSlotDef(db))
	mux.HandleFunc("GET /api/projects/{projectId}/time-slots", handlers.HandleListTimeSlotsDefByProject(db))
	mux.HandleFunc("PUT /api/projects/{projectId}/time-slots/{timeSlotId}", handlers.HandleUpdateTimeSlotDef(db))
	mux.HandleFunc("DELETE /api/projects/{projectId}/time-slots/{timeSlotId}", handlers.HandleDeleteTimeSlotDef(db))

	// シーン許可時間枠のCRUD
	mux.HandleFunc("GET /api/projects/{projectId}/scenes/{sceneId}/allowed-time-slots", handlers.HandleListSceneAllowedTimeSlotsByScene(db))
	mux.HandleFunc("PUT /api/projects/{projectId}/scenes/{sceneId}/allowed-time-slots/{timeSlotId}", handlers.HandleCreateSceneAllowedTimeSlot(db))
	mux.HandleFunc("DELETE /api/projects/{projectId}/scenes/{sceneId}/allowed-time-slots/{timeSlotId}", handlers.HandleDeleteSceneAllowedTimeSlot(db))

	// シーン必須キャストのCRUD
	mux.HandleFunc("GET /api/projects/{projectId}/scenes/{sceneId}/required-casts", handlers.HandleListSceneRequiredCastsByScene(db))
	mux.HandleFunc("PUT /api/projects/{projectId}/scenes/{sceneId}/required-casts/{castId}", handlers.HandleCreateSceneRequiredCast(db))
	mux.HandleFunc("DELETE /api/projects/{projectId}/scenes/{sceneId}/required-casts/{castId}", handlers.HandleDeleteSceneRequiredCast(db))

	// キャストの参加可能日時のCRUD
	mux.HandleFunc("GET /api/projects/{projectId}/casts/{castId}/availabilities", handlers.HandleListCastAvailabilitiesByCast(db))
	mux.HandleFunc("PUT /api/projects/{projectId}/casts/{castId}/availabilities/{candidateDateId}/{timeSlotId}", handlers.HandleUpdateCastAvailability(db))

	// CORSミドルウェアを適用
	return middleware.CORSMiddleware(mux)
}

// サーバを起動する
func Start(db *sql.DB) error {
	handler := SetupRouter(db)

	port := os.Getenv("PORT")
	if port == "" {
		port = DefaultPort
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	slog.Info("サーバを起動します...", "port", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("サーバが異常終了しました。", "error", err)
		return err
	}
	return nil
}

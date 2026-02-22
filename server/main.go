package main

import (
	"database/sql"
	"log/slog"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql" // MariaDB/MySQL用標準ドライバ

	"github.com/creatio313/movie_scheduler/internal/server"
)

func main() {
	// 1. ロガーの初期化
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// 2. データベース接続の設定
	// MariaDBのDSN例: user:password@tcp(192.168.x.x:3306)/dbname
	dbDsn := os.Getenv("DB_DSN")
	var db *sql.DB
	if dbDsn != "" {
		var err error
		// ドライバ名を "mysql" に指定
		db, err = sql.Open("mysql", dbDsn)
		if err != nil {
			slog.Error("DB connection failed", "error", err)
			os.Exit(1)
		}
		db.SetMaxOpenConns(25)
		db.SetMaxIdleConns(25)
		db.SetConnMaxLifetime(5 * time.Minute)
		defer db.Close()
	} else {
		slog.Warn("DB_DSN is not set, running without DB connection")
	}

	// 3. サーバーの起動
	if err := server.Start(db); err != nil {
		os.Exit(1)
	}
}

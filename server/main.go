package main

import (
	"database/sql"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"time"

	_ "github.com/go-sql-driver/mysql" // MariaDB/MySQL用標準ドライバ

	"github.com/creatio313/movie_scheduler/internal/secretmanager"
	"github.com/creatio313/movie_scheduler/internal/server"
)

func main() {
	// 1. ロガーの初期化
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// 2. データベース接続の設定
	var db *sql.DB
	var err error

	// シークレットマネージャからMariaDBのパスワードを取得できるようにする。
	vaultID := os.Getenv("SAKURA_VAULT_ID")
	secretName := os.Getenv("SAKURA_SECRET_NAME")
	zone := os.Getenv("SAKURA_API_ZONE")

	// MariaDB接続に必要な環境変数を取得。
	dbHost := os.Getenv("DB_HOST")
	dbPortRaw := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")
	dbUser := os.Getenv("DB_USER")

	if vaultID == "" {
		slog.Error("SAKURA_VAULT_IDは必須項目です。")
		os.Exit(1)
	}
	if dbHost == "" || dbPortRaw == "" || dbName == "" || dbUser == "" {
		slog.Error("DB_HOST, DB_PORT, DB_NAME, および DB_USER は必須項目です。")
		os.Exit(1)
	}

	dbPort, err := strconv.Atoi(dbPortRaw)
	if err != nil {
		slog.Error("DB_PORTは整数である必要があります。", "error", err)
		os.Exit(1)
	}

	client, err := secretmanager.NewSecretClient(vaultID, secretName, zone)
	if err != nil {
		slog.Error("シークレットマネージャのクライアント作成に失敗しました。", "error", err)
		os.Exit(1)
	}

	dbPassword, err := client.FetchDatabasePassword()
	if err != nil {
		slog.Error("シークレットマネージャからのMariaDBパスワード取得に失敗しました。", "error", err)
		os.Exit(1)
	}

	dbDsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s", dbUser, dbPassword, dbHost, dbPort, dbName)

	db, err = sql.Open("mysql", dbDsn)
	if err != nil {
		slog.Error("MariaDB接続に失敗しました。", "error", err)
		os.Exit(1)
	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	defer db.Close()

	// 3. サーバーの起動
	if err := server.Start(db); err != nil {
		os.Exit(1)
	}
}

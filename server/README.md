# 撮影計画支援電算処理システム - サーバー

Go 1.26で構築された REST API バックエンド。 MariaDB/MySQL をデータベースとして使用します。

## クイックスタート

### ビルド

```bash
cd server
go build
```

### 実行

```bash
export DB_DSN="user:password@tcp(localhost:3306)/movie_schedule"
export ALLOWED_ORIGIN="https://w32hlqto.user.webaccel.jp"  # 本番環境
./movie_scheduler
```

または開発環境の場合（CORSにワイルドカードを使用）：

```bash
export DB_DSN="user:password@tcp(localhost:3306)/movie_schedule"
# ALLOWED_ORIGIN を設定しない場合は "*" がデフォルト
./movie_scheduler
```

## 環境変数

| 変数名           | 必須 | デフォルト | 説明                                                                                                                     |
| ---------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `DB_DSN`         | ✅   | -          | MySQL/MariaDB接続文字列。形式: `user:password@tcp(host:port)/database`                                                   |
| `ALLOWED_ORIGIN` | ❌   | `*`        | CORS許可オリジン。本番環境では具体的なドメイン(例: `https://w32hlqto.user.webaccel.jp`)を指定。開発環境では未設定で`*`。 |
| `PORT`           | ❌   | `8080`     | リッスンポート                                                                                                           |

### 環境変数例

**開発環境（.env.local）**

```bash
DB_DSN=root:password@tcp(127.0.0.1:3306)/movie_schedule
# ALLOWED_ORIGIN は未設定（CORSが * になる）
PORT=8080
```

**本番環境**

```bash
DB_DSN=user:secure_password@tcp(db.example.com:3306)/movie_schedule
ALLOWED_ORIGIN=https://w32hlqto.user.webaccel.jp
PORT=8080
```

## API エンドポイント

全APIは `/api/` で始まります。詳細は各ハンドラーのコメントを参照してください。

### ヘルスチェック

- `GET /health` - サーバー稼働状態確認（JSON: `{"status":"ok"}` を返す）

### プロジェクト管理

- `POST /api/projects` - プロジェクト作成
- `GET /api/projects/{id}` - プロジェクト取得
- `PUT /api/projects/{id}` - プロジェクト更新
- `DELETE /api/projects/{id}` - プロジェクト削除

### キャスト管理

- `POST /api/casts` - キャスト作成
- `GET /api/casts/{id}` - キャスト取得
- `PUT /api/casts/{id}` - キャスト更新
- `DELETE /api/casts/{id}` - キャスト削除
- `GET /api/projects/{id}/casts` - プロジェクトのキャスト一覧

### シーン管理

- `POST /api/scenes` - シーン作成
- `GET /api/scenes/{id}` - シーン取得
- `PUT /api/scenes/{id}` - シーン更新
- `DELETE /api/scenes/{id}` - シーン削除
- `GET /api/projects/{id}/scenes` - プロジェクトのシーン一覧
- `GET /api/projects/{id}/scene_availabilities` - シーンの撮影可能日時一覧

### 撮影候補日管理

- `POST /api/candidate_dates` - 候補日作成
- `GET /api/candidate_dates/{id}` - 候補日取得
- `PUT /api/candidate_dates/{id}` - 候補日更新
- `DELETE /api/candidate_dates/{id}` - 候補日削除
- `GET /api/projects/{id}/candidate_dates` - プロジェクトの候補日一覧

### 時間枠管理

- `POST /api/time_slots_def` - 時間枠作成
- `GET /api/time_slots_def/{id}` - 時間枠取得
- `PUT /api/time_slots_def/{id}` - 時間枠更新
- `DELETE /api/time_slots_def/{id}` - 時間枠削除
- `GET /api/projects/{id}/time_slots_def` - プロジェクトの時間枠一覧

### シーン設定（許可時間枠）

- `POST /api/scene_allowed_time_slots` - 許可時間枠追加
- `GET /api/scene_allowed_time_slots/{id}` - 許可時間枠取得
- `DELETE /api/scene_allowed_time_slots/{id}` - 許可時間枠削除
- `GET /api/scenes/{id}/scene_allowed_time_slots` - シーンの許可時間枠一覧

### シーン設定（必要役者）

- `POST /api/scene_required_casts` - 必要役者追加
- `GET /api/scene_required_casts/{id}` - 必要役者取得
- `DELETE /api/scene_required_casts/{id}` - 必要役者削除
- `GET /api/scenes/{id}/scene_required_casts` - シーンの必要役者一覧

### キャスト出演可能日時管理

- `POST /api/cast_availabilities` - 可用性作成
- `GET /api/cast_availabilities/{id}` - 可用性取得
- `PUT /api/cast_availabilities/{id}` - 可用性更新
- `DELETE /api/cast_availabilities/{id}` - 可用性削除
- `GET /api/casts/{id}/cast_availabilities` - キャストの可用性一覧

## プロジェクト構成

```
server/
├── main.go                          # エントリーポイント
├── go.mod / go.sum                  # モジュール定義
├── internal/
│   ├── handlers/                    # HTTPハンドラー (CRUD操作)
│   │   ├── projects.go
│   │   ├── casts.go
│   │   ├── scenes.go
│   │   ├── candidate_dates.go
│   │   ├── time_slots_def.go
│   │   ├── scene_allowed_time_slots.go
│   │   ├── scene_required_casts.go
│   │   └── cast_availabilities.go
│   ├── models/
│   │   └── models.go                # データ構造体定義
│   ├── validators/
│   │   └── validators.go            # 入力バリデーション
│   ├── middleware/
│   │   ├── cors.go                  # CORSミドルウェア
│   │   ├── ratelimit.go             # レート制限ミドルウェア
│   ├── response/
│   │   └── response.go              # JSON レスポンスヘルパー
│   └── server/
│       └── server.go                # サーバー初期化・ルート設定
```

## セキュリティ機能

### 実装済み

- **SQLインジェクション対策**: 全プレースホルダー使用
- **CORS制御**: 環境変数で許可オリジン指定
- **入力バリデーション**: 型・長さ・フォーマットチェック
- **レート制限**: IPアドレスごとに10リクエスト/秒（バースト20）
- **タイムアウト設定**: Read/Write 10秒
- **エラー汎用化**: 内部エラー詳細を隠蔽、クライアントには汎用メッセージ
- **監査ログ**: CRUD操作はslogで記録
- **コネクションプール**: MaxOpenConns 25、MaxIdleConns 25

### 注意事項

- **認証・認可は未実装**: 規約にて説明が必要。本番環境では必ず認証機能を追加してください。

## ログ出力

サーバーはJSON形式でslogを使用してログを出力します。内容は標準出力（stdout）に送出されます。

**ログレベル**:

- `INFO`: 成功したCRUD操作（プロジェクト作成、シーン削除など）
- `WARN`: サーバー起動時にDB未接続時
- `ERROR`: DB接続エラー、バリデーション以外のエラー

**ログ例**:

```json
{"time":"2026-02-22T15:30:45Z","level":"INFO","msg":"Project created","project_id":"550e8400-e29b-41d4-a716-446655440000","title":"新作映画"}
{"time":"2026-02-22T15:31:12Z","level":"ERROR","msg":"Failed to fetch casts","error":"context deadline exceeded","project_id":"550e8400-e29b-41d4-a716-446655440000"}
```

## データベース

MariaDB 11.8.6 以上推奨。`table.sql` でスキーマを初期化してください。

**主な特性**:

- UTF-8mb4 文字コード対応
- 外部キー制約で参照整合性を確保（`ON DELETE CASCADE`）
- 複合ユニークキーで重複を防止

## 開発

### ビルド・実行

```bash
cd server
go mod tidy
go build
./movie_scheduler
```

### コード品質

- Go 1.22+ の新構文対応（`r.PathValue()` など）
- `go fmt` / `go vet` 推奨
- テストは未実装（別途対応推奨）

## トラブルシューティング

### "DB_DSN is not set"

DB接続文字列が設定されていません。環境変数を設定してください。

### CORS エラー

開発環境では `ALLOWED_ORIGIN` を設定せず（デフォルト `*`）、本番環境では具体的なドメインを指定してください。

### Too Many Requests（429）

レート制限に達しました。しばらく待機してから再度リクエストしてください。開発環境で邪魔な場合は、Goコード側で設定値を変更して再ビルドしてください。

## ライセンス

プロジェクト規約に準拠してください。

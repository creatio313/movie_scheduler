# 撮影計画支援電算処理システム

映像制作における撮影計画を支援するために作成したソース群です。
コードの大部分をAIで構築しているため、微細なバグが存在する可能性があります。

- Webフロントエンド：Next.js(SPA)
- APIサーバー：Go & Docker
- データベース：Maria DB
- 基盤：Terraformで構築

基盤に関しては、さくらのウェブアクセラレータ、オブジェクトストレージ、コンテナレジストリ、モニタリングスイートの４つのみ手動構築しています。
いずれも時間単位の課金ではないため、頻繁な構築・削除は望ましくありません。

# フロントエンド
通常のNext.jsに準じます。
webフォルダ直下に.env.localを作成し、以下のような設定が必要です。
```
# 開発環境ではローカルサーバーを使用
# 本番環境ではさくらのクラウドのサーバーURLに変更してください
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# OGP メタデータの base URL
# 開発環境：http://localhost:3000
# 本番環境：https://your-domain.com のように設定
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

# APIサーバー
## 環境変数

| 変数名                       | 必須 | デフォルト値 | 説明                                                                                                                     |
| ------------------------------ | ---- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `SAKURA_VAULT_ID`              | ❌   | -           | Sakura Cloud Secret Manager の Vault ID。設定時に Secret Manager から DB 認証情報を取得。                               |
| `SAKURA_ACCESS_TOKEN`          | 条件付き | -         | Sakura Cloud API トークン。`SAKURA_VAULT_ID` が設定された場合は必須。エンコードして Bearer 認証に使用。                |
| `SAKURA_ACCESS_TOKEN_SECRET`   | 条件付き | -         | Sakura Cloud API トークンシークレット。`SAKURA_VAULT_ID` が設定された場合は必須。`SAKURA_ACCESS_TOKEN` と共に Bearer 認証に使用。  |
| `SAKURA_SECRET_NAME`           | ❌   | `database_secret_value` | Sakura Secret 名。通常は Terraform デフォルト値を変更しないため設定不要。                                              |
| `DB_DSN`                  | ❌   | -          | MySQL/MariaDB接続文字列（Secret Managerが設定されていない場合のみ使用）。形式: `user:password@tcp(host:port)/database`  |
| `ALLOWED_ORIGIN`          | ❌   | `*`        | CORS許可オリジン。本番環境では具体的なドメイン(例: `https://w32hlqto.user.webaccel.jp`)を指定。開発環境では未設定で`*`。 |
| `PORT`                    | ❌   | `8080`     | リッスンポート                                                                                                           |

## 構築方法
Dockerイメージをbuildし、コンテナレジストリにpushします。
コンテナレジストリのURLとイメージのパスをTerraformの変数に設定、アクセスキーやウェブアクセラレータのホストURLも記載のうえ、Terraform applyしてください。

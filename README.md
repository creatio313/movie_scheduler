# 撮影計画支援電算処理システム

映像制作における撮影計画を支援するために作成したアプリケーションのソース群です。
記事化するために作成したリポジトリであり、実提供しているソースは[こちら](https://vps.seginus.jp/gitbucket/creatio313/mscheduler)で管理しています。

- Webフロントエンド：Next.js(SPA)
- APIサーバー：Go & Docker
- データベース：Maria DB
- 基盤：Terraformで構築

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

| 変数名                                      | 必須 | デフォルト値              | 説明                                                                                                  |
| ------------------------------------------- | ---- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `SAKURA_VAULT_ID`                           | ✅   | -                         | Sakura Cloud Secret Manager の Vault ID。DB パスワードの取得に使用。                                  |
| `SAKURA_SECRET_NAME`                        | ❌   | `database_secret_value`   | DB パスワードを格納した Sakura Secret の名前。Terraform では `movie_schedule_db_password` を指定。       |
| `SAKURA_API_ZONE`                            | ❌   | -                         | Sakura Cloud API のゾーン。設定する場合は Secret Manager クライアントの接続先として使用。              |
| `SAKURA_SERVICE_PRINCIPAL_RESOURCE_ID`      | 条件付き | -                    | Secret Manager にアクセスするサービスプリンシパルのリソース ID。                                      |
| `SAKURA_SERVICE_PRINCIPAL_KEY_ID`           | 条件付き | -                    | Secret Manager にアクセスするサービスプリンシパルキーの ID。                                          |
| `SAKURA_SERVICE_PRINCIPAL_PRIVATE_KEY`      | 条件付き | -                    | Secret Manager にアクセスするサービスプリンシパルキーの秘密鍵。                                        |
| `DB_HOST`                                   | ✅   | -                         | MariaDB ホスト。                                                                                      |
| `DB_PORT`                                   | ✅   | -                         | MariaDB ポート。整数で指定。                                                                          |
| `DB_NAME`                                   | ✅   | -                         | 接続先のデータベース名。                                                                              |
| `DB_USER`                                   | ✅   | -                         | MariaDB ユーザー名。                                                                                  |
| `ALLOWED_ORIGIN`                            | ❌   | `*`                       | CORS 許可オリジン。本番環境ではフロントエンドの URL を指定。未設定時は `*`。                           |
| `PORT`                                      | ❌   | `8080`                    | リッスンポート。                                                                                      |

## 構築方法
Dockerイメージをbuildし、コンテナレジストリにpushします。
サービスプリンシパルの作成、WireGuardの公開鍵取得を済ませたうえで、必要な値をTerraformの変数に設定、Terraform applyしてください。
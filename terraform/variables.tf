variable "access_token" {
  type        = string
  description = "プロジェクトのアクセストークン"
  sensitive   = true
}

variable "access_token_secret" {
  type        = string
  description = "プロジェクトのアクセストークンシークレット"
  sensitive   = true
}

variable "apprun_dedicated_lets_encrypt_email" {
  type        = string
  description = "AppRun専用クラスタのLet's Encrypt証明書用のメールアドレス"
  sensitive   = true
}

/**
 * 要変更
 */
variable "mscheduler_api_domain" {
  type        = string
  description = "APIのドメイン"
  default     = "mscheduler-api-demo.t-shirotani.jp"
}
variable "mscheduler_spa_domain" {
  type        = string
  description = "SPAのドメイン"
  default     = "mscheduler-spa-demo.t-shirotani.jp"
}

variable "container_password" {
  type        = string
  description = "コンテナレジストリのパスワード"
  sensitive   = true
}

/**
 * 要変更
 */
variable "container_registry_resource_id" {
  type        = string
  description = "コンテナレジストリのリソースID"
  default     = "113802145277"
}

variable "container_username" {
  type        = string
  description = "コンテナレジストリのユーザ名"
  sensitive   = true
}

variable "database_icon" {
  type        = string
  description = "データベースアイコンのID"
  default     = "113602453019"
}

variable "database_ip" {
  type        = string
  description = "データベースに割り当てられるIPアドレス"
  default     = "192.168.1.11"
}

variable "database_password" {
  type        = string
  description = "データベースのパスワード"
  sensitive   = true
}

variable "database_port" {
  type        = number
  description = "データベースのポート番号"
  sensitive   = true
}

variable "database_source_ranges" {
  type        = list(string)
  description = "データベースアクセスを許可する送信元CIDR範囲"
  default     = ["192.168.1.64/26", "10.0.0.2/32"]
}

variable "database_username" {
  type        = string
  description = "データベースのユーザ名"
  default     = "movie_schedule"
}

/**
 * 要変更
 */
variable "mscheduler_image" {
  type        = string
  description = "API用のDockerイメージ"
  default     = "mscheduler-api:latest"
}

/**
 * 要変更
 */
variable "sakura_service_principal_for_secret_unveil_resource_id" {
  type        = string
  description = "シークレットマネージャ実行権限を持つサービスプリンシパルのリソースID"
  default     = "113802145185"
}

/**
 * 要変更
 */
variable "sakura_service_principal_key_for_secret_unveil_id" {
  type        = string
  description = "シークレットマネージャ実行権限を持つサービスプリンシパルキーのキーID"
  default     = "NF30CDUX96-b_yZkbsBLRZP1UwJTqseLt1g1qs_Re3k"
}

variable "sakura_service_principal_private_key_for_secret_unveil" {
  type        = string
  description = "シークレットマネージャ実行権限を持つサービスプリンシパルキーの秘密鍵"
  sensitive   = true
}

variable "seg_internal_ip" {
  type        = string
  description = "SEGに割り当てられる内部IPアドレス"
  default     = "192.168.1.2"
}

variable "server_icon" {
  type        = string
  description = "サーバーアイコンのID"
  default     = "112901627749"
}

/**
 * 要変更
 */
variable "service_principal_id" {
  type        = string
  description = "サービスプリンシパルのID（AppRun）"
  default     = "113802145182"
}

variable "vpn_icon" {
  type        = string
  description = "VPNルータのアイコンのID"
  default     = "112300511393"
}

variable "vpn_internal_ip" {
  type        = string
  description = "VPNルータに割り当てられる内部IPアドレス"
  default     = "192.168.1.1"
}

variable "vpn_peer_public_key" {
  type        = string
  description = "WireGuardピアの公開鍵"
  sensitive   = true
}

variable "zone" {
  type        = string
  description = "リソースを構築するゾーン"
  default     = "is1c"
}
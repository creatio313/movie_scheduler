resource "sakura_kms" "database_key" {
  name        = "database_key"
  description = "KMS key for encrypting database disks."
  key_origin  = "generated"
}

resource "sakura_secret_manager" "database_secret" {
  name        = "database_secret"
  description = "Secret for database credentials."
  kms_key_id  = sakura_kms.database_key.id
}

resource "sakura_secret_manager_secret" "database_secret_value" {
  name     = "database_secret_value"
  vault_id = sakura_secret_manager.database_secret.id
  value_wo = jsonencode({
    database_name = var.database_database_name
    host          = var.database_ip
    port          = 3306
    username      = var.database_username
    password      = var.database_password
  })
  value_wo_version = 1
}

resource "sakura_switch" "switch_for_database" {
  name        = "データベース接続用スイッチ"
  description = "AppRun専有型のワーカーノードとデータベースを接続するためのスイッチ。"

  icon_id = var.database_icon
  zone    = var.zone
}
//あとでデータベース名
resource "sakura_database" "movie_scheduler_database" {
  name        = "movie_scheduler_database"
  description = "Movie scheduler database for AppRun."

  backup = {
    days_of_week = ["mon"]
    time         = "04:00"
  }

  network_interface = {
    vswitch_id    = sakura_switch.switch_for_database.id
    ip_address    = var.database_ip
    netmask       = 24
    gateway       = var.database_gateway
    port          = 3306
    source_ranges = var.database_source_ranges
  }

  username            = var.database_username
  password_wo         = var.database_password
  password_wo_version = 1

  database_type    = "mariadb"
  database_version = "10.11"
  disk = {
    encryption_algorithm = "aes256_xts"
    kms_key_id           = sakura_kms.database_key.id
  }
  icon_id = var.database_icon
  monitoring_suite = {
    enabled = true
  }
  //あとで検証
  parameters = {
    max_connections = 100
  }
  plan = "10g"
  zone = var.zone
}
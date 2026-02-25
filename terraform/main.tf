resource "sakura_container_registry" "movie_scheduler_registry" {
  name            = "撮影計画支援電算システム"
  subdomain_label = "movie-scheduler-reg"
  access_level    = "none"

  description = "撮影計画支援電算処理システムのDockerイメージを格納するためのコンテナレジストリ。"
  icon_id     = var.server_icon

  user = [
    {
      name       = var.container_username
      password   = var.container_password
      permission = "all"
    }
  ]
}

resource "sakura_apprun_shared" "movie_scheduler_api" {
  name = "movie-scheduler-api"

  components = [{
    name       = "movie-scheduler-api"
    max_cpu    = 0.5
    max_memory = "1Gi"
    deploy_source = {
      container_registry = {
        image               = var.container_image
        username            = tolist(sakura_container_registry.movie_scheduler_registry.user)[0].name
        password_wo         = tolist(sakura_container_registry.movie_scheduler_registry.user)[0].password
        password_wo_version = 1
        server              = sakura_container_registry.movie_scheduler_registry.fqdn
      }
    }
    env = [{
      key   = "SAKURA_ACCESS_TOKEN"
      value = var.secret_access_token
      },
      {
        key   = "SAKURA_ACCESS_TOKEN_SECRET"
        value = var.secret_access_token_secret
      },
      {
        key   = "SAKURA_SECRET_NAME"
        value = sakura_secret_manager_secret.database_secret_value.name
      },
      {
        key   = "SAKURA_VAULT_ID"
        value = sakura_secret_manager.database_secret.id
      },
      {
        key   = "ALLOWED_ORIGIN"
        value = var.allowed_origin
      }
    ]
    probe = {
      http_get = {
        path = "/health"
        port = 8080
      }
    }
  }]

  min_scale       = 1
  max_scale       = 2
  port            = 8080
  timeout_seconds = 60
}

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
    database_name = var.database_username
    host          = sakura_vpn_router.standard_vpn_router.public_ip
    port          = var.database_port
    username      = var.database_username
    password      = var.database_password
  })
  value_wo_version = 1
}

resource "sakura_vswitch" "switch_for_database" {
  name        = "データベース接続用スイッチ"
  description = "VPNルータとデータベースを接続するためのスイッチ。"

  icon_id = var.database_icon
  zone    = var.zone
}

resource "sakura_database" "movie_scheduler_database" {
  name        = "movie_scheduler_database"
  description = "Movie scheduler database for AppRun."

  backup = {
    days_of_week = ["mon"]
    time         = "04:00"
  }

  network_interface = {
    vswitch_id = sakura_vswitch.switch_for_database.id
    ip_address = var.database_ip
    netmask    = 24
    gateway    = sakura_vpn_router.standard_vpn_router.private_network_interface[0].ip_addresses[0]
    port       = var.database_port
    # AppRunの送信元IPに応じて適宜変更。
    # source_ranges = var.database_source_ranges
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
  # 基盤が弱いため、キャッシュはOFFにする
  parameters = {
    event_scheduler              = "OFF"
    innodb_buffer_pool_size      = 134217728
    log_warnings                 = 2
    long_query_time              = 10
    max_allowed_packet           = 16777216
    max_connections              = 100
    query_alloc_block_size       = 8192
    query_cache_limit            = 1048576
    query_cache_min_res_unit     = 4096
    query_cache_size             = 536870912
    query_cache_type             = 0
    query_cache_wlock_invalidate = "OFF"
    query_prealloc_size          = 8192
    slow_query_log               = "ON"
    sort_buffer_size             = 2097152
    sql_mode                     = "STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"
    tmpdir                       = "/tmp"
  }
  plan = "10g"
  zone = var.zone
}

resource "sakura_vpn_router" "standard_vpn_router" {
  name        = "standard_vpn_router"
  description = "VPN router for connecting to the database securely."

  firewall = [{
    interface_index = 0
    direction       = "receive"
    expression = [{
      protocol = "tcp"
      # AppRunの送信元IPに応じて適宜変更。
      source_network   = "0.0.0.0/0"
      destination_port = var.database_port
      allow            = true
      logging          = true
      description      = "Allow AppRun to access the database"
      },
      {
        protocol         = "tcp"
        source_network   = var.database_operator_global_ip
        destination_port = "443"
        allow            = true
        logging          = true
        description      = "Allow HTTPS access for database operator"
      },
      {
        protocol    = "ip"
        allow       = false
        logging     = true
        description = "Deny all other traffic"
    }]
  }]

  icon_id             = var.vpn_icon
  internet_connection = true

  monitoring_suite = {
    enabled = true
  }

  plan = "standard"

  port_forwarding = [{
    protocol     = "tcp"
    public_port  = var.database_port
    private_ip   = var.database_ip
    private_port = var.database_port
    description  = "Allow AppRun to access the database."
    },
    {
      protocol     = "tcp"
      public_port  = 443
      private_ip   = var.database_ip
      private_port = 443
      description  = "Allow HTTPS access for database operator."
  }]

  private_network_interface = [{
    index        = 1
    vswitch_id   = sakura_vswitch.switch_for_database.id
    ip_addresses = [var.vpn_internal_ip]
    netmask      = 24
  }]

  scheduled_maintenance = {
    day_of_week = "mon"
    hour        = 4
  }

  version = 2
  zone    = var.zone
}

# Outputs for the application
output "database_secret_vault_id" {
  description = "The Vault ID of the database secret for Secret Manager"
  value       = sakura_secret_manager.database_secret.id
}

output "database_secret_name" {
  description = "The name of the database secret"
  value       = sakura_secret_manager_secret.database_secret_value.name
}
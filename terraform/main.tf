resource "sakura_container_registry" "movie_scheduler_registry" {
  name        = "撮影計画支援電算システムAPI"
  description = "撮影計画支援電算処理システムAPIのDockerイメージを格納するためのコンテナレジストリ。"

  subdomain_label = "movie-scheduler-reg-beta"
  access_level    = "none"
  icon_id         = var.server_icon

  user = [
    {
      name       = var.container_username
      password   = var.container_password
      permission = "all"
    }
  ]
}

resource "sakura_kms" "database_key" {
  name        = "データベース認証用シークレット暗号鍵"
  description = "データベースのディスクおよびデータベース認証用シークレットを暗号化するためのKMS鍵。"
  key_origin  = "generated"
}

resource "sakura_secret_manager" "database_secret" {
  name        = "データベース認証用シークレット"
  description = "データベース認証用シークレットを格納するためのシークレット保管庫。"
  kms_key_id  = sakura_kms.database_key.id
}

resource "sakura_secret_manager_secret" "database_secret_value" {
  name     = "database_secret_value"
  vault_id = sakura_secret_manager.database_secret.id
  value_wo = jsonencode({
    database_name = var.database_username
    host          = var.database_ip
    port          = var.database_port
    username      = var.database_username
    password      = var.database_password
  })
  value_wo_version = 1
}

resource "sakura_packet_filter" "apprun_lb_eth" {
  name        = "Webサーバー用パケットフィルタ"
  description = "Webサーバー用のパケットフィルタ。非HTTPアクセスをブロックするためのフィルタルールを定義。"

  zone = var.zone
}

resource "sakura_packet_filter_rules" "apprun_lb_eth_rules" {
  packet_filter_id = sakura_packet_filter.apprun_lb_eth.id
  zone             = var.zone

  expression = [
    # 外部からのWebアクセス許可
    {
      protocol         = "tcp"
      destination_port = "80"
    },
    {
      protocol         = "tcp"
      destination_port = "443"
    },
    # 自発的な外部通信（API呼び出し等）の戻りパケットを許可（エフェメラルポート）
    {
      protocol         = "tcp"
      destination_port = "32768-65535"
    },
    {
      protocol         = "udp"
      destination_port = "32768-65535"
    },
    # ICMPとフラグメントは許可（必要な通信のため）
    {
      protocol = "icmp"
    },
    {
      protocol = "fragment"
    },
    # 上記以外をすべて拒否 (さくらのクラウドはデフォルト許可のため必須)
    {
      protocol    = "ip"
      allow       = false
      description = "Deny ALL"
    }
  ]
}

resource "sakura_packet_filter" "lb_switch" {
  name        = "Webサーバ内部NIC用パケットフィルタ"
  description = "Webサーバー内部NIC用のパケットフィルタ。内部通信を制御するためのフィルタルールを定義。"

  zone = var.zone
}

resource "sakura_packet_filter_rules" "lb_switch_rules" {
  packet_filter_id = sakura_packet_filter.lb_switch.id
  zone             = var.zone

  expression = [
    # APIサーバからのアクセス許可
    {
      protocol       = "ip"
      source_network = "192.168.1.64/26"
    },
    # 自発的な外部通信（API呼び出し等）の戻りパケットを許可（エフェメラルポート）
    {
      protocol         = "tcp"
      destination_port = "32768-65535"
    },
    {
      protocol         = "udp"
      destination_port = "32768-65535"
    },
    # ICMPとフラグメントは許可（必要な通信のため）
    {
      protocol = "icmp"
    },
    {
      protocol = "fragment"
    },
    # 上記以外をすべて拒否 (さくらのクラウドはデフォルト許可のため必須)
    {
      protocol    = "ip"
      allow       = false
      description = "Deny ALL"
    }
  ]
}

resource "sakura_packet_filter" "worker_switch" {
  name        = "APIサーバ用パケットフィルタ"
  description = "APIサーバ用のパケットフィルタ。内部通信を制御するためのフィルタルールを定義。"
}

resource "sakura_packet_filter_rules" "worker_switch_rules" {
  packet_filter_id = sakura_packet_filter.worker_switch.id
  zone             = var.zone

  expression = [
    # ロードバランサからのアクセスを許可
    {
      protocol         = "tcp"
      source_network   = "192.168.1.128/26"
      destination_port = "8080"
    },
    {
      protocol         = "tcp"
      destination_port = "32768-65535"
    },
    {
      protocol         = "udp"
      destination_port = "32768-65535"
    },
    # ICMPとフラグメントは許可（必要な通信のため）
    {
      protocol = "icmp"
    },
    {
      protocol = "fragment"
    },
    # 上記以外をすべて拒否 (さくらのクラウドはデフォルト許可のため必須)
    {
      protocol    = "ip"
      allow       = false
      description = "Deny ALL"
    }
  ]
}

resource "sakura_vswitch" "switch_for_database" {
  name        = "データベース接続用スイッチ"
  description = "VPNルータとデータベースを接続するためのスイッチ。"

  icon_id = var.database_icon
  zone    = var.zone
}

resource "sakura_database" "movie_scheduler_database" {
  name        = "撮影計画支援電算システムデータベース"
  description = "撮影計画支援電算システムデータベース。MariaDB 10.11を使用。"

  backup = {
    days_of_week = ["mon"]
    time         = "04:00"
  }

  network_interface = {
    vswitch_id    = sakura_vswitch.switch_for_database.id
    ip_address    = var.database_ip
    netmask       = 24
    gateway       = sakura_vpn_router.standard_vpn_router.private_network_interface[0].ip_addresses[0]
    port          = var.database_port
    source_ranges = concat(var.database_source_ranges, ["${var.database_operator_global_ip}"])
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
  name        = "外部接続用VPNルータ"
  description = "外部接続用VPNルータ。データベースへの安全な接続を提供。"

  firewall = [{
    interface_index = 0
    direction       = "receive"
    expression = [
      {
        protocol         = "tcp"
        source_network   = var.database_operator_global_ip
        destination_port = "443"
        allow            = true
        logging          = true
        description      = "データベースオペレーターのHTTPSアクセスを許可"
      },
      {
        protocol    = "ip"
        allow       = false
        logging     = true
        description = "他トラフィックを拒否"
    }]
  }]

  icon_id             = var.vpn_icon
  internet_connection = true

  monitoring_suite = {
    enabled = true
  }

  plan = "standard"

  port_forwarding = [
    {
      protocol     = "tcp"
      public_port  = 7777
      private_ip   = var.database_ip
      private_port = 443
      description  = "データベースオペレーターのHTTPSアクセスを許可"
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
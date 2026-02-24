data "sakura_archive" "ubuntu" {
  os_type = "ubuntu2404"
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
    host          = var.database_ip
    port          = 3306
    username      = var.database_username
    password      = var.database_password
  })
  value_wo_version = 1
}

resource "sakura_vswitch" "switch_for_database" {
  name        = "データベース接続用スイッチ"
  description = "AppRun専有型のワーカーノードとデータベースを接続するためのスイッチ。"

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
    vswitch_id    = sakura_vswitch.switch_for_database.id
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
resource "sakura_disk" "database_management_server_disk" {
  name        = "database_management_server_disk"
  description = "Disk for the database management server."

  connector            = "virtio"
  encryption_algorithm = "aes256_xts"
  icon_id              = var.ubuntu_icon
  kms_key_id           = sakura_kms.database_key.id
  plan                 = "ssd"
  size                 = 20
  source_archive_id    = data.sakura_archive.ubuntu.id
  zone                 = var.zone
}

resource "sakura_packet_filter" "minimum_filter" {
  name        = "minimum_filter"
  description = "Minimum packet filter for the database management server(SSH)."
  zone        = var.zone
}

resource "sakura_packet_filter_rules" "minimum_rules" {
  packet_filter_id = sakura_packet_filter.minimum_filter.id
  zone             = var.zone

  expression = [
    {
      description      = "Allow SSH access. Limit source IP addresses, if needed."
      destination_port = "22"
      protocol         = "tcp"
      source_network   = "0.0.0.0/0"
    },
    {
      protocol       = "udp"
      source_port    = "123"
      source_network = "0.0.0.0/0"
    },
    {
      protocol         = "udp"
      destination_port = "68"
    },
    {
      protocol = "icmp"
    },
    {
      protocol         = "tcp"
      destination_port = "32768-61000"
    },
    {
      protocol         = "udp"
      destination_port = "32768-61000"
    },
    {
      protocol = "fragment"
    },
    {
      protocol    = "ip"
      allow       = false
      description = "Deny all except above rules."
    }
  ]
}

resource "sakura_packet_filter" "database_filter" {
  name        = "database_filter"
  description = "Packet filter for the database management server(toDB)."
  zone        = var.zone
}

resource "sakura_packet_filter_rules" "database_rules" {
  packet_filter_id = sakura_packet_filter.database_filter.id
  zone             = var.zone

  expression = [
    {
      protocol         = "tcp"
      destination_port = "32768-61000"
      source_network   = var.database_source_ranges[0]
    },
    {
      description    = "Allow ICMP from DB for troubleshooting."
      protocol       = "icmp"
      source_network = var.database_source_ranges[0]
    },
    {
      description = "Allow IPv4 fragments (rare but harmless for return traffic)."
      protocol    = "fragment"
    },
    {
      description = "Deny all except above rules."
      protocol    = "ip"
      allow       = false
    }
  ]
}

resource "sakura_script" "mariadb_install_script" {
  name    = "mariadb_install_script"
  class   = "shell"
  content = file("scripts/install_mariadb_client.sh")
  icon_id = var.ubuntu_icon
}

# Generate a temporary SSH key pair for the server.
resource "tls_private_key" "temporary_ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Save the private key to a local file. Please save it securely, as it will be needed to access the server.
resource "local_sensitive_file" "private_key_file" {
  content  = tls_private_key.temporary_ssh_key.private_key_pem
  filename = ".ssh/id_rsa.pem"
}

resource "sakura_ssh_key" "database_management_server_ssh_key" {
  name        = "database_management_server_sshkey"
  description = "SSH key for the database management server."
  public_key  = tls_private_key.temporary_ssh_key.public_key_openssh
}

resource "sakura_server" "database_management_server" {
  name        = "database_management_server"
  description = "Server for the database management."

  core             = 1
  disks            = [sakura_disk.database_management_server_disk.id]
  icon_id          = var.ubuntu_icon
  interface_driver = "virtio"
  memory           = 1
  tags             = ["@keyboard-us"]
  zone             = var.zone

  disk_edit_parameter = {
    hostname            = "ubuntuhost"
    password_wo         = var.os_password
    password_wo_version = 1
    disable_pw_auth     = true

    ssh_key_ids = [sakura_ssh_key.database_management_server_ssh_key.id]
    script = [{
      id = sakura_script.mariadb_install_script.id
    }]
  }

  network_interface = [{
    upstream         = "shared"
    packet_filter_id = sakura_packet_filter.minimum_filter.id
    },
    {
      upstream         = sakura_vswitch.switch_for_database.id
      packet_filter_id = sakura_packet_filter.database_filter.id
      user_ip_address  = "192.168.100.11"
  }]
}
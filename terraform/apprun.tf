data "sakura_apprun_dedicated_worker_service_classes" "mscheduler" {}
data "sakura_apprun_dedicated_lb_service_classes" "mscheduler" {}

resource "sakura_apprun_dedicated_cluster" "mscheduler_cluster" {
  name                 = "MSCHEDULER_API"
  service_principal_id = var.service_principal_id
  lets_encrypt_email   = var.apprun_dedicated_lets_encrypt_email

  ports = [
    {
      port     = 80
      protocol = "http"
    },
    {
      port     = 443
      protocol = "https"
    },
  ]
}

resource "sakura_apprun_dedicated_auto_scaling_group" "mscheduler_group" {
  cluster_id = sakura_apprun_dedicated_cluster.mscheduler_cluster.id
  interfaces = [{
    connects_to_lb  = true
    interface_index = 0
    upstream        = sakura_vswitch.switch_for_database.id
    default_gateway = var.vpn_internal_ip
    ip_pool = [{
      start = "192.168.1.64"
      end   = "192.168.1.127"
    }]
    netmask          = 24
    packet_filter_id = sakura_packet_filter.worker_switch.id
  }]
  max_nodes                 = 3
  min_nodes                 = 1
  name                      = "API_AUTO_SCALING"
  worker_service_class_path = data.sakura_apprun_dedicated_worker_service_classes.mscheduler.classes[0].path
  zone                      = var.zone
  name_servers              = sakura_seg.seg_for_apprun_dedicated.server_ip_addresses
}

resource "sakura_apprun_dedicated_lb" "mscheduler_lb" {
  auto_scaling_group_id = sakura_apprun_dedicated_auto_scaling_group.mscheduler_group.id
  cluster_id            = sakura_apprun_dedicated_cluster.mscheduler_cluster.id

  interfaces = [{
    interface_index  = 0
    upstream         = "shared"
    packet_filter_id = sakura_packet_filter.apprun_lb_eth.id
    },
    {
      interface_index = 1
      upstream        = sakura_vswitch.switch_for_database.id
      default_gateway = var.vpn_internal_ip
      ip_pool = [{
        start = "192.168.1.128"
        end   = "192.168.1.254"
      }]
      netmask          = 24
      packet_filter_id = sakura_packet_filter.lb_switch.id
  }]

  name               = "API_LOAD_BALANCER"
  service_class_path = data.sakura_apprun_dedicated_lb_service_classes.mscheduler.classes[1].path
}

resource "sakura_apprun_dedicated_application" "mscheduler_app" {
  cluster_id = sakura_apprun_dedicated_cluster.mscheduler_cluster.id
  name       = "MSCHEDULER_API"
}

resource "sakura_apprun_dedicated_version" "mscheduler" {
  application_id = sakura_apprun_dedicated_application.mscheduler_app.id
  cpu            = 1000
  memory         = 512
  image          = "${data.sakura_container_registry.mscheduler_container_registry.fqdn}/${var.mscheduler_image}"
  scaling_mode   = "cpu"
  env_vars = [
    {
      key   = "ALLOWED_ORIGIN"
      value = "https://${var.mscheduler_spa_domain}"
    },
    {
      key   = "SAKURA_VAULT_ID"
      value = sakura_secret_manager.database_secret.id
    },
    {
      key   = "SAKURA_SECRET_NAME"
      value = "movie_schedule_db_password"
    },
    {
      key   = "SAKURA_SERVICE_PRINCIPAL_RESOURCE_ID"
      value = var.sakura_service_principal_for_secret_unveil_resource_id
    },
    {
      key   = "SAKURA_SERVICE_PRINCIPAL_KEY_ID"
      value = var.sakura_service_principal_key_for_secret_unveil_id
    },
    {
      key   = "DB_HOST"
      value = var.database_ip
    },
    {
      key   = "DB_PORT"
      value = var.database_port
    },
    {
      key   = "DB_NAME"
      value = var.database_username
    },
    {
      key   = "DB_USER"
      value = var.database_username
    }
  ]
  secret_vars = [
    {
      key    = "SAKURA_SERVICE_PRINCIPAL_PRIVATE_KEY"
      secret = true
      value  = var.sakura_service_principal_private_key_for_secret_unveil
    },
  ]
  exposed_ports = [
    {
      target_port = 8080
      health_check = {
        interval_seconds = 30
        path             = "/healthz"
        timeout_seconds  = 5
      }
      host             = [var.mscheduler_api_domain]
      lb_port          = 443
      use_lets_encrypt = true
    },
  ]
  max_scale           = 3
  min_scale           = 1
  registry_password   = var.container_password
  registry_username   = var.container_username
  scale_in_threshold  = 30
  scale_out_threshold = 60
}
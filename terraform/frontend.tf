data "sakura_object_storage_site" "ishikari" {
  display_name = "石狩第1サイト"
}

resource "sakura_object_storage_bucket" "mscheduler_spa_bucket" {
  name    = "mscheduler-spa-202609"
  site_id = data.sakura_object_storage_site.ishikari.id
}

resource "sakura_object_storage_permission" "mscheduler_spa_bucket_r_permission" {
  name = "撮影計画支援電算処理システムバケットRead権限"
  bucket_controls = [{
    bucket    = sakura_object_storage_bucket.mscheduler_spa_bucket.name
    can_read  = true
    can_write = false
  }]
  site_id = data.sakura_object_storage_site.ishikari.id
}

resource "sakura_object_storage_permission" "mscheduler_spa_bucket_rw_permission" {
  name = "撮影計画支援電算処理システムバケットReadWrite権限"
  bucket_controls = [{
    bucket    = sakura_object_storage_bucket.mscheduler_spa_bucket.name
    can_read  = true
    can_write = true
  }]
  site_id = data.sakura_object_storage_site.ishikari.id
}

resource "sakura_webaccel" "mscheduler_spa_webaccel" {
  name             = "撮影計画支援電算処理システムのWebページ"
  domain_type      = "own_domain"
  domain           = var.mscheduler_spa_domain
  request_protocol = "https-redirect"
  origin_parameters = {
    type                   = "bucket"
    access_key_wo          = sakura_object_storage_permission.mscheduler_spa_bucket_r_permission.access_key
    secret_access_key_wo   = sakura_object_storage_permission.mscheduler_spa_bucket_r_permission.secret_key
    bucket_name            = sakura_object_storage_bucket.mscheduler_spa_bucket.name
    credentials_wo_version = 1
    use_document_index     = true
    endpoint               = join("", ["s3.", data.sakura_object_storage_site.ishikari.endpoint])
    region                 = data.sakura_object_storage_site.ishikari.region
  }

  # 実運用では別バケットに保存すること
  logging = {
    enabled                = true
    bucket_name            = sakura_object_storage_bucket.mscheduler_spa_bucket.name
    access_key_wo          = sakura_object_storage_permission.mscheduler_spa_bucket_rw_permission.access_key
    secret_access_key_wo   = sakura_object_storage_permission.mscheduler_spa_bucket_rw_permission.secret_key
    credentials_wo_version = 1
    endpoint               = join("", ["s3.", data.sakura_object_storage_site.ishikari.endpoint])
    region                 = data.sakura_object_storage_site.ishikari.region
  }
  default_cache_ttl = 334
  normalize_ae      = "gzip"
}
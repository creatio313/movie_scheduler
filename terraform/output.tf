output "wire_guard_public_key" {
  description = "VPNルータのWireGuard公開鍵"
  value       = sakura_vpn_router.standard_vpn_router.wire_guard.public_key
}

output "vpn_public_ip" {
  description = "VPNルータのパブリックIPアドレス"
  value       = sakura_vpn_router.standard_vpn_router.public_ip
}

output "objst_access_key" {
  description = "オブジェクトストレージのアクセスキー"
  value       = sakura_object_storage_permission.mscheduler_spa_bucket_rw_permission.access_key
  sensitive   = true
}

output "objst_secret_key" {
  description = "オブジェクトストレージのシークレットアクセスキー"
  value       = sakura_object_storage_permission.mscheduler_spa_bucket_rw_permission.secret_key
  sensitive   = true
}

output "webaccel_cname" {
  description = "ウェブアクセラレータ向けに設定するCNAMEレコードの値"
  value       = sakura_webaccel.mscheduler_spa_webaccel.cname_record_value
}
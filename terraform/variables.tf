variable "access_token" {
  type        = string
  description = "Access token of the project."
  sensitive   = true
}
variable "access_token_secret" {
  type        = string
  description = "Access token secret of the project"
  sensitive   = true
}
variable "container_username" {
  type        = string
  description = "Username"
  sensitive   = true
}
variable "container_password" {
  type        = string
  description = "Password"
  sensitive   = true
}
variable "database_icon" {
  type        = string
  description = "ID of the database icon."
  default     = "113602453019"
}
variable "database_ip" {
  type        = string
  description = "IP address of the database."
  default     = "192.168.1.11"
}
variable "database_operator_global_ip" {
  type        = string
  description = "Global IP address of the database operator."
  sensitive   = true
}
variable "database_port" {
  type        = number
  description = "Port number for the database."
  sensitive   = true
}
variable "database_username" {
  type        = string
  description = "Username for the database."
  default     = "movie_schedule"
}
variable "database_password" {
  type        = string
  description = "Password for the database."
  sensitive   = true
}
variable "database_source_ranges" {
  type        = list(string)
  description = "Allowed source CIDR ranges for database access."
  default     = ["192.168.1.0/24"]
}
variable "server_icon" {
  type        = string
  description = "ID of the server icon."
  default     = "112901627749"
}
variable "vpn_icon" {
  type        = string
  description = "ID of the VPN icon."
  default     = "112300511393"
}
variable "vpn_internal_ip" {
  type        = string
  description = "Internal IP for the VPN."
  default     = "192.168.1.1"
}
variable "zone" {
  type        = string
  description = "Zone to build resources."
  default     = "is1c"
}
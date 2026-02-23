variable "access_token" {
  type        = string
  description = "Access token of the project."
}
variable "access_token_secret" {
  type        = string
  description = "Access token secret of the project"
  sensitive   = true
}
//あとでデータベース名確認
variable "database_database_name" {
  type        = string
  description = "Database name for the database."
  default     = "movie_schedule"
}
variable "database_gateway" {
  type        = string
  description = "Gateway for the database subnet."
  default     = "192.168.100.1"
}
variable "database_icon" {
  type        = string
  description = "ID of the database icon."
  default     = "113602453019"
}
variable "database_ip" {
  type        = string
  description = "IP address of the database."
  default     = "192.168.100.10"
}
variable "database_username" {
  type        = string
  description = "Username for the database."
  default     = "default_user"
}
variable "database_password" {
  type        = string
  description = "Password for the database."
  sensitive   = true
}
variable "database_source_ranges" {
  type        = list(string)
  description = "Allowed source CIDR ranges for database access."
  default     = ["192.168.100.0/24"]
}
variable "zone" {
  type        = string
  description = "Zone to build resources."
  default     = "is1a"
}
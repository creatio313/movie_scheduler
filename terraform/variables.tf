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
  default     = ["192.168.100.0/24"]
}
variable "os_password" {
  type        = string
  description = "OS password of the server."
  sensitive   = true
}
variable "ubuntu_icon" {
  type        = string
  description = "ID of the ubuntu icon."
  default     = "112901627751"
}
variable "zone" {
  type        = string
  description = "Zone to build resources."
  default     = "is1c"
}
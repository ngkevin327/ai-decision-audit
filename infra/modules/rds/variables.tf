variable "environment" {
  type        = string
  description = "Deployment environment name"
}

variable "db_name" {
  type        = string
  description = "Initial database name"
  default     = "audit_trail"
}

variable "instance_class" {
  type        = string
  description = "RDS instance class"
  default     = "db.t4g.micro"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Subnet IDs for the DB subnet group"
}

variable "vpc_security_group_ids" {
  type        = list(string)
  description = "Security groups attached to the RDS instance"
}

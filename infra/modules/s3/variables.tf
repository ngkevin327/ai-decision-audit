variable "environment" {
  type        = string
  description = "Deployment environment name"
}

variable "bucket_name" {
  type        = string
  description = "Globally unique bucket name for trace payloads"
}

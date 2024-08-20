variable "aws_region" {
  type        = string
  description = "AWS region for staging resources"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Environment label"
  default     = "staging"
}

variable "payload_bucket_name" {
  type        = string
  description = "S3 bucket for trace payloads"
}

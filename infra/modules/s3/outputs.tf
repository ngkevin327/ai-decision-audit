output "bucket_name" {
  value       = aws_s3_bucket.payloads.bucket
  description = "Payload storage bucket name"
}

output "bucket_arn" {
  value       = aws_s3_bucket.payloads.arn
  description = "Payload storage bucket ARN"
}

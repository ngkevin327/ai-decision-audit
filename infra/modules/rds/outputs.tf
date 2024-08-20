output "endpoint" {
  value       = aws_db_instance.this.endpoint
  description = "RDS connection endpoint"
}

output "db_name" {
  value       = aws_db_instance.this.db_name
  description = "Database name"
}

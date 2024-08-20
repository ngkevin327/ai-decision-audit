terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "audit-trail-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "audit-trail-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_security_group" "rds" {
  name        = "audit-trail-rds-${var.environment}"
  description = "RDS access for audit trail staging"
  vpc_id      = data.aws_vpc.default.id
}

module "payloads_bucket" {
  source      = "../../modules/s3"
  environment = var.environment
  bucket_name = var.payload_bucket_name
}

module "database" {
  source                 = "../../modules/rds"
  environment            = var.environment
  subnet_ids             = data.aws_subnets.default.ids
  vpc_security_group_ids = [aws_security_group.rds.id]
}

output "rds_endpoint" {
  value = module.database.endpoint
}

output "payload_bucket" {
  value = module.payloads_bucket.bucket_name
}

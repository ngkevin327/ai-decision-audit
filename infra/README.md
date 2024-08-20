# Infrastructure

Terraform modules for staging and production environments.

## Layout

```
infra/
├── modules/
│   ├── rds/          # PostgreSQL instance
│   └── s3/           # Payload object bucket
└── environments/
    └── staging/      # Staging stack composition
```

## Remote state

Staging uses an S3 backend with DynamoDB locking:

- Bucket: `audit-trail-terraform-state`
- Lock table: `audit-trail-terraform-locks`
- Key prefix: `staging/`

Configure credentials via your cloud profile before `terraform plan`.

## Commands

```bash
cd infra/environments/staging
terraform init
terraform plan -var-file=terraform.tfvars.example
```

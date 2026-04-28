# OpenClaw - Least Privilege IAM Policies
# Terraform configuration for restricted provider permissions

# AWS IAM Policy for OpenClaw Migration (Least Privilege)
resource "aws_iam_policy" "openclaw_migration_policy" {
  name        = "openclaw-migration-policy"
  description = "Least privilege policy for OpenClaw server migration operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeImages",
          "ec2:DescribeKeyPairs",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs",
          "ec2:RunInstances",
          "ec2:TerminateInstances",
          "ec2:CreateTags",
          "ec2:DeleteTags"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.allowed_regions
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateSecurityGroup",
          "ec2:DeleteSecurityGroup",
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress"
        ]
        Resource = "arn:aws:ec2:*:*:security-group/openclaw-*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateKeyPair",
          "ec2:DeleteKeyPair",
          "ec2:ImportKeyPair"
        ]
        Resource = "arn:aws:ec2:*:*:key-pair/openclaw-*"
      },
      {
        Effect = "Deny"
        Action = [
          "ec2:ModifyInstanceAttribute",
          "ec2:StopInstances",
          "ec2:StartInstances",
          "ec2:RebootInstances",
          "ec2:ResetInstanceAttribute"
        ]
        Resource = "*"
      }
    ]
  })
}

# AWS IAM Role for OpenClaw
resource "aws_iam_role" "openclaw_migration_role" {
  name = "openclaw-migration-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.aws_account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = {
    Project     = "OpenClaw"
    Environment = "Migration"
    Purpose     = "LeastPrivilege"
  }
}

# Attach the restrictive policy to the role
resource "aws_iam_role_policy_attachment" "openclaw_migration_attachment" {
  role       = aws_iam_role.openclaw_migration_role.name
  policy_arn = aws_iam_policy.openclaw_migration_policy.arn
}

# IAM User with restricted permissions (alternative to role)
resource "aws_iam_user" "openclaw_migration_user" {
  name = "openclaw-migration-user"
  tags = {
    Project     = "OpenClaw"
    Environment = "Migration"
    Purpose     = "LeastPrivilege"
  }
}

resource "aws_iam_user_policy_attachment" "openclaw_migration_user_attachment" {
  user       = aws_iam_user.openclaw_migration_user.name
  policy_arn = aws_iam_policy.openclaw_migration_policy.arn
}

# Access key for the restricted user (store securely)
resource "aws_iam_access_key" "openclaw_migration_key" {
  user = aws_iam_user.openclaw_migration_user.name
}

# Cloudflare API Token with restricted permissions
# Note: Create restricted tokens via Cloudflare dashboard for better control
# Required scopes for WAF operations:
# - Zone:Read
# - Firewall Services:Edit
# - SSL and Certificates:Read

# Data source for Cloudflare permissions (for reference)
data "cloudflare_api_token_permission_groups" "all" {
  account_id = var.cloudflare_account_id
}

# DigitalOcean restricted token (create via DO dashboard with limited scopes)
# Note: DigitalOcean doesn't support granular permissions via API
# Create a token with only necessary scopes: droplets:read, droplets:write

# Linode restricted token (create via Linode dashboard)
# Note: Linode tokens can be scoped to specific permissions

# Vultr restricted key (create via Vultr dashboard)
# Note: Vultr API keys have account-level permissions

# Outputs for secure credential management
output "aws_restricted_access_key_id" {
  description = "AWS Access Key ID for restricted OpenClaw migration user"
  value       = aws_iam_access_key.openclaw_migration_key.id
  sensitive   = true
}

output "aws_restricted_secret_access_key" {
  description = "AWS Secret Access Key for restricted OpenClaw migration user"
  value       = aws_iam_access_key.openclaw_migration_key.secret
  sensitive   = true
}

output "cloudflare_restricted_token" {
  description = "Cloudflare API token with restricted permissions"
  value       = cloudflare_api_token.openclaw_waf_token.value
  sensitive   = true
}

output "aws_role_arn" {
  description = "ARN of the OpenClaw migration IAM role"
  value       = aws_iam_role.openclaw_migration_role.arn
}

# Variables
variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "allowed_regions" {
  description = "Allowed AWS regions for OpenClaw operations"
  type        = list(string)
  default     = ["us-east-1", "us-west-2", "eu-west-1"]
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}
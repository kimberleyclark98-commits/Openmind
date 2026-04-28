# OpenMind AI - Multi-Cloud Migration Infrastructure
# Terraform configuration for automated server provisioning

terraform {
  required_version = ">= 1.0"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
    linode = {
      source  = "linode/linode"
      version = "~> 1.0"
    }
    vultr = {
      source  = "vultr/vultr"
      version = "~> 2.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# DigitalOcean Configuration
provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_droplet" "openmind_do" {
  count    = var.target_provider == "digitalocean" ? 1 : 0
  image    = "ubuntu-22-04-x64"
  name     = "openmind-${random_id.suffix.hex}"
  region   = var.do_region
  size     = var.do_size
  ssh_keys = [digitalocean_ssh_key.migration[0].fingerprint]

  # User data for automatic setup
  user_data = templatefile("${path.module}/user-data.sh", {
    migration_backup_url = var.migration_backup_url
    encryption_key       = var.encryption_key
  })
}

resource "digitalocean_ssh_key" "migration" {
  count      = var.target_provider == "digitalocean" ? 1 : 0
  name       = "openmind-migration-${random_id.suffix.hex}"
  public_key = file("${path.module}/migration-key.pub")
}

# Linode Configuration
provider "linode" {
  token = var.linode_token
}

resource "linode_instance" "openmind_linode" {
  count     = var.target_provider == "linode" ? 1 : 0
  label     = "openmind-${random_id.suffix.hex}"
  image     = "linode/ubuntu22.04"
  region    = var.linode_region
  type      = var.linode_type
  authorized_keys = [file("${path.module}/migration-key.pub")]

  # StackScript for automatic setup
  stackscript_id = linode_stackscript.openmind[0].id
  stackscript_data = {
    migration_backup_url = var.migration_backup_url
    encryption_key       = var.encryption_key
  }
}

resource "linode_stackscript" "openmind" {
  count = var.target_provider == "linode" ? 1 : 0
  label = "OpenMind AI Setup"
  description = "Automated setup for OpenMind AI migration"
  script = templatefile("${path.module}/linode-setup.sh", {})
  images = ["linode/ubuntu22.04"]
}

# Vultr Configuration
provider "vultr" {
  api_key = var.vultr_api_key
}

resource "vultr_instance" "openmind_vultr" {
  count  = var.target_provider == "vultr" ? 1 : 0
  plan   = var.vultr_plan
  region = var.vultr_region
  os_id  = 1743  # Ubuntu 22.04 x64
  label  = "openmind-${random_id.suffix.hex}"
  ssh_key_ids = [vultr_ssh_key.migration[0].id]

  # Startup script
  script_id = vultr_startup_script.openmind[0].id
}

resource "vultr_ssh_key" "migration" {
  count   = var.target_provider == "vultr" ? 1 : 0
  name    = "openmind-migration"
  ssh_key = file("${path.module}/migration-key.pub")
}

resource "vultr_startup_script" "openmind" {
  count = var.target_provider == "vultr" ? 1 : 0
  name  = "openmind-setup"
  script = templatefile("${path.module}/vultr-setup.sh", {
    migration_backup_url = var.migration_backup_url
    encryption_key       = var.encryption_key
  })
}

# AWS Configuration
provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

resource "aws_instance" "openmind_aws" {
  count         = var.target_provider == "aws" ? 1 : 0
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.aws_instance_type
  key_name      = aws_key_pair.migration[0].key_name

  # Security group
  vpc_security_group_ids = [aws_security_group.openmind[0].id]

  # User data
  user_data = templatefile("${path.module}/aws-user-data.sh", {
    migration_backup_url = var.migration_backup_url
    encryption_key       = var.encryption_key
  })

  tags = {
    Name = "openmind-${random_id.suffix.hex}"
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_key_pair" "migration" {
  count  = var.target_provider == "aws" ? 1 : 0
  key_name   = "openmind-migration-${random_id.suffix.hex}"
  public_key = file("${path.module}/migration-key.pub")
}

resource "aws_security_group" "openmind" {
  count  = var.target_provider == "aws" ? 1 : 0
  name_prefix = "openmind-"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Random suffix for unique naming
resource "random_id" "suffix" {
  byte_length = 4
}

# Outputs
output "instance_ip" {
  description = "Public IP of the provisioned instance"
  value = coalesce(
    try(digitalocean_droplet.openmind_do[0].ipv4_address, ""),
    try(linode_instance.openmind_linode[0].ip_address, ""),
    try(vultr_instance.openmind_vultr[0].main_ip, ""),
    try(aws_instance.openmind_aws[0].public_ip, "")
  )
}

output "instance_id" {
  description = "ID of the provisioned instance"
  value = coalesce(
    try(digitalocean_droplet.openmind_do[0].id, ""),
    try(linode_instance.openmind_linode[0].id, ""),
    try(vultr_instance.openmind_vultr[0].id, ""),
    try(aws_instance.openmind_aws[0].id, "")
  )
}

output "provider" {
  description = "Cloud provider used"
  value = var.target_provider
}

# Variables
variable "target_provider" {
  description = "Target cloud provider for migration"
  type        = string
  default     = "digitalocean"

  validation {
    condition     = contains(["digitalocean", "linode", "vultr", "aws"], var.target_provider)
    error_message = "Provider must be one of: digitalocean, linode, vultr, aws"
  }
}

# DigitalOcean variables
variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  default     = ""
}

variable "do_region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc3"
}

variable "do_size" {
  description = "DigitalOcean droplet size"
  type        = string
  default     = "s-2vcpu-4gb"
}

# Linode variables
variable "linode_token" {
  description = "Linode API token"
  type        = string
  default     = ""
}

variable "linode_region" {
  description = "Linode region"
  type        = string
  default     = "us-east"
}

variable "linode_type" {
  description = "Linode instance type"
  type        = string
  default     = "g6-standard-2"
}

# Vultr variables
variable "vultr_api_key" {
  description = "Vultr API key"
  type        = string
  default     = ""
}

variable "vultr_region" {
  description = "Vultr region"
  type        = string
  default     = "ewr"
}

variable "vultr_plan" {
  description = "Vultr plan"
  type        = string
  default     = "vc2-2c-4gb"
}

# AWS variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key" {
  description = "AWS access key"
  type        = string
  default     = ""
}

variable "aws_secret_key" {
  description = "AWS secret key"
  type        = string
  default     = ""
}

variable "aws_instance_type" {
  description = "AWS instance type"
  type        = string
  default     = "t3.medium"
}

# Common variables
variable "migration_backup_url" {
  description = "URL of the migration backup"
  type        = string
  default     = ""
}

variable "encryption_key" {
  description = "Encryption key for backup"
  type        = string
  default     = "default-migration-key"
}
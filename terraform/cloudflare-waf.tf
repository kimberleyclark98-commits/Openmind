# Cloudflare WAF Configuration for OpenClaw
# Deploy the WAF worker to protect API endpoints

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  type        = string
}

variable "openclaw_api_url" {
  description = "OpenClaw API base URL"
  type        = string
}

variable "domain" {
  description = "Domain name for the deployment"
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

# KV Namespaces for WAF data
resource "cloudflare_workers_kv_namespace" "waf_blocklist" {
  account_id = var.cloudflare_account_id
  title      = "openclaw-waf-blocklist"
}

resource "cloudflare_workers_kv_namespace" "rate_limit_kv" {
  account_id = var.cloudflare_account_id
  title      = "openclaw-rate-limits"
}

# WAF Worker Script with KV bindings
resource "cloudflare_worker_script" "openclaw_waf" {
  account_id = var.cloudflare_account_id
  name       = "openclaw-waf"
  content    = file("${path.module}/../cloudflare-waf.js")

  kv_namespace_binding {
    name         = "WAF_BLOCKLIST"
    namespace_id = cloudflare_workers_kv_namespace.waf_blocklist.id
  }

  kv_namespace_binding {
    name         = "RATE_LIMIT_KV"
    namespace_id = cloudflare_workers_kv_namespace.rate_limit_kv.id
  }

  plain_text_binding {
    name = "OPENCLAW_API_URL"
    text = var.openclaw_api_url
  }
}

# Worker Route - Protect API endpoints
resource "cloudflare_worker_route" "openclaw_api" {
  zone_id     = var.cloudflare_zone_id
  pattern     = "${var.domain}/api/*"
  script_name = cloudflare_worker_script.openclaw_waf.name
}

# Security settings for the zone
resource "cloudflare_zone_settings_override" "openclaw_security" {
  zone_id = var.cloudflare_zone_id

  settings {
    # Enable security features
    security_level = "medium" # high, medium, low, essentially_off

    # Browser integrity check
    browser_check = "on"

    # Challenge passage
    challenge_ttl = 1800

    # SSL/TLS settings
    ssl = "strict"

    # Always use HTTPS
    always_use_https = "on"

    # HTTP Strict Transport Security
    hsts_max_age = 31536000
    hsts_preload = true
    hsts_include_subdomains = true

    # Security headers
    security_header {
      enabled = true
      include_subdomains = true
      max_age = 31536000
      nosniff = true
      preload = true
    }
  }
}

# Additional WAF Rules (Optional - can be configured via Cloudflare dashboard)
# The main WAF protection is provided by the Cloudflare Worker above
# For additional rules, configure through Cloudflare dashboard:
# - Rate limiting rules
# - Firewall rules for common attacks
# - Bot management
# - DDoS protection

# Example of additional security headers (can be added to Cloudflare dashboard)
# Security Headers can be configured in Cloudflare Page Rules or Transform Rules
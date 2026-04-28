#!/bin/bash

# OpenMind AI - Secret Management Setup Script
# This script helps initialize Docker secrets for the OpenMind system

set -e

SECRETS_DIR="./secrets"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔐 OpenMind AI Secret Management Setup"
echo "======================================"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Create secrets directory
if [ ! -d "$SECRETS_DIR" ]; then
    echo "📁 Creating secrets directory..."
    mkdir -p "$SECRETS_DIR"
    chmod 700 "$SECRETS_DIR"
else
    echo "✅ Secrets directory already exists"
fi

# Function to create or update a secret file
create_secret() {
    local secret_name="$1"
    local description="$2"
    local default_value="$3"
    local secret_file="$SECRETS_DIR/${secret_name}.txt"

    if [ -f "$secret_file" ]; then
        echo "✅ $description secret already exists"
        return
    fi

    echo ""
    echo "🔑 $description"
    echo "   File: $secret_file"

    if [ -n "$default_value" ]; then
        echo "   Default: $default_value"
        read -p "   Use default value? (y/N): " use_default
        if [[ "$use_default" =~ ^[Yy]$ ]]; then
            echo "$default_value" > "$secret_file"
            echo "✅ Created with default value"
            return
        fi
    fi

    read -p "   Enter value (or press Enter to skip): " secret_value
    if [ -n "$secret_value" ]; then
        echo "$secret_value" > "$secret_file"
        echo "✅ Created"
    else
        echo "⏭️  Skipped"
        # Create empty file to avoid Docker errors
        touch "$secret_file"
    fi

    chmod 600 "$secret_file"
}

# Create all required secrets
create_secret "migration_encryption_key" "Migration Encryption Key" "skynet-encryption-key-2026"
create_secret "wallet_address" "Solana Wallet Address" ""
create_secret "solana_rpc_url" "Solana RPC URL" "https://api.mainnet.solana.com"
create_secret "aniday_api_key" "AniDay API Key" ""
create_secret "dify_api_key" "Dify API Key" ""
create_secret "n8n_api_key" "N8N API Key" ""
create_secret "n8n_webhook_url" "N8N Webhook URL" ""
create_secret "digitalocean_access_token" "DigitalOcean Access Token" ""
create_secret "linode_access_token" "Linode Access Token" ""
create_secret "vultr_access_token" "Vultr Access Token" ""
create_secret "aws_access_key_id" "AWS Access Key ID" ""
create_secret "aws_secret_access_key" "AWS Secret Access Key" ""
create_secret "cloudflare_token" "Cloudflare Token" ""
create_secret "vercel_token" "Vercel Token" ""
create_secret "master_encryption_key" "Master Encryption Key" "master-key-2026"
create_secret "backup_encryption_key" "Backup Encryption Key" "backup-key-2026"

echo ""
echo "🔒 Setting secure permissions on secrets directory..."
chmod 700 "$SECRETS_DIR"
chmod 600 "$SECRETS_DIR"/*.txt

echo ""
echo "✅ Secret management setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit the secret files in ./secrets/ with your actual values"
echo "   2. Run: docker-compose up -d"
echo "   3. For production, use Docker Swarm or external secret management"
echo ""
echo "🔍 To view secret status: docker secret ls"
echo "🛡️  Security notes:"
echo "   - Never commit secret files to version control"
echo "   - Regularly rotate encryption keys"
echo "   - Use environment-specific secrets for different deployments"
#!/bin/bash
# OpenMind AI - Cloud-Init User Data Script
# Automatically sets up migrated OpenMind instance

set -e

echo "🧠 Starting OpenMind AI migration setup..."

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y \
    curl \
    wget \
    git \
    nodejs \
    npm \
    docker.io \
    docker-compose \
    openssl \
    ufw \
    fail2ban

# Configure firewall
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3000
ufw --force enable

# Create OpenMind user
useradd -m -s /bin/bash openmind
usermod -aG docker openmind

# Create application directory
mkdir -p /opt/openmind
chown openmind:openmind /opt/openmind

# Download and setup OpenMind
cd /opt/openmind

if [ -n "${migration_backup_url}" ]; then
    echo "📥 Downloading migration backup..."
    wget -O migration-backup.tar.gz.enc "${migration_backup_url}"

    # Decrypt backup
    openssl enc -d -aes-256-cbc -in migration-backup.tar.gz.enc -out migration-backup.tar.gz -k "${encryption_key}"

    # Extract backup
    tar -xzf migration-backup.tar.gz
    rm migration-backup.tar.gz*

    echo "✅ Migration backup restored"
else
    echo "🔧 Setting up fresh OpenMind installation..."

    # Clone repository (fallback)
    git clone https://github.com/your-org/openmind-ai.git .
    npm install
fi

# Configure environment
cat > .env << EOF
NODE_ENV=production
MIGRATION_ENCRYPTION_KEY=${encryption_key}
# Add other required environment variables
EOF

# Setup systemd service
cat > /etc/systemd/system/openmind.service << EOF
[Unit]
Description=OpenMind AI System
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=openmind
WorkingDirectory=/opt/openmind
ExecStart=/usr/bin/npm run decentralized:start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl enable openmind
systemctl start openmind

# Setup monitoring
cat > /etc/cron.d/openmind-health << EOF
*/5 * * * * root curl -f http://localhost:3000/api/health > /dev/null 2>&1 || systemctl restart openmind
EOF

# Configure log rotation
cat > /etc/logrotate.d/openmind << EOF
/opt/openmind/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 0644 openmind openmind
    postrotate
        systemctl reload openmind || true
    endscript
}
EOF

echo "🎉 OpenMind AI migration setup complete!"
echo "🌐 System will be available at: http://$(curl -s ifconfig.me):3000"
echo "📊 Monitor status: http://$(curl -s ifconfig.me):3000/api/health"
#!/bin/bash

# Test Server Startup Script
# Initializes systemd and starts all test services

set -e

echo "🚀 Starting test Linux server container..."

# Generate SSH host keys if they don't exist
echo "🔑 Setting up SSH..."
ssh-keygen -A || true

# Create SSH directory for testuser
mkdir -p /home/testuser/.ssh
chown testuser:testuser /home/testuser/.ssh
chmod 700 /home/testuser/.ssh

# Set up a sample SSH key for testing (optional)
if [ ! -f /home/testuser/.ssh/authorized_keys ]; then
    echo "# SSH public keys for testuser" > /home/testuser/.ssh/authorized_keys
    chown testuser:testuser /home/testuser/.ssh/authorized_keys
    chmod 600 /home/testuser/.ssh/authorized_keys
fi

echo "📦 Setting up log directories..."
mkdir -p /var/log/test-services
chown testuser:testuser /var/log/test-services

echo "🔄 Starting systemd init process..."
exec /sbin/init 
#!/bin/bash

# Test Server Startup Script for Alpine Linux with OpenRC
# Initializes OpenRC and starts all test services

set -e

echo "🚀 Starting Alpine test server container with OpenRC..."

# Create necessary directories
mkdir -p /run/openrc
touch /run/openrc/softlevel

# Set up SSH host keys if they don't exist
echo "🔑 Setting up SSH..."
if [ ! -f /etc/ssh/ssh_host_rsa_key ]; then
    ssh-keygen -A
fi

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

echo "🔄 Starting OpenRC init system..."

# Start OpenRC in the background
/sbin/openrc sysinit
/sbin/openrc boot
/sbin/openrc default

echo "✅ Test server is ready!"
echo "SSH: testuser@localhost:2222 (password: testpass123)"
echo "Services will start automatically via OpenRC"

# Keep container running by monitoring OpenRC
while true; do
    sleep 30
    # Check if OpenRC is still running
    if ! pgrep -f openrc > /dev/null; then
        echo "OpenRC stopped, restarting..."
        /sbin/openrc default
    fi
done
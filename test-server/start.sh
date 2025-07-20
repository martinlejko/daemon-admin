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

echo "🔧 Configuring systemd access for testuser..."
# Ensure D-Bus directories exist and start D-Bus service
mkdir -p /run/dbus
chown messagebus:messagebus /run/dbus

# Start D-Bus system bus (required for systemd access)
/usr/bin/dbus-daemon --system --fork --nopidfile

# Create runtime directory for testuser  
mkdir -p /run/user/$(id -u testuser)
chown testuser:testuser /run/user/$(id -u testuser)
chmod 700 /run/user/$(id -u testuser)

# Set proper environment for systemd access
echo 'export XDG_RUNTIME_DIR=/run/user/$(id -u)' >> /home/testuser/.profile

# Add debug information
echo "🔍 Debug information:"
echo "  - Container hostname: $(hostname)"
echo "  - Container IP: $(hostname -i || echo 'Unable to get IP')"
echo "  - SSH service status will be checked after systemd starts"
echo "  - Test user: testuser (password: testpass123)"
echo "  - SSH access: ssh testuser@localhost -p 2222"

echo "🔄 Starting systemd init process..."
exec /sbin/init 
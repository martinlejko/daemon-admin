FROM ubuntu:22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Install systemd and other required packages
RUN apt-get update && \
    apt-get install -y \
        systemd \
        systemd-sysv \
        openssh-server \
        sudo \
        curl \
        wget \
        nano \
        htop \
        nginx \
        python3 \
        python3-pip \
        redis-server \
        rsyslog \
        cron \
        && \
    pip3 install psutil && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Configure systemd
RUN systemctl set-default multi-user.target

# Remove unnecessary systemd services for container
RUN find /etc/systemd/system \
         /lib/systemd/system \
         -path '*.wants/*' \
         -name '*syslog*' -o \
         -name '*udev*' -o \
         -name '*systemd-tmpfiles*' -o \
         -name '*systemd-machine-id*' \
         | xargs rm -f

# Configure SSH
RUN mkdir /var/run/sshd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Create test user
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser:testpass123' | chpasswd && \
    usermod -aG sudo testuser && \
    mkdir -p /home/testuser/.ssh && \
    chown testuser:testuser /home/testuser/.ssh && \
    chmod 700 /home/testuser/.ssh

# Configure sudo without password for testuser
RUN echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Create sample systemd services
COPY services/ /etc/systemd/system/
COPY scripts/ /opt/test-services/

# Make scripts executable
RUN chmod +x /opt/test-services/*

# Create sample application directories
RUN mkdir -p /var/log/test-services && \
    chown testuser:testuser /var/log/test-services

# Enable sample services
RUN systemctl enable test-web-app.service && \
    systemctl enable test-background-worker.service && \
    systemctl enable test-api-server.service && \
    systemctl enable test-monitoring.service && \
    systemctl enable ssh

# Configure nginx with a simple test page
RUN echo '<h1>Test Server - Nginx Running</h1><p>This is a test nginx service for daemon-admin testing.</p>' > /var/www/html/index.html && \
    systemctl enable nginx

# Configure redis
RUN systemctl enable redis-server

# Create startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose SSH port
EXPOSE 22

# Set up volumes
VOLUME ["/sys/fs/cgroup"]

# Use systemd as init
CMD ["/start.sh"] 
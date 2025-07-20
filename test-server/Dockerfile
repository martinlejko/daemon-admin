# Optimized test server with Ubuntu minimal and systemd
FROM ubuntu:22.04

# Prevent interactive prompts and set timezone
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Install only essential packages in a single layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    systemd \
    systemd-sysv \
    dbus \
    policykit-1 \
    openssh-server \
    sudo \
    python3 \
    python3-pip \
    curl \
    ca-certificates \
    && pip3 install --no-cache-dir psutil \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* /var/tmp/*

# Configure systemd for container use
RUN systemctl set-default multi-user.target \
    && find /etc/systemd/system \
         /lib/systemd/system \
         -path '*.wants/*' \
         \( -name '*getty*' -o \
            -name '*systemd-tmpfiles*' -o \
            -name '*systemd-machine-id*' \) \
         -exec rm -f {} \;

# Configure systemd access for non-root users via polkit
RUN mkdir -p /etc/polkit-1/rules.d \
    && echo 'polkit.addRule(function(action, subject) {' > /etc/polkit-1/rules.d/50-testuser-systemd.rules \
    && echo '    if (action.id.match("org.freedesktop.systemd1.") &&' >> /etc/polkit-1/rules.d/50-testuser-systemd.rules \
    && echo '        subject.user == "testuser") {' >> /etc/polkit-1/rules.d/50-testuser-systemd.rules \
    && echo '        return polkit.Result.YES;' >> /etc/polkit-1/rules.d/50-testuser-systemd.rules \
    && echo '    }' >> /etc/polkit-1/rules.d/50-testuser-systemd.rules \
    && echo '});' >> /etc/polkit-1/rules.d/50-testuser-systemd.rules

# Configure SSH with minimal settings
RUN mkdir -p /var/run/sshd \
    && sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config \
    && sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config \
    && sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config \
    && systemctl enable ssh

# Create test user with systemd access
RUN useradd -m -s /bin/bash testuser \
    && echo 'testuser:testpass123' | chpasswd \
    && usermod -aG sudo,systemd-journal,adm testuser \
    && echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers \
    && mkdir -p /home/testuser/.ssh \
    && chown testuser:testuser /home/testuser/.ssh \
    && chmod 700 /home/testuser/.ssh

# Create application directories
RUN mkdir -p /opt/test-services /var/log/test-services \
    && chown testuser:testuser /var/log/test-services

# Copy test service scripts and systemd service files
COPY scripts/ /opt/test-services/
COPY services/ /etc/systemd/system/
RUN chmod +x /opt/test-services/* \
    && systemctl enable test-web-app.service \
    && systemctl enable test-background-worker.service \
    && systemctl enable test-api-server.service \
    && systemctl enable test-monitoring.service

# Copy optimized startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose SSH port
EXPOSE 22

# Set up volumes for systemd
VOLUME ["/sys/fs/cgroup"]

# Use systemd as init
CMD ["/start.sh"]
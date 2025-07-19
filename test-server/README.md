# Test Linux Server

This directory contains a Docker-based test Linux server with systemd services for testing the daemon-admin functionality.

## What's Included

### Services

- **SSH Server** - For remote access (port 2222)
- **Nginx** - Web server (port 80)
- **Redis** - In-memory database
- **Test Web App** - Python web application (port 3000)
- **Test API Server** - REST API server (port 8080)
- **Test Background Worker** - Simulated background processing
- **Test Monitoring** - System monitoring service

### User Account

- **Username**: `testuser`
- **Password**: `testpass123`
- **Sudo**: Full sudo access without password

## Running the Test Server

Start the test server with the main application:

```bash
docker-compose up -d test-server
```

Or run just the test server:

```bash
cd test-server
docker build -t daemon-admin-test-server .
docker run -d \
  --name test-server \
  --hostname test-linux-server \
  --privileged \
  -p 2222:22 \
  -p 3001:3000 \
  -p 8081:8080 \
  -v /sys/fs/cgroup:/sys/fs/cgroup:rw \
  daemon-admin-test-server
```

## Testing SSH Connection

Test SSH access to the server:

```bash
ssh -p 2222 testuser@localhost
```

Password: `testpass123`

## Adding to Daemon Admin

In your daemon-admin application, add this server with the following settings:

- **Hostname**: `localhost` (or the Docker host IP)
- **SSH Port**: `2222`
- **SSH Username**: `testuser`
- **SSH Password**: `testpass123`
- **Connection Timeout**: `30` seconds
- **Connection Retries**: `3`
- **Is Enabled**: `true`
- **Auto-discover Services**: `true`

You can also add tags like:

- `environment`: `test`
- `purpose`: `development`

## Available systemd Services

Once connected, you should see these services that you can manage:

1. **test-web-app.service** - Web application
2. **test-background-worker.service** - Background worker
3. **test-api-server.service** - API server
4. **test-monitoring.service** - Monitoring service
5. **nginx.service** - Nginx web server
6. **redis-server.service** - Redis database
7. **ssh.service** - SSH daemon

## Service Commands

You can test service management commands:

```bash
# Check service status
sudo systemctl status test-web-app

# Stop a service
sudo systemctl stop test-web-app

# Start a service
sudo systemctl start test-web-app

# Restart a service
sudo systemctl restart test-web-app

# View logs
sudo journalctl -u test-web-app -f
```

## Accessing Services

- **SSH**: `ssh -p 2222 testuser@localhost`
- **Test Web App**: `http://localhost:3001`
- **Test API**: `http://localhost:8081/health`
- **Nginx**: `http://localhost` (if port 80 is mapped)

## Logs

View container logs:

```bash
docker logs daemon-admin-test-server
```

View systemd service logs inside container:

```bash
docker exec -it daemon-admin-test-server journalctl -f
```

## Cleanup

Stop and remove the test server:

```bash
docker-compose down test-server
# or
docker stop daemon-admin-test-server
docker rm daemon-admin-test-server
```

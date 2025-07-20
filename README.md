# Owleyes - Linux Server Management Tool

**Owleyes** is a web-based Linux server and systemd service management application. It allows users to remotely manage multiple Linux servers via SSH, controlling systemd services, viewing logs, and monitoring server status through an intuitive web interface.

## Architecture

- **Frontend**: React 19 + TypeScript + Vite + Chakra UI v3 + Bun
- **Backend**: FastAPI + Python 3.13 + Fabric (SSH) + UV package manager
- **Test Server**: Ubuntu 22.04 with systemd, SSH, and sample services

## Quick Start with Docker

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- Modern web browser

### Starting the Application

```bash
# Clone the repository
git clone <repository-url>
cd daemon-admin

# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

Access the application:
- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:8000
- **Test SSH Server**: `ssh testuser@localhost -p 2222` (password: `testpass123`)

## Docker Commands Reference

### Building and Running

```bash
# Build all services
docker compose build

# Build specific service
docker compose build frontend
docker compose build backend
docker compose build test-server

# Start services in development mode
docker compose up

# Start services in background (detached)
docker compose up -d

# Start specific services
docker compose up frontend backend

# Rebuild and start (force rebuild)
docker compose up --build

# Start with fresh containers (removes existing)
docker compose up --force-recreate
```

### Managing Containers

```bash
# Stop all services
docker compose down

# Stop and remove volumes (CAUTION: deletes data)
docker compose down -v

# Stop and remove images
docker compose down --rmi all

# Restart specific service
docker compose restart backend

# View running containers
docker compose ps

# View all containers (including stopped)
docker compose ps -a
```

### Logs and Debugging

```bash
# View logs for all services
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View logs for specific service
docker compose logs frontend
docker compose logs backend
docker compose logs test-server

# View last N lines of logs
docker compose logs --tail=50 backend

# Execute commands in running container
docker compose exec backend bash
docker compose exec test-server bash
docker compose exec frontend sh

# Run one-off commands
docker compose run --rm backend uv run ruff check
docker compose run --rm frontend bun run lint
```

### Development Workflow

```bash
# Start development environment
docker compose up -d postgres test-server
docker compose up frontend backend

# Run tests
docker compose exec backend uv run pytest
docker compose exec frontend bun test

# Format code
docker compose exec backend uv run ruff format
docker compose exec frontend bunx ultracite format

# Type checking
docker compose exec backend uv run basedpyright
docker compose exec frontend bunx tsc --noEmit

# Install dependencies
docker compose exec backend uv add package-name
docker compose exec frontend bun add package-name
```

### Database Management

```bash
# Access PostgreSQL directly
docker compose exec postgres psql -U daemon_admin -d daemon_admin

# View database logs
docker compose logs postgres

# Reset database (CAUTION: deletes all data)
docker compose down -v
docker volume rm daemon-admin_postgres_data
docker compose up -d postgres

# Create database backup
docker compose exec postgres pg_dump -U daemon_admin daemon_admin > backup.sql

# Restore database from backup
docker compose exec -T postgres psql -U daemon_admin daemon_admin < backup.sql
```

### Testing SSH Connectivity

```bash
# SSH to test server
ssh testuser@localhost -p 2222
# Password: testpass123

# Test service management via SSH
ssh testuser@localhost -p 2222 "sudo systemctl status test-web-app"
ssh testuser@localhost -p 2222 "sudo systemctl start test-background-worker"
ssh testuser@localhost -p 2222 "sudo systemctl stop test-api-server"

# View service logs via SSH
ssh testuser@localhost -p 2222 "sudo journalctl -u test-web-app -f"

# Test services are working
curl http://localhost:3000  # Web app (if port is exposed)
curl http://localhost:8080/health  # API server (if port is exposed)
```

### Cleaning Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes (CAUTION)
docker volume prune

# Remove unused networks
docker network prune

# Complete cleanup (CAUTION: removes everything)
docker system prune -a --volumes

# Remove only this project's resources
docker compose down -v --rmi all
docker volume rm daemon-admin_postgres_data daemon-admin_test_server_data
```

### Performance Optimization

```bash
# Check image sizes
docker images | grep daemon-admin

# Build with cache for faster rebuilds
docker compose build --parallel

# Use BuildKit for better caching
export DOCKER_BUILDKIT=1
docker compose build

# Monitor resource usage
docker stats

# Limit resources for containers
docker compose run --memory=512m --cpus=1 backend bash
```

### Troubleshooting

```bash
# Check container health
docker compose ps
docker inspect daemon-admin-backend
docker inspect daemon-admin-test-server

# Debug networking
docker network ls
docker network inspect daemon-admin_default

# Check volumes
docker volume ls
docker volume inspect daemon-admin_postgres_data

# Debug SSH issues
docker compose logs test-server
docker compose exec test-server systemctl status ssh
docker compose exec test-server ss -tlnp | grep :22

# Debug service startup
docker compose exec test-server systemctl list-units --failed
docker compose exec test-server journalctl -xe
```

### Production Deployment

```bash
# Build production images
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy to production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Health checks
curl http://your-domain/health
curl http://your-domain/api/health

# Monitor production logs
docker compose logs -f --tail=100
```

## Container Optimizations

This project uses several optimizations to reduce build times and image sizes:

### Build Context Optimization
- `.dockerignore` files filter unnecessary files
- Separate `.dockerignore` per service
- Excludes documentation, cache files, and development artifacts

### Multi-Stage Builds
- **Frontend**: Separate build and runtime stages using Nginx
- **Backend**: Separate development and production stages
- **Test Server**: Minimal Ubuntu with only essential packages

### Layer Caching
- Dependencies copied before source code
- Cache mounts for package managers (UV, Bun, APT)
- Optimized layer ordering for maximum cache reuse

### Security
- Non-root users in production containers
- Minimal base images where possible
- No unnecessary packages or tools in production
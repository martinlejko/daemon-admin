# Multi-stage Dockerfile for Owleyes Backend

# Base stage with Python and UV
FROM python:3.11-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    openssh-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install UV
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Set working directory
WORKDIR /app

# Development stage
FROM base AS development

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copy dependency files first for better caching
COPY pyproject.toml uv.lock* ./

# Install dependencies with cache mount and create virtual environment
RUN --mount=type=cache,target=/root/.cache/uv \
    UV_PROJECT_ENVIRONMENT=/opt/venv uv sync --dev

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Set the virtual environment path and run development server
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
CMD ["python", "-m", "app.main"]

# Production stage
FROM base AS production

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV ENVIRONMENT=production

# Create non-root user with home directory
RUN groupadd -r appuser && useradd -r -g appuser -m appuser

# Copy dependency files first for better caching
COPY pyproject.toml uv.lock* ./

# Install production dependencies and create virtual environment
RUN --mount=type=cache,target=/root/.cache/uv \
    uv venv .venv && \
    uv sync --no-dev

# Copy application code
COPY . .

# Create UV cache directory and change ownership
RUN mkdir -p /home/appuser/.cache && \
    chown -R appuser:appuser /app /home/appuser/.cache

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run production server with explicit virtual environment activation
CMD [".venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
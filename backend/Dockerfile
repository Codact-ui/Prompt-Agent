FROM python:3.11-alpine

WORKDIR /app

# Install uv for fast package installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Install system dependencies
RUN apk add --no-cache \
    gcc \
    g++ \
    musl-dev \
    linux-headers \
    python3-dev \
    postgresql-dev \
    libffi-dev

# Install heavy dependencies first using uv
RUN uv pip install --system "google-adk[all]>=0.1.0"
RUN uv pip install --system "google-cloud-aiplatform>=1.40.0"

# Copy requirements and install remaining dependencies using uv
COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN adduser -D -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Health check using Python
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/models')" || exit 1

# Run FastAPI server with multiple workers
CMD ["uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

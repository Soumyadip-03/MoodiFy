# Use Python 3.11 slim image for smaller size (~150 MB vs 1 GB for full python)
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Install system dependencies for OpenCV and MediaPipe
# This is THE FIX for the libGL.so.1 error that blocks deployment!
# - libgl1: OpenCV needs this for graphical processing (updated for Debian Trixie)
# - libglib2.0-0: Required by MediaPipe
# - libsm6, libxext6, libxrender-dev: X11 libraries for cv2
# - libgomp1: OpenMP support for parallel processing
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (Docker layer caching optimization)
# If requirements.txt doesn't change, this layer is reused
COPY requirements.txt .

# Install Python dependencies
# --no-cache-dir reduces image size by not storing pip cache
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application code
COPY . .

# Expose port 8000 (Azure overrides this with PORT env var)
EXPOSE 8000

# Health check - Azure uses this to verify container is running
# Checks /api/health endpoint every 30 seconds
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/health')" || exit 1

# Start command: 1 worker for F1 tier (1 GB RAM limit)
# - gunicorn: Production WSGI server
# - -w 1: Single worker (uses ~500-700 MB RAM)
# - -k uvicorn.workers.UvicornWorker: ASGI worker for FastAPI
# - --bind=0.0.0.0:${PORT:-8000}: Bind to Azure's PORT or default 8000
# - --timeout 120: Allow 2 minutes for ML model inference
# - --access-logfile - --error-logfile -: Log to stdout for Azure logs
CMD gunicorn -w 1 -k uvicorn.workers.UvicornWorker main:app \
    --bind=0.0.0.0:${PORT:-8000} \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -

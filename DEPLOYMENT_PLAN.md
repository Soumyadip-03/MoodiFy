# 🚀 MoodiFy Backend Deployment Plan - Azure F1 with Docker

## 📋 Executive Summary

**Goal**: Deploy FastAPI backend with OpenCV support to Azure App Service F1 (Free tier) using Docker with 1 worker

**Current Status**: 
- Using Azure B1 (~$13/month)
- Deployment blocked by OpenCV libGL.so.1 error
- No Docker implementation yet

**Target Status**:
- Azure F1 Free tier (save student credit)
- Docker resolves OpenCV dependency issues
- 1 worker for portfolio/demo usage

---

## 💰 Cost & Resource Analysis

### **Current Setup (B1)**
| Metric | Value |
|--------|-------|
| **Plan** | B1 (Basic) |
| **Monthly Cost** | ~$13 USD |
| **Annual Cost from Credit** | ~$156 (uses $100 credit + $56 out of pocket) |
| **RAM** | 1.75 GB |
| **vCPU** | 1 core |
| **Storage** | 10 GB |

### **Target Setup (F1)**
| Metric | Value |
|--------|-------|
| **Plan** | F1 (Free) |
| **Monthly Cost** | **$0 USD** ✅ |
| **Annual Cost** | **$0 USD** ✅ |
| **RAM** | 1 GB |
| **vCPU** | Shared (60 CPU min/day) |
| **Storage** | 1 GB |
| **Credit Saved** | $100 (full student credit preserved) |

### **Savings Analysis**
- **Monthly savings**: $13
- **Annual savings**: $156
- **Student credit preserved**: $100 (can use for databases, VMs, etc.)

---

## 🧮 RAM & CPU Requirements Calculation

### **Application Components Memory Footprint**

| Component | RAM Usage (Estimated) |
|-----------|----------------------|
| Python 3.11 Runtime | ~50 MB |
| FastAPI + Uvicorn | ~50-80 MB |
| OpenCV (headless) | ~100-150 MB |
| MediaPipe + Model (7.46 MB) | ~100-200 MB |
| HSEmotion ONNX | ~50-100 MB |
| NumPy | ~50 MB |
| Firebase Admin SDK | ~30-50 MB |
| Gunicorn Master Process | ~20-30 MB |
| **Total per Worker** | **~450-680 MB** |

### **Worker Configuration Analysis**

| Workers | Total RAM Needed | F1 (1 GB) | B1 (1.75 GB) | Status |
|---------|------------------|-----------|--------------|--------|
| **1 worker** | ~500-700 MB | ✅ **Safe** (30-50% buffer) | ✅ Safe | Recommended for F1 |
| **2 workers** | ~1-1.4 GB | ❌ Too tight | ✅ Safe | Not for F1 |
| **4 workers** | ~2-2.7 GB | ❌ Will crash | ❌ Too tight | Need B2+ |

### **CPU Requirements (F1 Shared CPU)**

**F1 Limitation**: 60 CPU minutes per day
- **1 worker consuming 100% CPU** = uses quota in 1 hour
- **Realistic usage**: 5-20% average CPU = 5-12 hours of uptime
- **For portfolio/demo**: More than sufficient
- **For production**: Not suitable (app stops when quota exceeded)

### **Verdict for F1 + 1 Worker**
✅ **RAM**: 500-700 MB usage in 1 GB = **Safe**
✅ **CPU**: Demo/portfolio usage won't hit 60 min/day limit
✅ **Disk**: ~20 MB app + model = **Safe** in 1 GB
✅ **Concurrent Users**: 3-5 simultaneous users handled comfortably

---

## 📁 Files to Create/Modify

### **1. Create New: `backend/Dockerfile`**
```dockerfile
# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV and MediaPipe
# This is what solves the libGL.so.1 error!
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (better Docker caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Azure will override with PORT env var)
EXPOSE 8000

# Health check (optional but recommended)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/health')"

# Start command: 1 worker for F1 tier
# PORT env variable is provided by Azure automatically
CMD gunicorn -w 1 -k uvicorn.workers.UvicornWorker main:app \
    --bind=0.0.0.0:${PORT:-8000} \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
```

**Why these settings:**
- `python:3.11-slim`: Smaller image (~150 MB vs 1 GB for full python)
- `libgl1-mesa-glx`: Fixes the OpenCV libGL.so.1 error ✅
- `-w 1`: Single worker for F1's 1 GB RAM
- `--timeout 120`: Longer timeout for ML model inference
- `${PORT:-8000}`: Uses Azure's PORT env var, fallback to 8000

### **2. Create New: `backend/.dockerignore`**
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
antenv/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
.pytest_cache/
.coverage
htmlcov/

# Local development
.env.local
*.log

# Azure deployment artifacts
backend-deploy.zip
output.tar.zst
antenv.tar.gz
oryx-manifest.toml

# Git
.git/
.gitignore

# Documentation
README.md
*.md

# Test files (optional - exclude if not needed in production)
test_*.py
```

**Why .dockerignore:**
- Reduces Docker image size
- Faster builds
- Excludes unnecessary files from container

### **3. Modify: `backend/.gitignore`**
Add these lines if not present:
```
# Docker
.dockerignore

# Azure
backend-deploy.zip
output.tar.zst
antenv.tar.gz
oryx-manifest.toml
```

### **4. Create New: `backend/.deployment`** (Azure-specific)
```
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=false
```

**Why:** Tell Azure to NOT use Oryx build, use Docker instead

---

## 🔧 Azure Configuration Changes Required

### **Environment Variables to Set in Azure Portal**

Navigate to: **Azure Portal → App Services → moodify-backend → Configuration → Application settings**

Add/Update these:

```
ENV=production
FRONTEND_URL=https://moodify.vercel.app
SPOTIFY_CLIENT_ID=43b8f99620574587835d6019f9a8a65f
SPOTIFY_CLIENT_SECRET=e5193642517b42acaa61160362b70e91
SPOTIFY_REDIRECT_URI=https://moodify-backend.azurewebsites.net/api/spotify/callback
FIREBASE_SERVICE_ACCOUNT_KEY=serviceAccountKey.json

# MoodiFy Owner
MOODIFY_REFRESH_TOKEN=AQCnU3rnsTnZSaVUAczesUpp8eYQiy5yQBaFHQxNnf9f1tFSsvrC_mhsB_0lZ4INpwoZdVN53l1WBuUGDtfAFqk9WiptBWqRpCnSAOyOA2m_5g4w9hx1qrPTd43_vxd2bag
MOODIFY_OWNER_UID=MOODIFY_OWNER
ADMIN_SECRET=x5O5va78SOPrzdWkn_u1voy1a364DWGRS827o4kDqG0

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=notification.moodify@gmail.com
SMTP_PASSWORD=mnkc nvnh dzgc fpeh

# All your MOOD_PLAYLIST_* variables (copy from .env)
MOOD_PLAYLIST_TRENDING=6trf0nTsv4F08U3w4wmJPZ
# ... (all other playlist IDs)
```

**⚠️ Security Note:** These values are already exposed in your .env file shared above. After deployment, rotate:
- `SPOTIFY_CLIENT_SECRET`
- `ADMIN_SECRET`
- `SMTP_PASSWORD`

---

## 📝 Step-by-Step Deployment Guide

### **Phase 1: Preparation (Local Machine)**

#### **Step 1.1: Clean Up Temporary Files**
```powershell
cd D:\Projects\MoodiFy\backend
Remove-Item backend-deploy.zip -ErrorAction SilentlyContinue
```

#### **Step 1.2: Create Dockerfile**
- Create `backend/Dockerfile` with content from section above
- Create `backend/.dockerignore` with content from section above

#### **Step 1.3: Test Docker Build Locally (Optional)**
```powershell
cd D:\Projects\MoodiFy\backend
docker build -t moodify-backend:test .
docker run -p 8000:8000 --env-file .env moodify-backend:test
```
Then test: `http://localhost:8000/api/health`

**Expected result:** API responds without OpenCV errors

#### **Step 1.4: Commit to Git**
```bash
git add backend/Dockerfile backend/.dockerignore
git commit -m "Add Docker support for Azure deployment with OpenCV"
git push origin main
```

---

### **Phase 2: Azure Portal Configuration**

#### **Step 2.1: Downgrade from B1 to F1**

1. **Navigate**: Azure Portal → App Services → moodify-backend
2. **Click**: "App Service plan" (left sidebar under Settings)
3. **Click**: "Scale up (App Service plan)"
4. **Select**: Dev/Test tab → **F1 (Free)**
5. **Click**: "Apply"
6. **Wait**: 2-3 minutes for plan change

**Result:** Saves $13/month, preserves $100 student credit

#### **Step 2.2: Configure for Docker Deployment**

1. **Navigate**: App Services → moodify-backend → **Deployment Center**
2. **Source**: Select "GitHub"
3. **Authorize**: Connect your GitHub account
4. **Repository**: Select `MoodiFy`
5. **Branch**: Select `main`
6. **Build Provider**: Select "GitHub Actions"
7. **Docker options**: Check if there's "Dockerfile" option (if yes, select it)
8. **Path**: Set to `backend/Dockerfile`
9. **Click**: "Save"

**Alternative if no direct Docker option:**
- Use "Container Registry" option
- We'll push Docker image to Azure Container Registry (ACR)

#### **Step 2.3: Set Environment Variables**

1. **Navigate**: App Services → moodify-backend → **Configuration**
2. **Click**: "Application settings" tab
3. **Add** all environment variables from section above (one by one or bulk)
4. **Click**: "Save" at top
5. **Click**: "Continue" on restart warning

#### **Step 2.4: Configure General Settings**

1. **Navigate**: Configuration → **General settings** tab
2. **Stack settings**:
   - **Stack**: Docker Container (Linux)
   - **Image source**: GitHub Actions (or Container Registry)
3. **Platform settings**:
   - **Platform**: 64 Bit
   - **Always On**: OFF (not available in F1)
   - **ARR affinity**: OFF (recommended for stateless API)
4. **Click**: "Save"

---

### **Phase 3: GitHub Actions Workflow Update**

#### **Step 3.1: Modify Workflow for Docker**

**Option A: If Azure supports direct Dockerfile deployment**
Modify `.github/workflows/main_moodify-backend.yml`:

```yaml
name: Build and deploy Docker container to Azure Web App - moodify-backend

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Azure Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ secrets.ACR_LOGIN_SERVER }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.ACR_LOGIN_SERVER }}/moodify-backend:${{ github.sha }}
          cache-from: type=registry,ref=${{ secrets.ACR_LOGIN_SERVER }}/moodify-backend:latest
          cache-to: type=inline

  deploy:
    runs-on: ubuntu-latest
    needs: build
    permissions:
      id-token: write
      contents: read

    steps:
      - name: Login to Azure
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZUREAPPSERVICE_CLIENTID_1E1B3DE25174407E92F90119E434F175 }}
          tenant-id: ${{ secrets.AZUREAPPSERVICE_TENANTID_3C0A6004A3C748D6B4A2B3F69B284CE9 }}
          subscription-id: ${{ secrets.AZUREAPPSERVICE_SUBSCRIPTIONID_F794FA3F9F224D5ABD7225EB565B8341 }}

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: 'moodify-backend'
          slot-name: 'Production'
          images: ${{ secrets.ACR_LOGIN_SERVER }}/moodify-backend:${{ github.sha }}
```

**Option B: Simpler approach (let Azure build from Dockerfile)**
Keep existing workflow, Azure will detect Dockerfile automatically.

#### **Step 3.2: Add GitHub Secrets (if using ACR)**

If using Azure Container Registry:
1. **Navigate**: GitHub → Your repo → Settings → Secrets and variables → Actions
2. **Add** (if not present):
   - `ACR_LOGIN_SERVER`: `<your-registry>.azurecr.io`
   - `ACR_USERNAME`: From Azure Portal → Container Registry → Access keys
   - `ACR_PASSWORD`: From Azure Portal → Container Registry → Access keys

---

### **Phase 4: Deployment Execution**

#### **Step 4.1: Trigger Deployment**
```bash
git push origin main
```

Or manually trigger from GitHub Actions tab.

#### **Step 4.2: Monitor Deployment**

1. **GitHub**: Actions tab → Watch workflow run
2. **Azure Portal**: App Services → moodify-backend → Deployment Center → Logs
3. **Expected duration**: 5-10 minutes (Docker build + deploy)

#### **Step 4.3: Check Deployment Logs**

**Navigate**: Azure Portal → App Services → moodify-backend → Log stream

**Look for**:
```
Starting container...
Pulling image...
Container started successfully
Listening on port 8000
```

**Success indicators:**
- No "libGL.so.1" errors ✅
- "Application startup complete"
- Health check passing

---

### **Phase 5: Verification & Testing**

#### **Step 5.1: Health Check**
```bash
curl https://moodify-backend.azurewebsites.net/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "moodify-backend",
  "version": "1.0.0",
  "timestamp": 1234567890.123,
  "environment": "production"
}
```

#### **Step 5.2: Test OpenCV Endpoint**
Test mood detection endpoint (will use OpenCV internally):
```bash
curl -X POST https://moodify-backend.azurewebsites.net/api/mood/detect \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_test_image"}'
```

**Success**: No libGL errors, returns mood data

#### **Step 5.3: Frontend Connection Test**
Update frontend `.env`:
```
NEXT_PUBLIC_API_URL=https://moodify-backend.azurewebsites.net
```

Test login, mood detection from frontend.

#### **Step 5.4: Monitor Resource Usage**

**Azure Portal** → moodify-backend → Metrics:
- **Memory percentage**: Should stay under 70%
- **CPU percentage**: Should average 10-30%
- **Response time**: Should be under 2-3 seconds

---

## ⚠️ Known Limitations & Trade-offs

### **F1 Free Tier Limitations**

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **60 CPU min/day** | App stops if exceeded | Monitor usage, demo/portfolio traffic won't hit this |
| **No "Always On"** | Cold starts (~10-30s) | First request after idle is slow |
| **Shared infrastructure** | Variable performance | Expected for free tier |
| **1 GB RAM** | Single worker only | Sufficient for 3-5 concurrent users |
| **1 GB storage** | Limited | Your app uses ~20 MB, plenty of room |
| **No auto-scaling** | Fixed 1 instance | Not needed for portfolio |
| **No custom domains** | azurewebsites.net only | Fine for demo |

### **1 Worker Configuration**

| Aspect | Impact |
|--------|--------|
| **Concurrency** | 3-5 simultaneous users max |
| **Response time under load** | Slower when multiple requests arrive |
| **Suitable for** | Portfolio, demo, personal projects ✅ |
| **NOT suitable for** | Production, high traffic ❌ |

---

## 🔄 Rollback Plan (If Deployment Fails)

### **Scenario 1: Docker Build Fails**
**Symptom**: Build errors in GitHub Actions

**Fix**:
1. Check Dockerfile syntax
2. Test build locally: `docker build -t test ./backend`
3. Fix errors, commit, push again

### **Scenario 2: Container Crashes (OOM)**
**Symptom**: "Container terminated" in logs

**Fix**:
1. RAM exceeded - unlikely with 1 worker
2. Check logs for memory spike
3. Temporarily upgrade to B1 if needed

### **Scenario 3: OpenCV Still Fails**
**Symptom**: libGL errors persist

**Fix**:
1. Verify `libgl1-mesa-glx` is in Dockerfile
2. Check Docker build logs for apt-get errors
3. Try alternative base image: `python:3.11-bullseye`

### **Scenario 4: Complete Failure**
**Rollback**:
1. Remove Docker files
2. Git revert to previous working commit
3. Re-deploy with Oryx (old method)
4. Temporarily comment out OpenCV imports

---

## 📊 Success Criteria

✅ **Deployment successful if:**
1. Health endpoint responds: `/api/health` returns 200
2. No libGL.so.1 errors in logs
3. Mood detection endpoint works
4. Frontend can connect and authenticate
5. Memory usage under 70% (check Azure metrics)
6. Response times under 3 seconds
7. No crashes for 24 hours

❌ **Deployment failed if:**
1. Container fails to start
2. OpenCV errors still present
3. Out of memory crashes
4. Health check timeouts

---

## 💡 Post-Deployment Optimization (Optional)

### **Further Cost Savings**
- F1 is already free, no further savings possible
- $100 student credit preserved for:
  - Azure Database (if needed later)
  - Azure Blob Storage
  - Azure Functions
  - Virtual Machines for other projects

### **Performance Improvements (If Needed)**
If you find F1 too slow:
1. **Upgrade to B1** ($13/mo): 1.75 GB RAM, 2 workers possible
2. **Upgrade to B2** ($26/mo): 3.50 GB RAM, 4 workers possible
3. **Switch to Railway free tier**: 8 GB RAM, better for heavy ML

### **Monitoring Setup**
1. **Azure Monitor**: Set up alerts for:
   - Memory > 80%
   - CPU quota approaching limit
   - Response time > 5 seconds
2. **Application Insights**: Track API performance (optional, costs extra)

---

## 📅 Estimated Timeline

| Phase | Duration | Details |
|-------|----------|---------|
| **Preparation** | 15 min | Create Dockerfile, .dockerignore, commit |
| **Azure Config** | 10 min | Downgrade to F1, set env vars |
| **Workflow Update** | 10 min | Modify GitHub Actions (if needed) |
| **Deploy & Build** | 10 min | Git push, wait for build |
| **Testing** | 10 min | Health check, endpoint tests |
| **Frontend Update** | 5 min | Update API URL, test |
| **Total** | **~60 min** | End-to-end deployment |

**Buffer time**: Add 30 min for unexpected issues

---

## 🎯 Final Checklist

**Before Starting:**
- [ ] Backup current working code (git commit)
- [ ] Note current B1 configuration (screenshot)
- [ ] Verify $100 student credit balance
- [ ] Test local development environment works

**Files to Create:**
- [ ] `backend/Dockerfile`
- [ ] `backend/.dockerignore`
- [ ] Update `.gitignore` if needed

**Azure Portal Tasks:**
- [ ] Downgrade B1 → F1
- [ ] Set all environment variables
- [ ] Configure Docker deployment
- [ ] Enable GitHub Actions deployment

**Deployment:**
- [ ] Commit and push Docker files
- [ ] Monitor GitHub Actions workflow
- [ ] Check Azure deployment logs
- [ ] Verify no libGL errors

**Testing:**
- [ ] Health endpoint works
- [ ] Mood detection works (OpenCV)
- [ ] Frontend connects successfully
- [ ] No crashes after 1 hour

**Post-Deployment:**
- [ ] Monitor RAM usage (should be <70%)
- [ ] Test with multiple concurrent requests
- [ ] Update documentation
- [ ] Rotate exposed secrets (.env file)

---

## 📞 Support Resources

**If stuck:**
1. Azure App Service Docker logs: Portal → Log stream
2. GitHub Actions logs: Repo → Actions tab
3. Local Docker test: `docker build` and `docker run`
4. Azure documentation: https://learn.microsoft.com/azure/app-service/

**Common issues:**
- Docker build timeout: Increase GitHub Actions timeout
- Port binding: Ensure `${PORT}` variable is used
- Environment vars: Check Azure Configuration → Application settings

---

**This deployment plan provides a complete roadmap for migrating MoodiFy backend to Azure F1 with Docker, resolving OpenCV issues while maximizing cost savings.**

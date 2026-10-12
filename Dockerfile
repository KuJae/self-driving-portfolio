# One container serves both the FastAPI backend and the built React dashboard.
#   docker build -t self-driving-portfolio .
#   docker run -p 8000:8000 self-driving-portfolio   → http://localhost:8000

# --- 1) Build the React dashboard -------------------------------------------
FROM node:24-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# --- 2) Python runtime ------------------------------------------------------
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=web /web/dist ./static

# Render injects PORT; default to 8000 for local runs.
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

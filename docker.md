Below is the **production-ready version specifically adapted for a React app built with Vite** — the setup is identical in architecture, but the frontend build process changes because Vite outputs files into `dist/` instead of `build/`.

This includes:

* ✔ Updated `frontend/Dockerfile` for Vite
* ✔ Updated build copy step
* ✔ Nginx serving Vite output
* ✔ Fully integrated production architecture

---

# 🏗 Updated Folder Structure (Vite)

```
project/
  backend/
    Dockerfile
    app/
    requirements.txt
  frontend/
    Dockerfile
    package.json
    vite.config.js
  nginx/
    nginx.conf
  docker-compose.yml
  .env
```

---

# 🚢 docker-compose.yml (Vite-ready, Production Setup)

```yaml
version: "3.9"

services:

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: backend
    env_file:
      - .env
    expose:
      - "8000"
    restart: always
    networks:
      - app-network

  frontend-builder:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: frontend-builder
    volumes:
      - frontend_build:/frontend_build
    command: >
      sh -c "npm ci && npm run build && cp -r ./dist/* /frontend_build"
    networks:
      - app-network

  nginx:
    image: nginx:stable-alpine
    container_name: nginx
    depends_on:
      - backend
      - frontend-builder
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - frontend_build:/var/www/frontend:ro
    restart: always
    networks:
      - app-network

networks:
  app-network:

volumes:
  frontend_build:
```

---

# 🌐 frontend/Dockerfile (Optimized for Vite)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build Vite production bundle
RUN npm run build

# Copy built assets to shared volume
CMD ["sh", "-c", "cp -r /app/dist/* /frontend_build"]
```

---

# 📡 nginx/nginx.conf (Vite-Optimized + API Proxy)

```nginx
events {}

http {
    include       mime.types;
    default_type  application/octet-stream;

    # gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/xml image/svg+xml;

    server {
        listen 80;
        server_name _;

        root /var/www/frontend;
        index index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
            try_files $uri =404;
        }

        # Proxy backend API
        location /api/ {
            proxy_pass http://backend:8000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # SPA fallback route (critical for Vite/React Router)
        location / {
            try_files $uri /index.html;
        }
    }
}
```

---

# 🖥 backend/Dockerfile (Production FastAPI example)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc libpq-dev && apt-get clean

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

---

# 🔑 .env (example)

```
DATABASE_URL=postgresql://user:password@db:5432/appdb
SECRET_KEY=supersecretkey
ENV=production
```

---

# 🏃 Run in Production

```bash
docker compose up --build -d
```

Then access your entire application at:

```
http://localhost
```

Frontend → served by Nginx
Backend → proxied at `/api`
Everything runs through **only one port (80)**.

---

# 📘 How it works (Vite version) — short explanation

* Vite builds production-ready files into `dist/`
* A temporary container copies `dist/` into a Docker volume
* Nginx mounts that volume and serves it
* Nginx proxies API routes to the backend on port 8000
* Only Nginx is exposed externally → **single-port production architecture**

---

# Want More?

I can also generate:

✅ Production HTTPS (Let's Encrypt, auto-renewing)
✅ PostgreSQL + migrations included
✅ CI/CD pipeline (GitHub Actions)
✅ Add rate-limiting + security headers
✅ Add Redis / background workers
✅ Add Docker healthchecks

Just tell me what you'd like next!

FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Vite production bundle with relative API URL for Docker
# This makes the frontend use nginx proxy instead of direct backend access
ARG VITE_ADK_BACKEND_URL=/api
ENV VITE_ADK_BACKEND_URL=${VITE_ADK_BACKEND_URL}
RUN pnpm build

# Copy built assets to shared volume on container start
CMD ["sh", "-c", "cp -r /app/dist/* /frontend_build"]

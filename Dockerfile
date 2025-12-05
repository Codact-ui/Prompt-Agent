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

# Build Vite production bundle
RUN pnpm build

# Copy built assets to shared volume on container start
CMD ["sh", "-c", "cp -r /app/dist/* /frontend_build"]

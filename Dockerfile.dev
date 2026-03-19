FROM node:22-alpine AS base
WORKDIR /usr/local/app

FROM base AS backend
COPY backend/. ./
RUN mkdir -p /usr/local/app/uploads
RUN npm install
CMD ["sh", "-c", "npx prisma migrate dev && npm run dev"]

FROM base AS frontend
COPY frontend/. ./
RUN npm install
CMD ["sh", "-c", "npm run dev"]
# --- 빌드 단계 ---
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- 실행 단계 ---
FROM node:20-alpine
WORKDIR /usr/src/app
# 빌드 단계에서 생성된 결과물만 복사 (이미지 용량 다이어트)
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
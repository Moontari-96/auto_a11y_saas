# 1. 노드 환경 설정 (Alpine 기반)
FROM node:20-alpine

# --- 크롬 설치 및 환경 설정 추가 시작 ---
# Puppeteer/Lighthouse 실행에 필요한 Chromium과 필수 라이브러리 설치
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

# Puppeteer가 실행 시 설치된 Chromium을 사용하도록 경로 지정 및 다운로드 건너뛰기
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
# --- 크롬 설치 및 환경 설정 추가 끝 ---

# 2. 작업 디렉토리 생성
WORKDIR /usr/src/app

# 3. 의존성 설치 (캐시 활용을 위해 분리)
COPY package*.json ./
RUN npm install

# 4. 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 5. 실행
CMD ["npm", "run", "start"]
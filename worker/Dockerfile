# 1. 노드 환경 설정
FROM node:20-alpine

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
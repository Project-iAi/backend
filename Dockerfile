# Multi-stage build를 사용한 Node.js Dockerfile
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 yarn.lock 복사
COPY package.json yarn.lock ./

# 의존성 설치
RUN yarn install --frozen-lockfile

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN yarn build

# 프로덕션 이미지
FROM node:18-alpine AS production

# 보안을 위한 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 yarn.lock 복사
COPY package.json yarn.lock ./

# 프로덕션 의존성만 설치
RUN yarn install --frozen-lockfile --production && yarn cache clean

# 빌드된 파일 복사
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# 사용자 변경
USER nestjs

# 포트 노출
EXPOSE 3000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/main.js --healthcheck || exit 1

# 애플리케이션 실행
CMD ["node", "dist/main.js"]

#!/bin/bash

# SSL 인증서 자동 갱신 스크립트

set -e

echo "🔄 SSL 인증서 갱신을 시작합니다..."

# 인증서 갱신
docker-compose run --rm certbot renew --quiet

# nginx 설정 리로드
if [ $? -eq 0 ]; then
    echo "✅ SSL 인증서 갱신 완료"
    echo "🔄 Nginx 설정 리로드 중..."
    docker-compose exec nginx nginx -s reload
    echo "✅ Nginx 리로드 완료"
else
    echo "❌ SSL 인증서 갱신 실패"
    exit 1
fi

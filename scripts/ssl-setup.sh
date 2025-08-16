#!/bin/bash

# SSL 인증서 설정 및 관리 스크립트

set -e

DOMAIN="iailog.store"
EMAIL="your-email@domain.com"  # 실제 이메일로 변경해주세요

echo "🔐 SSL 인증서 설정을 시작합니다..."

# 이메일 확인
read -p "SSL 인증서 발급을 위한 이메일을 입력하세요 [$EMAIL]: " input_email
if [ ! -z "$input_email" ]; then
    EMAIL=$input_email
fi

echo "📧 사용할 이메일: $EMAIL"

# docker-compose에서 이메일 업데이트
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/your-email@domain.com/$EMAIL/g" docker-compose.yml
else
    # Linux
    sed -i "s/your-email@domain.com/$EMAIL/g" docker-compose.yml
fi

echo "✅ docker-compose.yml에 이메일이 업데이트되었습니다."

# 첫 번째 SSL 인증서 발급 (테스트)
echo "🧪 테스트 모드로 SSL 인증서 발급..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --staging \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ 테스트 인증서 발급 성공!"
    echo "🏁 실제 인증서 발급 중..."
    
    # 실제 SSL 인증서 발급
    docker-compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d $DOMAIN \
        -d www.$DOMAIN
        
    if [ $? -eq 0 ]; then
        echo "🎉 SSL 인증서 발급 완료!"
        
        # nginx 재시작
        echo "🔄 Nginx 재시작 중..."
        docker-compose restart nginx
        
        echo "✅ 설정 완료!"
        echo "🌐 https://$DOMAIN 으로 접속 가능합니다."
    else
        echo "❌ 실제 인증서 발급 실패"
        exit 1
    fi
else
    echo "❌ 테스트 인증서 발급 실패. DNS 설정을 확인해주세요."
    echo "📋 확인사항:"
    echo "  1. 도메인 $DOMAIN 이 이 서버의 IP로 설정되어 있는지 확인"
    echo "  2. 방화벽에서 80, 443 포트가 열려있는지 확인"
    echo "  3. nginx 컨테이너가 실행 중인지 확인"
    exit 1
fi

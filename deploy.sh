#!/bin/bash

# IAI 서버 배포 스크립트 (도메인: iailog.store)

set -e

DOMAIN="iailog.store"
SSL_SETUP=false

echo "🚀 IAI 서버 배포를 시작합니다..."
echo "🌐 도메인: $DOMAIN"

# 인자 처리
while [[ $# -gt 0 ]]; do
    case $1 in
        --ssl)
            SSL_SETUP=true
            shift
            ;;
        *)
            echo "사용법: $0 [--ssl]"
            echo "  --ssl: SSL 인증서 설정 포함"
            exit 1
            ;;
    esac
done

# 환경변수 파일 확인
if [ ! -f .env ]; then
    echo "❌ .env 파일이 없습니다. env.example을 참고하여 .env 파일을 생성해주세요."
    exit 1
fi

# Docker 및 Docker Compose 설치 확인
if ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되어 있지 않습니다."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose가 설치되어 있지 않습니다."
    exit 1
fi

# 방화벽 확인 (ufw가 설치된 경우)
if command -v ufw &> /dev/null; then
    echo "🔥 방화벽 포트 확인..."
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 22/tcp
    echo "✅ 필요한 포트가 열려있습니다."
fi

echo "📦 기존 컨테이너 정리 중..."
docker-compose down --remove-orphans

echo "🔨 이미지 빌드 중..."
docker-compose build --no-cache

echo "🏃 기본 서비스 시작 중..."
# certbot 제외하고 먼저 시작
docker-compose up -d backend db nginx

echo "⏳ 서비스 상태 확인 중..."
sleep 30

# 헬스체크 (HTTP로 먼저 확인)
echo "🔍 백엔드 서비스 헬스체크..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ 백엔드 서비스가 정상적으로 실행되고 있습니다."
else
    echo "❌ 백엔드 서비스에 문제가 있습니다. 로그를 확인해주세요:"
    docker-compose logs backend
    exit 1
fi

# SSL 설정
if [ "$SSL_SETUP" = true ]; then
    echo "🔐 SSL 인증서 설정 중..."
    
    # certbot 컨테이너로 인증서 발급
    echo "📧 SSL 인증서 발급을 위한 이메일을 입력하세요:"
    read -p "이메일: " EMAIL
    
    if [ -z "$EMAIL" ]; then
        echo "❌ 이메일이 입력되지 않았습니다."
        exit 1
    fi
    
    # docker-compose에서 이메일 업데이트
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/your-email@domain.com/$EMAIL/g" docker-compose.yml
    else
        sed -i "s/your-email@domain.com/$EMAIL/g" docker-compose.yml
    fi
    
    # Let's Encrypt 인증서 발급
    docker-compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN
    
    if [ $? -eq 0 ]; then
        echo "✅ SSL 인증서 발급 완료!"
        echo "🔄 Nginx 재시작 중..."
        docker-compose restart nginx
        
        # HTTPS 헬스체크
        sleep 10
        if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
            echo "✅ HTTPS 연결이 성공했습니다!"
        else
            echo "⚠️  HTTPS 연결에 문제가 있을 수 있습니다. HTTP로는 정상 작동 중입니다."
        fi
    else
        echo "❌ SSL 인증서 발급 실패. HTTP로 계속 진행합니다."
    fi
fi

echo "📊 컨테이너 상태:"
docker-compose ps

echo "🎉 배포가 완료되었습니다!"
echo ""
echo "🌐 서버 접속:"
echo "  HTTP: http://$DOMAIN"
if [ "$SSL_SETUP" = true ]; then
    echo "  HTTPS: https://$DOMAIN"
fi
echo "  API 문서: http://$DOMAIN/api-docs"
echo ""
echo "📋 유용한 명령어:"
echo "  로그 확인: docker-compose logs -f [service-name]"
echo "  서비스 재시작: docker-compose restart [service-name]"
echo "  서비스 중지: docker-compose down"
echo "  컨테이너 상태: docker-compose ps"
echo "  SSL 갱신: ./scripts/ssl-renew.sh"
echo ""
echo "🔒 보안 설정:"
echo "  SSH 보안 설정: ./scripts/ssh-security.sh"
echo "  SSL 수동 설정: ./scripts/ssl-setup.sh"

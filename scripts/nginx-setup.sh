#!/bin/bash

# Nginx 설정 및 SSL 인증서 설정 스크립트

set -e

echo "🔧 Nginx 설정을 시작합니다..."

# SSL 디렉토리 생성
mkdir -p nginx/ssl

# 자체 서명 인증서 생성 (개발/테스트용)
if [ ! -f nginx/ssl/selfsigned.crt ]; then
    echo "🔐 자체 서명 SSL 인증서 생성 중..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/selfsigned.key \
        -out nginx/ssl/selfsigned.crt \
        -subj "/C=KR/ST=Seoul/L=Seoul/O=IAI/OU=IT/CN=localhost"
    echo "✅ SSL 인증서가 생성되었습니다."
fi

# DH 파라미터 생성 (보안 강화)
if [ ! -f nginx/ssl/dhparam.pem ]; then
    echo "🔒 DH 파라미터 생성 중... (시간이 걸릴 수 있습니다)"
    openssl dhparam -out nginx/ssl/dhparam.pem 2048
    echo "✅ DH 파라미터가 생성되었습니다."
fi

# Nginx 설정 검증
echo "🔍 Nginx 설정 검증 중..."
if docker run --rm -v "$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" nginx:alpine nginx -t; then
    echo "✅ Nginx 설정이 올바릅니다."
else
    echo "❌ Nginx 설정에 오류가 있습니다."
    exit 1
fi

# 로그 로테이션 설정
echo "📋 로그 로테이션 설정..."
cat > nginx/logrotate.conf << EOF
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 640 nginx adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \`cat /var/run/nginx.pid\`
        fi
    endscript
}
EOF

echo "🎉 Nginx 설정이 완료되었습니다!"
echo ""
echo "📁 생성된 파일들:"
echo "  - nginx/ssl/selfsigned.crt (자체 서명 인증서)"
echo "  - nginx/ssl/selfsigned.key (개인키)"
echo "  - nginx/ssl/dhparam.pem (DH 파라미터)"
echo "  - nginx/logrotate.conf (로그 로테이션 설정)"
echo ""
echo "🚀 배포를 위해 다음 명령어를 실행하세요:"
echo "  ./deploy.sh"

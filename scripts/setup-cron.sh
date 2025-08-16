#!/bin/bash

# SSL 인증서 자동 갱신을 위한 crontab 설정 스크립트

set -e

PROJECT_DIR=$(pwd)

echo "⏰ SSL 인증서 자동 갱신 crontab 설정..."

# 현재 crontab 백업
crontab -l > /tmp/crontab.backup 2>/dev/null || true

# SSL 갱신 cron job 추가 (매월 1일 새벽 3시)
cat << EOF > /tmp/ssl-cron
# IAI SSL 인증서 자동 갱신 (매월 1일 새벽 3시)
0 3 1 * * cd $PROJECT_DIR && ./scripts/ssl-renew.sh >> /var/log/ssl-renew.log 2>&1

# 시스템 업데이트 (매주 일요일 새벽 4시)
0 4 * * 0 cd $PROJECT_DIR && docker-compose pull && docker-compose up -d >> /var/log/docker-update.log 2>&1

# 로그 정리 (매일 새벽 2시)
0 2 * * * docker system prune -f >> /var/log/docker-cleanup.log 2>&1
EOF

# 기존 crontab과 합치기
cat /tmp/crontab.backup /tmp/ssl-cron | crontab -

# 로그 디렉토리 생성
sudo mkdir -p /var/log
sudo touch /var/log/ssl-renew.log
sudo touch /var/log/docker-update.log
sudo touch /var/log/docker-cleanup.log
sudo chmod 644 /var/log/ssl-renew.log
sudo chmod 644 /var/log/docker-update.log
sudo chmod 644 /var/log/docker-cleanup.log

echo "✅ Crontab 설정이 완료되었습니다."
echo ""
echo "📋 설정된 작업:"
echo "  - SSL 갱신: 매월 1일 새벽 3시"
echo "  - 도커 업데이트: 매주 일요일 새벽 4시"
echo "  - 시스템 정리: 매일 새벽 2시"
echo ""
echo "📊 crontab 확인: crontab -l"
echo "📝 로그 확인:"
echo "  - SSL 갱신: tail -f /var/log/ssl-renew.log"
echo "  - 도커 업데이트: tail -f /var/log/docker-update.log"
echo "  - 시스템 정리: tail -f /var/log/docker-cleanup.log"

# 임시 파일 정리
rm -f /tmp/crontab.backup /tmp/ssl-cron

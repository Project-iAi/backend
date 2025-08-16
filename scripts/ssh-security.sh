#!/bin/bash

# SSH 보안 설정 스크립트 (EC2 서버에서 실행)

set -e

echo "🔒 SSH 보안 설정을 시작합니다..."

# SSH 설정 백업
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d)

# SSH 보안 설정
cat << 'EOF' | sudo tee /etc/ssh/sshd_config.iai
# IAI 서버 SSH 보안 설정

# 기본 설정
Port 22
Protocol 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

# 로깅
SyslogFacility AUTH
LogLevel INFO

# 인증 설정
LoginGraceTime 60
PermitRootLogin no
StrictModes yes
MaxAuthTries 3
MaxSessions 3

# 패스워드 인증 (키 인증 설정 후 비활성화 권장)
PasswordAuthentication yes
PermitEmptyPasswords no
ChallengeResponseAuthentication no

# 공개키 인증
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# 기타 보안 설정
X11Forwarding no
PrintMotd no
TCPKeepAlive yes
Compression delayed
ClientAliveInterval 300
ClientAliveCountMax 2

# 특정 사용자만 SSH 접근 허용 (필요시 수정)
# AllowUsers ubuntu ec2-user

# 접근 시간 제한
LoginGraceTime 60

# 배너 설정
Banner /etc/ssh/banner
EOF

# SSH 배너 생성
cat << 'EOF' | sudo tee /etc/ssh/banner
************************************************************************
*                        IAI 서버 시스템                                *
*                                                                      *
*  주의: 이 시스템은 승인된 사용자만 접근할 수 있습니다.                      *
*  모든 활동은 로그에 기록되며 모니터링됩니다.                              *
*                                                                      *
************************************************************************
EOF

echo "✅ SSH 설정 파일이 생성되었습니다."
echo "🔧 SSH 설정을 적용하려면 다음 명령어를 실행하세요:"
echo ""
echo "sudo cp /etc/ssh/sshd_config.iai /etc/ssh/sshd_config"
echo "sudo systemctl restart ssh"
echo ""
echo "⚠️  주의: SSH 재시작 전에 새 터미널에서 연결 테스트를 권장합니다."
echo ""
echo "🔑 SSH 키 인증 설정 방법:"
echo "1. 로컬에서 키 생성: ssh-keygen -t ed25519 -C 'your-email@domain.com'"
echo "2. 공개키 복사: ssh-copy-id -i ~/.ssh/id_ed25519.pub user@iailog.store"
echo "3. 패스워드 인증 비활성화: PasswordAuthentication no"

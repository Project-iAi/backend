<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

IAI (AI Interactive) - AI 캐릭터와 대화할 수 있는 NestJS 기반의 백엔드 서버입니다.

## 주요 기능

- 🤖 AI 캐릭터와의 실시간 채팅
- 👤 카카오 소셜 로그인
- 📝 일기 작성 및 분석
- 🎨 다양한 캐릭터 선택
- 🔊 음성 채팅 지원
- 📊 부모 리포트 기능

## 기술 스택

- **Backend**: NestJS, TypeScript
- **Database**: MySQL 8.0
- **Authentication**: JWT, Passport
- **AI**: OpenAI API
- **WebSocket**: Socket.IO
- **Infrastructure**: Docker, Nginx

## 로컬 개발 환경 설정

### 1. 의존성 설치

```bash
$ yarn install
```

### 2. 환경변수 설정

```bash
# env.example을 참고하여 .env 파일 생성
$ cp env.example .env
# .env 파일에서 필요한 값들을 설정해주세요
```

### 3. 데이터베이스 실행

```bash
$ docker-compose up -d db
```

### 4. 서버 실행

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Docker를 이용한 배포 (EC2 + 도메인)

### 1. 환경변수 설정

```bash
# env.example을 참고하여 .env 파일 생성
$ cp env.example .env
# .env 파일에서 필요한 값들을 설정해주세요
```

### 2. 도메인 설정 확인

- **도메인**: iailog.store
- **DNS 레코드**:
  - A 레코드: iailog.store → EC2 IP
  - CNAME 레코드: www.iailog.store → iailog.store

### 3. 배포 옵션

#### 3-1. HTTP만 배포 (빠른 테스트)

```bash
$ ./deploy.sh
```

#### 3-2. HTTPS 포함 배포 (프로덕션 권장)

```bash
$ ./deploy.sh --ssl
```

#### 3-3. 수동 SSL 설정

```bash
# 기본 서비스 먼저 시작
$ docker-compose up -d backend db nginx

# SSL 인증서 설정
$ ./scripts/ssl-setup.sh

# 자동 갱신 설정
$ ./scripts/setup-cron.sh
```

### 4. 보안 설정

#### SSH 보안 강화

```bash
$ ./scripts/ssh-security.sh
```

#### 방화벽 설정

```bash
# Ubuntu/Debian
$ sudo ufw enable
$ sudo ufw allow 22/tcp   # SSH
$ sudo ufw allow 80/tcp   # HTTP
$ sudo ufw allow 443/tcp  # HTTPS
```

## 서비스 접속

- **도메인**: https://iailog.store
- **API 문서**: https://iailog.store/api-docs
- **헬스체크**: https://iailog.store/health

## 유지보수

### SSL 인증서 관리

```bash
# 수동 갱신
$ ./scripts/ssl-renew.sh

# 갱신 상태 확인
$ docker-compose exec certbot certbot certificates
```

### 로그 모니터링

```bash
# 전체 로그
$ docker-compose logs -f

# 특정 서비스 로그
$ docker-compose logs -f nginx
$ docker-compose logs -f backend

# SSL 갱신 로그
$ tail -f /var/log/ssl-renew.log
```

## 테스트 실행

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## 프로젝트 구조

```
src/
├── auth/          # 인증 관련
├── character/     # 캐릭터 관리
├── chat/          # 채팅 기능
├── common/        # 공통 모듈
├── diary/         # 일기 기능
└── users/         # 사용자 관리
```

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Tokens } from './types/tokens.type';

@Injectable()
export class AuthService {
  private readonly tokenEndpoint = 'https://kauth.kakao.com/oauth/token';
  private readonly userInfoEndpoint = 'https://kapi.kakao.com/v2/user/me';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  /** 1) 인가코드 → 카카오 액세스 토큰 교환 */
  async exchangeCodeForKakaoToken(code: string) {
    const clientId = this.config.get<string>('KAKAO_CLIENT_ID');
    const redirectUri = this.config.get<string>('KAKAO_REDIRECT_URI');

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId!,
      redirect_uri: redirectUri!,
      code,
    });

    try {
      const { data } = await firstValueFrom(
        this.http.post(this.tokenEndpoint, params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );
      return data as { access_token: string; refresh_token?: string };
    } catch (e) {
      console.error('Kakao token exchange failed:', e);
      throw new UnauthorizedException(
        '카카오 로그인에 실패했습니다. 다시 시도해주세요.',
      );
    }
  }

  /** 2) 카카오 프로필 조회 */
  async fetchKakaoProfile(accessToken: string) {
    try {
      const { data } = await firstValueFrom(
        this.http.get(this.userInfoEndpoint, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      // 참고: data.id, data.kakao_account.profile.nickname, data.kakao_account.email
      const kakaoId = String(data.id);
      const nickname = data.kakao_account?.profile?.nickname as
        | string
        | undefined;
      const email = data.kakao_account?.email as string | undefined;
      return { providerUserId: kakaoId, nickname, email };
    } catch (e) {
      console.error('Kakao profile fetch failed:', e);
      throw new UnauthorizedException(
        '카카오 사용자 정보를 가져올 수 없습니다.',
      );
    }
  }

  /** 3) 우리 시스템 유저 upsert 후 임시 JWT 발급 (profileCompleted 여부 포함) */
  async signInWithKakao(
    code: string,
  ): Promise<Tokens & { profileCompleted: boolean }> {
    const { access_token } = await this.exchangeCodeForKakaoToken(code);
    const kakao = await this.fetchKakaoProfile(access_token);
    const user = await this.users.createOrUpdateFromKakao(kakao);

    const payload = {
      sub: user.id,
      providerUserId: user.providerUserId,
      profileCompleted: user.profileCompleted,
    };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken, profileCompleted: user.profileCompleted };
  }

  /** 4) 회원가입 폼 완료 후 최종 JWT 재발급 */
  async completeRegistration(
    userId: string,
    profile: {
      childName: string;
      childGender: any;
      childAge: number;
      motherName: string;
      childInterests?: string[];
    },
  ): Promise<Tokens> {
    const saved = await this.users.completeProfile(userId, profile);
    const payload = {
      sub: saved!.id,
      providerUserId: saved!.providerUserId,
      profileCompleted: true,
    };
    return { accessToken: await this.jwt.signAsync(payload) };
  }

  async signInWithKakaoNative(
    kakaoAccessToken: string,
  ): Promise<Tokens & { profileCompleted: boolean }> {
    // 1) 카카오 accessToken 검증 겸 프로필 조회
    const kakao = await this.fetchKakaoProfile(kakaoAccessToken);
    // kakao = { providerUserId, nickname?, email? }

    // 2) 우리 시스템 사용자 upsert
    const user = await this.users.createOrUpdateFromKakao(kakao);

    // 3) 우리 서비스 JWT 발급
    const payload = {
      sub: user.id,
      providerUserId: user.providerUserId,
      profileCompleted: user.profileCompleted,
    };
    const accessToken = await this.jwt.signAsync(payload);

    return { accessToken, profileCompleted: user.profileCompleted };
  }
}

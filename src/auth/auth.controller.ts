import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { KakaoLoginDto } from './dto/kakao-login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { KakaoNativeLoginDto } from './dto/kakao-native-login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, description: '회원가입' })
  @Post('sign-up')
  async register(@Req() req: any, @Body() dto: RegisterDto) {
    const userId = req.user.sub as string;
    return this.auth.completeRegistration(userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 토큰 조회' })
  @ApiResponse({ status: 200, description: 'JWT payload' })
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }

  @ApiOperation({ summary: '카카오 네이티브 로그인 (RN: accessToken 전달)' })
  @ApiResponse({
    status: 200,
    description: 'JWT 발급 & 프로필완료여부 반환',
    schema: {
      properties: {
        accessToken: { type: 'string', description: '서비스 JWT 토큰' },
        profileCompleted: { type: 'boolean', description: '프로필 완성 여부' },
      },
    },
  })
  @Post('kakao/native')
  async kakaoNative(@Body() dto: KakaoNativeLoginDto) {
    return this.auth.signInWithKakaoNative(dto.accessToken);
  }
}

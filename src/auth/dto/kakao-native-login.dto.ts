import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class KakaoNativeLoginDto {
  @ApiProperty({ description: '카카오 액세스 토큰(@react-native-seoul/kakao-login 에서 획득)' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

import { IsNotEmpty, IsString } from 'class-validator';

export class KakaoLoginDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

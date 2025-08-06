import { ApiProperty } from '@nestjs/swagger';

export class DiaryResponseDto {
  @ApiProperty({ description: '일기 ID' })
  id: number;

  @ApiProperty({ description: '방 ID' })
  roomId: number;

  @ApiProperty({ description: '일기 내용' })
  content: string;

  @ApiProperty({ description: '대화 요약' })
  summary: string;

  @ApiProperty({ description: '그림 URL', required: false })
  imageUrl?: string;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;
}

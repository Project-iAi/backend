import { ApiProperty } from '@nestjs/swagger';
import { Emotion } from '../../../character/enum/emotion.enum';

export class CreateRoomDto {
  @ApiProperty({
    description: '선택할 캐릭터 ID (선택사항)',
    required: false,
    example: 1,
  })
  characterId?: number;

  @ApiProperty({
    description: '현재 감정 상태 (선택사항)',
    enum: Emotion,
    required: false,
    example: Emotion.HAPPY,
  })
  emotion?: Emotion;
}

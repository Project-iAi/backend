import { ApiProperty } from '@nestjs/swagger';

export class SelectCharacterDto {
  @ApiProperty({ description: '선택할 캐릭터 ID' })
  characterId: number;
}

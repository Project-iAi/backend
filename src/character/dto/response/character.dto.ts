import { ApiProperty } from '@nestjs/swagger';
import { CharacterCategory } from '../../enum/character-category.enum';

export class CharacterResponseDto {
  @ApiProperty({ description: '캐릭터 ID' })
  id: number;

  @ApiProperty({ description: '캐릭터 이름' })
  name: string;

  @ApiProperty({
    description: '카테고리',
    enum: CharacterCategory,
  })
  category: CharacterCategory;
}

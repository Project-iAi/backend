import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CharacterService } from '../service/character.service';
import { CharacterResponseDto } from '../dto/response/character.dto';

@ApiTags('Character')
@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @ApiOperation({
    summary: '모든 캐릭터 조회',
    description: '선택 가능한 모든 캐릭터 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '캐릭터 목록 조회 성공',
    type: [CharacterResponseDto],
  })
  @Get()
  async getAllCharacters(): Promise<CharacterResponseDto[]> {
    const characters = await this.characterService.getAllCharacters();

    return characters.map((character) => ({
      id: character.id,
      name: character.name,
      category: character.category,
    }));
  }
}

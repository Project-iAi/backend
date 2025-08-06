import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DiaryService } from '../service/diary.service';
import { DiaryResponseDto } from '../dto/response/diary.dto';

@ApiTags('Diary')
@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @ApiOperation({
    summary: '일기 생성',
    description:
      '특정 채팅방의 대화 내용을 바탕으로 일기를 생성합니다. GPT로 대화를 요약하고, 일기 내용을 생성하며, DALL-E로 그림을 만듭니다.',
  })
  @ApiParam({ name: 'roomId', type: Number, description: '채팅방 ID' })
  @ApiResponse({
    status: 201,
    description: '일기 생성 성공',
    type: DiaryResponseDto,
  })
  @Post('room/:roomId')
  async generateDiary(
    @Param('roomId') roomId: string,
  ): Promise<DiaryResponseDto> {
    const roomIdNum = parseInt(roomId, 10);
    const diary = await this.diaryService.generateDiary(roomIdNum);

    return {
      id: diary.id,
      roomId: diary.room.id,
      content: diary.content,
      summary: diary.summary,
      imageUrl: diary.imageUrl,
      createdAt: diary.createdAt,
    };
  }

  @ApiOperation({
    summary: '특정 방 일기 조회',
    description: '특정 채팅방의 일기를 조회합니다.',
  })
  @ApiParam({ name: 'roomId', type: Number, description: '채팅방 ID' })
  @ApiResponse({
    status: 200,
    description: '일기 조회 성공',
    type: DiaryResponseDto,
  })
  @Get('room/:roomId')
  async getDiary(
    @Param('roomId') roomId: string,
  ): Promise<DiaryResponseDto | null> {
    const roomIdNum = parseInt(roomId, 10);
    const diary = await this.diaryService.getDiary(roomIdNum);

    if (!diary) {
      return null;
    }

    return {
      id: diary.id,
      roomId: diary.room.id,
      content: diary.content,
      summary: diary.summary,
      imageUrl: diary.imageUrl,
      createdAt: diary.createdAt,
    };
  }

  @ApiOperation({
    summary: '모든 일기 조회',
    description: '생성된 모든 일기를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '일기 목록 조회 성공',
    type: [DiaryResponseDto],
  })
  @Get()
  async getAllDiaries(): Promise<DiaryResponseDto[]> {
    const diaries = await this.diaryService.getAllDiaries();

    return diaries.map((diary) => ({
      id: diary.id,
      roomId: diary.room.id,
      content: diary.content,
      summary: diary.summary,
      imageUrl: diary.imageUrl,
      createdAt: diary.createdAt,
    }));
  }
}

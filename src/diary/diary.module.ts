import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryService } from './service/diary.service';
import { DiaryController } from './controller/diary.controller';
import { Diary } from './entity/diary.entity';
import { ChatMessage } from '../chat/entity/chat-message.entity';
import { ChatRoom } from '../chat/entity/chat-room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Diary, ChatMessage, ChatRoom])],
  providers: [DiaryService],
  controllers: [DiaryController],
  exports: [DiaryService],
})
export class DiaryModule {}

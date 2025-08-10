import { Module } from '@nestjs/common';
import { ChatService } from './service/chat.service';
import { ChatController } from './controller/chat.controller';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './entity/chat-message.entity';
import { ChatRoom } from './entity/chat-room.entity';
import { ChatVoiceService } from './service/chat-voice.service';
import { Character } from '../character/entity/character.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRoom, ChatMessage, Character])],
  providers: [ChatGateway, ChatService, ChatVoiceService],
  exports: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}

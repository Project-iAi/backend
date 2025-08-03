import { Controller, Get, Param, Post } from '@nestjs/common';
import { ChatService } from "../service/chat.service";
import { RoomInfoResponseDto } from "../dto/response/room-response.dto";
import { ChatMessageResponseDto } from "../dto/response/chat-message.dto";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Chat') // Swagger에서 그룹핑
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @ApiOperation({ summary: '채팅방 생성', description: '새로운 채팅방을 생성합니다.' })
    @ApiResponse({ status: 201, description: '채팅방 생성 성공', type: RoomInfoResponseDto })
    @Post('room')
    async createRoom(): Promise<RoomInfoResponseDto> {
        const room = await this.chatService.createRoom();
        return { id: room.id, createdAt: room.createdAt };
    }

    // @ApiOperation({ summary: '채팅방 단건 조회', description: 'roomId로 채팅방을 조회합니다.' })
    // @ApiParam({ name: 'roomId', type: Number, description: '채팅방 ID' })
    // @ApiResponse({ status: 200, description: '채팅방 단건 반환', type: RoomInfoResponseDto })
    // @Get('room/:roomId')
    // async getRoom(@Param('roomId') roomId: string): Promise<RoomInfoResponseDto> {
    //     const roomIdNum = parseInt(roomId, 10);
    //     const room = await this.chatService.getRoom(roomIdNum);
    //     return { id: room.id, createdAt: room.createdAt };
    // }
    //
    // @ApiOperation({ summary: '채팅방 전체 목록 조회', description: '모든 채팅방을 조회합니다.' })
    // @ApiResponse({ status: 200, description: '채팅방 리스트 반환', type: [RoomInfoResponseDto] })
    // @Get('room')
    // async getRoomList(): Promise<RoomInfoResponseDto[]> {
    //     const rooms = await this.chatService.getRoomList();
    //     return rooms.map(room => ({
    //         id: room.id,
    //         createdAt: room.createdAt,
    //     }));
    // }

    @ApiOperation({ summary: '방별 메시지 목록 조회', description: '특정 채팅방에 모든 메시지를 조회합니다.' })
    @ApiParam({ name: 'roomId', type: Number, description: '채팅방 ID' })
    @ApiResponse({ status: 200, description: '메시지 리스트 반환', type: [ChatMessageResponseDto] })
    @Get('room/:roomId/messages')
    async getMessages(@Param('roomId') roomId: string): Promise<ChatMessageResponseDto[]> {
        const roomIdNum = parseInt(roomId, 10);
        const messages = await this.chatService.getMessagesByRoom(roomIdNum);
        return messages.map(msg => ({
            id: msg.id,
            roomId: msg.room.id,
            userType: msg.userType,
            content: msg.content,
            createdAt: msg.createdAt,
        }));
    }
}

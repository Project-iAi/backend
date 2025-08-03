import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {ChatService} from "./service/chat.service";

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() data: { roomId: number }, @ConnectedSocket() client: Socket) {
    await client.join(String(data.roomId));
    client.emit('joinedRoom', {roomId: data.roomId});
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(@MessageBody() data: { roomId: number; text: string }, @ConnectedSocket() client: Socket) {

    //유저 메시지 저장
    await this.chatService.saveMessage(data.roomId, 'user', data.text);

    //ai 답변 저장
    const aiText = await this.chatService.getAIResponse(data.text);
    await this.chatService.saveMessage(data.roomId, 'ai', aiText);

    //메시지 전달
    this.server.to(String(data.roomId)).emit('message', {
      user: client.id,
      text: data.text,
      time: new Date(),
      sender: 'user',
    });

    this.server.to(String(data.roomId)).emit('message', {
      user: 'ai',
      text: aiText,
      time: new Date(),
      sender: 'ai',
    });
  }
}

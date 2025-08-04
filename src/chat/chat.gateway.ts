import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {ChatService} from "./service/chat.service";
import {ChatVoiceService} from "./service/chat-voice.service";

@WebSocketGateway({
  cors: { origin: '*' },
  maxHttpBuffersize: 10e6
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  //타이머관리
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(
      private readonly chatService: ChatService,
      private readonly chatVoiceService: ChatVoiceService
  ) {}

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() data: { roomId: number }, @ConnectedSocket() client: Socket) {
    await client.join(String(data.roomId));
    client.emit('joinedRoom', {roomId: data.roomId, socketId: client.id });

    this.startInactivityTimer(client, data.roomId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(@MessageBody() data: { roomId: number; text: string }, @ConnectedSocket() client: Socket) {

    try {
      this.resetInactivityTimer(client, data.roomId);

      //유저 메시지 저장
      await this.chatService.saveMessage(data.roomId, 'user', data.text);

      //메시지 전달
      this.server.to(String(data.roomId)).emit('message', {
        id: Date.now(),
        text: data.text,
        sender: 'user',
        type: 'text',
        timestamp: new Date()
      });

      //ai 답변 저장
      const aiText = await this.chatService.getAIResponse(data.text);
      await this.chatService.saveMessage(data.roomId, 'ai', aiText);

      //text 전송
      this.server.to(String(data.roomId)).emit('message', {
        id: Date.now() +1,
        text: aiText,
        sender: 'ai',
        type: 'text',
        timestamp: new Date()
      });

      //ai응답 tts로
      const audioBase64 = await this.chatVoiceService.textToSpeech(aiText);

      //ai 음성 전송
      this.server.to(String(data.roomId)).emit('message', {
        id: Date.now() + 2,
        text: aiText,
        audioData: audioBase64,
        sender: 'ai',
        type: 'voice',
        timestamp: new Date()
      });

      this.startInactivityTimer(client, data.roomId);
    } catch (error) {
      console.error('메시지 처리 에러:', error);
      client.emit('error', {
        message: '메시지 처리 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  //음성 메시지 처리
  @SubscribeMessage('sendVoiceMessage')
  async handleVoiceMessage(@MessageBody() data: { roomId: number; audioData: string }, @ConnectedSocket() client: Socket) {
    try {
      // 타이머 리셋
      this.resetInactivityTimer(client, data.roomId);

      // Base64 → Buffer 변환
      const audioBuffer = Buffer.from(data.audioData, 'base64');

      // STT 처리 중 알림
      client.emit('processing', {
        stage: 'stt',
        message: '음성을 인식하고 있어요...'
      });

      // STT: 음성 → 텍스트
      const recognizedText = await this.chatVoiceService.speechToText(audioBuffer);

      if (!recognizedText.trim()) {
        client.emit('error', { message: '음성을 인식할 수 없어요. 다시 말해주세요!' });
        this.startInactivityTimer(client, data.roomId);
        return;
      }

      // 유저 메시지 저장 및 브로드캐스트
      await this.chatService.saveMessage(data.roomId, 'user', recognizedText);

      this.server.to(String(data.roomId)).emit('message', {
        id: Date.now(),
        text: recognizedText,
        audioData: data.audioData, // 원본 음성도 함께
        sender: 'user',
        type: 'voice',
        timestamp: new Date()
      });

      // AI 응답 생성 중 알림
      client.emit('processing', {
        stage: 'ai',
        message: '답변을 생각하고 있어요...'
      });

      // AI 답변 생성
      const aiText = await this.chatService.getAIResponse(recognizedText);
      await this.chatService.saveMessage(data.roomId, 'ai', aiText);

      // AI 텍스트 먼저 전송
      this.server.to(String(data.roomId)).emit('message', {
        id: Date.now() + 1,
        text: aiText,
        sender: 'ai',
        type: 'text',
        timestamp: new Date()
      });

      // TTS 처리 중 알림
      client.emit('processing', {
        stage: 'tts',
        message: '음성으로 만들고 있어요...'
      });

      // TTS: AI 텍스트 → 음성
      const aiAudioBase64 = await this.chatVoiceService.textToSpeech(aiText);

      // AI 음성 메시지 전송
      this.server.to(String(data.roomId)).emit('message', {
        id: Date.now() + 2,
        text: aiText,
        audioData: aiAudioBase64,
        sender: 'ai',
        type: 'voice',
        timestamp: new Date()
      });

      // 처리 완료 알림
      client.emit('processing', {
        stage: 'complete',
        message: '완료!'
      });

      // 새 타이머 시작
      this.startInactivityTimer(client, data.roomId);

    } catch (error) {
      console.error('음성 메시지 처리 에러:', error);
      client.emit('error', {
        message: '음성 처리 중 오류가 발생했습니다.',
        error: error.message
      });

      // 에러 시에도 타이머 재시작
      this.startInactivityTimer(client, data.roomId);
    }
  }

  // 20초 무응답 타이머 관리
  private startInactivityTimer(client: Socket, roomId: number) {
    const timerId = `${client.id}-${roomId}`;

    // 기존 타이머가 있으면 제거
    if (this.timers.has(timerId)) {
      clearTimeout(this.timers.get(timerId));
    }

    // 새 타이머 시작
    const timer = setTimeout(() => {
      this.server.to(String(roomId)).emit('sessionTimeout', {
        roomId,
        message: '오늘 이야기한 걸 그림으로 남겨볼까? 내가 너랑 나눈 이야기를 바탕으로 그림을 그려줄게!',
        timestamp: new Date()
      });

      // 타이머 정리
      this.timers.delete(timerId);
    }, 20000); // 20초

    this.timers.set(timerId, timer);
  }

  private resetInactivityTimer(client: Socket, roomId: number) {
    const timerId = `${client.id}-${roomId}`;
    if (this.timers.has(timerId)) {
      clearTimeout(this.timers.get(timerId));
      this.timers.delete(timerId);
    }
  }

  // 연결 해제 시 타이머 정리
  handleDisconnect(client: Socket) {
    const timersToDelete = [];
    this.timers.forEach((timer, timerId) => {
      if (timerId.startsWith(client.id)) {
        clearTimeout(timer);
        timersToDelete.push(timerId);
      }
    });

    timersToDelete.forEach(timerId => {
      this.timers.delete(timerId);
    });
  }
}
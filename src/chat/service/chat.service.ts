import { Injectable } from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import { OpenAI} from 'openai';
import {InjectRepository} from "@nestjs/typeorm";
import {ChatMessage} from "../entity/chat-message.entity";
import {Repository} from "typeorm";
import {ChatRoom} from "../entity/chat-room.entity";

@Injectable()
export class ChatService {
    private readonly openai: OpenAI;

    constructor(
        private readonly configService: ConfigService,

        @InjectRepository(ChatMessage)
        private readonly chatMessageRepo: Repository<ChatMessage>,

        @InjectRepository(ChatRoom)
        private readonly roomRepo: Repository<ChatRoom>,
    ) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        this.openai = new OpenAI({ apiKey });
    }
    async getAIResponse(message: string): Promise<string> {
        const systemPrompt = `
    너는 4~7세 어린이의 하루와 감정을 기록해주는 AI 친구야.
    아이와 대화할 때는 항상 밝고 따뜻한 톤을 유지하고, 짧고 쉬운 한글로 대답해.
    아이의 기분, 오늘 한 일, 느낀 감정 등을 자연스럽게 물어보고,
    아이의 대답에 항상 공감과 칭찬, 격려의 말을 덧붙여줘.
    절대 어른스럽거나 어려운 단어, 명령조 표현은 쓰지 말고,
    항상 아이가 먼저 말을 많이 할 수 있도록 부드럽게 질문해줘.
    절대 두 문장 이상은 쓰지 않고, 한 문장으로 간단하게 답변해.
    반드시 존댓말은 쓰지 말고, 친구처럼 말해줘.
    `;

        const res = await this.openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message },
            ],
        });
        return res.choices[0].message?.content || '';
    }

    async saveMessage(roomId: number, userType: 'user' | 'ai', content: string): Promise<ChatMessage> {
        const room = await this.roomRepo.findOne({ where: {id: roomId}});
        if (!room) throw new Error('채팅방이 존재하지 않습니다.');

        const message = this.chatMessageRepo.create({
            room: room,
            userType,
            content,
        });
        return this.chatMessageRepo.save(message);
    }

    async createRoom(): Promise<ChatRoom> {
        const room = this.roomRepo.create();
        return this.roomRepo.save(room);
    }

    async getRoom(roomId: number ): Promise<ChatRoom> {
        return this.roomRepo.findOne({ where: { id: roomId }});
    }

    async getRoomList(): Promise<ChatRoom[]> {
        return this.roomRepo.find();
    }

    async getMessagesByRoom(roomId: number): Promise<ChatMessage[]> {
        return this.chatMessageRepo.find({
            where: { room: {id: roomId} },
            order: { createdAt: 'ASC' },
            relations: ['room'],
        });
}}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMessage } from '../entity/chat-message.entity';
import { Repository } from 'typeorm';
import { ChatRoom } from '../entity/chat-room.entity';
import { Character } from '../../character/entity/character.entity';
import { Emotion } from '../../character/enum/emotion.enum';

@Injectable()
export class ChatService {
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,

    @InjectRepository(ChatRoom)
    private readonly roomRepo: Repository<ChatRoom>,

    @InjectRepository(Character)
    private readonly characterRepo: Repository<Character>,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey });
  }

  async getAIResponse(message: string, roomId: number): Promise<string> {
    // 채팅방의 선택된 캐릭터와 감정 정보 가져오기
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['selectedCharacter'],
    });

    let systemPrompt = `
너는 4~7세 어린이의 하루와 감정을 기록해주는 친구야.
아이와 대화할 때는 항상 밝고 따뜻한 톤을 유지하고, 짧고 쉬운 한글로 대답해.
아이의 기분, 오늘 한 일, 느낀 감정 등을 자연스럽게 물어보고,
아이의 대답에 항상 공감과 칭찬, 격려의 말을 덧붙여줘.
절대 어른스럽거나 어려운 단어, 명령조 표현은 쓰지 말고,
항상 아이가 먼저 말을 많이 할 수 있도록 부드럽게 질문해줘.
절대 두 문장 이상은 쓰지 않고, 한 문장으로 간단하게 답변해.
반드시 존댓말은 쓰지 말고, 친구처럼 말해줘.
        `;

    // 선택된 캐릭터가 있으면 해당 캐릭터의 페르소나 적용
    if (room?.selectedCharacter) {
      systemPrompt =
        room.selectedCharacter.persona +
        `
추가로, 4~7세 어린이와 대화할 때는 짧고 쉬운 한글로 대답하고,
절대 두 문장 이상은 쓰지 않으며, 한 문장으로 간단하게 답변해.
존댓말은 쓰지 말고 친구처럼 말해줘.
            `;
    }

    // 감정 상태에 따른 추가 컨텍스트
    if (room?.emotion) {
      let emotionContext = '';
      switch (room.emotion) {
        case Emotion.HAPPY:
          emotionContext = `
오늘 친구가 기쁜 감정을 선택했으니, 무슨 기분 좋은 일이 있었는지 자연스럽게 물어보고 함께 기뻐해줘.
"오늘 뭔가 좋은 일이 있었나봐?", "무슨 일로 기분이 좋아?" 같은 식으로 기쁜 상황에 대해 궁금해하고 함께 즐거워해줘.`;
          break;
        case Emotion.SAD:
          emotionContext = `
오늘 친구가 슬픈 감정을 선택했으니, 무슨 속상한 일이 있었는지 따뜻하게 물어보고 위로해줘.
"오늘 뭔가 속상한 일이 있었어?", "무슨 일로 마음이 아파?" 같은 식으로 슬픈 상황에 대해 공감하고 마음을 달래줘.`;
          break;
        case Emotion.ANGRY:
          emotionContext = `
오늘 친구가 화난 감정을 선택했으니, 무슨 화나는 일이 있었는지 이해하려 하고 마음을 진정시켜줘.
"오늘 뭔가 화나는 일이 있었나?", "무슨 일로 속이 상해?" 같은 식으로 화난 상황을 들어주고 기분을 풀어줘.`;
          break;
      }
      systemPrompt += emotionContext;
    }

    const res = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    });
    return res.choices[0].message?.content || '';
  }

  async saveMessage(
    roomId: number,
    userType: 'user' | 'ai',
    content: string,
  ): Promise<ChatMessage> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new Error('채팅방이 존재하지 않습니다.');

    const message = this.chatMessageRepo.create({
      room: room,
      userType,
      content,
    });
    return this.chatMessageRepo.save(message);
  }

  async createRoom(characterId?: number, emotion?: Emotion): Promise<ChatRoom> {
    const room = this.roomRepo.create();

    // 캐릭터가 선택된 경우
    if (characterId) {
      const character = await this.characterRepo.findOne({
        where: { id: characterId },
      });
      if (character) {
        room.selectedCharacter = character;
      }
    }

    // 감정이 선택된 경우
    if (emotion) {
      room.emotion = emotion;
    }

    return this.roomRepo.save(room);
  }

  async getRoom(roomId: number): Promise<ChatRoom> {
    return this.roomRepo.findOne({ where: { id: roomId } });
  }

  async getRoomList(): Promise<ChatRoom[]> {
    return this.roomRepo.find();
  }

  async getMessagesByRoom(roomId: number): Promise<ChatMessage[]> {
    return this.chatMessageRepo.find({
      where: { room: { id: roomId } },
      order: { createdAt: 'ASC' },
      relations: ['room'],
    });
  }

  async selectCharacterForRoom(
    roomId: number,
    characterId: number,
  ): Promise<ChatRoom> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new Error('채팅방이 존재하지 않습니다.');

    const character = await this.characterRepo.findOne({
      where: { id: characterId },
    });
    if (!character) throw new Error('캐릭터가 존재하지 않습니다.');

    room.selectedCharacter = character;
    return this.roomRepo.save(room);
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Diary } from '../entity/diary.entity';
import { ChatMessage } from '../../chat/entity/chat-message.entity';
import { ChatRoom } from '../../chat/entity/chat-room.entity';

@Injectable()
export class DiaryService {
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(Diary)
    private readonly diaryRepo: Repository<Diary>,

    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,

    @InjectRepository(ChatRoom)
    private readonly roomRepo: Repository<ChatRoom>,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey });
  }

  async generateDiary(roomId: number): Promise<Diary> {
    // 1. 해당 방의 모든 메시지 가져오기
    const messages = await this.chatMessageRepo.find({
      where: { room: { id: roomId } },
      order: { createdAt: 'ASC' },
      relations: ['room'],
    });

    if (messages.length === 0) {
      throw new Error('대화 내용이 없어서 일기를 생성할 수 없습니다.');
    }

    // 2. 대화 내용을 요약하기
    const summary = await this.summarizeConversation(messages);

    // 3. 요약을 바탕으로 일기 내용 생성하기
    const diaryContent = await this.generateDiaryContent(summary);

    // 4. DALL-E로 그림 생성하기 (대화 내용 전체 활용)
    const imageUrl = await this.generateDiaryImage(messages);

    // 5. 일기 저장하기
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) {
      throw new Error('채팅방이 존재하지 않습니다.');
    }

    const diary = this.diaryRepo.create({
      room: room,
      content: diaryContent,
      summary: summary,
      imageUrl: imageUrl,
    });

    return this.diaryRepo.save(diary);
  }

  private async summarizeConversation(
    messages: ChatMessage[],
  ): Promise<string> {
    const conversation = messages
      .map((msg) => `${msg.userType}: ${msg.content}`)
      .join('\n');

    const prompt = `
다음은 4~7세 어린이와 AI의 대화입니다. 이 대화를 바탕으로 아이의 하루를 요약해주세요.
아이가 무엇을 했는지, 어떤 기분이었는지, 특별한 일이 있었는지 등을 중심으로 요약해주세요.
요약은 2-3문장으로 간단하게 작성해주세요.

대화 내용:
${conversation}
        `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '당신은 어린이의 하루를 요약하는 전문가입니다.',
        },
        { role: 'user', content: prompt },
      ],
    });

    return response.choices[0].message?.content || '';
  }

  private async generateDiaryContent(summary: string): Promise<string> {
    const prompt = `
다음은 어린이의 하루 요약입니다. 이를 바탕으로 어린이가 쓴 것 같은 귀여운 일기를 작성해주세요.
어린이의 시각에서, 간단하고 솔직한 문체로 작성해주세요.

요약:
${summary}
        `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            '당신은 어린이의 일기를 대신 써주는 도우미입니다. 어린이다운 귀여운 문체로 일기를 작성해주세요.',
        },
        { role: 'user', content: prompt },
      ],
    });

    return response.choices[0].message?.content || '';
  }

  private async generateDiaryImage(messages: ChatMessage[]): Promise<string> {
    // 대화 내용에서 이미지 생성에 적합한 키워드 추출
    const imageKeywords = this.extractImageKeywords(messages);

    const prompt = `
A child's drawing style illustration, as if drawn by a 4-7 year old kid with crayons. 
Scene showing: ${imageKeywords}
Art style: simple childlike drawing, crayon texture, uneven lines, bright primary colors, 
innocent perspective, stick figures or simple shapes, like a kid's artwork on paper.
The drawing should look spontaneous and charming, with the imperfect beauty of children's art.
No text or words in the image.
        `;

    try {
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      return response.data[0].url || '';
    } catch (error) {
      console.error('DALL-E 이미지 생성 오류:', error);
      return ''; // 이미지 생성 실패시 빈 문자열 반환
    }
  }

  // 대화 내용에서 이미지 생성에 적합한 키워드 추출
  private extractImageKeywords(messages: ChatMessage[]): string {
    // 전체 대화 내용 합치기
    const allConversation = messages.map((msg) => msg.content).join(' ');

    // 그림으로 표현하기 좋은 키워드들
    const visualKeywords = [
      // 장소
      '집',
      '방',
      '거실',
      '부엌',
      '침실',
      '화장실',
      '학교',
      '교실',
      '운동장',
      '놀이터',
      '공원',
      '바다',
      '산',
      '강',
      '들판',
      '숲',
      '하늘',
      '구름',
      '별',
      '해',
      '달',

      // 활동
      '놀이',
      '게임',
      '그리기',
      '색칠',
      '만들기',
      '요리',
      '청소',
      '산책',
      '뛰기',
      '춤',
      '노래',
      '책읽기',
      '공부',
      '숙제',
      '운동',
      '수영',
      '자전거',
      '그네',
      '미끄럼틀',

      // 사물
      '장난감',
      '인형',
      '블록',
      '자동차',
      '공',
      '책',
      '연필',
      '크레용',
      '종이',
      '가방',
      '옷',
      '신발',
      '모자',
      '음식',
      '과일',
      '채소',
      '케이크',
      '사탕',
      '우유',

      // 동물
      '강아지',
      '고양이',
      '새',
      '물고기',
      '나비',
      '꽃',
      '나무',
      '잔디',

      // 감정 표현
      '웃음',
      '기쁨',
      '행복',
      '즐거움',
      '재미',
      '신남',
      '좋아',

      // 자연
      '꽃',
      '나무',
      '잔디',
      '하늘',
      '구름',
      '해',
      '달',
      '별',
      '무지개',
      '비',
      '눈',
    ];

    // 대화에서 발견된 키워드들 추출
    const foundKeywords = visualKeywords.filter((keyword) =>
      allConversation.includes(keyword),
    );

    if (foundKeywords.length > 0) {
      // 최대 5개의 키워드만 사용 (너무 복잡하지 않게)
      return foundKeywords.slice(0, 5).join(', ');
    }

    // 키워드가 없으면 대화 내용 직접 요약
    const shortSummary = allConversation
      .replace(/어린이|아이|아기|유아/g, 'person')
      .replace(/4-7세|[0-9]세/g, '')
      .substring(0, 100); // 100자로 제한

    return shortSummary || 'happy daily life scene';
  }

  async getDiary(roomId: number): Promise<Diary | null> {
    return this.diaryRepo.findOne({
      where: { room: { id: roomId } },
      relations: ['room'],
    });
  }

  async getAllDiaries(): Promise<Diary[]> {
    return this.diaryRepo.find({
      relations: ['room'],
      order: { createdAt: 'DESC' },
    });
  }
}

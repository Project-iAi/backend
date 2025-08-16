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

    // 3. 요약과 원본 대화를 바탕으로 일기 내용 생성하기
    const diaryContent = await this.generateDiaryContent(summary, messages);

    // 4. DALL-E로 그림 생성하기 (대화 내용 전체 활용)
    const imageUrl = await this.generateDiaryImage(messages);

    // 5. 부모 리포트 생성하기
    const parentReport = await this.generateParentReport(messages);

    // 6. 일기 저장하기
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) {
      throw new Error('채팅방이 존재하지 않습니다.');
    }

    const diary = this.diaryRepo.create({
      room: room,
      content: diaryContent,
      summary: summary,
      imageUrl: imageUrl,
      parentReport: parentReport,
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

중요한 포인트:
1. 아이가 직접 언급한 활동, 감정, 경험을 우선적으로 포함
2. 아이가 사용한 특별한 표현이나 새로운 단어가 있다면 기록
3. 아이의 관심사나 호기심을 보인 주제들을 파악
4. 아이의 감정 변화나 특별한 반응을 놓치지 말고 포함
5. 요약은 3-4문장으로 구체적이고 생생하게 작성

대화 내용:
${conversation}
        `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            '당신은 4-7세 어린이의 발달과 행동을 잘 아는 전문가입니다. 아이의 대화에서 중요한 발달 신호와 감정, 관심사를 놓치지 않고 정확하게 요약합니다.',
        },
        { role: 'user', content: prompt },
      ],
    });

    return response.choices[0].message?.content || '';
  }

  private async generateDiaryContent(
    summary: string,
    messages: ChatMessage[],
  ): Promise<string> {
    const conversation = messages
      .map((msg) => `${msg.userType}: ${msg.content}`)
      .join('\n');

    const userMessages = messages.filter((msg) => msg.userType === 'user');

    const prompt = `
다음은 4-7세 어린이와 AI의 실제 대화입니다. 이 대화를 바탕으로 어린이가 직접 쓴 것 같은 자연스러운 일기를 작성해주세요.

중요한 가이드라인:
1. 아이가 실제로 말한 내용과 표현을 최대한 활용하세요
2. 아이가 사용한 단어나 표현이 있다면 그대로 반영하세요
3. 4-7세 아이의 순수하고 솔직한 문체로 작성하세요
4. 아이의 감정과 경험을 생생하게 표현하세요
5. 너무 복잡한 문장보다는 짧고 명확한 문장들로 구성하세요
6. "오늘은~", "나는~" 같은 자연스러운 시작으로 작성하세요
7. 일기 길이는 3-5문장 정도로 적당하게 작성하세요

실제 대화 내용:
${conversation}

하루 요약:
${summary}

위 정보를 바탕으로 어린이가 직접 쓴 것 같은 일기를 작성해주세요:
        `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            '당신은 4-7세 어린이의 언어 발달과 표현을 잘 아는 전문가입니다. 아이의 실제 말투와 감정을 그대로 살려서 자연스럽고 진짜 아이가 쓴 것 같은 일기를 작성해주세요. 아이의 순수함과 솔직함이 드러나도록 해주세요.',
        },
        { role: 'user', content: prompt },
      ],
    });

    return response.choices[0].message?.content || '';
  }

  private async generateDiaryImage(messages: ChatMessage[]): Promise<string> {
    // GPT로 대화 내용을 분석해서 이미지 프롬프트 생성
    const imagePrompt = await this.generateImagePrompt(messages);

    const prompt = `
A child's drawing style illustration, as if drawn by a 4-7 year old kid with crayons on paper.

Scene to draw: ${imagePrompt}

Art style requirements:
- Simple childlike drawing with crayon or colored pencil texture
- Uneven lines and imperfect shapes that look hand-drawn by a child
- Bright, vibrant primary colors (red, blue, yellow, green)
- Innocent perspective with simple stick figures or basic shapes
- Objects might be disproportionate in a charming way
- Looks spontaneous and joyful, like a child's bedroom wall artwork
- Paper texture visible in background
- No text, letters, or words in the image
- Focus on happiness and wonder that children see in the world
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

  // GPT로 대화 내용을 분석해서 이미지 프롬프트 생성
  private async generateImagePrompt(messages: ChatMessage[]): Promise<string> {
    const conversation = messages
      .map((msg) => `${msg.userType}: ${msg.content}`)
      .join('\n');

    const prompt = `
다음은 4-7세 어린이와 AI의 대화 내용입니다. 이 대화를 바탕으로 어린이가 그릴 법한 그림의 장면을 영어로 묘사해주세요.

대화 내용:
${conversation}

요구사항:
1. 아이가 대화에서 언급한 구체적인 내용을 반영하세요
2. 아이의 관심사나 감정이 드러나는 장면으로 구성하세요
3. 4-7세 아이가 그릴 수 있는 수준의 간단한 장면으로 제한하세요
4. 너무 복잡하지 않고 1-2개의 주요 요소에 집중하세요
5. 긍정적이고 밝은 분위기의 장면으로 만드세요

응답은 영어로 간단하게 작성해주세요 (예: "a happy child playing with a dog in the garden"):
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              '당신은 아동 미술과 발달을 이해하는 전문가입니다. 아이의 대화 내용을 바탕으로 그들이 그릴 법한 간단하고 의미 있는 그림 장면을 제안합니다.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      });

      const imagePrompt = response.choices[0].message?.content || '';

      // 기본값 제공
      return imagePrompt || 'a happy child in a colorful room with toys';
    } catch (error) {
      console.error('이미지 프롬프트 생성 오류:', error);
      return 'a happy child in a colorful room with toys';
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

  private async generateParentReport(messages: ChatMessage[]): Promise<{
    emotionalState: string;
    interests: string[];
    languageDevelopment: string;
    socialSkills: string;
    highlights: string[];
    suggestions: string[];
    overallAssessment: string;
    developmentScores: {
      language: number;
      social: number;
      emotional: number;
      creativity: number;
      curiosity: number;
    };
    overallScore: number;
  }> {
    const conversation = messages
      .map((msg) => `${msg.userType}: ${msg.content}`)
      .join('\n');

    const prompt = `
다음은 4-7세 어린이와 AI의 대화 내용입니다. 이 대화를 분석하여 부모에게 전달할 리포트를 작성해주세요.

대화 내용:
${conversation}

다음 항목들을 JSON 형태로 분석해주세요:

1. emotionalState: 아이의 전반적인 감정 상태 (긍정적/보통/부정적 중 하나)
2. interests: 아이가 관심을 보인 주제들 (예: ["동물", "그림그리기"], 최대 5개, 없으면 빈 배열)
3. languageDevelopment: 아이의 언어 발달 수준 평가 (1-2문장)
4. socialSkills: 아이의 사회성 및 소통 능력 평가 (1-2문장)
5. highlights: 오늘 특별히 새로 보인 행동이나 성장한 점 (예: ["처음으로 긴 문장을 말했습니다"], 최대 3개, 없으면 빈 배열)
6. suggestions: 부모를 위한 구체적인 제안사항 (배열 형태, 최대 3개)
7. overallAssessment: 전체적인 하루 평가 (2-3문장)
8. developmentScores: 발달 영역별 점수 (1-10점)
   - language: 언어 발달 (어휘력, 문법, 표현력)
   - social: 사회성 (예의, 소통 능력, 상호작용)
   - emotional: 감정 발달 (감정 표현, 인식, 조절)
   - creativity: 창의성 (상상력, 새로운 아이디어)
   - curiosity: 호기심 (질문, 탐구, 관심)
9. overallScore: 전체 종합 점수 (위 5개 점수의 평균, 소수점 1자리)

응답은 반드시 JSON 형태로만 해주세요. 다른 텍스트는 포함하지 마세요.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              '당신은 아동 발달 전문가입니다. 아이와의 대화를 분석하여 부모에게 유용한 리포트를 작성합니다. 응답은 반드시 JSON 형태로만 해주세요.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      });

      const content = response.choices[0].message?.content || '{}';

      try {
        const reportData = JSON.parse(content);
        const defaultScores = {
          language: 5,
          social: 5,
          emotional: 5,
          creativity: 5,
          curiosity: 5,
        };

        const developmentScores = reportData.developmentScores || defaultScores;
        const overallScore =
          reportData.overallScore ||
          Math.round(
            ((developmentScores.language +
              developmentScores.social +
              developmentScores.emotional +
              developmentScores.creativity +
              developmentScores.curiosity) /
              5) *
              10,
          ) / 10;

        return {
          emotionalState: reportData.emotionalState || '분석 불가',
          interests: reportData.interests || [],
          languageDevelopment:
            reportData.languageDevelopment || '분석할 데이터가 부족합니다.',
          socialSkills:
            reportData.socialSkills || '분석할 데이터가 부족합니다.',
          highlights: reportData.highlights || [],
          suggestions: reportData.suggestions || [],
          overallAssessment:
            reportData.overallAssessment || '오늘 아이와의 대화가 있었습니다.',
          developmentScores,
          overallScore,
        };
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        // 기본값 반환
        const defaultScores = {
          language: 5,
          social: 5,
          emotional: 5,
          creativity: 5,
          curiosity: 5,
        };

        return {
          emotionalState: '분석 불가',
          interests: [],
          languageDevelopment: '분석할 데이터가 부족합니다.',
          socialSkills: '분석할 데이터가 부족합니다.',
          highlights: [],
          suggestions: [],
          overallAssessment: '오늘 아이와의 대화가 있었습니다.',
          developmentScores: defaultScores,
          overallScore: 5.0,
        };
      }
    } catch (error) {
      console.error('부모 리포트 생성 오류:', error);
      // 기본값 반환
      const defaultScores = {
        language: 5,
        social: 5,
        emotional: 5,
        creativity: 5,
        curiosity: 5,
      };

      return {
        emotionalState: '분석 불가',
        interests: [],
        languageDevelopment: '분석할 데이터가 부족합니다.',
        socialSkills: '분석할 데이터가 부족합니다.',
        highlights: [],
        suggestions: [],
        overallAssessment: '오늘 아이와의 대화가 있었습니다.',
        developmentScores: defaultScores,
        overallScore: 5.0,
      };
    }
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

  async getParentReport(roomId: number): Promise<any | null> {
    const diary = await this.diaryRepo.findOne({
      where: { room: { id: roomId } },
      relations: ['room'],
    });

    if (!diary || !diary.parentReport) {
      return null;
    }

    const report = diary.parentReport;

    // 기존 리포트와의 호환성을 위해 점수가 없으면 기본값 추가
    if (!report.developmentScores) {
      const defaultScores = {
        language: 5,
        social: 5,
        emotional: 5,
        creativity: 5,
        curiosity: 5,
      };

      report.developmentScores = defaultScores;
      report.overallScore = 5.0;
    }

    // 제거된 필드들 정리 (기존 데이터에 있을 수 있음)
    const cleanedReport = {
      emotionalState: report.emotionalState,
      interests: report.interests || [],
      languageDevelopment: report.languageDevelopment,
      socialSkills: report.socialSkills,
      highlights: report.highlights || [],
      suggestions: report.suggestions || [],
      overallAssessment: report.overallAssessment,
      developmentScores: report.developmentScores,
      overallScore: report.overallScore,
      createdAt: diary.createdAt,
    };

    return cleanedReport;
  }
}

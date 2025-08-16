import { ApiProperty } from '@nestjs/swagger';

export class ParentReportDto {
  @ApiProperty({
    description: '아이의 오늘 전반적인 감정 상태',
    example: '긍정적',
  })
  emotionalState: string;

  @ApiProperty({
    description: '아이가 오늘 주로 관심을 보인 주제들',
    type: [String],
    example: ['동물', '그림그리기', '가족'],
  })
  interests: string[];

  @ApiProperty({
    description: '아이의 언어 발달 수준 평가',
    example:
      '또래 대비 평균 수준이며, 새로운 단어를 적극적으로 사용하려고 합니다.',
  })
  languageDevelopment: string;

  @ApiProperty({
    description: '아이의 사회성 및 소통 능력',
    example: '예의 바르게 대화하며, 자신의 감정을 잘 표현합니다.',
  })
  socialSkills: string;

  @ApiProperty({
    description: '오늘 특별히 주목할 만한 점들',
    type: [String],
    example: [
      '새로운 단어 "멋있다"를 배웠습니다',
      '동생에 대한 관심을 많이 보였습니다',
    ],
  })
  highlights: string[];

  @ApiProperty({
    description: '부모를 위한 제안사항',
    type: [String],
    example: [
      '아이가 동물에 관심이 많으니 동물원 방문을 고려해보세요',
      '그림그리기 재료를 더 다양하게 준비해주세요',
    ],
  })
  suggestions: string[];

  @ApiProperty({
    description: '전체적인 하루 평가',
    example:
      '오늘은 아이가 매우 활발하게 대화에 참여했으며, 긍정적인 감정을 많이 표현했습니다. 새로운 것에 대한 호기심도 왕성했습니다.',
  })
  overallAssessment: string;

  @ApiProperty({
    description: '발달 영역별 점수 (1-10점)',
    example: {
      language: 8,
      social: 7,
      emotional: 9,
      creativity: 6,
      curiosity: 8,
    },
  })
  developmentScores: {
    language: number; // 언어 발달
    social: number; // 사회성
    emotional: number; // 감정 발달
    creativity: number; // 창의성
    curiosity: number; // 호기심/탐구심
  };

  @ApiProperty({
    description: '전체 종합 점수 (1-10점)',
    example: 7.6,
  })
  overallScore: number;

  @ApiProperty({
    description: '리포트 생성 일시',
    example: '2025-08-16T12:53:00.000Z',
  })
  createdAt: Date;
}

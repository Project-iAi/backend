import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ChatVoiceService {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('NAVER_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('NAVER_CLIENT_SECRET');
  }

  //stt(음성->텍스트)
  async speechToText(audioBuffer: Buffer): Promise<string> {
    const url =
      'https://naveropenapi.apigw.ntruss.com/recog/v1/stt?lang=Kor&format=wav';

    try {
      // API 키가 없는 경우 미리 체크
      if (!this.clientId || !this.clientSecret) {
        console.warn(
          '네이버 STT API 키가 설정되지 않았습니다. 텍스트 메시지를 사용해주세요.',
        );
        throw new Error(
          '음성 인식 서비스가 설정되지 않았습니다. 텍스트로 입력해주세요.',
        );
      }

      const response = await axios.post(
        url,
        audioBuffer, // 바로 버퍼만!
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-NCP-APIGW-API-KEY-ID': this.clientId,
            'X-NCP-APIGW-API-KEY': this.clientSecret,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );
      // 네이버 응답이 보통 { text: "결과" } 형태
      return response.data.text || '';
    } catch (error) {
      console.error('STT Error:', error?.response?.data || error);

      // 인증 오류인 경우
      if (error?.response?.data?.error?.message === 'Authentication Failed') {
        throw new Error(
          '음성 인식 서비스 설정이 필요합니다. 텍스트로 대화해주세요!',
        );
      }

      throw new Error('음성 인식에 실패했습니다. 텍스트로 다시 시도해주세요.');
    }
  }

  // TTS: 텍스트 → 음성 (Base64로 반환)
  async textToSpeech(text: string): Promise<string> {
    try {
      // API 키가 없는 경우 미리 체크
      if (!this.clientId || !this.clientSecret) {
        console.warn('네이버 TTS API 키가 설정되지 않았습니다.');
        throw new Error('음성 합성 서비스가 설정되지 않았습니다.');
      }

      // 지원목소리로 선택
      const speaker = 'vdain';

      // 질문문인지 확인하여 끝음 올림 결정 (문장 끝에 ?가 있는 경우에만)
      const trimmedText = text.trim();
      const isQuestion = trimmedText.endsWith('?'); // 문장 끝에만 체크
      const endPitch = isQuestion ? 2 : 0; // 질문문만 끝음 올림

      console.log(
        `TTS 처리: "${text}" - 질문문: ${isQuestion}, endPitch: ${endPitch}`,
      );

      const params =
        `speaker=${speaker}` +
        `&volume=0&speed=0&pitch=0` +
        `&end-pitch=${endPitch}` + // ← 조건부 끝음 조절!
        `&format=wav&text=${encodeURIComponent(text)}`;

      const response = await axios.post(
        'https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts',
        params,
        {
          headers: {
            'X-NCP-APIGW-API-KEY-ID': this.clientId,
            'X-NCP-APIGW-API-KEY': this.clientSecret,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          responseType: 'arraybuffer',
        },
      );

      return Buffer.from(response.data).toString('base64');
    } catch (error) {
      console.error('TTS Error:', error?.response?.data?.toString() || error);

      if (error?.response?.data?.error?.message === 'Authentication Failed') {
        throw new Error('음성 서비스 설정이 필요합니다.');
      }

      throw new Error('음성 합성에 실패했습니다.');
    }
  }
}

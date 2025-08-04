import {Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import * as FormData from 'form-data';
import axios from "axios";


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
        const url = 'https://naveropenapi.apigw.ntruss.com/recog/v1/stt?lang=Kor&format=wav';

        try {
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
                }
            );
            // 네이버 응답이 보통 { text: "결과" } 형태
            return response.data.text || '';
        } catch (error) {
            console.error('STT Error:', error?.response?.data || error);
            throw new Error('음성 인식에 실패했습니다.');
        }
    }


    // TTS: 텍스트 → 음성 (Base64로 반환)
    async textToSpeech(text: string): Promise<string> {
        try {
            // 지원목소리로 선택
            const speaker = 'vdain';
            const endPitch = 2;     // 끝음 올림

            const params =
                `speaker=${speaker}` +
                `&volume=0&speed=0&pitch=0` +
                `&end-pitch=${endPitch}` +      // ← 끝음 조절!
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
                    responseType: 'arraybuffer'
                }
            );

            return Buffer.from(response.data).toString('base64');
        } catch (error) {
            console.error('TTS Error:', error?.response?.data?.toString() || error);
            throw new Error('음성 합성에 실패했습니다.');
        }
    }
}
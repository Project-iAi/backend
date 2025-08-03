export class ChatMessageResponseDto {
    id: number;
    roomId: number;
    userType: 'user' | 'ai';
    content: string;
    createdAt: Date;
}

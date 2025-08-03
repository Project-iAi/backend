import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {ChatRoom} from "./chat-room.entity";

@Entity()
export class ChatMessage {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ChatRoom, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'roomId'})
    room: ChatRoom;

    @Column()
    userType: 'user' | 'ai';

    @Column()
    content: string;

    @CreateDateColumn()
    createdAt: Date;
}
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatRoom } from '../../chat/entity/chat-room.entity';

@Entity()
export class Diary {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => ChatRoom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: ChatRoom;

  @Column('text')
  content: string;

  @Column('text')
  summary: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}

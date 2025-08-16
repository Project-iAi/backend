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

  @Column({ type: 'json', nullable: true })
  parentReport: {
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
  };

  @CreateDateColumn()
  createdAt: Date;
}

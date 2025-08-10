import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { Character } from '../../character/entity/character.entity';
import { Emotion } from '../../character/enum/emotion.enum';

@Entity()
export class ChatRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Character, { nullable: true })
  @JoinColumn({ name: 'characterId' })
  selectedCharacter: Character;

  @Column({
    type: 'enum',
    enum: Emotion,
    nullable: true,
  })
  emotion: Emotion;

  @CreateDateColumn()
  createdAt: Date;
}

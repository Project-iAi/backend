import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CharacterCategory } from '../enum/character-category.enum';

@Entity()
export class Character {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CharacterCategory,
  })
  category: CharacterCategory;

  @Column('text')
  description: string;

  @Column('text')
  persona: string; // 프롬프트에 사용될 페르소나
}

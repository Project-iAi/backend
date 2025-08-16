import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Gender } from '../../common/types/gender.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({ description: '내부 UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '소셜 로그인 사용자 식별자(kakao id)' })
  @Column({ unique: true })
  providerUserId: string;

  @ApiProperty({ example: 'kakao' })
  @Column({ default: 'kakao' })
  provider: 'kakao';

  @ApiProperty({ description: '아이 이름', required: false })
  @Column({ default: '' })
  childName: string;

  @ApiProperty({ enum: Gender, required: false })
  @Column({ type: 'enum', enum: Gender, nullable: true })
  childGender: Gender | null;

  @ApiProperty({ description: '아이 나이', required: false })
  @Column({ type: 'int', default: 0 })
  childAge: number;

  @ApiProperty({ description: '엄마 이름', required: false })
  @Column({ default: '' })
  motherName: string;

  @ApiProperty({ description: '아이 관심사', required: false, type: [String] })
  @Column('simple-array', { nullable: true })
  childInterests: string[] | null;

  @ApiProperty({ description: '프로필 완료 여부' })
  @Column({ default: false })
  profileCompleted: boolean;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  kakaoNickname?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  kakaoEmail?: string;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

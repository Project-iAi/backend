import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, Max, IsArray, ArrayMinSize } from 'class-validator';
import { Gender } from '../../common/types/gender.enum';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: '민수' })
  @IsString() @IsNotEmpty()
  childName: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  childGender: Gender;

  @ApiProperty({ example: 7, minimum: 0, maximum: 18 })
  @IsInt() @Min(0) @Max(18)
  childAge: number;

  @ApiProperty({ example: '김가을' })
  @IsString() @IsNotEmpty()
  motherName: string;

  @ApiProperty({ type: [String], required: false, example: ['그림','레고'] })
  @IsArray() @ArrayMinSize(0)
  @IsString({ each: true })
  @IsOptional()
  childInterests?: string[];
}

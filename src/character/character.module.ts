import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharacterService } from './service/character.service';
import { CharacterController } from './controller/character.controller';
import { Character } from './entity/character.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Character])],
  providers: [CharacterService],
  controllers: [CharacterController],
  exports: [CharacterService],
})
export class CharacterModule {}

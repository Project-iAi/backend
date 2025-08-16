import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findByProviderUserId(providerUserId: string) {
    return this.repo.findOne({ where: { providerUserId } });
  }

  async createOrUpdateFromKakao(profile: {
    providerUserId: string; nickname?: string; email?: string;
  }) {
    let user = await this.findByProviderUserId(profile.providerUserId);
    if (!user) {
      user = this.repo.create({
        providerUserId: profile.providerUserId,
        provider: 'kakao',
        profileCompleted: false,
        childName: '',
        childGender: null,
        childAge: 0,
        motherName: '',
        childInterests: [],
        kakaoNickname: profile.nickname,
        kakaoEmail: profile.email,
      });
    } else {
      user.kakaoNickname = profile.nickname ?? user.kakaoNickname;
      user.kakaoEmail = profile.email ?? user.kakaoEmail;
    }
    return this.repo.save(user);
  }

  async completeProfile(userId: string, data: Partial<User>) {
    await this.repo.update(userId, { ...data, profileCompleted: true });
    return this.repo.findOneBy({ id: userId });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await this.repo.update(userId, { fcmToken });
  }

  async updateProfile(
    userId: string,
    updates: Partial<Pick<UserEntity, 'displayName' | 'photoUrl'>>,
  ): Promise<UserEntity> {
    await this.repo.update(userId, updates);
    return this.findById(userId);
  }
}

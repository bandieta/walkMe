import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from '../database/entities/message.entity';
import { WalkEntity } from '../database/entities/walk.entity';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messagesRepo: Repository<MessageEntity>,
    @InjectRepository(WalkEntity)
    private readonly walksRepo: Repository<WalkEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async saveMessage(data: {
    walkId: string;
    senderId: string;
    content: string;
    type?: 'text' | 'image' | 'location';
    imageUrl?: string;
    location?: { latitude: number; longitude: number };
  }): Promise<MessageEntity> {
    const [walk, sender] = await Promise.all([
      this.walksRepo.findOne({ where: { id: data.walkId } }),
      this.usersRepo.findOne({ where: { id: data.senderId } }),
    ]);

    const message = this.messagesRepo.create({
      walk: walk!,
      sender: sender!,
      content: data.content,
      type: data.type ?? 'text',
      imageUrl: data.imageUrl,
      location: data.location,
    });
    return this.messagesRepo.save(message);
  }

  async getMessages(walkId: string, limit = 50, offset = 0): Promise<MessageEntity[]> {
    return this.messagesRepo.find({
      where: { walk: { id: walkId } },
      relations: ['sender'],
      order: { sentAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}

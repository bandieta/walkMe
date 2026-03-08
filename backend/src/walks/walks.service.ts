import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalkEntity, WalkStatus } from '../database/entities/walk.entity';
import { UserEntity } from '../database/entities/user.entity';
import { CreateWalkDto } from './dto/create-walk.dto';

@Injectable()
export class WalksService {
  constructor(
    @InjectRepository(WalkEntity)
    private readonly walksRepo: Repository<WalkEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async create(hostId: string, dto: CreateWalkDto): Promise<WalkEntity> {
    const host = await this.usersRepo.findOne({ where: { id: hostId } });
    if (!host) throw new NotFoundException('User not found');

    const walk = this.walksRepo.create({
      host,
      title: dto.title,
      description: dto.description,
      meetingLat: dto.meetingLat,
      meetingLng: dto.meetingLng,
      scheduledAt: new Date(dto.scheduledAt),
      maxParticipants: dto.maxParticipants ?? 10,
      participants: [host],
    });
    return this.walksRepo.save(walk);
  }

  async findAll(lat?: number, lng?: number, radiusKm = 10): Promise<WalkEntity[]> {
    const query = this.walksRepo
      .createQueryBuilder('walk')
      .leftJoinAndSelect('walk.host', 'host')
      .leftJoinAndSelect('walk.participants', 'participants')
      .where('walk.status = :status', { status: WalkStatus.PENDING });

    if (lat !== undefined && lng !== undefined) {
      // Haversine distance filter (approximate)
      query.andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(walk.meeting_lat)) *
          cos(radians(walk.meeting_lng) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(walk.meeting_lat)))) < :radius`,
        { lat, lng, radius: radiusKm },
      );
    }

    return query.orderBy('walk.scheduledAt', 'ASC').getMany();
  }

  async findById(id: string): Promise<WalkEntity> {
    const walk = await this.walksRepo.findOne({
      where: { id },
      relations: ['host', 'participants'],
    });
    if (!walk) throw new NotFoundException('Walk not found');
    return walk;
  }

  async join(walkId: string, userId: string): Promise<WalkEntity> {
    const walk = await this.findById(walkId);
    if (walk.status !== WalkStatus.PENDING) throw new BadRequestException('Walk is not joinable');
    if (walk.participants.length >= walk.maxParticipants)
      throw new BadRequestException('Walk is full');
    if (walk.participants.some((p) => p.id === userId))
      throw new BadRequestException('Already joined');

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    walk.participants.push(user);
    return this.walksRepo.save(walk);
  }

  async leave(walkId: string, userId: string): Promise<WalkEntity> {
    const walk = await this.findById(walkId);
    if (walk.host.id === userId) throw new ForbiddenException('Host cannot leave their own walk');
    walk.participants = walk.participants.filter((p) => p.id !== userId);
    return this.walksRepo.save(walk);
  }

  async updateStatus(walkId: string, hostId: string, status: WalkStatus): Promise<WalkEntity> {
    const walk = await this.findById(walkId);
    if (walk.host.id !== hostId) throw new ForbiddenException('Only the host can update status');
    walk.status = status;
    return this.walksRepo.save(walk);
  }
}

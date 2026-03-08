import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

export enum WalkStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('walks')
export class WalkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'host_id' })
  host: UserEntity;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, name: 'meeting_lat' })
  meetingLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, name: 'meeting_lng' })
  meetingLng: number;

  @Column({ type: 'jsonb', nullable: true })
  route?: { latitude: number; longitude: number }[];

  @Column({ type: 'enum', enum: WalkStatus, default: WalkStatus.PENDING })
  status: WalkStatus;

  @Column({ name: 'max_participants', default: 10 })
  maxParticipants: number;

  @ManyToMany(() => UserEntity, { eager: true })
  @JoinTable({ name: 'walk_participants' })
  participants: UserEntity[];

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

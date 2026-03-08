import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('sessions')
@Index(['tokenHash'], { unique: true })
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'token_hash', length: 64 })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'ip_address', nullable: true, length: 45 })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true, type: 'text' })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

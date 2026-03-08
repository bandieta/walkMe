import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { WalkEntity } from './walk.entity';

export type MessageType = 'text' | 'image' | 'location';

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WalkEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walk_id' })
  walk: WalkEntity;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'sender_id' })
  sender: UserEntity;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', default: 'text' })
  type: MessageType;

  @Column({ nullable: true, name: 'image_url' })
  imageUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  location?: { latitude: number; longitude: number };

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;
}

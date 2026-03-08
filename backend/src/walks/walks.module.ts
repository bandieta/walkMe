import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalkEntity } from '../database/entities/walk.entity';
import { UserEntity } from '../database/entities/user.entity';
import { WalksController } from './walks.controller';
import { WalksService } from './walks.service';

@Module({
  imports: [TypeOrmModule.forFeature([WalkEntity, UserEntity])],
  controllers: [WalksController],
  providers: [WalksService],
  exports: [WalksService],
})
export class WalksModule {}

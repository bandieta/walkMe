import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { IsString, IsMimeType } from 'class-validator';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class PresignedUploadDto {
  @IsString()
  folder!: string;

  @IsMimeType()
  mimeType!: string;
}

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a pre-signed S3 URL to upload a file directly from the client' })
  @ApiBody({ type: PresignedUploadDto })
  async presignedUpload(@Body() dto: PresignedUploadDto) {
    return this.storageService.createPresignedUpload(dto.folder, dto.mimeType);
  }
}

import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class SendTestNotificationDto {
  @IsString()
  fcmToken!: string;

  @IsString()
  title!: string;

  @IsString()
  body!: string;
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test push notification to a device FCM token' })
  async sendTest(@Body() dto: SendTestNotificationDto) {
    await this.notificationsService.sendPushNotification(
      dto.fcmToken,
      dto.title,
      dto.body,
      { source: 'test' },
    );
    return { sent: true };
  }
}

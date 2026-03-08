import { Controller, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(
    @Request() req: any,
    @Body() body: { displayName?: string; photoUrl?: string },
  ) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Patch('me/fcm-token')
  @ApiOperation({ summary: 'Update FCM push notification token' })
  updateFcmToken(@Request() req: any, @Body() body: { fcmToken: string }) {
    return this.usersService.updateFcmToken(req.user.id, body.fcmToken);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseFloatPipe,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalksService } from './walks.service';
import { CreateWalkDto } from './dto/create-walk.dto';
import { WalkStatus } from '../database/entities/walk.entity';

@ApiTags('walks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('walks')
export class WalksController {
  constructor(private readonly walksService: WalksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new walk' })
  create(@Request() req: any, @Body() dto: CreateWalkDto) {
    return this.walksService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List nearby pending walks' })
  @ApiQuery({ name: 'lat', required: false })
  @ApiQuery({ name: 'lng', required: false })
  @ApiQuery({ name: 'radiusKm', required: false })
  findAll(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    return this.walksService.findAll(
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined,
      radiusKm ? parseFloat(radiusKm) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get walk by ID' })
  findOne(@Param('id') id: string) {
    return this.walksService.findById(id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a walk' })
  join(@Param('id') id: string, @Request() req: any) {
    return this.walksService.join(id, req.user.id);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a walk' })
  leave(@Param('id') id: string, @Request() req: any) {
    return this.walksService.leave(id, req.user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update walk status (host only)' })
  updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { status: WalkStatus },
  ) {
    return this.walksService.updateStatus(id, req.user.id, body.status);
  }
}

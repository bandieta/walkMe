import { IsString, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWalkDto {
  @ApiProperty({ example: 'Morning city walk' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 52.2297 })
  @IsNumber()
  meetingLat: number;

  @ApiProperty({ example: 21.0122 })
  @IsNumber()
  meetingLng: number;

  @ApiProperty({ example: '2026-03-10T08:00:00Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(50)
  maxParticipants?: number;
}

import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({ summary: 'System Health Check' })
  check() {
    const isDbConnected = this.connection.readyState === 1;
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      service: 'Vehicle Rental & Fleet Management System (VMS)',
      version: '1.0.0',
      database: {
        status: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
        readyState: this.connection.readyState,
        host: this.connection.host,
        name: this.connection.name,
      },
    };
  }
}

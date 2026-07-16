import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  async check() {
    const isDbConnected = this.connection.readyState === 1;
    
    return {
      status: isDbConnected ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      services: {
        api: 'ok',
        database: isDbConnected ? 'ok' : 'disconnected',
      },
      memory: process.memoryUsage(),
    };
  }
}

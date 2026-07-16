import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api/v1')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health/live')
  getLiveHealth() {
    return this.appService.getLiveHealth();
  }

  @Get('health/ready')
  getReadyHealth() {
    return this.appService.getReadyHealth();
  }
}

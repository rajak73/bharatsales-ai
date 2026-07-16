import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getLiveHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  getReadyHealth() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        mongodb: process.env.MONGODB_URI ? 'configured' : 'not_configured',
      }
    };
  }
}

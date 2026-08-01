import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot() {
    return {
      name: 'GymApp API',
      version: '0.0.1',
      phase: 4,
      docs: '/api/docs',
      health: '/api/health',
    };
  }
}

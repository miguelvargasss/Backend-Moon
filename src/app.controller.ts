import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'Backend Moon Phases API is running',
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      message: 'Backend Moon Phases API is running',
    };
  }
}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TaskModule } from './task/task.module.js';
import { AppConfigModule } from './core/config/app-config.module.js';

@Module({
  imports: [AppConfigModule, TaskModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

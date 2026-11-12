import { Module } from '@nestjs/common';
import { CronService } from './cron.service.js';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [CronService],
})
export class CronModule {}

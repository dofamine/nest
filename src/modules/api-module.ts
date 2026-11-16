import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [UserModule, AdminModule],
})
export class ApiModule {}

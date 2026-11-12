import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client.js';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('POSTGRESS_DB_URL'),
    });
    super({ adapter, log: ['query'] });
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (e) {
      console.error(e);
    }
  }

  async onModuleInit() {
    await this.$connect();
    console.log(`[PrismaService] Connected to DB`);
  }
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { serveFrontend } from './core/frontend.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  serveFrontend(app);

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();

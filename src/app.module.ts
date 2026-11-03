import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppConfigModule } from './core/config/app-config.module.js';
import { RequestLoggerMiddleware } from './core/middleware/request-logger/request-logger.middleware.js';
import { UserModule } from './modules/user/user.module.js';

@Module({
  imports: [AppConfigModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}

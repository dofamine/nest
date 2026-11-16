import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { serveFrontend } from './frontend.js';

@Controller('user')
class ApiFixture {
  @Get('@me')
  me() {
    return { role: 'admin' };
  }
}

@Module({ controllers: [ApiFixture] })
class FixtureModule {}

describe('embedded frontend routing', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await NestFactory.create<NestExpressApplication>(FixtureModule, {
      logger: false,
    });
    serveFrontend(
      app,
      fileURLToPath(new URL('../../test/fixtures/frontend/', import.meta.url)),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    '/',
    '/login',
    '/profile',
    '/users',
    '/patients',
    '/invite/example-id',
    '/forgot-password',
    '/reset-password?token=example',
  ])('serves the public Angular shell at %s', async (path) => {
    const response = await request(app.getHttpServer()).get(path).expect(200);
    expect(response.text).toContain('<app-root>');
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('preserves API JSON responses', async () => {
    await request(app.getHttpServer())
      .get('/user/@me')
      .expect(200, { role: 'admin' });
  });

  it('does not turn API errors or missing assets into HTML pages', async () => {
    await request(app.getHttpServer()).get('/user/missing').expect(404);
    await request(app.getHttpServer()).get('/missing.js').expect(404);
    await request(app.getHttpServer()).post('/login').expect(404);
  });
});

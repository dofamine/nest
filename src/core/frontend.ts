import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

const frontendRoot = fileURLToPath(
  new URL('../../frontend/dist/portal/browser/', import.meta.url),
);

/** Serve the Angular shell only for UI routes; API requests still reach Nest. */
export function serveFrontend(
  app: NestExpressApplication,
  root = frontendRoot,
): void {
  const index = join(root, 'index.html');
  if (!existsSync(index)) return;

  app.useStaticAssets(root, { index: false });
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isPage =
      /^\/(?:login\/?|profile\/?|users\/?|patients\/?|forgot-password\/?|reset-password\/?|invite\/[^/]+\/?)?$/.test(
        req.path,
      );
    if (!['GET', 'HEAD'].includes(req.method) || !isPage) return next();
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(index);
  });
}

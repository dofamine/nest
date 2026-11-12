import { Global, Module } from '@nestjs/common';
import { join } from 'node:path';
import {
  FileMailTransport,
  FileTemplateEngine,
  MailModule,
} from '@nestjs/mail';

@Global()
@Module({
  imports: [
    MailModule.forRoot({
      // Development: every mail becomes an .eml file in var/mail instead of leaving the machine
      transport: new FileMailTransport({
        directory: join(process.cwd(), 'var', 'mail'),
      }),
      // Mail bodies are HTML files in mail/templates, wrapped in mail/templates/layout.html
      templates: new FileTemplateEngine({
        dir: join(process.cwd(), 'mail', 'templates'),
        layout: 'layout',
        // Development reads the files for every mail, so edits show up without a restart
        cache: process.env.NODE_ENV === 'production',
      }),
      from: 'forRoot <logo-system@gmail.com>',
    }),
  ],
  exports: [MailModule],
})
export class EmailModule {}

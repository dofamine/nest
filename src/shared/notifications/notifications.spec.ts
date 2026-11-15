import { describe, expect, it } from 'vitest';
import type { MailRenderContext } from '@nestjs/mail';
import { ForgotPasswordMail } from './forgot-password.mail.js';
import { InvitationMail } from './invitation.mail.js';

describe('notification mail', () => {
  const context = {} as MailRenderContext;

  it('renders invitation data into the invitation template', () => {
    expect(
      new InvitationMail().render(
        { invitationUrl: 'https://app.example.com/invite/1' },
        context,
      ),
    ).toEqual({
      template: 'invitation',
      subject: 'Invitation for Registration',
      context: {
        invitationUrl: 'https://app.example.com/invite/1',
      },
    });
  });

  it('renders password reset data and provides a fallback name', () => {
    const mail = new ForgotPasswordMail();

    expect(
      mail.render(
        {
          resetUrl: 'https://app.example.com/reset-password?token=token',
          userName: 'Alice',
        },
        context,
      ),
    ).toEqual({
      template: 'forgot-password',
      subject: 'Reset your password',
      context: {
        url: 'https://app.example.com/reset-password?token=token',
        userName: 'Alice',
      },
    });

    expect(
      mail.render(
        {
          resetUrl: 'https://app.example.com/reset-password?token=token',
          userName: '',
        },
        context,
      ).context,
    ).toMatchObject({ userName: 'there' });
  });
});

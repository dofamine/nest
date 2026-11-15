import { Injectable } from '@nestjs/common';
import { Mailable, MailRenderContext, MailTemplateContent } from '@nestjs/mail';

export interface IForgotPasswordMailData {
  resetUrl: string;
  userName: string;
}

@Injectable()
export class ForgotPasswordMail implements Mailable<IForgotPasswordMailData> {
  render(
    data: IForgotPasswordMailData,
    _context: MailRenderContext,
  ): MailTemplateContent {
    return {
      template: 'forgot-password',
      subject: 'Reset your password',
      context: {
        url: data.resetUrl,
        userName: data.userName || 'there',
      },
    };
  }
}

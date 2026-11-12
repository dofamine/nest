import { Injectable } from '@nestjs/common';
import { Mailable, MailRenderContext, MailTemplateContent } from '@nestjs/mail';

export interface IInvitationMailData {
  invitationUrl: string;
}

@Injectable()
export class InvitationMail implements Mailable<IInvitationMailData> {
  render(
    data: IInvitationMailData,
    context: MailRenderContext,
  ): MailTemplateContent {
    console.log(context);
    return {
      template: 'invitation',
      subject: 'Invitation for Registration',
      context: {
        invitationUrl: data.invitationUrl,
      },
    };
  }
}

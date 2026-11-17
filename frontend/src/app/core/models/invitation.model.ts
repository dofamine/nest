export interface IInvitation {
  id: string | null;
  createdAt: Date | null;
  email: string;
  userId: string | null;
  expiresAt: Date | null;
}

export class InvitationModel {}

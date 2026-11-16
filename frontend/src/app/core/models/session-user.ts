export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'therapist';
  createdAt: string;
  updatedAt: string;
}

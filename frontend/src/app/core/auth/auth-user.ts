import { AccountStatus, Role } from '@app/core/models/profile';

export interface AuthUser {
  id: string;
  email: string | null;
  username: string;
  avatarUrl: string | null;
  role: Role;
  status: AccountStatus;
  needsProfile?: boolean;
  needsOnboarding?: boolean;
}

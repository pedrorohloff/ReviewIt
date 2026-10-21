export type Role = 'Regular' | 'Moderator' | 'Admin';

export type AccountStatus = 'Active' | 'Inactive' | 'Suspended' | 'Banned';

export interface ProfileSummary {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface Profile extends ProfileSummary {
  role: Role;
  status: AccountStatus;
  suspendedUntil: string | null;
  createdAt: string;
}

export interface ProfileInput {
  username: string;
  avatarUrl: string | null;
}

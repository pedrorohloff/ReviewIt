import { AuthUser } from './auth-user';

/** Fixed identity used by the local demo. It matches the first mock author. */
export const DEMO_USER: AuthUser = {
  id: '10000000-0000-4000-8000-000000000001',
  email: 'maria@reviewit.demo',
  username: 'Maria Rohls',
  avatarUrl: null,
  role: 'Admin',
  status: 'Active',
};

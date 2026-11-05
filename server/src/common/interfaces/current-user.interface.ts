import { Role } from '@prisma/client';

export interface CurrentUserInterface {
  id: number;
  email: string;
  role: Role;
  tenantId?: string;
  profile?: {
    id: number;
    fullName: string;
    department?: string;
    site?: string;
  };
}
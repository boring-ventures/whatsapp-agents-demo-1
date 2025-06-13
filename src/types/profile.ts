export interface Profile {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  birthDate?: string | null;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMetadata {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string;
  birthDate?: string;
  role?: string;
}

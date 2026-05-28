/// Role labels — `admin` can do everything, `editor` can create + update
/// products and manufacturers but cannot toggle product status.
export type Role = 'admin' | 'editor';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

/// Payload encoded in the JWT.
export interface JwtPayload {
  sub: string;   // user id (UUID)
  email: string;
  role: Role;
  name: string;
  iat?: number;
  exp?: number;
}

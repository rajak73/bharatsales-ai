import { Schema, Document } from 'mongoose';

export type SessionDocument = Session & Document;

export interface Session {
  userId: string;
  organizationId: string;
  // SHA-256 hex of the current refresh token (sessions created before
  // hashing was introduced hold the plaintext; see AuthService.refresh).
  refreshToken: string;
  // Hashes of refresh tokens already rotated out of this session. Presenting
  // one again means the token was stolen/replayed: the session is revoked.
  rotatedRefreshTokens?: string[];
  // Hash of the token retired by the latest normal rotation, and when that
  // happened: it stays usable for a short grace window (lost responses).
  previousRefreshToken?: string;
  rotatedAt?: Date;
  deviceInfo?: string;
  ipAddress?: string;
  expiresAt: Date;
  revoked: boolean;
}

export const SessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    refreshToken: { type: String, required: true, unique: true },
    rotatedRefreshTokens: { type: [String], default: [], index: true },
    previousRefreshToken: { type: String, index: true, sparse: true },
    rotatedAt: { type: Date },
    deviceInfo: { type: String },
    ipAddress: { type: String },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collection: 'sessions' },
);

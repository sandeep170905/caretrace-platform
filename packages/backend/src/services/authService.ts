import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { User } from '@caretrace/shared';

// Requirement 1: Stored in environment variable with placeholder default for local dev
const JWT_SECRET = process.env.JWT_SECRET || 'caretrace-dev-secret-key-2026-tamper-evident-zero-trust';
const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  institutionId?: string;
  iat: number;
  exp: number;
}

export class AuthService {
  /**
   * Hashes a plaintext password with a unique cryptographic salt using PBKDF2 (SHA-256)
   */
  public static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const iterations = 10000;
    const keylen = 64;
    const digest = 'sha256';
    const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
    return `${salt}:${derivedKey}`;
  }

  /**
   * Verifies a plaintext candidate password against a stored salt:hash string
   */
  public static verifyPassword(password: string, storedHash: string): boolean {
    try {
      const parts = storedHash.split(':');
      if (parts.length !== 2) return false;
      const [salt, originalDerivedKey] = parts;
      const iterations = 10000;
      const keylen = 64;
      const digest = 'sha256';
      const candidateKey = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
      return crypto.timingSafeEqual(
        Buffer.from(candidateKey, 'utf-8'),
        Buffer.from(originalDerivedKey, 'utf-8')
      );
    } catch {
      return false;
    }
  }

  /**
   * Base64URL encoding helper for standard RFC 7519 JWT compatibility
   */
  private static base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private static base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  /**
   * Generates an HMAC-SHA256 signed JWT token
   */
  public static generateToken(user: User): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      institutionId: user.institutionId,
      iat: now,
      exp: now + JWT_EXPIRY_SECONDS
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(dataToSign)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${dataToSign}.${signature}`;
  }

  /**
   * Cryptographically verifies JWT token signature and expiration
   */
  public static verifyToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;
      const dataToVerify = `${encodedHeader}.${encodedPayload}`;

      const expectedSignature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(dataToVerify)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      if (signature !== expectedSignature) {
        return null;
      }

      const payloadJson = this.base64UrlDecode(encodedPayload);
      const payload: JWTPayload = JSON.parse(payloadJson);

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null; // Expired
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Strips sensitive internal fields (like passwordHash) before sending User to client
   */
  public static sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

/**
 * Express middleware to authenticate Bearer JWT
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = AuthService.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ success: false, error: 'Invalid or expired authentication token' });
  }

  (req as any).user = decoded;
  next();
}


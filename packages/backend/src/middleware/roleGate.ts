import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { UserRole } from '@caretrace/shared';

/**
 * Explicit route prefixes restricted for REVIEWER_DEMO mode.
 * The academic reviewer evaluates base research paper compliance:
 * - NO ML analytics engine
 * - NO field courier logistics / QR pickup scanning
 * - NO GPS transit telemetry
 * - NO admin risk / fraud dashboards
 */
const RESTRICTED_PATH_PREFIXES_FOR_REVIEWER = [
  '/api/analytics',
  '/api/pickup',
  '/api/delivery',
  '/api/transit',
  '/api/admin'
];

/**
 * Reusable backend RoleGate / FeatureGate middleware.
 * Ensures REVIEWER_DEMO cannot access restricted features even via direct API calls or deep links.
 * All existing roles (DONOR, INSTITUTION, PICKUP_AGENT, ADMIN) pass through completely unaffected.
 */
export function reviewerRoleGate(req: Request, res: Response, next: NextFunction): void {
  // Check Authorization header if present
  const authHeader = req.headers.authorization;
  let callerRole: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = AuthService.verifyToken(token);
    if (decoded) {
      callerRole = decoded.role;
      (req as any).user = decoded;
    }
  }

  // If authenticated as REVIEWER_DEMO, enforce strict allow-list
  if (callerRole === 'REVIEWER_DEMO') {
    const rawPath = req.originalUrl || req.path || '';
    const normalizedPath = rawPath.startsWith('/api')
      ? rawPath
      : `/api${rawPath.startsWith('/') ? '' : '/'}${rawPath}`;

    const isRestricted = RESTRICTED_PATH_PREFIXES_FOR_REVIEWER.some(prefix =>
      normalizedPath.startsWith(prefix)
    );

    if (isRestricted) {
      res.status(403).json({
        success: false,
        error: 'Access Denied: This feature is restricted in Reviewer Demo mode to align strictly with the Base Research Paper scope.',
        code: 'FEATURE_RESTRICTED_REVIEWER_DEMO',
        allowedFeatures: [
          'Institution registration and directory',
          'Requirement posting and listing (title, description, goal, deadline)',
          'Donor registration and donation/pledge flow',
          'Transaction confirmation and Section 80G receipt',
          'Donor-facing donation history',
          'Basic read-only SHA-256 ledger explorer (block count and validity status)'
        ]
      });
      return;
    }
  }

  next();
}

/**
 * Route-level guard for specific routes where explicit role checking is desired.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (user && !allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Role ${user.role} is not permitted to access this resource.`,
        code: 'ROLE_RESTRICTED'
      });
      return;
    }
    next();
  };
}


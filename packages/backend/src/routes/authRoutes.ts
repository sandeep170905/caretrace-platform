import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { User, Institution } from '@caretrace/shared';
import { AuthService, authenticateToken } from '../services/authService';
import { NotificationService } from '../services/notificationService';

export const authRouter = Router();

// Get list of demo user personas for fast multi-role testing (kept for quick demo purposes)
authRouter.get('/personas', (req: Request, res: Response) => {
  const users = db.getUsers();
  const primaryIds = ['user-donor-ajith', 'user-inst-lakshmi', 'user-agent-sakthivel', 'user-admin-sandeep'];
  const personas = primaryIds
    .map(id => users.find(u => u.id === id))
    .filter((u): u is typeof users[0] => Boolean(u))
    .map(u => AuthService.sanitizeUser(u));

  res.json({ success: true, personas: personas.length > 0 ? personas : users.slice(0, 4).map(AuthService.sanitizeUser) });
});

// Get all users (sanitized)
authRouter.get('/users', (req: Request, res: Response) => {
  const users = db.getUsers().map(AuthService.sanitizeUser);
  res.json({ success: true, users });
});

// Real Donor Registration
authRouter.post('/register-donor', (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists' });
  }

  const newUser: User = {
    id: `user-donor-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: 'DONOR',
    phone: phone ? phone.trim() : undefined,
    avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    passwordHash: AuthService.hashPassword(password),
    createdAt: new Date().toISOString()
  };

  db.upsertUser(newUser);

  const token = AuthService.generateToken(newUser);
  res.status(201).json({
    success: true,
    token,
    user: AuthService.sanitizeUser(newUser),
    message: 'Donor account created successfully'
  });
});

// Real Institution Director & Sanctuary Registration
authRouter.post('/register-institution', (req: Request, res: Response) => {
  const {
    directorName,
    email,
    password,
    phone,
    institutionName,
    registrationNumber,
    taxId,
    address,
    city,
    state,
    postalCode,
    capacity,
    currentChildrenCount,
    description,
    website
  } = req.body;

  if (!directorName || !email || !password || !institutionName || !registrationNumber) {
    return res.status(400).json({
      success: false,
      error: 'Director name, email, password, institution name, and registration number are required'
    });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists' });
  }

  const instId = `inst-${Date.now()}`;
  const now = new Date().toISOString();

  // Create unverified institution
  const newInstitution: Institution = {
    id: instId,
    name: institutionName.trim(),
    registrationNumber: registrationNumber.trim(),
    taxId: taxId ? taxId.trim() : 'PENDING-VERIF',
    address: address ? address.trim() : 'Pending verification address',
    city: city ? city.trim() : 'Chennai',
    state: state ? state.trim() : 'Tamil Nadu',
    postalCode: postalCode ? postalCode.trim() : '600001',
    latitude: 13.0827,
    longitude: 80.2707,
    capacity: Number(capacity) || 40,
    currentChildrenCount: Number(currentChildrenCount) || 30,
    verified: false, // New institution starts unverified as required
    trustScore: 50,  // Provisional trust score
    contactEmail: email.trim().toLowerCase(),
    contactPhone: phone ? phone.trim() : '+91 90000 00000',
    description: description ? description.trim() : 'Child residential care sanctuary',
    website: website ? website.trim() : undefined
  };

  db.upsertInstitution(newInstitution);

  // Create institution director user
  const newDirector: User = {
    id: `user-inst-${Date.now()}`,
    name: directorName.trim(),
    email: email.trim().toLowerCase(),
    role: 'INSTITUTION',
    phone: phone ? phone.trim() : undefined,
    institutionId: instId,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    passwordHash: AuthService.hashPassword(password),
    createdAt: now
  };

  db.upsertUser(newDirector);

  NotificationService.broadcast('INSTITUTION_REGISTERED', {
    id: newInstitution.id,
    name: newInstitution.name,
    director: newDirector.name,
    timestamp: now
  });

  const token = AuthService.generateToken(newDirector);
  res.status(201).json({
    success: true,
    token,
    user: AuthService.sanitizeUser(newDirector),
    institution: newInstitution,
    message: 'Institution registered. Accreditation is pending Admin verification.'
  });
});

// Real Credential Login & Demo Persona Switch
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found with email: ' + email });
  }

  // If password provided, verify cryptographic PBKDF2 hash
  if (password) {
    if (user.passwordHash) {
      const isValid = AuthService.verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid password' });
      }
    } else {
      // Fallback for demo users without set password
      if (password !== 'caretrace123') {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    }
  }

  const token = AuthService.generateToken(user);
  res.json({
    success: true,
    token,
    user: AuthService.sanitizeUser(user)
  });
});

// Validate Token & Return Current Session
authRouter.get('/me', authenticateToken, (req: Request, res: Response) => {
  const decoded = (req as any).user;
  const user = db.getUserById(decoded.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  let institution: Institution | undefined;
  if (user.institutionId) {
    institution = db.getInstitutionById(user.institutionId);
  }

  res.json({
    success: true,
    user: AuthService.sanitizeUser(user),
    institution
  });
});

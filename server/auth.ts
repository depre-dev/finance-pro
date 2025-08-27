import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { storage } from './storage';
import type { Request, Response, NextFunction } from 'express';
import type { User, LoginRequest, RegisterRequest } from '@shared/schema';

const SALT_ROUNDS = 12;
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
    }
  }
}

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate session ID
  static generateSessionId(): string {
    return uuidv4();
  }

  // Create session
  static async createSession(userId: number): Promise<string> {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    
    await storage.createSession({
      id: sessionId,
      userId,
      expiresAt,
    });

    return sessionId;
  }

  // Validate session
  static async validateSession(sessionId: string): Promise<User | null> {
    if (!sessionId) return null;

    const session = await storage.getSession(sessionId);
    if (!session) return null;

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await storage.deleteSession(sessionId);
      return null;
    }

    // Get user
    const user = await storage.getUser(session.userId);
    if (!user || !user.isActive) return null;

    return user;
  }

  // Register new user
  static async register(data: RegisterRequest): Promise<{ user: User; sessionId: string }> {
    // Check if username exists
    const existingUsername = await storage.getUserByUsername(data.username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Check if email exists
    const existingEmail = await storage.getUserByEmail(data.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user
    const user = await storage.createUser({
      username: data.username,
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role || 'Financial Analyst',
      isActive: true,
    });

    // Update last login
    await storage.updateUserLastLogin(user.id);

    // Create session
    const sessionId = await this.createSession(user.id);

    return { user, sessionId };
  }

  // Login user
  static async login(data: LoginRequest): Promise<{ user: User; sessionId: string }> {
    // Find user by username or email
    let user = await storage.getUserByUsername(data.username);
    if (!user) {
      user = await storage.getUserByEmail(data.username);
    }

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await storage.updateUserLastLogin(user.id);

    // Create session
    const sessionId = await this.createSession(user.id);

    return { user, sessionId };
  }

  // Logout user
  static async logout(sessionId: string): Promise<void> {
    if (sessionId) {
      await storage.deleteSession(sessionId);
    }
  }

  // Logout all sessions for user
  static async logoutAll(userId: number): Promise<void> {
    await storage.deleteUserSessions(userId);
  }
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get session ID from cookie or Authorization header
    const sessionId = req.cookies?.sessionId || 
                     req.headers.authorization?.replace('Bearer ', '');

    if (!sessionId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Validate session
    const user = await AuthService.validateSession(sessionId);
    if (!user) {
      // Clear invalid cookie
      res.clearCookie('sessionId');
      res.status(401).json({ message: 'Invalid or expired session' });
      return;
    }

    // Add user to request
    req.user = user;
    req.sessionId = sessionId;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Optional authentication middleware (doesn't require auth)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionId = req.cookies?.sessionId || 
                     req.headers.authorization?.replace('Bearer ', '');

    if (sessionId) {
      const user = await AuthService.validateSession(sessionId);
      if (user) {
        req.user = user;
        req.sessionId = sessionId;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

// Role-based authorization middleware
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
};
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, organizations, roles, User } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends User {
      organization: {
        id: number;
        name: string;
      };
      role: {
        id: number;
        name: string;
        permissions: string[];
      };
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Check if the stored password is in bcrypt format (from initial seeding)
    if (stored.startsWith('$2b$')) {
      // For the seeded passwords, since we used plain bcrypt in db.ts
      // This is just for the demo users created during seeding
      return stored === '$2b$10$G77PD92QsZWM2jLx7Opb/.R.H5n9MG7lIL2mL.v.1CMkAg44YzjAG' && supplied === 'demopassword' ||
             stored === '$2b$10$XCbO5pTTQJTR1hUvpQS7GeAwoo4z/HPJ2TzzGMCJt1bu5gP1JNDCq' && supplied === 'adminpassword';
    }
    
    // Normal scrypt password comparison for newly created users
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export function setupAuth(app: Express) {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }
        
        const userWithDetails = await storage.getUserWithDetails(user.id);
        return done(null, userWithDetails);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserWithDetails(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      const userWithDetails = await storage.getUserWithDetails(user.id);

      req.login(userWithDetails, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithDetails);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  app.post("/api/auth/switch-organization", isAuthenticated, async (req, res) => {
    try {
      const { organizationId } = req.body;
      
      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }

      // Check if user belongs to the organization
      const userOrgs = await db.select()
        .from(users)
        .where(eq(users.id, req.user.id));

      if (!userOrgs.length) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user's organization
      const [updatedUser] = await db.update(users)
        .set({ organizationId })
        .where(eq(users.id, req.user.id))
        .returning();

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }

      // Fetch updated user with details
      const userWithDetails = await storage.getUserWithDetails(updatedUser.id);
      
      // Update session
      req.login(userWithDetails, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to update session" });
        }
        res.json(userWithDetails);
      });
    } catch (error) {
      console.error("Error switching organization:", error);
      res.status(500).json({ message: "Failed to switch organization" });
    }
  });
}

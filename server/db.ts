import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use the DATABASE_URL environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a connection pool
export const pool = new Pool({ connectionString });

// Create a Drizzle instance
export const db = drizzle(pool, { schema, logger: true });

// Initialize the database with default data if needed
export async function initializeDatabase() {
  try {
    // Check if we need to seed the database
    const existingRoles = await db.query.roles.findMany({
      limit: 1
    });

    if (existingRoles.length === 0) {
      console.log("Seeding database with initial data...");

      // Create roles
      const adminRole = await db.insert(schema.roles).values({
        name: "Administrator",
        permissions: ["admin", "manage_users", "manage_organizations", "view_all", "edit_all"]
      }).returning();

      const userRole = await db.insert(schema.roles).values({
        name: "User",
        permissions: ["view_own", "edit_own"]
      }).returning();

      const analystRole = await db.insert(schema.roles).values({
        name: "Analyst",
        permissions: ["view_all", "edit_own"]
      }).returning();

      const viewerRole = await db.insert(schema.roles).values({
        name: "Viewer",
        permissions: ["view_own"]
      }).returning();

      // Create organizations
      const adminOrg = await db.insert(schema.organizations).values({
        name: "Admin Organization"
      }).returning();

      const demoOrg = await db.insert(schema.organizations).values({
        name: "demo_org"
      }).returning();

      // Create admin user
      await db.insert(schema.users).values({
        username: "admin",
        email: "admin@auraai.com",
        password: "$2b$10$XCbO5pTTQJTR1hUvpQS7GeAwoo4z/HPJ2TzzGMCJt1bu5gP1JNDCq", // "adminpassword"
        firstName: "Admin",
        lastName: "User",
        organizationId: adminOrg[0].id,
        roleId: adminRole[0].id,
        active: true
      });

      // Create demo user
      await db.insert(schema.users).values({
        username: "demo_user",
        email: "demo_user@demo_org.com",
        password: "$2b$10$G77PD92QsZWM2jLx7Opb/.R.H5n9MG7lIL2mL.v.1CMkAg44YzjAG", // "demopassword"
        firstName: "Demo",
        lastName: "User",
        organizationId: demoOrg[0].id,
        roleId: userRole[0].id,
        active: true
      });

      console.log("Database seeded successfully");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// Call initialization on import (async but we don't await it here)
initializeDatabase().catch(console.error);

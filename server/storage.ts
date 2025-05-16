import { 
  users, type User, type InsertUser, 
  roles, organizations, 
  infraInventory, type InfraInventory, type InsertInfraInventory,
  promptAnswers, type PromptAnswer, type InsertPromptAnswer,
  dataStoreFiles, type DataStoreFile, type InsertDataStoreFile
} from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull } from "drizzle-orm";
import createMemoryStore from "memorystore";
import session from "express-session";

// Create memory store for sessions
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserWithDetails(id: number): Promise<User & { 
    organization: { id: number; name: string }; 
    role: { id: number; name: string; permissions: string[] }; 
  } | undefined>;
  createUser(user: InsertUser): Promise<User>;
  sessionStore: any; // session store type
  
  // InfraInventory methods
  getInfraInventory(organizationId: number): Promise<InfraInventory[]>;
  getInfraInventoryById(id: number): Promise<InfraInventory | undefined>;
  createInfraInventory(item: InsertInfraInventory): Promise<InfraInventory>;
  updateInfraInventory(id: number, item: Partial<InsertInfraInventory>): Promise<InfraInventory | undefined>;
  deleteInfraInventory(id: number): Promise<boolean>;
  
  // ChatGPT Incognito methods
  getPromptAnswers(userId: number): Promise<PromptAnswer[]>;
  createPromptAnswer(promptAnswer: InsertPromptAnswer): Promise<PromptAnswer>;
  
  // Data Store Files methods
  getDataStoreFiles(userId: number, parentId?: number): Promise<DataStoreFile[]>;
  getDataStoreFileById(id: number): Promise<DataStoreFile | undefined>;
  createDataStoreFile(file: InsertDataStoreFile): Promise<DataStoreFile>;
  updateDataStoreFile(id: number, file: Partial<InsertDataStoreFile>): Promise<DataStoreFile | undefined>;
  deleteDataStoreFile(id: number): Promise<boolean>;
  deleteAllDataStoreFiles(userId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Session store type

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error fetching user by username:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
  }

  async getUserWithDetails(id: number): Promise<User & { 
    organization: { id: number; name: string }; 
    role: { id: number; name: string; permissions: string[] }; 
  } | undefined> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
        with: {
          organization: true,
          role: true
        }
      });
      
      return user as any;
    } catch (error) {
      console.error("Error fetching user with details:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // InfraInventory Implementation
  async getInfraInventory(organizationId: number): Promise<InfraInventory[]> {
    try {
      return await db
        .select()
        .from(infraInventory)
        .where(eq(infraInventory.organizationId, organizationId));
    } catch (error) {
      console.error("Error getting infrastructure inventory:", error);
      throw error;
    }
  }

  async getInfraInventoryById(id: number): Promise<InfraInventory | undefined> {
    try {
      const [item] = await db
        .select()
        .from(infraInventory)
        .where(eq(infraInventory.id, id));
      return item;
    } catch (error) {
      console.error("Error getting infrastructure inventory item:", error);
      throw error;
    }
  }

  async createInfraInventory(item: InsertInfraInventory): Promise<InfraInventory> {
    try {
      const [newItem] = await db
        .insert(infraInventory)
        .values(item)
        .returning();
      return newItem;
    } catch (error) {
      console.error("Error creating infrastructure inventory item:", error);
      throw error;
    }
  }

  async updateInfraInventory(id: number, item: Partial<InsertInfraInventory>): Promise<InfraInventory | undefined> {
    try {
      const [updatedItem] = await db
        .update(infraInventory)
        .set(item)
        .where(eq(infraInventory.id, id))
        .returning();
      return updatedItem;
    } catch (error) {
      console.error("Error updating infrastructure inventory item:", error);
      throw error;
    }
  }

  async deleteInfraInventory(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(infraInventory)
        .where(eq(infraInventory.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting infrastructure inventory item:", error);
      return false;
    }
  }

  // ChatGPT Incognito methods implementation
  async getPromptAnswers(userId: number): Promise<PromptAnswer[]> {
    try {
      return await db
        .select()
        .from(promptAnswers)
        .where(eq(promptAnswers.userId, userId))
        .orderBy(promptAnswers.created_at);
    } catch (error) {
      console.error("Error getting prompt answers:", error);
      return [];
    }
  }

  async createPromptAnswer(answer: InsertPromptAnswer): Promise<PromptAnswer> {
    try {
      const [newAnswer] = await db
        .insert(promptAnswers)
        .values(answer)
        .returning();
      return newAnswer;
    } catch (error) {
      console.error("Error creating prompt answer:", error);
      throw error;
    }
  }

  // Data Store Files methods implementation
  async getDataStoreFiles(userId: number, parentId?: number): Promise<DataStoreFile[]> {
    try {
      if (parentId) {
        return await db
          .select()
          .from(dataStoreFiles)
          .where(
            and(
              eq(dataStoreFiles.userId, userId),
              eq(dataStoreFiles.parentId, parentId)
            )
          )
          .orderBy(dataStoreFiles.name);
      } else {
        return await db
          .select()
          .from(dataStoreFiles)
          .where(
            and(
              eq(dataStoreFiles.userId, userId),
              isNull(dataStoreFiles.parentId)
            )
          )
          .orderBy(dataStoreFiles.name);
      }
    } catch (error) {
      console.error("Error getting data store files:", error);
      return [];
    }
  }

  async getDataStoreFileById(id: number): Promise<DataStoreFile | undefined> {
    try {
      const [file] = await db
        .select()
        .from(dataStoreFiles)
        .where(eq(dataStoreFiles.id, id));
      return file;
    } catch (error) {
      console.error("Error getting data store file:", error);
      return undefined;
    }
  }

  async createDataStoreFile(file: InsertDataStoreFile): Promise<DataStoreFile> {
    try {
      const [newFile] = await db
        .insert(dataStoreFiles)
        .values(file)
        .returning();
      return newFile;
    } catch (error) {
      console.error("Error creating data store file:", error);
      throw error;
    }
  }

  async updateDataStoreFile(id: number, file: Partial<InsertDataStoreFile>): Promise<DataStoreFile | undefined> {
    try {
      const [updatedFile] = await db
        .update(dataStoreFiles)
        .set(file)
        .where(eq(dataStoreFiles.id, id))
        .returning();
      return updatedFile;
    } catch (error) {
      console.error("Error updating data store file:", error);
      return undefined;
    }
  }

  async deleteDataStoreFile(id: number): Promise<boolean> {
    try {
      await db
        .delete(dataStoreFiles)
        .where(eq(dataStoreFiles.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting data store file:", error);
      return false;
    }
  }
  
  async deleteAllDataStoreFiles(userId: number): Promise<boolean> {
    try {
      await db
        .delete(dataStoreFiles)
        .where(eq(dataStoreFiles.userId, userId));
      return true;
    } catch (error) {
      console.error("Error deleting all data store files:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();

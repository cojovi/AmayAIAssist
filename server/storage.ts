import { 
  users, 
  emailTriages, 
  meetings, 
  tasks, 
  aiSuggestions, 
  systemLogs,
  type User, 
  type InsertUser,
  type EmailTriage,
  type InsertEmailTriage,
  type Meeting,
  type InsertMeeting,
  type Task,
  type InsertTask,
  type AiSuggestion,
  type InsertAiSuggestion,
  type SystemLog,
  type InsertSystemLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, isNull, or } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateUserTokens(id: string, tokens: { access_token?: string; refresh_token?: string }): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Email triage management
  getEmailTriageById(id: string): Promise<EmailTriage | undefined>;
  getEmailTriageByMessageId(messageId: string): Promise<EmailTriage | undefined>;
  getEmailTriagesByUserId(userId: string): Promise<EmailTriage[]>;
  getRecentEmailTriages(userId: string, limit: number): Promise<EmailTriage[]>;
  createEmailTriage(triage: InsertEmailTriage): Promise<EmailTriage>;
  updateEmailTriage(id: string, updates: Partial<EmailTriage>): Promise<EmailTriage>;
  getEmailTriageCount(userId: string): Promise<number>;

  // Meeting management
  getMeetingById(id: string): Promise<Meeting | undefined>;
  getMeetingsByUserId(userId: string): Promise<Meeting[]>;
  getUpcomingMeetings(userId: string): Promise<Meeting[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting>;
  getMeetingCount(userId: string): Promise<number>;

  // Task management
  getTaskById(id: string): Promise<Task | undefined>;
  getTasksByUserId(userId: string): Promise<Task[]>;
  getPendingTasks(userId: string): Promise<Task[]>;
  getCompletedTasks(userId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  getCompletedTaskCount(userId: string): Promise<number>;

  // AI suggestions management
  getAiSuggestionById(id: string): Promise<AiSuggestion | undefined>;
  getAiSuggestionsByUserId(userId: string): Promise<AiSuggestion[]>;
  createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion>;
  updateAiSuggestion(id: string, updates: Partial<AiSuggestion>): Promise<AiSuggestion>;
  getAiSuggestionCount(userId: string): Promise<number>;

  // System logs
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  getSystemLogsByUserId(userId: string): Promise<SystemLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserTokens(id: string, tokens: { access_token?: string; refresh_token?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Email triage management
  async getEmailTriageById(id: string): Promise<EmailTriage | undefined> {
    const [triage] = await db.select().from(emailTriages).where(eq(emailTriages.id, id));
    return triage || undefined;
  }

  async getEmailTriageByMessageId(messageId: string): Promise<EmailTriage | undefined> {
    const [triage] = await db.select().from(emailTriages).where(eq(emailTriages.messageId, messageId));
    return triage || undefined;
  }

  async getEmailTriagesByUserId(userId: string): Promise<EmailTriage[]> {
    return await db
      .select()
      .from(emailTriages)
      .where(eq(emailTriages.userId, userId))
      .orderBy(desc(emailTriages.createdAt));
  }

  async getRecentEmailTriages(userId: string, limit: number): Promise<EmailTriage[]> {
    return await db
      .select()
      .from(emailTriages)
      .where(eq(emailTriages.userId, userId))
      .orderBy(desc(emailTriages.createdAt))
      .limit(limit);
  }

  async createEmailTriage(triage: InsertEmailTriage): Promise<EmailTriage> {
    const [newTriage] = await db
      .insert(emailTriages)
      .values({
        ...triage,
        createdAt: new Date()
      })
      .returning();
    return newTriage;
  }

  async updateEmailTriage(id: string, updates: Partial<EmailTriage>): Promise<EmailTriage> {
    const [triage] = await db
      .update(emailTriages)
      .set(updates)
      .where(eq(emailTriages.id, id))
      .returning();
    return triage;
  }

  async getEmailTriageCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: emailTriages.id })
      .from(emailTriages)
      .where(eq(emailTriages.userId, userId));
    return result.length;
  }

  // Meeting management
  async getMeetingById(id: string): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting || undefined;
  }

  async getMeetingsByUserId(userId: string): Promise<Meeting[]> {
    return await db
      .select()
      .from(meetings)
      .where(eq(meetings.userId, userId))
      .orderBy(desc(meetings.startTime));
  }

  async getUpcomingMeetings(userId: string): Promise<Meeting[]> {
    const now = new Date();
    return await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.userId, userId),
          gte(meetings.startTime, now)
        )
      )
      .orderBy(meetings.startTime);
  }

  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [newMeeting] = await db
      .insert(meetings)
      .values({
        ...meeting,
        createdAt: new Date()
      })
      .returning();
    return newMeeting;
  }

  async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting> {
    const [meeting] = await db
      .update(meetings)
      .set(updates)
      .where(eq(meetings.id, id))
      .returning();
    return meeting;
  }

  async getMeetingCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: meetings.id })
      .from(meetings)
      .where(eq(meetings.userId, userId));
    return result.length;
  }

  // Task management
  async getTaskById(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getPendingTasks(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.completed, false)
        )
      )
      .orderBy(tasks.dueDate);
  }

  async getCompletedTasks(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.completed, true)
        )
      )
      .orderBy(desc(tasks.completedAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values({
        ...task,
        createdAt: new Date()
      })
      .returning();
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const updateData = { ...updates };
    
    // Set completedAt timestamp when marking as completed
    if (updates.completed === true && !updates.completedAt) {
      updateData.completedAt = new Date();
    } else if (updates.completed === false) {
      updateData.completedAt = null;
    }

    const [task] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async getCompletedTaskCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.completed, true)
        )
      );
    return result.length;
  }

  // AI suggestions management
  async getAiSuggestionById(id: string): Promise<AiSuggestion | undefined> {
    const [suggestion] = await db.select().from(aiSuggestions).where(eq(aiSuggestions.id, id));
    return suggestion || undefined;
  }

  async getAiSuggestionsByUserId(userId: string): Promise<AiSuggestion[]> {
    return await db
      .select()
      .from(aiSuggestions)
      .where(eq(aiSuggestions.userId, userId))
      .orderBy(desc(aiSuggestions.createdAt));
  }

  async createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion> {
    const [newSuggestion] = await db
      .insert(aiSuggestions)
      .values({
        ...suggestion,
        createdAt: new Date()
      })
      .returning();
    return newSuggestion;
  }

  async updateAiSuggestion(id: string, updates: Partial<AiSuggestion>): Promise<AiSuggestion> {
    const [suggestion] = await db
      .update(aiSuggestions)
      .set(updates)
      .where(eq(aiSuggestions.id, id))
      .returning();
    return suggestion;
  }

  async getAiSuggestionCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: aiSuggestions.id })
      .from(aiSuggestions)
      .where(
        and(
          eq(aiSuggestions.userId, userId),
          eq(aiSuggestions.dismissed, false)
        )
      );
    return result.length;
  }

  // System logs
  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    const [newLog] = await db
      .insert(systemLogs)
      .values({
        ...log,
        createdAt: new Date()
      })
      .returning();
    return newLog;
  }

  async getSystemLogsByUserId(userId: string): Promise<SystemLog[]> {
    return await db
      .select()
      .from(systemLogs)
      .where(eq(systemLogs.userId, userId))
      .orderBy(desc(systemLogs.createdAt));
  }
}

export const storage = new DatabaseStorage();

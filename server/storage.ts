import { users, playbooks, steps, ratings } from "@shared/schema";
import type { User, InsertUser, Playbook, InsertPlaybook, Step, InsertStep, Rating, InsertRating } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

type GoogleUserInput = {
  username: string;
  password: string;
  googleId: string;
};

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createGoogleUser(user: GoogleUserInput): Promise<User>;
  linkGoogleAccount(userId: string, googleId: string): Promise<User>;

  getPlaybooks(params?: { search?: string, category?: string, difficulty?: string, sort?: 'newest' | 'highest_rated' }): Promise<any[]>;
  getPlaybookBySlug(slug: string): Promise<any | undefined>;
  getPlaybookById(id: string): Promise<any | undefined>;
  createPlaybook(userId: string, playbook: InsertPlaybook, playbookSteps: InsertStep[]): Promise<any>;
  updatePlaybook(id: string, updates: Partial<InsertPlaybook>, updatedSteps?: InsertStep[]): Promise<any>;
  deletePlaybook(id: string): Promise<void>;

  ratePlaybook(userId: string, playbookId: string, rating: number): Promise<void>;
  getPlaybookRatings(playbookId: string): Promise<{ averageRating: number, ratingCount: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createGoogleUser(insertUser: GoogleUserInput): Promise<User> {
    const [user] = await db.insert(users).values({ ...insertUser, authProvider: "google" }).returning();
    return user;
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<User> {
    const existing = await this.getUser(userId);
    if (!existing) {
      throw new Error("User not found");
    }

    const nextProvider = existing.authProvider === "local" ? "both" : existing.authProvider;

    const [updated] = await db
      .update(users)
      .set({ googleId, authProvider: nextProvider })
      .where(eq(users.id, userId))
      .returning();

    return updated;
  }

  async getPlaybooks(params?: { search?: string, category?: string, difficulty?: string, sort?: 'newest' | 'highest_rated' }) {
    let query = db
      .select({
        id: playbooks.id,
        userId: playbooks.userId,
        title: playbooks.title,
        slug: playbooks.slug,
        shortDescription: playbooks.shortDescription,
        category: playbooks.category,
        difficulty: playbooks.difficulty,
        estimatedTime: playbooks.estimatedTime,
        toolsUsed: playbooks.toolsUsed,
        createdAt: playbooks.createdAt,
        authorName: users.username,
        averageRating: sql<number>`CAST(AVG(${ratings.rating}) AS FLOAT)`,
        ratingCount: sql<number>`CAST(COUNT(${ratings.rating}) AS INTEGER)`
      })
      .from(playbooks)
      .innerJoin(users, eq(playbooks.userId, users.id))
      .leftJoin(ratings, eq(playbooks.id, ratings.playbookId))
      .groupBy(playbooks.id, users.username);

    let results = await query;

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      results = results.filter(p => p.title.toLowerCase().includes(searchLower) || p.shortDescription.toLowerCase().includes(searchLower));
    }
    if (params?.category) {
      results = results.filter(p => p.category === params.category);
    }
    if (params?.difficulty) {
      results = results.filter(p => p.difficulty === params.difficulty);
    }
    
    if (params?.sort === 'highest_rated') {
      results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else {
      results.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    }

    return results;
  }

  async getPlaybookBySlug(slug: string) {
    const [playbook] = await db.select().from(playbooks).where(eq(playbooks.slug, slug));
    if (!playbook) return undefined;

    const playbookSteps = await db.select().from(steps).where(eq(steps.playbookId, playbook.id)).orderBy(steps.stepNumber);
    const [author] = await db.select().from(users).where(eq(users.id, playbook.userId));
    const stats = await this.getPlaybookRatings(playbook.id);

    return {
      ...playbook,
      steps: playbookSteps,
      authorName: author.username,
      averageRating: stats.averageRating,
      ratingCount: stats.ratingCount
    };
  }

  async getPlaybookById(id: string) {
    const [playbook] = await db.select().from(playbooks).where(eq(playbooks.id, id));
    if (!playbook) return undefined;

    const playbookSteps = await db.select().from(steps).where(eq(steps.playbookId, playbook.id)).orderBy(steps.stepNumber);
    const [author] = await db.select().from(users).where(eq(users.id, playbook.userId));
    const stats = await this.getPlaybookRatings(playbook.id);

    return {
      ...playbook,
      steps: playbookSteps,
      authorName: author.username,
      averageRating: stats.averageRating,
      ratingCount: stats.ratingCount
    };
  }

  async createPlaybook(userId: string, playbook: InsertPlaybook, playbookSteps: InsertStep[]) {
    // Generate a simple slug
    const baseSlug = playbook.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;
    
    const [createdPlaybook] = await db.insert(playbooks).values({
      ...playbook,
      userId,
      slug
    }).returning();

    if (playbookSteps && playbookSteps.length > 0) {
      const stepsToInsert = playbookSteps.map(s => ({ ...s, playbookId: createdPlaybook.id }));
      await db.insert(steps).values(stepsToInsert);
    }

    return this.getPlaybookById(createdPlaybook.id);
  }

  async updatePlaybook(id: string, updates: Partial<InsertPlaybook>, updatedSteps?: InsertStep[]) {
    await db.update(playbooks).set(updates).where(eq(playbooks.id, id));

    if (updatedSteps && updatedSteps.length > 0) {
      await db.delete(steps).where(eq(steps.playbookId, id));
      const stepsToInsert = updatedSteps.map(s => ({ ...s, playbookId: id }));
      await db.insert(steps).values(stepsToInsert);
    }

    return this.getPlaybookById(id);
  }

  async deletePlaybook(id: string) {
    await db.delete(playbooks).where(eq(playbooks.id, id));
  }

  async ratePlaybook(userId: string, playbookId: string, ratingValue: number) {
    await db.insert(ratings).values({
      userId,
      playbookId,
      rating: ratingValue
    }).onConflictDoUpdate({
      target: [ratings.playbookId, ratings.userId],
      set: { rating: ratingValue }
    });
  }

  async getPlaybookRatings(playbookId: string) {
    const [stats] = await db
      .select({
        averageRating: sql<number>`CAST(AVG(${ratings.rating}) AS FLOAT)`,
        ratingCount: sql<number>`CAST(COUNT(${ratings.rating}) AS INTEGER)`
      })
      .from(ratings)
      .where(eq(ratings.playbookId, playbookId));
    
    return {
      averageRating: stats.averageRating || 0,
      ratingCount: stats.ratingCount || 0
    };
  }
}

export const storage = new DatabaseStorage();

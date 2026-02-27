import { pgTable, text, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(), // Using as email
  password: text("password").notNull(),
});

export const playbooks = pgTable("playbooks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  estimatedTime: text("estimated_time").notNull(),
  toolsUsed: text("tools_used").array().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const steps = pgTable("steps", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  playbookId: text("playbook_id").notNull().references(() => playbooks.id, { onDelete: 'cascade' }),
  stepNumber: integer("step_number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  toolUsed: text("tool_used").notNull(),
  promptText: text("prompt_text"),
  expectedOutput: text("expected_output").notNull(),
});

export const ratings = pgTable("ratings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  playbookId: text("playbook_id").notNull().references(() => playbooks.id, { onDelete: 'cascade' }),
  userId: text("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  unique().on(t.playbookId, t.userId)
]);

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPlaybookSchema = createInsertSchema(playbooks).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertStepSchema = createInsertSchema(steps).omit({
  id: true,
  playbookId: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type Playbook = typeof playbooks.$inferSelect;
export type Step = typeof steps.$inferSelect;
export type Rating = typeof ratings.$inferSelect;

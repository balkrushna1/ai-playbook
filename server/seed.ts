import { db } from "./db";
import { users, playbooks, steps } from "@shared/schema";
import { setupAuth } from "./auth";
import express from "express";

async function seed() {
  console.log("Seeding database...");
  const app = express();
  const { hashPassword } = setupAuth(app);
  
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already seeded");
    process.exit(0);
  }

  // Create users
  const pwd = await hashPassword("password123");
  const [user1] = await db.insert(users).values({ username: "alice_builder", password: pwd }).returning();
  const [user2] = await db.insert(users).values({ username: "bob_creator", password: pwd }).returning();

  // Create playbooks
  const [pb1] = await db.insert(playbooks).values({
    userId: user1.id,
    title: "Cold Email Outreach Sequence",
    slug: "cold-email-outreach-sequence",
    shortDescription: "A complete workflow for researching prospects and writing highly personalized cold emails.",
    category: "Marketing",
    difficulty: "Intermediate",
    estimatedTime: "15 mins",
    toolsUsed: ["ChatGPT", "Apollo", "LinkedIn"]
  }).returning();

  await db.insert(steps).values([
    {
      playbookId: pb1.id,
      stepNumber: 1,
      title: "Research the prospect",
      description: "Find the prospect on LinkedIn and note down 3 recent posts or achievements.",
      toolUsed: "LinkedIn",
      expectedOutput: "A list of 3 personalized data points."
    },
    {
      playbookId: pb1.id,
      stepNumber: 2,
      title: "Draft the email",
      description: "Use ChatGPT to draft an email based on the personalized data points.",
      toolUsed: "ChatGPT",
      promptText: "Write a short cold email to a marketing manager using these 3 data points: [DATA]. Keep it under 100 words and focus on how we can help them scale.",
      expectedOutput: "A customized cold email draft."
    }
  ]);

  const [pb2] = await db.insert(playbooks).values({
    userId: user2.id,
    title: "Automated Blog Post Generation",
    slug: "automated-blog-post",
    shortDescription: "Generate SEO-optimized blog posts from a simple keyword.",
    category: "Content Creation",
    difficulty: "Beginner",
    estimatedTime: "5 mins",
    toolsUsed: ["Claude", "Ahrefs"]
  }).returning();

  await db.insert(steps).values([
    {
      playbookId: pb2.id,
      stepNumber: 1,
      title: "Keyword Research",
      description: "Find a long-tail keyword with good volume.",
      toolUsed: "Ahrefs",
      expectedOutput: "One primary keyword and 3 secondary keywords."
    },
    {
      playbookId: pb2.id,
      stepNumber: 2,
      title: "Write the post",
      description: "Ask Claude to write a comprehensive article.",
      toolUsed: "Claude",
      promptText: "Write a 1500-word blog post about [KEYWORD]. Include an introduction, 3 main sections, and a conclusion. Use markdown.",
      expectedOutput: "A fully formatted blog post."
    }
  ]);

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed", err);
  process.exit(1);
});
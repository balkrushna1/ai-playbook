import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./auth";
import passport from "passport";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const { hashPassword, googleAuthEnabled } = setupAuth(app);

  const safeUser = (user: { id: string; username: string; googleId: string | null; authProvider: string }) => ({
    id: user.id,
    username: user.username,
    googleId: user.googleId,
    authProvider: user.authProvider,
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        if (existingUser.authProvider === "google") {
          return res.status(400).json({ message: "Account already exists with Google sign-in. Please continue with Google." });
        }
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      
      req.login(user, (err) => {
        if (err) throw err;
        res.status(201).json(safeUser(user));
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: { message?: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid username or password" });
      }

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.status(200).json(safeUser(user));
      });
    })(req, res, next);
  });

  app.get(api.auth.google.path, (req, res, next) => {
    if (!googleAuthEnabled) {
      return res.status(503).json({ message: "Google auth is not configured" });
    }
    return passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" })(req, res, next);
  });

  app.get(api.auth.googleCallback.path, (req, res, next) => {
    if (!googleAuthEnabled) {
      return res.status(503).json({ message: "Google auth is not configured" });
    }

    passport.authenticate("google", { failureRedirect: "/?auth=google_failed" }, (err: any, user: Express.User | false) => {
      if (err || !user) {
        return res.redirect("/?auth=google_failed");
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.redirect("/?auth=google_failed");
        }
        return res.redirect("/");
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.status(200).json(safeUser(req.user!));
  });

  // Playbooks
  app.get(api.playbooks.list.path, async (req, res) => {
    try {
      const queryParams = api.playbooks.list.input?.parse(req.query) || {};
      const playbooks = await storage.getPlaybooks(queryParams);
      res.json(playbooks);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.playbooks.get.path, async (req, res) => {
    const playbook = await storage.getPlaybookBySlug(req.params.slug);
    if (!playbook) {
      return res.status(404).json({ message: "Playbook not found" });
    }
    res.json(playbook);
  });

  app.post(api.playbooks.create.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const input = api.playbooks.create.input.parse(req.body);
      const userId = req.user!.id;
      const { steps, ...playbookData } = input;
      const created = await storage.createPlaybook(userId, playbookData, steps);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.playbooks.update.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const input = api.playbooks.update.input.parse(req.body);
      const existing = await storage.getPlaybookById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Not found" });
      }
      if (existing.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { steps, ...updates } = input;
      const updated = await storage.updatePlaybook(req.params.id, updates, steps);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.playbooks.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const existing = await storage.getPlaybookById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Not found" });
      }
      if (existing.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deletePlaybook(req.params.id);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.playbooks.rate.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const input = api.playbooks.rate.input.parse(req.body);
      await storage.ratePlaybook(req.user!.id, req.params.id, input.rating);
      const stats = await storage.getPlaybookRatings(req.params.id);
      res.json(stats);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}

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
  const siteUrl = (process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:5000").replace(/\/$/, "");

  const escapeXml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const safeUser = (user: { id: string; username: string; googleId: string | null; authProvider: string }) => ({
    id: user.id,
    username: user.username,
    googleId: user.googleId,
    authProvider: user.authProvider,
  });

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain");
    res.send(`User-agent: *\nAllow: /\nDisallow: /create\nSitemap: ${siteUrl}/sitemap.xml\n`);
  });

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const playbookItems = await storage.getPlaybooks({ sort: "newest" });
      const now = new Date().toISOString();

      const staticUrls = [
        { path: "/", changefreq: "weekly", priority: "1.0", lastmod: now },
        { path: "/explore", changefreq: "daily", priority: "0.9", lastmod: now },
      ];

      const urls = [
        ...staticUrls.map(
          (entry) =>
            `<url><loc>${escapeXml(`${siteUrl}${entry.path}`)}</loc><lastmod>${entry.lastmod}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`,
        ),
        ...playbookItems.map((playbook) => {
          const lastMod = playbook.createdAt ? new Date(playbook.createdAt).toISOString() : now;
          return `<url><loc>${escapeXml(`${siteUrl}/playbook/${playbook.slug}`)}</loc><lastmod>${lastMod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
        }),
      ];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

      res.type("application/xml");
      res.send(xml);
    } catch (err) {
      res.status(500).json({ message: "Failed to generate sitemap" });
    }
  });

  app.get("/rss.xml", async (_req, res) => {
    try {
      const playbookItems = await storage.getPlaybooks({ sort: "newest" });
      const feedItems = playbookItems.slice(0, 50);
      const now = new Date().toUTCString();

      const items = feedItems.map((playbook) => {
        const pubDate = playbook.createdAt ? new Date(playbook.createdAt).toUTCString() : now;
        const description = (playbook.shortDescription || "").slice(0, 400);
        const link = `${siteUrl}/playbook/${playbook.slug}`;

        return `<item><title>${escapeXml(playbook.title)}</title><link>${escapeXml(link)}</link><guid isPermaLink="true">${escapeXml(link)}</guid><description>${escapeXml(description)}</description><pubDate>${pubDate}</pubDate></item>`;
      });

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n<title>PlaybookAI</title>\n<link>${escapeXml(siteUrl)}</link>\n<description>Latest AI workflow playbooks from PlaybookAI</description>\n<language>en-us</language>\n<lastBuildDate>${now}</lastBuildDate>\n${items.join("\n")}\n</channel>\n</rss>`;

      res.type("application/rss+xml");
      res.send(xml);
    } catch (err) {
      res.status(500).json({ message: "Failed to generate rss" });
    }
  });

  app.get("/og/default.svg", (_req, res) => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0F172A"/>
      <stop offset="1" stop-color="#1E293B"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="80" y="250" fill="#F8FAFC" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="700">PlaybookAI</text>
  <text x="80" y="330" fill="#94A3B8" font-family="Inter, Arial, sans-serif" font-size="36">AI Workflow Playbooks & Prompt Guides</text>
  <text x="80" y="530" fill="#CBD5E1" font-family="Inter, Arial, sans-serif" font-size="28">${escapeXml(siteUrl)}</text>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(svg);
  });

  app.get("/og/playbook/:slug.svg", async (req, res) => {
    try {
      const slug = decodeURIComponent(req.params.slug);
      const playbook = await storage.getPlaybookBySlug(slug);
      if (!playbook) {
        return res.redirect("/og/default.svg");
      }

      const title = String(playbook.title || "PlaybookAI").slice(0, 90);
      const description = String(playbook.shortDescription || "AI workflow playbook").slice(0, 180);
      const author = String(playbook.authorName || "PlaybookAI").slice(0, 60);

      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#020617"/>
      <stop offset="1" stop-color="#0F172A"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="70" y="70" width="1060" height="490" rx="24" fill="rgba(15,23,42,0.4)" stroke="rgba(148,163,184,0.35)" />
  <text x="110" y="170" fill="#60A5FA" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="600">PlaybookAI • AI Workflow</text>
  <text x="110" y="270" fill="#F8FAFC" font-family="Inter, Arial, sans-serif" font-size="58" font-weight="700">${escapeXml(title)}</text>
  <text x="110" y="350" fill="#CBD5E1" font-family="Inter, Arial, sans-serif" font-size="30">${escapeXml(description)}</text>
  <text x="110" y="520" fill="#94A3B8" font-family="Inter, Arial, sans-serif" font-size="28">By ${escapeXml(author)} • ${escapeXml(siteUrl)}</text>
</svg>`;

      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(svg);
    } catch (err) {
      res.redirect("/og/default.svg");
    }
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

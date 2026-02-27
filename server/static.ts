import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { getDefaultSeo, getPlaybookSeo, injectSeoIntoHtml } from "./seo";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath, { index: false }));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", async (req, res) => {
    const siteUrl = (process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
    const indexPath = path.resolve(distPath, "index.html");
    const template = await fs.promises.readFile(indexPath, "utf-8");

    let seo = getDefaultSeo(siteUrl);
    const playbookMatch = req.path.match(/^\/playbook\/([^/?#]+)/);
    if (playbookMatch) {
      const slug = decodeURIComponent(playbookMatch[1]);
      const playbook = await storage.getPlaybookBySlug(slug);
      if (playbook) {
        seo = getPlaybookSeo(siteUrl, {
          slug: playbook.slug,
          title: playbook.title,
          shortDescription: playbook.shortDescription,
          authorName: playbook.authorName,
          toolsUsed: playbook.toolsUsed,
          createdAt: playbook.createdAt,
          estimatedTime: playbook.estimatedTime,
          ratingCount: playbook.ratingCount,
          averageRating: playbook.averageRating,
          steps: playbook.steps,
        });
      }
    }

    res.status(200).type("text/html").send(injectSeoIntoHtml(template, seo));
  });
}

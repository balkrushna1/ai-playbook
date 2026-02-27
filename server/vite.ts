import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { storage } from "./storage";
import { getDefaultSeo, getPlaybookSeo, injectSeoIntoHtml } from "./seo";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("/{*path}", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      const siteUrl = (process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
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

      template = injectSeoIntoHtml(template, seo);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

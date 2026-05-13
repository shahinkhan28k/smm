import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: Generic SMM Provider Proxy
  app.post("/api/provider/proxy", async (req, res) => {
    try {
      const { apiUrl, apiKey, action, ...params } = req.body;
      
      if (!apiUrl || !apiKey || !action) {
        return res.status(400).json({ error: "apiUrl, apiKey, and action are required" });
      }

      console.log(`[Proxy] Action: ${action} for: ${apiUrl}`);

      const url = new URL(apiUrl as string);
      url.searchParams.append('key', apiKey as string);
      url.searchParams.append('action', action as string);
      
      // Append other parameters (service, link, quantity, order, etc.)
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });

      const response = await fetch(url.toString(), {
        method: 'POST', // Some panels prefer POST, and it's generally safer for API keys in URL (though they are in the body here)
        headers: {
          'User-Agent': 'Mozilla/5.0 (Node.js)'
        }
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: `Provider responded with ${response.status}: ${text}` });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("[Proxy] Error:", error.message);
      res.status(500).json({ error: error.message || "Internal server error during proxy call" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

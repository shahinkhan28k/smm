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

  // API Route: SMM Provider Proxy - Fetch Services
  app.get("/api/provider/services", async (req, res) => {
    try {
      const { apiUrl, apiKey } = req.query;
      
      if (!apiUrl || !apiKey) {
        return res.status(400).json({ error: "API URL and Key are required" });
      }

      console.log(`[Proxy] Fetching services from: ${apiUrl}`);

      // SMM Panels typically use action=services
      const url = new URL(apiUrl as string);
      url.searchParams.append('key', apiKey as string);
      url.searchParams.append('action', 'services');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[Proxy] Backend error: ${response.status} - ${text}`);
        return res.status(response.status).json({ error: `Provider responded with ${response.status}` });
      }
      
      const data = await response.json();
      
      // Some panels return an error object: { error: "..." }
      if (data.error) {
        return res.status(400).json({ error: data.error });
      }

      res.json(data);
    } catch (error: any) {
      console.error("[Proxy] Critical Error:", error.message);
      res.status(500).json({ error: error.message || "Failed to fetch services from provider" });
    }
  });

  // API Route: SMM Provider Proxy - Place Order
  app.post("/api/provider/order", async (req, res) => {
    try {
      const { serviceId, link, quantity } = req.body;
      
      // Check if provider API key exists
      if (!process.env.PROVIDER_API_KEY) {
        // Mock response for development if no key
        return res.json({ 
          status: "Success", 
          order: Math.floor(Math.random() * 1000000).toString(),
          message: "Simulator: Order placed successfully (No REAL API Key found in .env)"
        });
      }

      // Real integration logic would go here
      // const response = await fetch(PROVIDER_URL, { ... });
      
      res.json({ status: "ok", message: "Real provider logic not implemented yet." });
    } catch (error) {
      res.status(500).json({ error: "Failed to process order with provider" });
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

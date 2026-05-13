import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ... (previous health check and proxy routes)

  // API Route: AI Order Analysis
  app.post("/api/ai/analyze-orders", async (req, res) => {
    try {
      const { orders } = req.body;
      
      if (!orders || !Array.isArray(orders)) {
        return res.status(400).json({ error: "Orders array is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        You are a professional SMM Panel Order Manager for "Natok Boost". 
        Analyze the following failed or errored orders and provide a concise report in Bengali.
        Explain common reasons for failure and suggest fixes.
        Orders: ${JSON.stringify(orders.slice(0, 20))}
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      res.json({ analysis: text });
    } catch (error: any) {
      console.error("[AI] Error:", error.message);
      res.status(500).json({ error: "Failed to generate AI analysis" });
    }
  });

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

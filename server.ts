import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Gemini API Proxy
  app.post("/api/analyze-photo", async (req, res) => {
    try {
      const { base64Image, mimeType, prompt: customPrompt } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3.1-pro-preview";
      
      const defaultPrompt = `
        Eres un experto entrenador personal y especialista en biomecánica. 
        Analiza esta foto de progreso de un atleta. 
        Identifica:
        1. Cambios notables en la composición corporal (si es una comparativa implícita o una sola foto).
        2. Postura y alineación.
        3. Áreas de mejora o enfoque para el entrenamiento.
        4. Estimación visual (aproximada y con cautela) de progreso.
        
        Responde de forma profesional, motivadora y técnica en español. Usa Markdown para el formato.
      `;

      const prompt = customPrompt || defaultPrompt;
      const parts: any[] = [{ text: prompt }];

      if (base64Image) {
        parts.push({
          inlineData: {
            data: base64Image.split(',')[1] || base64Image,
            mimeType: mimeType || 'image/jpeg',
          },
        });
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: [{ parts }],
      });

      res.json({ text: response.text, analysis: response.text }); // analysis for backward compatibility with TrainingPlanEditor
    } catch (error: any) {
      console.error("Error in /api/analyze-photo:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // SPA fallback for dev mode
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      console.log(`Dev request: ${url}`);
      try {
        const templatePath = path.resolve(__dirname, 'index.html');
        let template = await fs.promises.readFile(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        console.error(`Error serving dev template: ${e}`);
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    console.log("Starting server in PRODUCTION mode");
    const distPath = path.resolve(__dirname, 'dist');
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      console.log(`Prod request: ${req.originalUrl}`);
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

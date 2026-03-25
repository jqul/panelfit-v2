import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middleware
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

    res.json({ text: response.text, analysis: response.text });
  } catch (error: any) {
    console.error("Error in /api/analyze-photo:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

export default app;

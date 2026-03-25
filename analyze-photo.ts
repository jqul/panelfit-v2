import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers para que el frontend pueda llamar a la API
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { base64Image, mimeType, prompt: customPrompt } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ error: "GEMINI_API_KEY no está configurada en Vercel." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // CORRECCIÓN: modelo que sí existe
    const model = "gemini-2.0-flash";

    const defaultPrompt = `
Eres un experto entrenador personal y especialista en biomecánica.
Analiza esta foto de progreso de un atleta.

Identifica:
1. Cambios notables en la composición corporal.
2. Postura y alineación.
3. Áreas de mejora o enfoque para el entrenamiento.
4. Estimación visual (aproximada y con cautela) de progreso.

Responde de forma profesional, motivadora y técnica en español. Usa Markdown para el formato.
`;

    const prompt = customPrompt || defaultPrompt;
    const parts: { text?: string; inlineData?: { data: string; mimeType: string } }[] = [{ text: prompt }];

    if (base64Image) {
      parts.push({
        inlineData: {
          data: base64Image.split(",")[1] || base64Image,
          mimeType: mimeType || "image/jpeg",
        },
      });
    }

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
    });

    return res.status(200).json({
      text: response.text,
      analysis: response.text, // compatibilidad con TrainingPlanEditor
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in /api/analyze-photo:", message);
    return res.status(500).json({ error: message });
  }
}

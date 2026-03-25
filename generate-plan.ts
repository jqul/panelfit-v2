import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { type = "hipertrofia", exercises = [] } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY no está configurada en Vercel." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `Eres un experto en programación de entrenamiento. 
Genera un plan de entrenamiento de 4 semanas para un cliente con objetivo: ${type}.

IMPORTANTE: Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin \`\`\`json, sin explicaciones.

El JSON debe seguir exactamente esta estructura:
{
  "weeks": [
    {
      "label": "Semana 1 - Adaptación",
      "rpe": "@7",
      "isCurrent": false,
      "days": [
        {
          "title": "LUNES — Empuje",
          "focus": "Pecho / Hombro / Tríceps",
          "exercises": [
            {
              "name": "Press banca",
              "sets": "4×8",
              "weight": "RPE 7",
              "isMain": true,
              "comment": "Codos a 45 grados"
            }
          ]
        }
      ]
    }
  ]
}

Usa preferiblemente ejercicios de esta lista: ${exercises.slice(0, 20).join(", ")}.
La semana 3 debe tener isCurrent: true. Incluye 3-5 días por semana y 4-6 ejercicios por día.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    const text = response.text || "";

    // Intentar parsear para validar que es JSON correcto
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No se encontró JSON en la respuesta");
      JSON.parse(jsonMatch[0]); // Validar
    } catch {
      return res.status(500).json({ 
        error: "La IA no generó un plan válido. Inténtalo de nuevo.",
        raw: text.substring(0, 200)
      });
    }

    return res.status(200).json({ text, analysis: text });
  } catch (error: any) {
    console.error("Error in /api/generate-plan:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}

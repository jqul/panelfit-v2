import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function analyzeProgressPhoto(base64Image: string, mimeType: string) {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Eres un experto entrenador personal y especialista en biomecánica. 
    Analiza esta foto de progreso de un atleta. 
    Identifica:
    1. Cambios notables en la composición corporal (si es una comparativa implícita o una sola foto).
    2. Postura y alineación.
    3. Áreas de mejora o enfoque para el entrenamiento.
    4. Estimación visual (aproximada y con cautela) de progreso.
    
    Responde de forma profesional, motivadora y técnica en español. Usa Markdown para el formato.
  `;

  const imagePart = {
    inlineData: {
      data: base64Image.split(',')[1] || base64Image,
      mimeType: mimeType,
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: prompt }, imagePart] }],
    });

    return response.text;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}

export async function analyzeProgressPhoto(base64Image: string, mimeType: string) {
  try {
    const response = await fetch("/api/analyze-photo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ base64Image, mimeType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to analyze photo");
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}

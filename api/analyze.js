import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    // CORS + preflight
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // FORCE GEMINI TO RETURN ONLY JSON
    const prompt = `
      You MUST return ONLY a JSON object. No text, no explanation.

      If the image does NOT contain food, return exactly:
      {
        "name": "not food",
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "confidence": 0
      }

      If the image DOES contain food, return exactly:
      {
        "name": "...",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "confidence": number
      }
    `;

    const image = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([prompt, image]);
    const text = result.response.text();

    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      // If Gemini didn't return JSON, treat as NOT FOOD
      return res.status(200).json({
        name: "not food",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        confidence: 0
      });
    }

    const data = JSON.parse(jsonMatch[0]);
    return res.status(200).json(data);

  } catch (error) {
    console.error("Backend error:", error);
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}

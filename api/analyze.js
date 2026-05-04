module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb"
    }
  }
};

const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
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

    // Convert to URL-safe base64 (REQUIRED for Gemini Vision)
    const safeBase64 = imageBase64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Return ONLY a JSON object. No text. No explanation. No markdown.

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
        "name": "string",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "confidence": number
      }
    `;

    const image = {
      inlineData: {
        data: safeBase64,
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([prompt, image]);

    let text = result.response.text().trim();

    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return res.status(200).json({
        name: "not food",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        confidence: 0
      });
    }

    const jsonText = text.slice(start, end + 1);
    const data = JSON.parse(jsonText);

    return res.status(200).json(data);

  } catch (error) {
    console.error("Backend error:", error);
    return res.status(500).json({
      name: "not food",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      confidence: 0
    });
  }
};

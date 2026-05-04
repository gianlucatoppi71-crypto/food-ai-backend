const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a nutrition expert. Analyze the food in the image and return ONLY a JSON object with:
      - name
      - calories
      - protein_g
      - carbs_g
      - fat_g
      - confidence (0–1)

      No text outside JSON.
    `;

    const image = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, image]);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Invalid AI response", raw: text });
    }

    const data = JSON.parse(jsonMatch[0]);
    return res.status(200).json(data);

  } catch (error) {
    console.error("Backend error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

export default async function handler(req, res) {
  // --- CORS FIX ---
  res.setHeader("Access-Control-Allow-Origin", "https://gianlucatoppi71-crypto.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // --- BODY PARSING FIX ---
    const { imageBase64 } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64" });
    }

    // --- CALL GEMINI ---
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "Analyze this food. Return JSON ONLY with calories, protein, carbs, fat, description."
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: imageBase64
                  }
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    // --- EXTRACT JSON FROM GEMINI ---
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let nutrition;
    try {
      nutrition = JSON.parse(aiText);
    } catch {
      nutrition = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        description: "Could not parse AI response"
      };
    }

    return res.status(200).json(nutrition);
  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
}

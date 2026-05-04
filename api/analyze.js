export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "https://gianlucatoppi71-crypto.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { imageBase64 } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64" });
    }

    // --- DO NOT MODIFY BASE64 ---
    const rawBase64 = imageBase64; 

    async function callGemini(promptText) {
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
                  { text: promptText },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: rawBase64
                    }
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    }

    // --- FIRST ATTEMPT ---
    let aiText = await callGemini(`
You are a strict nutrition analysis model.
Return ONLY valid JSON:

{
  "description": "string",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number
}

No text. No markdown. No explanation.
If unsure, guess the closest food.
    `);

    let nutrition;

    try {
      nutrition = JSON.parse(aiText);
    } catch {
      // --- SECOND ATTEMPT ---
      aiText = await callGemini(`
Return ONLY JSON with estimated nutrition:

{
  "description": "string",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number
}
      `);

      try {
        nutrition = JSON.parse(aiText);
      } catch {
        nutrition = {
          description: "Unknown food",
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        };
      }
    }

    return res.status(200).json(nutrition);

  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
}

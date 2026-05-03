export default async function handler(req, res) {
  // --- CORS (required for GitHub Pages) ---
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
                  text: `
You are a nutrition analysis model.

Look at the food in the image and identify it.

Return ONLY valid JSON in this exact format:

{
  "description": "name of the food",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number
}

Do NOT include explanations, text, markdown, or comments.
If unsure, make your best guess.
`
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
        description: "Unknown food",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
    }

    return res.status(200).json(nutrition);

  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
}

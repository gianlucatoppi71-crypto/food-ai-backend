export default async function handler(req, res) {
  try {
    const { imageBase64 } = req.body;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: "Analyze this food. Return JSON ONLY with calories, protein, carbs, fat, description." },
                { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
}

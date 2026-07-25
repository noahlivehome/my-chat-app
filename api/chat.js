import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY が設定されていません。" });
    }

    // 公式SDKの初期化
    const ai = new GoogleGenAI({ apiKey });

    // APIの呼び出し
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: message || "こんにちは",
    });

    return res.status(200).json({ reply: response.text });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ 
      error: "AIの呼び出しに失敗しました。", 
      details: error.message || String(error)
    });
  }
}

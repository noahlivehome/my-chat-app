export default async function handler(req, res) {
  // POST以外のアクセスは拒否
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;
    
    // 環境変数からキーを取得（前後空白を除去）
    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY が設定されていません。" });
    }

    // Google API のエンドポイント
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: message || "こんにちは" }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return res.status(500).json({ 
        error: "Google APIエラーが発生しました。", 
        details: data.error?.message || JSON.stringify(data) 
      });
    }

    // AIの返答テキストを取り出して返却
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "返答が得られませんでした。";
    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。", details: error.message });
  }
}

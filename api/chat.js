export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY が設定されていません。" });
    }

    // Google APIへ直接リクエストを送信（ライブラリ不使用）
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

    // AIからの返答テキストを取り出す
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "返答が得られませんでした。";

    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。", details: error.message });
  }
}export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    // APIキーを使わず、動作確認用の返答を返す
    const replyText = `【テスト応答】「${message || "こんにちは"}」というメッセージを受け取りました！通信は正常に成功しています。`;

    return res.status(200).json({ reply: replyText });

  } catch (error) {
    return res.status(500).json({ error: "エラーが発生しました。" });
  }
}

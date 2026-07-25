import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. POST以外のアクセスを拒否
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 2. リクエストボディからメッセージを取得
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "メッセージが入力されていません。" });
    }

    // 3. 環境変数からAPIキーを取得
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY がVercelに設定されていません。" });
    }

    // 4. Gemini SDK の初期化
    const genAI = new GoogleGenerativeAI(apiKey);

    // 5. モデルの指定（現在最も安定して動作する最新モデル）
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 6. Gemini API へ送信してレスポンスを取得
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    // 7. 正常レスポンスを返却
    return res.status(200).json({ reply: text });

  } catch (error) {
    // 8. エラー内容をコンソールと画面側の両方に詳細表示
    console.error("Gemini API Error Details:", error);
    
    return res.status(500).json({
      error: "通信エラーが発生しました。",
      details: error.message || String(error)
    });
  }
}

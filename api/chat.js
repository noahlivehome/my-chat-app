import { GoogleGenerativeAI } from "@google/genai";

export default async function handler(req, res) {
  // 1. リクエストメソッドの検証（POSTのみ許可）
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 2. クライアントからのメッセージを取得
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "メッセージが入力されていません。" });
    }

    // 3. 環境変数からAPIキーを読み込む
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "APIキー（GEMINI_API_KEY）が設定されていません。" });
    }

    // 4. Gemini SDK の初期化
    const genAI = new GoogleGenerativeAI(apiKey);

    // 5. モデルの指定（エラー回避のため gemini-2.5-flash を指定）
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 6. Gemini API へメッセージを送信して回答を取得
    const result = await model.generateContent(message);
    const responseText = result.response.text();

    // 7. クライアント（画面側）へレスポンスを返す
    return res.status(200).json({ reply: responseText });

  } catch (error) {
    // 8. エラーハンドリング
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      error: "AIの処理中にエラーが発生しました。",
      details: error.message
    });
  }
}

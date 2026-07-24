import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS設定（自社サイトからの通信を許可）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { messages } = req.body;
    // ユーザーが入力した最新のメッセージを取得
    const userMessage = messages[messages.length - 1].content;

    // 後でVercelで設定するGemini APIキーを呼び出す
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // 無料で使えるモデル「gemini-1.5-flash」を指定
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "あなたは不動産会社の公式AIアシスタントです。お部屋探し（賃貸）、賃貸管理、売買に関するお客様からのご質問に親切丁寧に回答してください。"
    });

    // AIからの回答を生成
    const result = await model.generateContent(userMessage);
    const reply = result.response.text();

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: "通信エラーが発生しました。" });
  }
}
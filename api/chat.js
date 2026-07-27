const Groq = require("groq-sdk");

// Vercelの環境変数からAPIキーを取得
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

module.exports = async function handler(req, res) {
  // POST以外のメソッドは拒否
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "メッセージが空です" });
    }

    // 会話履歴（history）のフォーマット整形（トークン節約のため直近6件に制限）
    const formattedHistory = Array.isArray(history) 
      ? history.slice(-6).map(item => ({
          role: item.role === "user" ? "user" : "assistant",
          content: String(item.content || "")
        }))
      : [];

    // システムプロンプト設定
    const systemMessage = {
      role: "system",
      content: `あなたは「ノアリブホーム」の親切で丁寧な不動産AIアドバイザーです。
お部屋探し（賃貸）、賃貸管理・経営（オーナー様向け）、売却、購入の相談に対応します。
回答は簡潔かつ分かりやすく、ユーザーに寄り添った丁寧な敬語（〜です、〜ます）で回答してください。
回答内に [OPTIONS] などの不要な内部タグは絶対に使用しないでください。`
    };

    // APIへ送信するメッセージ配列の構築
    const messages = [
      systemMessage,
      ...formattedHistory,
      { role: "user", content: message }
    ];

    // Groq API 呼び出し（軽量・爆速モデル指定でレート制限を回避）
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 512
    });

    const reply = completion.choices[0]?.message?.content || "申し訳ありません。回答を生成できませんでした。";

    return res.status(200).json({ reply: reply });

  } catch (error) {
    console.error("Groq API Execution Error:", error);
    
    // レート制限（429）の場合のハンドリング
    if (error?.status === 429 || error?.message?.includes("rate_limit")) {
      return res.status(429).json({ 
        error: "一時的にアクセスが集中しています。1〜2分ほど置いてから再度お試しください。" 
      });
    }

    return res.status(500).json({ 
      error: "API呼び出しエラーが発生しました。" 
    });
  }
};

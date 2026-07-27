import Groq from "groq-sdk";

export default async function handler(req, res) {
  // 1. CORS 対策 & プリフライト（OPTIONS）リクエスト対応
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 2. POSTメソッド以外のアクセスを拒否
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 3. GROQ_API_KEY の存在チェック
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not defined in environment variables.");
      return res.status(500).json({ error: "サーバー側でAPIキーが設定されていません。" });
    }

    // Groqクライアントの初期化
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const { message, history } = req.body || {};

    // メッセージの空チェック
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "メッセージが空です。" });
    }

    // 4. 会話履歴（history）の整形・直近6件（3往復）に制限してトークン消費を節約
    const formattedHistory = Array.isArray(history)
      ? history.slice(-6).map(item => ({
          role: item.role === "user" ? "user" : "assistant",
          content: String(item.content || "")
        }))
      : [];

    // 5. システムプロンプト（AIのキャラクター設定）
    const systemMessage = {
      role: "system",
      content: `あなたは「ノアリブホーム」の親切で丁寧な不動産AIアドバイザーです。
お部屋探し（賃貸）、賃貸管理・経営（オーナー様向け）、売却、購入の相談に対応します。

【回答ルール】
・ユーザーに寄り添った丁寧な敬語（〜です、〜ます）で回答してください。
・回答は簡潔で分かりやすくまとめてください。
・回答文の中に [OPTIONS] などの不要な内部タグや独自の装飾コードは絶対に使用しないでください。`
    };

    // 6. メッセージ配列の生成
    const messages = [
      systemMessage,
      ...formattedHistory,
      { role: "user", content: message.trim() }
    ];

    // 7. Groq API 呼び出し（高速・軽量モデル「llama-3.1-8b-instant」）
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 512
    });

    const reply = completion.choices[0]?.message?.content || "申し訳ありません。回答を生成できませんでした。";

    // script.js が期待する { reply: "..." } 形式でレスポンスを返却
    return res.status(200).json({ reply: reply });

  } catch (error) {
    console.error("Groq API Execution Error:", error);

    // レート制限エラー（429）のハンドリング
    if (error?.status === 429 || error?.message?.includes("rate_limit")) {
      return res.status(429).json({
        error: "一時的にアクセスが集中しています。1〜2分ほど置いてから再度お試しください。"
      });
    }

    // script.js 側で `エラーが発生しました: ${data.error}` と表示されるため綺麗な文字列を返す
    return res.status(500).json({
      error: error?.message || "通信エラーが発生しました。"
    });
  }
}

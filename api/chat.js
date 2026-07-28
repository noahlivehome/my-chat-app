import https from 'https';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history } = req.body || {};
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY が設定されていません。" });
    }

    // ユーザー発話数に基づき正確にターン判定
    const userMessages = Array.isArray(history) 
      ? history.filter(item => item.role === "user") 
      : [];
    const turnCount = userMessages.length + 1;

    // 会話全体のコンテキスト（ニーズ）を判定
    const fullText = (userMessages.map(m => m.content).join(" ") + " " + (message || "")).toLowerCase();
    
    let userCategory = "rent_user"; // デフォルト：部屋を探したい
    if (fullText.includes("貸したい") || fullText.includes("オーナー") || fullText.includes("管理")) {
      userCategory = "owner_rent";
    } else if (fullText.includes("売りたい") || fullText.includes("売却")) {
      userCategory = "owner_sell";
    } else if (fullText.includes("買いたい") || fullText.includes("購入")) {
      userCategory = "buy_user";
    }

    let systemInstruction = `あなたは不動産会社「ノアリブホーム」の優秀で親しみやすいAIコンサルタントです。

【話し方・トーンの徹底ルール】
・「〜ということは〜ですね」といった機械的なオウム返しや理屈っぽい表現は【厳禁】です。
・「承知いたしました！」「素敵ですね！」など、自然で誠実なプロの接客日本語を使ってください。
・1回の返答は80〜120文字程度で短く簡潔に話してください。

【会話の進行ルール】
現在のターン：${turnCount}ターン目（最大5ターン）

1〜4ターン目：
・必ずユーザーに対して「質問を1つだけ」投げかけてください。
・質問の選択肢を、文章の【一番最後】に [OPTIONS: 選択肢1, 選択肢2, 選択肢3, 選択肢4] の形式で必ず付与してください。
・【注意】早期のお問い合わせ誘導（「下部のアクションボタンより〜」等）は1〜4ターン目では絶対に行わないでください。

【ニーズ別質問シナリオ】
1. 部屋を探したい（賃貸）：希望エリア → 希望の間取り → ご予算 → 引っ越し時期
2. 買いたい（購入）：ご希望の物件種別（マンション/戸建て） → エリア → ご予算 → 購入の時期
3. 貸したい（オーナー）：所有物件の種別 → 現在の状況（空室/退去予定） → お困りごと/ご要望
4. 売りたい（売却）：所有物件の種別 → 売却のご希望時期 → 査定方法のご希望

【禁止事項】
・借りる人/買う人に「査定」や「オーナー管理」の話をすること。
・マークダウン（** や # 等）を使うこと。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【現在5ターン目（最終ターン）】
これ以上の質問（「〜でしょうか？」等）は一切しないでください。
「ご希望をお聞かせいただきありがとうございます！ご条件に合う最新の物件情報や詳細なご案内をご用意いたします。画面下部よりお気軽にお問い合わせください。」
という旨を丁寧にお伝えして締めくくってください。[OPTIONS: ...] タグは絶対に付けないでください。`;
    }

    const messages = [{ role: "system", content: systemInstruction }];

    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-8);
      recentHistory.forEach(item => {
        messages.push({
          role: item.role === "user" ? "user" : "assistant",
          content: String(item.content || "")
        });
      });
    }

    messages.push({ role: "user", content: String(message || "こんにちは") });

    const postData = JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: messages,
      temperature: 0.3,
      presence_penalty: 0.5,
      frequency_penalty: 0.5,
      max_tokens: 250
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData, 'utf8')
      }
    };

    const apiResponse = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        response.setEncoding('utf8');
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try {
            resolve({ statusCode: response.statusCode, body: JSON.parse(data) });
          } catch (e) {
            reject(new Error("JSON解析エラー"));
          }
        });
      });
      request.on('error', (error) => reject(error));
      request.write(postData, 'utf8');
      request.end();
    });

    if (apiResponse.statusCode !== 200) {
      return res.status(apiResponse.statusCode).json({ error: "一時的なエラーが発生しました。" });
    }

    const rawText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";

    let replyText = rawText;
    let buttonOptions = [];

    const match = rawText.match(/\[?OPTIONS:\s*([^\]\n]+)\]?/i);
    if (match) {
      replyText = rawText.replace(/\[?OPTIONS:\s*([^\]\n]+)\]?/gi, '').trim();
      buttonOptions = match[1].split(',').map(s => s.trim()).filter(Boolean);
    }

    const isFinished = turnCount >= 5;

    return res.status(200).json({ 
      reply: replyText,
      options: isFinished ? [] : buttonOptions,
      isFinished: isFinished,
      userCategory: userCategory
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}

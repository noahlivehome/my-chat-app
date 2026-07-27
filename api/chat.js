import https from 'https';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body || {};
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY が設定されていません。" });
    }

    const turnCount = history && Array.isArray(history) ? Math.floor(history.length / 2) + 1 : 1;

    let systemInstruction = `あなたは不動産会社「ノアリブホーム」の親切でプロフェッショナルなAIコンサルタントです。
対応エリア：東京都北区（赤羽・王子等）、板橋区、埼玉県（東武東上線・埼京線沿線）。

【全体会話設計（5ラリーで丁寧に対応）】
・1〜4ラリー目：ユーザーのご希望条件やお悩みを共感し、ひとつずつ丁寧に質問を行ってください。
・5ラリー目：会話の締めくくりです。ヒアリング内容をまとめ、画面下部のお問い合わせボタンから専門スタッフへの相談・査定・来店予約へ進むよう案内してください。

【選択肢ボタン（OPTIONS）の出力ルール】
1〜4ラリー目のメッセージの「最後」には、必ずユーザーがタップで返答できる選択肢（2〜4個）を、以下のフォーマットで付与してください。
フォーマット例：
[OPTIONS: ペット可希望, 2階以上希望, 特になし]

【言葉遣い・NGルール（厳守）】
・「〜をご存じですか」「〜に関しまして」「〜かと存じます」などの不自然な日本語は絶対禁止です。
・自然で親切な敬語（「〜でしょうか？」「〜はございますか？」「〜ですね」）を使用してください。
・一度にたくさんの質問を詰め込まず、1〜2個の質問に絞ってください。
・物件の周辺環境や街の解説、架空の金額（〇〇万円等）や試算・解説は絶対に行わないでください。
・「**」「#」等のマークダウン記号は絶対に使わず、プレーンテキストのみで出力してください。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【現在5ラリー目です（締めくくり）】
これまでのヒアリング内容を簡単にまとめ、「詳細な査定・最新空室確認・個別ご提案については、画面下部のお問い合わせボタンよりお気軽にお進みください」と丁寧に伝えて会話を終了してください。[OPTIONS: ...] は付与しないでください。`;
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
      presence_penalty: 0.2,
      frequency_penalty: 0.2,
      max_tokens: 400
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

      request.on('error', (error) => { reject(error); });
      request.write(postData, 'utf8');
      request.end();
    });

    if (apiResponse.statusCode !== 200) {
      console.error("Groq API Error:", apiResponse.body);
      return res.status(apiResponse.statusCode).json({ 
        error: apiResponse.body?.error?.message || "APIエラーが発生しました。" 
      });
    }

    const rawText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";

    // OPTIONSタグを抽出してレスポンスを分離
    let replyText = rawText;
    let buttonOptions = [];

    const optionsMatch = rawText.match(/\[OPTIONS:\s*(.*?)\]/);
    if (optionsMatch) {
      replyText = rawText.replace(/\[OPTIONS:\s*.*?\]/, '').trim();
      buttonOptions = optionsMatch[1].split(',').map(s => s.trim());
    }

    return res.status(200).json({ 
      reply: replyText,
      options: buttonOptions 
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}

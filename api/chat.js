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

【対応得意エリア・駅】
・東京都北区：赤羽、王子、十条、田端、志茂
・東京都板橋区：板橋、大山、成増
・埼玉県：川口、戸田、和光市、朝霞、志木

【全体会話設計（5ラリーで丁寧に対応）】
・1〜4ラリー目：ユーザーのご希望や相談に対し、具体的な駅名やエリアの選択肢を数つ添えて魅力的に提案・ヒアリングしてください。質問だけを投げ返すのは厳禁です。
・5ラリー目：会話の締めくくりです。これまでの内容をまとめ、画面下部のお問い合わせボタンから専門スタッフへの相談・査定・来店予約へ進むよう案内してください。

【提案と選択肢（OPTIONS）の絶対ルール】
・ユーザーから「おすすめのエリアや駅」「どんな条件が良いか」等を聞かれた場合は、上記対応エリアから具体的な駅名やエリアを3〜4つ挙げて提案してください。
・1〜4ラリー目のメッセージの最後には、提案した内容に対応するタップ用選択肢（2〜4個）を必ず以下のフォーマットで付与してください。
  例：[OPTIONS: 和光市・朝霞エリア, 川口・戸田エリア, 赤羽・板橋エリア, その他]

【言葉遣い・NGルール】
・自然で丁寧な接客用敬語（「〜です」「〜ます」「〜でしょうか？」）を使用してください。
・「〜をご存じですか」「〜に関しまして」「〜かと存じます」などの不自然な日本語は絶対禁止です。
・架空の物件の部屋番号や家賃・面積などの具体的な物件スペック数値は捏造しないでください（実在する「駅名」や「エリア名」の提案は大歓迎です）。
・「**」「#」等のマークダウン記号は絶対に使わず、プレーンテキストのみで出力してください。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【現在5ラリー目です（締めくくり）】
これまでのご相談・ご希望を簡単にまとめ、「詳細な物件情報・査定・ご案内については、画面下部のお問い合わせボタンよりお気軽にお進みください」と丁寧に伝えて会話を終了してください。[OPTIONS: ...] は付与しないでください。`;
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
      temperature: 0.5,          // 提案力と柔軟性を持たせるため0.5に調整
      presence_penalty: 0.2,
      frequency_penalty: 0.2,
      max_tokens: 450
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

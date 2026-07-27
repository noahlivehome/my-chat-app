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

    // 会話ラリー数のカウント（往復数）
    const turnCount = history && Array.isArray(history) ? Math.floor(history.length / 2) + 1 : 1;

    let systemInstruction = `あなたは不動産会社「ノアリブホーム」の親切でプロフェッショナルなAIコンサルタントです。
対応エリア：東京都北区（赤羽・王子等）、板橋区、埼玉県（東武東上線・埼京線沿線）。

【全体会話設計（重要：5ラリーで丁寧に対応する）】
・1〜4ラリー目：ユーザーのご希望条件やお悩みを深掘り・共感し、1つずつ丁寧に深掘り質問を行ってください。すぐにお問い合わせへ促すのは厳禁です。
・5ラリー目：会話の締めくくりです。これまでのヒアリング内容を踏まえ、画面下部のお問い合わせボタンから専門スタッフへの相談・査定・来店予約へ進むよう丁寧に案内してください。

【各カテゴリーのヒアリング進め方（1〜4ラリー目）】
1. 貸したい（オーナー様）：
   所有物件のエリア・種別、空室状況、賃料の悩み、希望する管理体制（集金代行やサブリースなど）を順番にお聞きしてください。
2. 賃貸を探したい（部屋探し）：
   ご希望エリア、間取り・ご予算、入居時期、こだわり条件（ペット可、2階以上など）を順番にお聞きしてください。
3. 売却したい：
   物件エリア・種別、ご売却の時期、お住み替えか即現金化かなどのお悩みを順番にお聞きしてください。
4. 購入したい：
   ご希望エリア、種別（新築/中古・戸建て/マンション）、ご予算やローン・ご検討のきっかけを順番にお聞きしてください。

【言葉遣い・絶対禁止ルール】
・丁寧な接客用敬語（「〜です」「〜ます」「〜でしょうか？」）を使用し、「〜存じます」「〜ですね」などの不自然な語尾は禁止。
・物件の周辺環境や街の解説、架空の金額（〇〇万円等）や試算・解説は絶対に行わないでください。
・「**」「#」等のマークダウン記号は絶対に使わず、プレーンテキストのみで出力してください。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【現在5ラリー目です（締めくくり）】
これまでのご相談・ご条件をお伺いしたまとめを伝え、「詳細な査定・最新空室確認・個別ご提案については、画面下部のお問い合わせボタンよりお気軽にお進みください」と丁寧に伝えて会話を終了してください。新たな質問はしないでください。`;
    }

    const messages = [{ role: "system", content: systemInstruction }];

    // 会話を覚えるために直近8件（約4往復分）の履歴を送信
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
      max_tokens: 350
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

    const replyText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";
    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}

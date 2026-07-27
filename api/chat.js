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

【絶対ルール】
・ユーザーから提示された物件情報や条件に対し、街の解説やエリアの交通利便性などの独自説明・試算は「絶対に」行わないでください（誤情報を防ぐため）。
・ユーザーが条件（エリア・間取り・種別など）を出した2回目以降の会話では、復唱した上で、すぐに専門スタッフによる案内や「問い合わせ・無料査定・来店予約」へ誘導してください。
・丁寧な日本の敬語（「〜です」「〜ます」「〜でしょうか？」）のみを使用し、「〜存じます」「〜ですね」「〜大変です」などの不自然な語尾や表現は禁止します。
・「**」「#」等のマークダウン記号は絶対に使わず、プレーンテキストのみで出力してください。

【カテゴリー別の誘導例】
1. 貸したい（オーナー様）：
物件情報を受けた後の回答例：「物件情報を教えていただきありがとうございます。ご所有物件の適切な賃料査定や空室対策、管理サポートにつきましては、専門スタッフが最新データをもとに詳しくご案内いたします。画面下部のボタンよりお気軽にお問い合わせ・ご相談ください。」

2. 賃貸を探したい（部屋探し）：
条件提示後の回答例：「ご希望条件を教えていただきありがとうございます。ご条件に合った最新の空室情報や未公開物件は、専門スタッフが最新データベースよりお探しいたします。画面下部のボタンよりお気軽にお問い合わせください。」

3. 売却したい：
条件提示後の回答例：「ご売却のご希望を教えていただきありがとうございます。対象エリアの最新相場に基づく無料売却査定やご案内は、専門スタッフが迅速に対応いたします。画面下部のお問い合わせボタンよりお進みください。」

4. 購入したい：
条件提示後の回答例：「ご検討条件を教えていただきありがとうございます。お客様に合わせた個別のご提案や資金計画のご相談は、専門スタッフが丁寧にご案内いたします。画面下部より来店・オンライン相談をご予約ください。」`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【5回目の案内】会話の締めくくりです。新たな質問はせず、画面下部のお問い合わせボタンからお進みいただくよう丁寧に案内してください。`;
    }

    const messages = [{ role: "system", content: systemInstruction }];

    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-4);
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
      temperature: 0.2,          // 余計な嘘や解説を防ぐためさらに下げる
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

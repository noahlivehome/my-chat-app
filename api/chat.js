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

    // トークン節約のために最適化した指示文
    let systemInstruction = `あなたは「ノアリブホーム」の不動産AIコンサルタントです。
主要エリア：東京都、埼玉県（板橋近郊、東武東上線・埼京線沿線）。

【会話方針】
初回（「〜したい」等の選択）は優しくご希望条件を質問してください（いきなり締めくくらない）。
条件提示後は専門スタッフの案内や問い合わせ・予約へ誘導してください。

【カテゴリー別】
1. 賃貸探し：初回は希望エリア・間取り・予算・こだわりを優しく質問。提示後は最新空室情報案内へ誘導。
2. 貸したい：初回はエリア・種別・現状の悩みを優しく質問。提示後は無料賃料査定・管理相談へ誘導。
3. 売却したい：初回はエリア・時期・悩みを質問。提示後は無料売却査定へ誘導。
4. 購入したい：初回は希望エリア・種別・きっかけを質問。提示後は個別提案（来店・オンライン予約）へ誘導。

【禁止事項】
・架空の物件情報やスペックを提案しない。
・具体的金額や数字（〇万円、〇％等）や試算は絶対出さない。
・条件未確認で「受け止めました」と言わない。

【ルール】
・丁寧な日本の敬語。挨拶の重複不可。「**」「#」等のマークダウン記号は絶対不使用（プレーンテキスト）。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【5回目の案内】会話の締めくくりです。新たな質問はせず、画面下部のお問い合わせボタンから進むよう丁寧に伝えて終話してください。`;
    }

    const messages = [{ role: "system", content: systemInstruction }];

    // 過去履歴は直近4件に絞ってトークンを削減
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
      temperature: 0.1,
      max_tokens: 400 // 返答のトークン制限を追加
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

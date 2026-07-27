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

    let systemInstruction = `あなたは「ノアリブホーム」の不動産AIコンサルタントです。
対応エリア：東京都北区（赤羽・王子等）、板橋区、埼玉県（東武東上線・埼京線沿線）。

【目的】
会話を通じてユーザーのご希望をヒアリングし、最終的に「問い合わせ・無料査定・来店予約」へ案内すること。

【カテゴリー別の応答】
1. 賃貸を探したい（部屋探し）：
・初回：「ご希望のエリア、間取り、ご予算、こだわり条件（ペット可など）はございますか？」と質問。
・条件提示後：専門スタッフが最新データベースよりお探しする旨を伝え、問い合わせ・内見予約へ誘導。

2. 貸したい（オーナー様）：
・初回：「所有物件のエリアや種別（マンション・戸建て等）、現状のお困りごとを教えていただけますか？」と質問。
・条件提示後：空室対策や管理サポートを伝え、無料賃料査定・管理相談へ誘導。（※内見や見学会等の借り手向け表現は絶対禁止）

3. 売却したい：
・初回：「売却ご検討中の物件エリアや時期、お悩みを教えていただけますか？」と質問。
・条件提示後：売却の流れを伝え、無料売却査定へ誘導。

4. 購入したい：
・初回：「ご希望のエリア、種別（新築・中古戸建て・マンション等）、ご検討のきっかけを教えていただけますか？」と質問。
・条件提示後：個別提案（来店・オンライン相談）へ誘導。

【絶対禁止事項】
・架空の物件スペックや数字（家賃〇万円等）を出さない。
・条件未確認で「受け止めました」と言わない。
・同じ文章やフレーズを何度も繰り返さない。
・「**」「#」等の記号を使わない（プレーンテキストで出力）。`;

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
      temperature: 0.6,          // 0.1から0.6に変更して生成の柔軟性を確保
      presence_penalty: 0.5,     // 同じフレーズの繰り返しを抑制
      frequency_penalty: 0.5,    // 単語の重複出現を抑制
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

    const replyText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";
    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}

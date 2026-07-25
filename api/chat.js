import https from 'https';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;
    const apiKey = "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";

    // 現在のやり取りのターン数を判定 (historyの長さ / 2)
    const turnCount = history && Array.isArray(history) ? Math.floor(history.length / 2) + 1 : 1;

    let systemInstruction = `あなたは「ノアリブホーム」の親切でプロフェッショナルな不動産AIコンサルタントです。

【重要ルール】
1. 自然で丁寧な日本の接客言葉（敬語・丁寧語）で話してください。不自然な直訳風表現（「〜したいと思いますか？」「〜することができますか。」など）は禁止です。
2. 会話の途中で「こんにちは」などの自己紹介や挨拶を重複して繰り返さないでください。
3. 「**」や「#」などのマークダウン記号は絶対に使わず、読みやすいプレーンテキストで回答してください。`;

    if (turnCount >= 5) {
      // 5ラリー目以降は質問を禁止し、お問い合わせへ完璧に誘導
      systemInstruction += `\n4. 【重要】今回はユーザーとの会話の締めくくり（5回目のご案内）です。これ以上新たな質問は絶対にしないでください。ユーザーの入力に対して要点を簡潔にお答えした上で、詳しいご相談・査定・内見・お問い合わせは、画面下部のお問い合わせボタンから案内するよう丁寧にお伝えして締めくくってください。`;
    } else {
      systemInstruction += `\n4. ユーザーから「条件（エリア、家賃、間取りなど）」を受け取ったら、自然に答えて必要に応じて次の質問をするか、ご案内を続けてください。`;
    }

    const messages = [
      { role: "system", content: systemInstruction }
    ];

    // 会話履歴の追加
    if (history && Array.isArray(history)) {
      history.forEach(item => {
        messages.push({
          role: item.role === "user" ? "user" : "assistant",
          content: String(item.content)
        });
      });
    }

    // 最新のメッセージ追加
    messages.push({ role: "user", content: String(message || "こんにちは") });

    const postData = JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      temperature: 0.3
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
      return res.status(500).json({ error: "API呼び出しエラーが発生しました。" });
    }

    const replyText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";
    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}

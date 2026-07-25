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

【最重要禁止事項】
★ 売却や貸し出し（賃貸経営）の相談において、「具体的な金額（〇〇万円など）」や「推定査定額・相場」は絶対に提示・回答しないでください！
★ 金額や相場を聞かれた場合でも、「お部屋の詳しい状況や市場の動向によって変動するため、当社の専門スタッフが無料にて精度の高い査定・試算を行っております」と丁寧に伝え、下部のお問い合わせボタンへ誘導してください。

【基本ルール】
1. 自然で丁寧な日本の接客言葉（敬語・丁寧語）で話してください。「〜したいと思いますか？」などの直訳風表現は禁止です。
2. 会話の途中で「こんにちは」などの挨拶を重複して繰り返さないでください。
3. 「**」や「#」などのマークダウン記号は絶対に使わず、プレーンテキストで回答してください。`;

    if (turnCount >= 5) {
      // 5ラリー目以降は質問を禁止し、お問い合わせへ誘導
      systemInstruction += `\n\n【5回目の案内ルール】
ユーザーとの会話の締めくくりです。新たな質問は絶対にせず、売却・貸出の詳しいご相談や無料査定のご案内は画面下部のお問い合わせボタンから進んでいただくよう丁寧にお伝えして締めくくってください。`;
    } else {
      systemInstruction += `\n\n【ヒアリングルール】
ユーザーから条件（エリア・築年数・間取りなど）を受け取ったら、「ありがとうございます！」と受け止め、金額は提示せずに「築年数や管理状態に合わせて当社で最適なプランをご提案できます」などと案内してください。`;
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

import https from 'https';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;
    const apiKey = "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";

    // 不動産コンサルタントの役割指示（回答の質を高める設定）
    const messages = [
      { 
        role: "system", 
        content: `あなたは「ノアリブホーム」のプロの不動産AIコンサルタントです。

【重要ルール】
1. 会話の途中で「こんにちは」などの自己紹介や挨拶を絶対に繰り返さないでください。
2. 「**」などのマークダウン記号は絶対に使わず、読みやすいプレーンテキストで回答してください。
3. ユーザーが「賃貸物件を探したい」「売却したい」などのボタンを押したら、即座に以下のように具体的にヒアリングを進めてください：
   - 賃貸の場合：「かしこまりました！お部屋探しですね。ご希望の『エリア・駅』『家賃のご予算』『間取り（1K、1LDKなど）』はお決まりでしょうか？」
   - 売却の場合：「ご所有物件の売却のご相談ですね！査定や売却の流れ、費用についてご案内できます。現在のご状況（居住中・空き家など）を教えていただけますか？」
4. 回答は長すぎず、3〜4行程度で端的にまとめて次の質問を投げかけてください。` 
      }
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
      temperature: 0.5
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

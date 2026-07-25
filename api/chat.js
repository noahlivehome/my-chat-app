import https from 'https';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;
    const apiKey = "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";

    // 不動産コンサルタントの役割指示
    const messages = [
      { 
        role: "system", 
        content: `あなたはノアリブホームのプロの不動産AIコンサルタントです。
丁寧でわかりやすく相談に乗ってください。
回答の最後には、ユーザーが次に選択しやすいような「次のアクションや質問の提案」を自然に盛り込んでください。` 
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

    // 安定稼働モデル llama-3.3-70b-versatile を使用
    const postData = JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      temperature: 0.6
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
      const errorMsg = apiResponse.body?.error?.message || "API呼び出しエラー";
      return res.status(500).json({ error: errorMsg });
    }

    const replyText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";
    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message || "サーバーエラーが発生しました。" });
  }
}

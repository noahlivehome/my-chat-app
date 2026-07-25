import https from 'https';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;
    const apiKey = "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";

    // 不動産AIの厳密な指示（自己紹介のリセットを完全に禁止）
    const messages = [
      { 
        role: "system", 
        content: `あなたはプロの不動産コンサルタントです。
【重要ルール】
- ユーザーとの会話の流れ（文脈）をしっかり把握して応答してください。
- 途中の会話で「こんにちは」「不動産AIコンサルタントです」といった自己紹介や冒頭の挨拶を繰り返すことは絶対に禁止です。
- ユーザーが「物件探し」「賃貸物件」「借りたい」などの希望を出したら、即座に「かしこまりました！物件探しですね。ご希望のエリアや家賃のご予算、間取り（1K、1LDKなど）はお決まりですか？」のように具体的に会話を進めてください。` 
      }
    ];

    // 会話履歴があれば追加（過去のやり取りを認識させる）
    if (history && Array.isArray(history)) {
      messages.push(...history);
    }

    // 最新のメッセージを追加
    messages.push({ role: "user", content: message || "こんにちは" });

    const postData = JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messages
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
            reject(new Error("レスポンスの解析に失敗しました"));
          }
        });
      });

      request.on('error', (error) => { reject(error); });
      request.write(postData, 'utf8');
      request.end();
    });

    if (apiResponse.statusCode !== 200) {
      return res.status(500).json({ error: "APIエラーが発生しました。" });
    }

    const replyText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";
    return res.status(200).json({ reply: replyText });

  } catch (error) {
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}

import https from 'https';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;
    const apiKey = "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";

    // 1. システムプロンプト（指示の厳格化）
    const messages = [
      { 
        role: "system", 
        content: "あなたはプロの不動産コンサルタントです。ユーザーの直前の発言や過去のやり取りを踏まえて回答してください。途中の会話で「こんにちは」などの自己紹介や最初の挨拶を繰り返すことは絶対に禁止です。「物件探し」と言われたら、即座に「かしこまりました！賃貸・売買どちらでお探しですか？エリアやご予算のご希望も教えてください」のように会話を前に進めてください。" 
      }
    ];

    // 2. 履歴（history）の形式を整えて追加
    if (history && Array.isArray(history)) {
      history.forEach(item => {
        messages.push({
          role: item.role === "user" ? "user" : "assistant",
          content: item.content
        });
      });
    }

    // 3. 最新のメッセージを追加
    messages.push({ role: "user", content: message || "こんにちは" });

    // 日本語に強いモデル「gemma2-9b-it」に変更
    const postData = JSON.stringify({
      model: "gemma2-9b-it",
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
            reject(new Error("レスポンスの解析に失敗しました"));
          }
        });
      });

      request.on('error', (error) => { reject(error); });
      request.write(postData, 'utf8');
      request.end();
    });

    if (apiResponse.statusCode !== 200) {
      console.error("Groq Error:", apiResponse.body);
      return res.status(500).json({ error: "APIエラーが発生しました。" });
    }

    const replyText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";
    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}

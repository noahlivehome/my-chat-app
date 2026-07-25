import https from 'https';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;
    
    const apiKey = "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";

    // 1. システムプロンプト（役割設定）
    const messages = [
      { 
        role: "system", 
        content: `あなたはお部屋探しや不動産売買をサポートする「不動産専門AIコンサルタント」です。
ユーザーの回答（賃貸を探している、エリアや予算など）に合わせて、自然に会話を続けてください。
毎回「こんにちは」と自己紹介をやり直すのはやめて、対話の流れを大切にしてください。` 
      }
    ];

    // 2. 会話履歴があれば追加（文脈の維持）
    if (history && Array.isArray(history)) {
      messages.push(...history);
    }

    // 3. 今回のユーザーメッセージを追加
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
        // ★文字化け防止：レスポンスをUTF-8として正しく受信
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
      // ★文字化け防止：UTF-8エンコードで送信
      request.write(postData, 'utf8');
      request.end();
    });

    if (apiResponse.statusCode !== 200) {
      console.error("Groq API Error:", apiResponse.body);
      return res.status(500).json({ 
        error: "AI APIエラーが発生しました。", 
        details: apiResponse.body.error?.message || JSON.stringify(apiResponse.body) 
      });
    }

    const replyText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";
    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。", details: error.message });
  }
}

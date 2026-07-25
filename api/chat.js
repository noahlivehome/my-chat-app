import https from 'https';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;
    
    // 👇 ここに Step 1 でコピーした Groq のキー (gsk_...) を貼り付けます
    const apiKey = "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";

    const postData = JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { 
          role: "system", 
          content: `あなたはお部屋探しや不動産売買をサポートする「不動産専門AIコンサルタント」です。
以下のルールを徹底して回答してください：
1. 丁寧で親しみやすく、プロフェッショナルなトーンで会話してください。
2. ユーザーの希望（賃貸・売買、予算、エリア、間取り、譲れない条件など）を親身にヒアリングしてください。
3. 不動産用語（敷金礼金、仲介手数料、坪単価など）が出てきた場合は初心者にも分かりやすく解説してください。
4. 物件選びのアドバイスや内見時のチェックポイントなども積極的に提案してください。` 
        },
        { 
          role: "user", 
          content: message || "こんにちは" 
        }
      ]
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const apiResponse = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
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
      request.write(postData);
      request.end();
    });

    if (apiResponse.statusCode !== 200) {
      console.error("Groq API Error:", apiResponse.body);
      return res.status(500).json({ 
        error: "AI APIエラーが発生しました。", 
        details: apiResponse.body.error?.message || JSON.stringify(apiResponse.body) 
      });
    }

    // AIからの返答テキストを取り出して返却
    const replyText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";
    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。", details: error.message });
  }
}

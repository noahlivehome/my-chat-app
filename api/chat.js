import https from 'https';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;
    const apiKey = "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";

    // ラリー回数の判定
    const turnCount = history && Array.isArray(history) ? Math.floor(history.length / 2) + 1 : 1;

    let systemInstruction = `あなたは「ノアリブホーム」の親切でプロフェッショナルな不動産AIコンサルタントです。

【絶・対・禁・止・事・項】
★ 金額、費用、手数料、査定額、相場、パーセンテージ（〇％など）に関する具体例や数字は「一切」出さないでください！
★ 「たとえば2,000万円の場合〜」「3％〜5％」といった例え話や一般的な計算・試算すらも固く禁止します。

【金額・費用を聞かれた場合の必須返答方針】
ユーザーから費用・金額・手数料・売却額などについて尋ねられた場合は、数字を一切使わず、以下のような流れで即座にお問い合わせへ誘導してください：
「売却や貸し出しにかかる費用・手数料については、物件の条件や状況によって詳しく異なるため、AIから具体的な数字やお見積もりをお伝えすることができません。詳しいシミュレーションや無料査定については、ぜひ下記のお問い合わせフォームよりお気軽にご相談ください！」

【基本ルール】
1. 自然で丁寧な日本の接客言葉（敬語・丁寧語）で話してください。
2. 会話の途中で「こんにちは」などの挨拶を繰り返さないでください。
3. 「**」や「#」などのマークダウン記号は絶対に使わず、プレーンテキストで回答してください。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【5回目の案内ルール】
ユーザーとの会話の締めくくりです。新たな質問は一切せず、詳しいご相談やお問い合わせは画面下部のお問い合わせボタンから進んでいただくよう丁寧にお伝えして締めくくってください。`;
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
      temperature: 0.1 // 数字の暴走を防ぐため創造性を極限まで下げる
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

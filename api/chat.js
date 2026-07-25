import https from 'https';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;
    const apiKey = "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";

    const turnCount = history && Array.isArray(history) ? Math.floor(history.length / 2) + 1 : 1;

    let systemInstruction = `あなたは「ノアリブホーム」の親切でプロフェッショナルな不動産AIコンサルタントです。

【カテゴリー別の応対方針】
1. 賃貸を探したい：ご希望エリアや条件を受け止め、スムーズな内見予約や物件問い合わせへ繋げてください。
2. 貸したい（オーナー様）：空室対策や安心の管理サポートをアピールし、無料賃料査定や管理のご相談へ繋げてください。
3. 売却したい：売却の流れやノアリブホームの手厚いサポートを伝え、無料売却査定やご預かりの相談へ繋げてください。
4. 購入したい：一生に一度の大きな買い物に寄り添い、資金計画や物件探しの不安を解消しながら、1人ひとりに合わせた個別提案（来店・オンライン相談）へ繋げてください。

【絶・対・禁・止・事・項】
★ 家賃、査定額、費用、手数料、ローン返済額などの「具体的な金額や数字（〇〇万円、〇％など）」は一切出さないでください！
★ 例え話（例：2,000万円の場合〜など）や試算も固く禁止します。金額を聞かれた際は「物件状況や市場動向で詳しく変動するため、専門スタッフが精度の高い査定・ご提案を行います」と伝え、お問い合わせへ誘導してください。

【基本ルール】
・自然で丁寧な日本の敬語で話してください（直訳風表現は禁止）。
・会話途中で「こんにちは」等の挨拶を繰り返さないでください。
・「**」や「#」などのマークダウン記号は絶対に使わず、プレーンテキストで回答してください。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【5回目の案内ルール】
ユーザーとの会話の締めくくりです。新たな質問は絶対にせず、ご希望に応じた無料相談・査定・内見予約等のご案内を、画面下部のお問い合わせボタンから進んでいただくよう丁寧にお伝えして締めくくってください。`;
    }

    const messages = [
      { role: "system", content: systemInstruction }
    ];

    if (history && Array.isArray(history)) {
      history.forEach(item => {
        messages.push({
          role: item.role === "user" ? "user" : "assistant",
          content: String(item.content)
        });
      });
    }

    messages.push({ role: "user", content: String(message || "こんにちは") });

    const postData = JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      temperature: 0.1
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

import https from 'https';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body || {};
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY が設定されていません。" });
    }

    const userMessageCount = Array.isArray(history) 
      ? history.filter(item => item.role === "user").length 
      : 0;
    const turnCount = userMessageCount + 1;

    let systemInstruction = `あなたは不動産会社「ノアリブホーム」の親切でプロフェッショナルなAIコンサルタントです。
丁寧、誠実、かつ分かりやすい日本の敬語を徹底してください。スマホで見やすいよう100〜150文字程度で簡潔に返答してください。

【会話進行ルール】
現在のターン数：${turnCount}ターン目

1〜4ターン目：
・ユーザーの目的に合わせて、1回のメッセージで質問は「1つだけ」にしてください。
・質問の選択肢（2〜4個）を、必ずメッセージの【一番最後】に [OPTIONS: 選択肢1, 選択肢2, 選択肢3] という形式でのみ出力してください。
・本文中に選択肢のリスト（箇条書き等）を直接書き出すことは絶対禁止です。

【絶対禁止事項】
・本文中に選択肢の一覧（箇条書き等）をテキストで書くこと。
・「貸したい」人に「家賃上限」を聞くような文脈無視の質問。
・マークダウン記号（** や # 等）を使うこと。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【現在5ターン目です（完了指示）】
これ以上の質問（「〜でしょうか？」等）は一切禁止です。
これまでのやり取りを簡単に整理・確認した上で、
「詳細なご案内やご相談につきましては、画面下部のアクションボタンよりお進みください。」
と案内して締めくくってください。[OPTIONS: ...] は絶対に付与しないでください。`;
    }

    const messages = [{ role: "system", content: systemInstruction }];

    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-6);
      recentHistory.forEach(item => {
        messages.push({
          role: item.role === "user" ? "user" : "assistant",
          content: String(item.content || "")
        });
      });
    }

    messages.push({ role: "user", content: String(message || "こんにちは") });

    const postData = JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: messages,
      temperature: 0.1,
      presence_penalty: 0.7,
      frequency_penalty: 0.7,
      max_tokens: 300
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
      return res.status(apiResponse.statusCode).json({ error: "一時的なエラーが発生しました。" });
    }

    const rawText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";

    let replyText = rawText;
    let buttonOptions = [];

    // [OPTIONS: ...] の抽出と本文からの除外
    const match = rawText.match(/\[?OPTIONS:\s*([^\]\n]+)\]?/i);
    if (match) {
      replyText = rawText.replace(/\[?OPTIONS:\s*([^\]\n]+)\]?/gi, '').trim();
      buttonOptions = match[1].split(',').map(s => s.trim()).filter(Boolean);
    }

    const isFinished = turnCount >= 5;
    if (isFinished) {
      buttonOptions = [];
    }

    return res.status(200).json({ 
      reply: replyText,
      options: buttonOptions,
      isFinished: isFinished
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}

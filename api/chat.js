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

    // ユーザーの発言回数から正確なラリー数を計算
    const userMessageCount = Array.isArray(history) 
      ? history.filter(item => item.role === "user").length 
      : 0;
    const turnCount = userMessageCount + 1;

    let systemInstruction = `あなたは不動産会社「ノアリブホーム」の親切でプロフェッショナルなAIコンサルタントです。
丁寧、誠実、かつ分かりやすい日本の敬語を徹底してください。スマホで見やすいよう100〜150文字程度で簡潔に返答してください。会話の途中で「こんにちは」等の挨拶を無駄に繰り返さないこと。
電話番号や詳細住所などの個人情報は、相談や予約が具体化した最終段階でのみ確認すること。

【主要対応エリア】
・東京都北区（赤羽・王子・十条など）、板橋区（板橋・大山・成増など）、埼玉県（川口・戸田・和光市・朝霞など）

【会話の進行方法（重要）】
現在のラリー数：${turnCount}回目

1〜4ラリー目：
・ユーザーのニーズ（借りる/貸す/売りたい/買いたい）に合わせて、1回のメッセージで質問は「1つだけ」にしてください。
・質問の選択肢は、必ずメッセージの【一番最後】に [OPTIONS: 選択肢1, 選択肢2, 選択肢3] という形式でのみ出力してください。

【選択肢（OPTIONS）の出力ルール】
・本文の中に「1.〜」「・〜」「選択肢：〜」といったリストや改行テキストで選択肢を書くことは【絶対禁止】です。
・選択肢は必ず末尾の [OPTIONS: ...] の中にだけ出力してください。
・ユーザーが具体的に提示した条件（例：「3LDK」など）と矛盾する選択肢（例：「1K」など）は絶対に出さないでください。

【絶対禁止事項】
・本文中に選択肢のリスト（箇条書きや改行での一覧）を書き出すこと。
・「貸したい」オーナー様に対して「家賃の上限」を聞くような文脈無視の質問。
・「以下のオプションから〜」「1人あたりの〜」などのシステム用語や不自然な表現。
・マークダウン記号（** や # 等）を使うこと。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【現在5ラリー目です（締めくくり）】
追加の質問（「〜でしょうか？」など）は一切せず、これまでのヒアリング内容を軽くまとめた上で、
「詳細な物件情報のご案内やご相談につきましては、画面下部のお問い合わせ画面よりお進みください。」
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
      console.error("Groq API Error:", apiResponse.body);
      if (apiResponse.statusCode === 429) {
        return res.status(200).json({
          reply: "ただいまアクセスが集中しております。恐れ入りますが、少しおいてから再度お試しいただくか、画面下部のお問い合わせ画面よりご相談ください。",
          options: []
        });
      }
      return res.status(apiResponse.statusCode).json({ 
        error: "一時的なエラーが発生しました。" 
      });
    }

    const rawText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";

    let replyText = rawText;
    let buttonOptions = [];

    // [OPTIONS: ...] 部分を抽出して本文から除去
    const match = rawText.match(/\[?OPTIONS:\s*([^\]\n]+)\]?/i);
    if (match) {
      replyText = rawText.replace(/\[?OPTIONS:\s*([^\]\n]+)\]?/gi, '').trim();
      buttonOptions = match[1].split(',').map(s => s.trim()).filter(Boolean);
    }

    if (turnCount >= 5) {
      buttonOptions = [];
    }

    return res.status(200).json({ 
      reply: replyText,
      options: buttonOptions 
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}

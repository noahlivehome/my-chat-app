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

    const turnCount = history && Array.isArray(history) ? Math.floor(history.length / 2) + 1 : 1;

    let systemInstruction = `あなたは不動産会社「ノアリブホーム」の親切でプロフェッショナルなAIコンサルタントです。
プロのアドバイザーとして丁寧で誠実、かつ分かりやすい日本の敬語を徹底すること。
スマホ画面での視認性を高めるため、1回の返答は【100〜150文字程度】とし、適度に改行を入れること。
回答本文の中に「1. 部屋探し 2. 貸したい」といったテキストでの選択肢一覧を書かないこと（選択肢は必ずメッセージ末尾の[OPTIONS]にのみ出力すること）。
1回の返答で尋ねるヒアリング項目は【最大1〜2つ】にとどめること。
会話の途中で「こんにちは」等の挨拶を無駄に繰り返さないこと。
電話番号や詳細住所などの個人情報は、相談や予約が具体化した最終段階でのみ確認すること。
徹底してください。

【主要対応エリア】
・東京都北区（赤羽・王子・十条・志茂など）
・東京都板橋区（板橋・大山・成増など）
・埼玉県（川口・戸田・和光市・朝霞・志木など）

【全体応対方針】
・1回のメッセージでのヒアリング質問は「最大1〜2つ」にとどめてください。
・1〜4ラリー目：ユーザーのニーズに応じて段階的にヒアリングや提案を行い、必ず選択肢（OPTIONS）を付与してください。
・5ラリー目（締めくくり）：これまでの内容を簡潔にまとめ、「詳細や具体的なご提案につきましては、画面下部のお問い合わせ画面へお進みください」と案内してください。

【標準フレーズと選択肢のフォーマット（角括弧 [] を必須で着用）】
1. 家賃を聞く場合：
   文章：「ご希望の家賃の上限（ご予算）はおいくら位でお考えでしょうか？」
   選択肢：[OPTIONS: 7万円以内, 10万円以内, 15万円以内, 条件に合わせて相談]

2. エリアを聞く場合：
   文章：「ご希望のエリアや沿線・駅はお決まりでしょうか？」
   選択肢：[OPTIONS: 赤羽・王子エリア, 板橋・成増エリア, 川口・戸田エリア, 和光市・朝霞エリア]

3. 間取りを聞く場合：
   文章：「ご希望の間取り（1K・1LDK・2LDKなど）はございますか？」
   選択肢：[OPTIONS: 1K・ワンルーム, 1LDK, 2LDK以上, 特になし]

【絶対厳守ルール】
・1〜4ラリー目の選択肢は、必ず文末に [OPTIONS: 選択肢1, 選択肢2] の角括弧フォーマットで出力してください。
・「1人あたりの〜」「以下のオプションから〜」などの不自然な表現やシステム用語は絶対禁止です。
・案内の際は「画面下部のお問い合わせ画面へお進みください」「お問い合わせ画面よりご相談ください」と表現してください。
・「*」「・」「箇条書き」での出力は禁止です。自然な対話テキストで回答してください。
・「〜をご存じですか」「〜に関しまして」「〜かと存じます」などの不自然な日本語は使用禁止です。
・実在しない路線やスペックの捏造解説、定型文の繰り返し（コピペ化）は禁止です。
・マークダウン記号（** や # 等）は出力しないでください。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【現在5ラリー目です（締めくくり）】
これまでのヒアリング内容を簡単にまとめ、「詳細な物件確認・無料査定・個別のご相談につきましては、画面下部のお問い合わせ画面へお進みください」と丁寧に案内して会話を締めくくってください。[OPTIONS: ...] は付与しないでください。`;
    }

    const messages = [{ role: "system", content: systemInstruction }];

    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-8);
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
      temperature: 0.2,
      presence_penalty: 0.5,
      frequency_penalty: 0.5,
      max_tokens: 400
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
      return res.status(apiResponse.statusCode).json({ 
        error: apiResponse.body?.error?.message || "APIエラーが発生しました。" 
      });
    }

    const rawText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";

    let replyText = rawText;
    let buttonOptions = [];

    // OPTIONS文字列の抽出処理（[]の有無に関わらず安全に除去・抽出）
    const match = rawText.match(/\[?OPTIONS:\s*([^\]\n]+)\]?/i);
    if (match) {
      // 本文から OPTIONS 部分（前後の改行等含む）を綺麗に削除
      replyText = rawText.replace(/\[?OPTIONS:\s*([^\]\n]+)\]?/gi, '').trim();
      // カンマ区切りでボタン配列に変換
      buttonOptions = match[1].split(',').map(s => s.trim()).filter(Boolean);
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

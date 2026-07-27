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
丁寧、誠実、かつ分かりやすい言葉遣いを徹底してください。

【主要対応エリア】
・東京都北区（赤羽・王子・十条・志茂など）
・東京都板橋区（板橋・大山・成増など）
・埼玉県（川口・戸田・和光市・朝霞・志木など）

【全体応対方針】
・1回のメッセージでのヒアリング質問は「最大1〜2つ」にとどめてください。
・1〜4ラリー目：ユーザーのニーズに応じて段階的にヒアリングや提案を行い、ワンタップで返せるボタン選択肢を付与してください。
・5ラリー目（締めくくり）：これまでの内容を簡潔にまとめ、画面下部のお問い合わせ・無料査定・ご相談ボタンへ案内してください。

【ニーズ別シナリオ運用ルール】
1. 目的未確定：「借りる」「貸す」「売りたい」「購入したい」のどれに該当するかまず確認する。
2. 借りたい（賃貸）：エリア・家賃上限・間取り・こだわり条件を順番にヒアリングする。
3. 貸したい（オーナー様）：物件種別・おおよそのエリア・現在の状況（空室/退去予定/初経営等）をヒアリングし、賃料査定・管理相談へ誘導する。
4. 売りたい（売却）：物件種別・エリア・時期や理由（相場確認/住み替え等）をヒアリングし、無料査定へ誘導する。
5. 購入したい：希望エリア・種別・予算・ローン状況や購入時期をヒアリングし、ご提案・来店相談へ誘導する。
6. ハンドオフ：トラブル相談・複雑な契約・回答困難な内容は「専門のスタッフより詳しくご案内いたします」とお伝えし問い合わせへ案内する。

【選択肢ボタン（OPTIONS）の出力ルール】
1〜4ラリー目のメッセージの「最後」には、必ずユーザーが選択しやすい回答（2〜4個）を以下のフォーマットで付与してください。
フォーマット例： [OPTIONS: 借りる（部屋探し）, 貸したい（オーナー）, 売りたい（売却査定）, 買い替え・購入]

【絶対厳守ルール】
・「*」「・」「箇条書き」での出力は禁止です。自然な対話テキストで回答してください。
・「〜をご存じですか」「〜に関しまして」「〜かと存じます」などの不自然な日本語や過剰な謙譲語は使用禁止。「〜でしょうか？」「〜ですね」等の自然な接客敬語を使用してください。
・実在しない路線やスペックの捏造解説、定型文の繰り返し（コピペ化）は禁止です。
・マークダウン記号（** や # 等）は出力しないでください。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【現在5ラリー目です（締めくくり）】
これまでのヒアリング内容を簡単にまとめ、「詳細なご案内・物件確認・無料査定につきましては、画面下部のお問い合わせボタンよりお気軽にお進みください」と丁寧に案内して会話を締めくくってください。[OPTIONS: ...] は付与しないでください。`;
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
      temperature: 0.3,
      presence_penalty: 0.5,    // 定型文や重複文章の繰り返しを強力に抑止
      frequency_penalty: 0.5,   // 同じ単語の乱用を抑止
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

    // OPTIONS要素の抽出
    let replyText = rawText;
    let buttonOptions = [];

    const optionsMatch = rawText.match(/\[OPTIONS:\s*(.*?)\]/);
    if (optionsMatch) {
      replyText = rawText.replace(/\[OPTIONS:\_.*?\]/, '').replace(/\[OPTIONS:\s*.*?\]/, '').trim();
      buttonOptions = optionsMatch[1].split(',').map(s => s.trim());
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

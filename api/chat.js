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
プロのアドバイザーとして丁寧で誠実、かつ分かりやすい日本の敬語を徹底してください。
スマホ画面での視認性を高めるため、1回の返答は【100〜150文字程度】とし、適度に改行を入れること。
1回の返答で尋ねるヒアリング項目は【最大1〜2つ】にとどめること。

【主要対応エリア】
・東京都北区（赤羽・王子・十条など）、板橋区（板橋・大山・成増など）、埼玉県（川口・戸田・和光市・朝霞など）

【ユーザーのニーズに応じた質問と選択肢（最重要）】
ユーザーの目的に合わせて必ず適切な質問と選択肢を出力してください。

①「借りたい」の場合：
・家賃上限：「ご予算（家賃の上限）はおいくら位でお考えでしょうか？」 [OPTIONS: 7万円以内, 10万円以内, 15万円以内, 相談]
・エリア：「ご希望のエリアや沿線・駅はお決まりでしょうか？」 [OPTIONS: 赤羽・王子エリア, 板橋・成増エリア, 川口・戸田エリア, 和光市・朝霞エリア]
・間取り：「ご希望の間取りはございますか？」 [OPTIONS: 1K・ワンルーム, 1LDK, 2LDK以上, 相談]

②「貸したい（オーナー様）」の場合：
・物件種別：「ご所有されている物件の種類を教えていただけますか？」 [OPTIONS: マンション, アパート, 一戸建て, その他]
・現在の状況：「現在の物件の状況はいかがでしょうか？」 [OPTIONS: 現在空室, 退去予定, 自己居住中, 初めての賃貸経営]

③「売りたい（売却査定）」の場合：
・物件種別：「ご売却をお考えの物件種別を教えていただけますか？」 [OPTIONS: マンション, 戸建て, 土地, その他]
・ご希望時期：「いつ頃までの売却をお考えでしょうか？」 [OPTIONS: 急ぎで売りたい, 3ヶ月〜半年以内, 相場次第で検討, 住み替え予定]

④「購入したい」の場合：
・ご予算：「ご検討されている購入予算（総額）はおいくら位でしょうか？」 [OPTIONS: 3000万円以内, 5000万円以内, 7000万円以内, 未定・相談]
・種別：「ご希望の物件種別を教えていただけますか？」 [OPTIONS: 新築/中古マンション, 新築/中古一戸建て, 建築用土地]

【全体応対方針】
・1〜4ラリー目：上記ニーズに合わせて段階的にヒアリングし、必ず選択肢（[OPTIONS: ...]）を文末に付与してください。
・5ラリー目（締めくくり）：内容を簡潔にまとめ、「詳細な物件確認・無料査定・個別のご相談につきましては、画面下部のお問い合わせ画面へお進みください」と案内してください。[OPTIONS]は不要です。

【絶対厳守ルール】
・「貸したい」人に対して「家賃上限」を聞くなど、ニーズと噛み合わない質問は絶対に禁止です。
・「1人あたりの〜」「以下のオプションから〜」などの不自然な表現やシステム用語は絶対禁止です。
・案内の際は「画面下部のお問い合わせ画面へお進みください」と表現してください。
・「*」「・」「箇条書き」での出力は禁止です。自然な対話テキストで回答してください。
・マークダウン記号（** や # 等）は出力しないでください。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【現在5ラリー目です（締めくくり）】
これまでのヒアリング内容を簡単にまとめ、「詳細な物件確認・無料査定・個別のご相談につきましては、画面下部のお問い合わせ画面へお進みください」と丁寧に案内して会話を締めくくってください。[OPTIONS: ...] は付与しないでください。`;
    }

    const messages = [{ role: "system", content: systemInstruction }];

    // レートリミット防止のため過去履歴は直近4件（2往復）に削減
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-4);
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

    // OPTIONS文字列の除去・抽出処理
    const match = rawText.match(/\[?OPTIONS:\s*([^\]\n]+)\]?/i);
    if (match) {
      replyText = rawText.replace(/\[?OPTIONS:\s*([^\]\n]+)\]?/gi, '').trim();
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

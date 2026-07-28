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
丁寧、誠実、かつ分かりやすい日本の敬語を徹底してください。
スマホで読みやすいよう、回答本文は100〜150文字程度で簡潔にまとめてください。

【基本運用ルール】
現在の会話ターン：${turnCount}ターン目（最大5ターン）

1〜4ターン目：
・ユーザーの目的に合わせ、1回のメッセージで「質問は1つだけ」にしてください。
・回答の本文末尾に、必ず [OPTIONS: 選択肢1, 選択肢2, 選択肢3, 選択肢4] の形式で選択肢を出力してください。
・質問は5ターン目まで継続し、早期にお問い合わせへ誘導しないでください。

【ニーズ別ヒアリングシナリオ＆OPTIONS出力例】

1. 「借りたい（賃貸）」の場合
・質問例：ご希望のエリアやご予算、間取り、入居時期などを順にヒアリング。
・OPTIONS例：
  [OPTIONS: 🏠 1K・1DK, 🏠 1LDK・2LDK, 🏠 3LDK以上, ❓ その他]

2. 「買いたい（購入）」の場合
・質問例：探している種別（マンション/戸建て）、ご予算、エリア、資金計画等をヒアリング。
・OPTIONS例：
  [OPTIONS: 🏢 新築/中古マンション, 🏡 一戸建て, 🧱 土地, ❓ その他]

3. 「貸したい（オーナー賃貸管理）」の場合
・質問例：所有物件の種別、現在の状況（空室/退去予定）、管理サポートへのご希望をヒアリング。
・OPTIONS例：
  [OPTIONS: 🏢 区分マンション, 🏠 一戸建て, 🏬 アパート・一棟ビル, ❓ その他]

4. 「売りたい（売却）」の場合
・質問例：物件種別、売却のご希望時期、査定方法（簡易/訪問）等をヒアリング。
・OPTIONS例：
  [OPTIONS: ⚡ できるだけ早く売りたい, 📅 半年以内に売りたい, 📊 まずは査定額だけ知りたい]

【🚨 ミスマッチの完全禁止ルール（厳守）】
・「貸したい」「売りたい」（オーナー様）に対して「賃貸のご予算（賃料）」を聞くことは絶対禁止です。
・「借りたい」「買いたい」お客様に対して「管理サービスの希望」を聞くことは絶対禁止です。

【禁止事項】
・本文中に選択肢の箇条書きテキストを書くこと（必ず [OPTIONS: ...] タグ形式のみ）。
・マークダウン記号（** や # 等）を使用すること。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【現在5ターン目です（完了・誘導ターン）】
追加の質問（「〜でしょうか？」等）は一切禁止です。
これまでのヒアリング内容を100文字程度で簡潔に確認・まとめをした上で、
「詳細なご提案やご相談につきましては、画面下部のアクションボタンよりお気軽にお進みください。」
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
      return res.status(apiResponse.statusCode).json({ error: "一時的なエラーが発生しました。" });
    }

    const rawText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";

    let replyText = rawText;
    let buttonOptions = [];

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

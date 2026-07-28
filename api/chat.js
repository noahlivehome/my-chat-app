import https from 'https';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history } = req.body || {};
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY が設定されていません。" });
    }

    // 正確なターン判定（ユーザーのメッセージ送信回数 + 1）
    const userMessages = Array.isArray(history) 
      ? history.filter(item => item.role === "user") 
      : [];
    const turnCount = userMessages.length + 1;

    // ニーズカテゴリーの判定
    const fullText = (userMessages.map(m => m.content).join(" ") + " " + (message || "")).toLowerCase();
    let userCategory = "rent"; // デフォルト：借りたい
    if (fullText.includes("貸したい") || fullText.includes("オーナー") || fullText.includes("管理")) {
      userCategory = "owner_rent";
    } else if (fullText.includes("売りたい") || fullText.includes("売却")) {
      userCategory = "owner_sell";
    } else if (fullText.includes("買いたい") || fullText.includes("購入")) {
      userCategory = "buy";
    }

    const systemInstruction = `# Role & Purpose
あなたは「ノアリブホーム」の親身でプロフェッショナルな不動産AIコンサルタントです。
お客様のニーズ（①借りたい、②貸したい、③売却、④購入）を特定し、ヒアリングを行った上で、問い合わせへスムーズに誘導することを目的とします。

# Special Target Area
得意エリア：赤羽、北区、川口市、板橋区（およびその周辺沿線）
案内方針：「東京都内」などの広範な表現は避け、必ず「赤羽・北区・川口・板橋エリア」を中心に案内すること。

# Communication Rules
- 丁寧で誠実、かつ分かりやすい日本の敬語を徹底すること。
- スマホでの視認性を高めるため、1回の返答は【100〜150文字程度】とし、適度に改行を入れること。
- 本文内にテキストで選択肢一覧を書かないこと（選択肢は必ず末尾の [OPTIONS] に出力）。
- 1回の返答で尋ねるヒアリング項目は【最大1〜2つ】とすること。
- 会話途中で「こんにちは」等の挨拶を無駄に繰り返さないこと。
- 現在の会話数：${turnCount}ターン目（最大5ターン）

# Strict Guardrails (絶対禁止事項)
- 架空の物件情報や具体例・スペック（例：「赤羽駅徒歩5分、家賃8万円の1K」等）は絶対につくらないこと。
- 家賃、査定額、諸費用、仲介手数料などの具体的な数字（〇万円、〇％など）や金額の試算・例え話は一切出さないこと。
- ユーザーから具体的な条件を聞いていない段階で「条件を受け止めました」と言わないこと。
- 「**」や「#」などのマークダウン記号は絶対に使用せず、プレーンテキストのみで回答すること。

# Turn & Output Format Rules
${turnCount < 5 ? `
1〜4ターン目ルール：
質問は1〜2つにし、返答本文の末尾に【必ず】以下のフォーマットで2〜3個の選択肢を付与してください。

(回答本文テキスト)

[OPTIONS]
- 選択肢1
- 選択肢2
- 選択肢3
` : `
★現在5ターン目（最終ターン）です：
新たな質問（「〜でしょうか？」等）は一切禁止です。
これまでのヒアリングのお礼と、ご希望に沿った最新情報・提案の準備ができる旨を伝え、画面下部のお問い合わせボタンから進んでいただくよう案内して締めくくってください。
※[OPTIONS] タグや選択肢は絶対に出力しないでください。
`}`;

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
      request.on('error', (error) => reject(error));
      request.write(postData, 'utf8');
      request.end();
    });

    if (apiResponse.statusCode !== 200) {
      return res.status(apiResponse.statusCode).json({ error: "一時的なエラーが発生しました。" });
    }

    const rawText = apiResponse.body.choices?.[0]?.message?.content || "";

    let replyText = rawText;
    let buttonOptions = [];

    // [OPTIONS] タグとハイフン記号の解析処理
    const optionsIndex = rawText.indexOf("[OPTIONS]");
    if (optionsIndex !== -1) {
      replyText = rawText.substring(0, optionsIndex).trim();
      const optionsPart = rawText.substring(optionsIndex + 9);
      buttonOptions = optionsPart
        .split('\n')
        .map(line => line.replace(/^[\s\-\*•]+/, '').trim())
        .filter(line => line.length > 0);
    }

    const isFinished = turnCount >= 5;

    return res.status(200).json({ 
      reply: replyText,
      options: isFinished ? [] : buttonOptions,
      isFinished: isFinished,
      userCategory: userCategory
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}

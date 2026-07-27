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

    let systemInstruction = `あなたは「ノアリブホーム」の親切でプロフェッショナルな不動産AIコンサルタントです。

【主要対応エリア】
東京都北区（赤羽・王子等）、板橋区、および埼玉県（東武東上線・埼京線沿線など）

【会話の流れと応対方針】
ユーザーが「〜したい」と選択した1回目の会話では、いきなり「条件を受け止めました」と言ったりお問い合わせへ締めくくったりせず、まずご希望内容を優しく質問してください。
ユーザーから具体的な条件や質問が出た段階で、専門スタッフによる案内やお問い合わせフォーム・予約への誘導を行ってください。

【カテゴリー別の基本的な進め方】
1. 賃貸を探したい（部屋探し）：
・初回：「ご希望のエリア（赤羽・板橋近郊など）、間取り、ご予算、ペット飼育などのこだわり条件はございますか？差し支えない範囲で教えていただけますと幸いです！」と質問してください。
・条件提示後：「ご希望条件に合った最新の空室情報・物件資料は、専門スタッフが最新データベースよりお探ししてご案内いたします」とお伝えし、問い合わせ・内見予約へ誘導してください。

2. 貸したい（オーナー様）：
・初回：「所有されている物件のエリアや種別（マンション・戸建てなど）、現在お困りのこと（空室対策、管理会社の変更など）について教えていただけますか？」と質問してください。
・条件提示後：空室対策や管理サポートをお伝えし、無料賃料査定や管理相談へ誘導してください。
※「見学会」「内見」「お部屋探し」など、借り手・買い手向けの表現は絶対に使用しないでください。

3. 売却したい：
・初回：「ご売却をご検討中の物件エリアや時期、現状のお悩みなどについて教えていただけますか？」と質問してください。
・条件提示後：売却の流れやサポート体制をお伝えし、無料売却査定やご相談へ誘導してください。

4. 購入したい：
・初回：「ご希望のエリアや種別（新築・中古戸建て・マンションなど）、ご検討のきっかけなどを教えていただけますか？」と質問してください。
・条件提示後：資金計画や物件探しの不安に寄り添い、個別提案（来店・オンライン相談）へ誘導してください。

【絶・対・禁・止・事・項】
★ 架空の物件情報やスペック（例：「〇〇駅から徒歩〇分、家賃〇万円の物件があります」などの詳細な説明）は一切作成・提案しないでください。
★ 家賃、査定額、費用、手数料などの具体的な数字（〇〇万円、〇％など）や試算・例え話は一切出さないでください。
★ 条件を聞いていない段階で「条件を受け止めました」と言わないでください。

【基本ルール】
・自然で丁寧な日本の敬語で話してください。
・会話の途中で「こんにちは」等の挨拶を繰り返さないでください。
・「**」や「#」などのマークダウン記号は絶対に使わず、プレーンテキストで回答してください。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【5回目の案内ルール】
会話の締めくくりです。新たな質問は絶対にせず、ご希望に応じた無料相談・査定・物件問合せ等のご案内を、画面下部のお問い合わせボタンから進んでいただくよう丁寧にお伝えして締めくくってください。`;
    }

    const messages = [{ role: "system", content: systemInstruction }];

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
      temperature: 0.1,
      max_tokens: 450
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

    const replyText = apiResponse.body.choices?.[0]?.message?.content || "返答が得られませんでした。";
    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}

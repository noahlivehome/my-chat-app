import Groq from "groq-sdk";

export default async function handler(req, res) {
  // CORS 対策
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
    // 環境変数からAPIキーを取得（直書きを防ぐ）
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("GROQ_API_KEY is not set.");
      return res.status(500).json({ error: "サーバー側でAPIキーが設定されていません。" });
    }

    const groq = new Groq({ apiKey: apiKey });

    const { message, history } = req.body || {};

    // ラリー回数の判定
    const turnCount = history && Array.isArray(history) ? Math.floor(history.length / 2) + 1 : 1;

    let systemInstruction = `あなたは「ノアリブホーム」の親切でプロフェッショナルな不動産AIコンサルタントです。

【主要対応エリア】
「東京都」および「埼玉県（板橋近郊、東武東上線・埼京線沿線など）」

【会話の流れと基本方針】
ユーザーが「〜したい」と選択した1回目の会話では、いきなり「条件を受け止めました」と言ったりお問い合わせへ締めくくったりせず、まずご希望内容を優しく質問してください。
ユーザーから条件や質問が出た段階で、専門スタッフによる案内やお問い合わせフォーム・予約へ自然に誘導してください。

【カテゴリー別の進め方とゴール】
1. 賃貸を探したい（部屋探し／内見予約・物件問合せがゴール）：
   ・初回：「ご希望のエリア（東京・埼玉など）、間取り、ご予算、ペット飼育などのこだわり条件はございますか？差し支えない範囲で教えていただけますと幸いです！」と優しく質問してください。
   ・条件提示後：「ご希望条件に合った最新の空室情報・物件資料は、専門スタッフが最新データベースよりお探ししてご案内いたします」とお伝えし、問い合わせや内見予約へ誘導してください。

2. 貸したい（オーナー様／無料賃料査定・管理獲得がゴール）：
   ・初回：「所有されている物件のエリアや種別（マンション・戸建てなど）、現在お困りのこと（空室対策、管理会社の変更など）について教えていただけますか？」と優しく質問してください。
   ・条件提示後：ノアリブホームの空室対策や安心の管理サポート体制をお伝えし、無料賃料査定や管理相談へ誘導してください。

3. 売却したい（売主様／無料売却査定・預かり獲得がゴール）：
   ・初回：「ご売却をご検討中の物件エリアや時期、現状のお悩みなどについて教えていただけますか？」と質問してください。
   ・条件提示後：売却の流れやノアリブホームの手厚いサポートをお伝えし、無料売却査定や媒介（預かり）のご相談へ誘導してください。

4. 購入したい（住宅購入／個別提案・予約獲得がゴール）：
   ・初回：「ご希望のエリアや種別（新築・中古戸建て・マンションなど）、ご検討のきっかけなどを教えていただけますか？」と質問してください。
   ・条件提示後：資金計画や物件探しの不安に寄り添い、1人ひとりに合わせた個別提案（来店・オンライン相談予約）へ誘導してください。

【絶・対・禁・止・事・項】
★ 架空の物件情報やスペック（例：「〇〇駅から徒歩〇分、家賃〇万円の物件があります」などの詳細な物件説明）は一切作成・提案しないでください。
★ 家賃、査定額、費用、手数料、ローン返済額などの「具体的な金額や数字（〇〇万円、〇％など）」や試算・例え話は一切出さないでください。
★ 条件を聞いていない段階で「条件を受け止めました」と言わないでください。

【基本ルール】
・自然で丁寧な日本の敬語で話してください（直訳風表現は禁止）。
・会話の途中で「こんにちは」等の挨拶を繰り返さないでください。
・「**」や「#」などのマークダウン記号は絶対に使わず、プレーンテキストで回答してください。`;

    if (turnCount >= 5) {
      systemInstruction += `\n\n【5回目の案内ルール】
ユーザーとの会話の締めくくりです。新たな質問は絶対にせず、ご希望に応じた無料相談・査定・物件問合せ等のご案内を、画面下部のお問い合わせボタンから進んでいただくよう丁寧にお伝えして締めくくってください。`;
    }

    // 会話履歴の追加（トークン超過防止のため直近6件に制限）
    const formattedHistory = Array.isArray(history)
      ? history.slice(-6).map(item => ({
          role: item.role === "user" ? "user" : "assistant",
          content: String(item.content || "")
        }))
      : [];

    const messages = [
      { role: "system", content: systemInstruction },
      ...formattedHistory,
      { role: "user", content: String(message || "こんにちは") }
    ];

    // Groq API 呼び出し（軽量モデルでレート制限を回避＆超高速応答）
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.1-8b-instant", // ★ 無料枠の上限がゆるく高速なモデルに変更
      temperature: 0.1
    });

    const replyText = completion.choices[0]?.message?.content || "返答が得られませんでした。";
    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Groq API Execution Error:", error);

    if (error?.status === 429 || error?.message?.includes("rate_limit")) {
      return res.status(429).json({ 
        error: "一時的にアクセスが集中しています。1〜2分ほど置いてから再度お試しください。" 
      });
    }

    return res.status(500).json({ error: "API呼び出しエラーが発生しました。" });
  }
}

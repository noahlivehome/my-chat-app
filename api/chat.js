import https from 'https';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;
    
    // APIキー（環境変数からの取得を推奨）
    const apiKey = process.env.GROQ_API_KEY || "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";

    // 会話ターン数の計算（ユーザーの発話回数）
    const turnCount = history && Array.isArray(history) ? Math.floor(history.length / 2) + 1 : 1;

    // 1. 赤羽・北区・川口・板橋特化 & UX最適化プロンプト
    let systemInstruction = `あなたは「ノアリブホーム」の親切でプロフェッショナルな不動産AIコンサルタントです。

# Role & Purpose
赤羽、北区、川口市、板橋区エリアを中心に、物件をお探しのお客様（部屋探し・購入）やオーナー様（貸したい・売りたい）に対し、親身にヒアリングを行い、最終的にお問い合わせ（内見予約・無料査定・来店相談）へスムーズに誘導すること。

# Special Target Area
- 得意エリア：赤羽、北区、川口市、板橋区（および周辺沿線）
- 案内方針：「東京都内」などの広範な表現は避け、必ず「赤羽・北区・川口・板橋エリア」を中心に案内すること。

# Response & Conversation Rules
- 1回の返答はスマホで読みやすい【100〜150文字程度】とし、適度に改行を入れること。
- 会話の途中で「こんにちは」等の挨拶を無駄に繰り返さないこと。
- 回答本文の中に「1. 部屋探し 2. 貸したい」といったテキストでの選択肢一覧を書かないこと（選択肢は必ず[OPTIONS]にのみ出力すること）。
- 1回の返答で尋ねるヒアリング項目は【最大1〜2つ】にとどめること。

# Conversation Flow (Maximum 5 Turns)
会話は最大5ターンで完結させてください。

・【1ターン目（初期対応）】
  ユーザーが「物件を探したい」と選択・発話した場合：
  「ノアリブホームにお任せください！赤羽・北区・川口・板橋エリアを中心に最新物件をご案内しております。ご希望のエリアや駅、ご予算（家賃）などはございますか？」のように優しくヒアリングを開始する。

・【2〜3ターン目（詳細ヒアリング）】
  希望エリア、間取り、こだわり条件（ペット可、バストイレ別等）を順に確認する。

・【4ターン目（提案準備）】
  「ご希望の条件をしっかり確認いたしました！ご希望に沿う最新の空室情報やWeb未公開の物件資料を、専門スタッフが最新データベースよりすぐにお探しいたします。」と伝える。

・【5ターン目（最終誘導）】
  新たな質問や[OPTIONS]の出力は一切行わない。
  「条件に合った物件情報のお受け取りや内見のご予約は、画面下部のお問い合わせボタンからすぐにお進みいただけます。赤羽店舗でのご相談やオンライン案内も可能ですので、ぜひお気軽にご利用ください！」と伝えて締めくくる。

# Strict Guardrails (絶対禁止事項)
- ★架空の物件情報やスペック（例：「赤羽駅徒歩5分、家賃8万円の1K」等）は絶対につくらないこと。
- ★家賃、査定額、諸費用、手数料などの具体的な数字（〇万円、〇％など）や試算・例え話は一切出さないこと。
- ★ユーザーから具体的な条件を聞いていない段階で「条件を受け止めました」と言わないこと。
- ★「**」や「#」などのマークダウン記号は絶対に使用せず、プレーンテキストのみで回答すること。

# Output Format & UI Rules
ユーザーがタップ操作で会話を進められるよう、メッセージの末尾には必ず次の選択肢（2〜3個）を以下のフォーマットで付与してください。
（※5回目のターンの場合は[OPTIONS]を出力せず、お問い合わせへの誘導文章のみで終了すること。）

（回答本文テキスト）

[OPTIONS]
- 選択肢1
- 選択肢2
- 選択肢3`;

    // 2. 5ターン目以降の制御ルールを追加
    if (turnCount >= 5) {
      systemInstruction += `\n\n【5回目の案内ルール】
ユーザーとの会話の締めくくりです。新たな質問や[OPTIONS]の出力は絶対にせず、ご希望に応じた無料相談・査定・物件問合せ等のご案内を、画面下部のお問い合わせボタンから進んでいただくよう丁寧にお伝えして締めくくってください。`;
    }

    // 3. メッセージ構造の組み立て
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

    // 4. APIリクエストデータ構造の作成
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

    // 5. Groq API 呼び出し処理
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

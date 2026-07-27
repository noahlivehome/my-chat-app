import https from 'https';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;
    
    // APIキーは Vercel の Environment Variables (GROQ_API_KEY) から読み込みます
    const apiKey = process.env.GROQ_API_KEY || "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";

    // 会話のターン数を計算
    const turnCount = history && Array.isArray(history) ? Math.floor(history.length / 2) + 1 : 1;

    // 1. システムプロンプトの定義（統合完全版）
    let systemInstruction = `あなたは「ノアリブホーム」の親切でプロフェッショナルな不動産AIコンサルタントです。

【役割と目的】
Webサイトを訪れたお客様のニーズ（①借りる、②貸す、③売る、④購入する）を素早く特定し、丁寧なヒアリングを行ったうえで、適切な内見予約・査定・問い合わせフォームへスムーズに誘導すること。

【共通の応対方針】
- プロのアドバイザーとして丁寧で誠実、かつ分かりやすい日本の敬語を徹底する。
- ユーザーを疲れさせないため、1回のメッセージで尋ねるヒアリング項目は【最大1〜2つ】にとどめる。
- スマホ画面で読みやすいよう、1回の返答は【100〜150文字程度】とし、適度に改行を入れる。
- 「こんにちは」等の挨拶を会話の途中で繰り返さないこと。
- 電話番号や詳細な住所などの個人情報は、相談や予約が具体化した段階でのみ確認する。
- 専門的すぎる質問やトラブル対応は「専門スタッフより詳しくご案内いたします」と告げて人間へ誘導する。

【ニーズ別・会話シナリオ】
ユーザーが「〜したい」と選択した1回目の会話では、いきなり「条件を受け止めました」「お問い合わせください」と締めくくらず、まずご希望内容を優しく質問してください。

1. 賃貸を探したい（借りたい）：
   - 初回発話例：「ご希望のエリア、間取り、ご予算、ペット飼育などのこだわり条件はございますか？差し支えない範囲で教えていただけますと幸いです！」
   - ヒアリング：エリア、予算（家賃）、間取り、時期、こだわり条件（バストイレ別等）。
   - ゴール：条件の確認後、内見予約・店舗相談予約への誘導。

2. 貸したい（オーナー様）：
   - 初回発話例：「所有されている物件のエリアや種別（マンション・戸建てなど）、現在お困りのこと（空室対策、管理会社の変更など）について教えていただけますか？」
   - ヒアリング：物件種別、所在地（市区町村）、現在の状況（空室/退去予定/初めて等）。
   - ゴール：想定賃料の試算・募集管理の無料相談予約への誘導。

3. 売却したい（売りたい）：
   - 初回発話例：「ご売却をご検討中の物件エリアや時期、現状のお悩みなどについて教えていただけますか？」
   - ヒアリング：物件種別・エリア、売却希望時期・理由。
   - ゴール：簡易相場（机上査定）または正確な価格（訪問査定）の提案、査定フォームへの誘導。

4. 購入したい：
   - 初回発話例：「ご希望のエリアや種別（新築・中古戸建て・マンションなど）、ご検討のきっかけなどを教えていただけますか？」
   - ヒアリング：希望エリア、種別、総予算、時期・ローンの状況。
   - ゴール：物件提案、非公開物件の案内、来店・オンライン相談予約への誘導。

【絶・対・禁・止・事・項】
★ 架空の物件情報（「〇〇駅から徒歩〇分、家賃〇万円の物件があります」など）は絶対につくらないでください。
★ 家賃、査定額、費用、手数料などの具体的な数字（〇〇万円、〇％など）や試算は一切出さないでください。
★ 条件を聞いていない段階で「条件を受け止めました」と言わないでください。
★ 「**」や「#」などのマークダウン記号は絶対に使わず、プレーンテキストで回答してください。

【選択肢ボタンの出力ルール】
ユーザーのタップ操作を助けるため、メッセージの末尾には必ず次に押しやすい選択肢（2〜4個）を以下のフォーマットで出力してください。

（回答本文テキスト）

[OPTIONS]
- 選択肢1
- 選択肢2
- 選択肢3`;

    // 2. 5ターン目以降の締めくくりルール追加
    if (turnCount >= 5) {
      systemInstruction += `\n\n【5回目の案内ルール】
ユーザーとの会話の締めくくりです。新たな質問や[OPTIONS]の出力は絶対にせず、ご希望に応じた無料相談・査定・物件問合せ等のご案内を、画面下部のお問い合わせボタンから進んでいただくよう丁寧にお伝えして締めくくってください。`;
    }

    // 3. メッセージ配列の組み立て
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

    // 4. Groq API へのリクエストボディ作成
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

    // 5. HTTPSリクエストの実行
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

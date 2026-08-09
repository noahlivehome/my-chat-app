import talkFlowData from './talk_flow_data.json' assert { type: 'json' };

export default async function handler(req, res) {
  // CORSヘッダーの設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userInputText = '', turnCount = 1, category = null, messages = [] } = req.body || {};

  // 1. 固定ルール分岐（ロジック処理）
  // 5ターン目以降はお問い合わせへ誘導
  if (turnCount >= 5) {
    return res.status(200).json({
      text: "詳細なご条件やお問合せにつきましては、担当スタッフより詳しく丁寧にご案内いたします。\n\n他にご希望や気になる条件などはございましたら、下記に入力してお気軽にお問い合わせくださいませ。\",
      options: [
        { text: "📅 無料相談・お問い合わせ", value: "contact", isPrimary: true }
      ]
    });
  }

  // トラブル・法律系質問への対応
  if (["トラブル", "契約", "法律", "違約金"].some(keyword => userInputText.includes(keyword))) {
    return res.status(200).json({
      text: "ご質問ありがとうございます。\nお約束事や専門的なご相談につきましては、専門スタッフより詳しくご案内いたします。\n\nお手数ですが直接お問い合わせいただけますでしょうか。",
      options: [
        { text: "📩 専門スタッフに相談する", value: "contact", isPrimary: true }
      ]
    });
  }

  // 2. OpenAI APIキーのチェック
  const apiKey = process.env.OPENAI_API_KEY;

  // APIキーが無い場合は、静的ルールで応答（フォールバック）
  if (!apiKey) {
    let responseData = {
      category: category,
      text: "ご回答いただきありがとうございます！\n他にご希望や気になる条件などはございますか？\n\nご希望のボタンをお選びいただくか、メッセージで教えてください。",
      options: [
        { text: "✨ その他の条件を伝える", value: "more_detail" },
        { text: "🔍 詳しい相談をしたい", value: "more_consult" },
        { text: "📅 無料で相談予約・問合せをする", value: "contact", isPrimary: true }
      ]
    };

    if (userInputText.includes("賃貸") || userInputText.includes("部屋")) {
      responseData.category = "rent";
      responseData.text = "お部屋探しですね！\nご希望のエリア、間取り、ご予算、ペット飼育などのこだわり条件はございますか？\n\n差し支えない範囲で教えていただけますと幸いです！";
      responseData.options = [
        { text: "💰 家賃相場を確認", value: "rent_market" },
        { text: "💭 条件（ペット等）伝える", value: "rent_condition" },
        { text: "📅 内見予約・物件問合せをする", value: "contact", isPrimary: true }
      ];
    } else if (userInputText.includes("貸したい") || userInputText.includes("オーナー")) {
      responseData.category = "owner";
      responseData.text = "賃貸管理のご相談ですね！\n所有されている物件のエリアや種別（マンション・戸建てなど）、現在のお悩みについて教えていただけますか？";
      responseData.options = [
        { text: "🏢 物件・エリアを伝える", value: "owner_info" },
        { text: "❓ 空室対策のご相談", value: "owner_vacancy" },
        { text: "📋 賃料査定・管理相談を予約する", value: "contact", isPrimary: true }
      ];
    } else if (userInputText.includes("売却") || userInputText.includes("売り")) {
      responseData.category = "sell";
      responseData.text = "ご売却のご相談ですね！\nご売却をご検討中の物件エリアや時期、現状のお悩みなどについて教えていただけますか？";
      responseData.options = [
        { text: "📍 エリア・時期を伝える", value: "sell_info" },
        { text: "📊 査定の流れを聞く", value: "sell_flow" },
        { text: "📝 無料査定・売却相談を予約する", value: "contact", isPrimary: true }
      ];
    } else if (userInputText.includes("購入") || userInputText.includes("買")) {
      responseData.category = "buy";
      responseData.text = "物件ご購入のご相談ですね！\nご希望のエリアや種別（新築・中古戸建て・マンションなど）、ご検討のきっかけなどを教えていただけますか？";
      responseData.options = [
        { text: "🏠 希望種別・エリア伝える", value: "buy_info" },
        { text: "💡 住宅ローンの相談", value: "buy_loan" },
        { text: "📱 内見予約・購入相談を予約する", value: "contact", isPrimary: true }
      ];
    }

    return res.status(200).json(responseData);
  }

  // 3. LLM（OpenAI API）を使った動的応答生成
  try {
    const systemPrompt = `あなたは優秀な不動産仲介のWeb接客アシスタントAIです。
現在のカテゴリ: ${category || '未設定'}
会話ターン数: ${turnCount}/5

接客方針:
- 親しみやすく丁寧なトーンで短く（150文字程度）応答してください。
- ユーザーの入力を踏まえて共感し、さらに深掘りする質問を1つ含めてください。
- 5ターン目でお問い合わせ（contact.html）へ誘導するため、段階的にヒアリングを進めてください。`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userInputText }
    ];

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 250
      })
    });

    const data = await aiResponse.json();
    const aiText = data.choices[0].message.content;

    return res.status(200).json({
      text: aiText,
      options: [
        { text: "✨ 詳細条件を伝える", value: "more_detail" },
        { text: "📅 無料で相談予約・問合せをする", value: "contact", isPrimary: true }
      ]
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

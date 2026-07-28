export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history } = req.body || {};

    // ユーザーのメッセージ履歴から現在のターン数を判定
    const userMessages = Array.isArray(history) 
      ? history.filter(item => item.role === "user") 
      : [];
    const turnCount = userMessages.length + 1;

    // 過去の会話全体からカテゴリを判定
    const fullText = (userMessages.map(m => m.content).join(" ") + " " + (message || "")).toLowerCase();
    
    let category = "rent"; // デフォルト：賃貸を探したい
    if (fullText.includes("貸したい") || fullText.includes("オーナー") || fullText.includes("管理")) {
      category = "owner_rent";
    } else if (fullText.includes("売却") || fullText.includes("売りたい")) {
      category = "owner_sell";
    } else if (fullText.includes("購入") || fullText.includes("買いたい")) {
      category = "buy";
    }

    // 各シナリオのメッセージ＆ボタン定義（オウム返し一切なし、エリア完全指定）
    const scenarios = {
      // 1. 賃貸を探したい
      rent: {
        1: {
          reply: "お部屋探しのご相談ですね！ノアリブホームにお任せください。\nご希望のエリアをお聞かせいただけますか？",
          options: ["📍 赤羽・北区エリア", "📍 川口エリア", "📍 板橋区エリア", "📍 その他・相談したい"]
        },
        2: {
          reply: "ありがとうございます！\nご希望の間取り（広さ）はお決まりでしょうか？",
          options: ["🏠 1K・1DK", "🏠 1LDK・2LDK", "🏠 3LDK以上", "❓ まだ決まっていない"]
        },
        3: {
          reply: "承知いたしました。\nおおよその月額ご予算（管理費込み）の目安を教えていただけますか？",
          options: ["💰 8万円未満", "💰 8〜10万円", "💰 10〜15万円", "💰 15万円以上"]
        },
        4: {
          reply: "ありがとうございます。\nお引っ越しのご希望時期はいつ頃をお考えでしょうか？",
          options: ["⚡ すぐにでも", "📅 1ヶ月以内", "📅 2〜3ヶ月以内", "💭 良い物件があれば"]
        },
        5: {
          reply: "ご条件をお聞かせいただきありがとうございます！\n最新のデータベースよりご希望に沿う空室情報やWeb未公開資料をお探しいたします。\n画面下部のお問い合わせボタンよりお気軽にご連絡ください。",
          options: []
        }
      },

      // 2. 貸したい（オーナー様）
      owner_rent: {
        1: {
          reply: "賃貸管理・貸し出しのご相談ですね！\nご所有されている物件のエリアはおどちらになりますか？",
          options: ["📍 赤羽・北区エリア", "📍 川口エリア", "📍 板橋区エリア", "📍 その他"]
        },
        2: {
          reply: "承知いたしました。\nご所有物件の種別について教えていただけますか？",
          options: ["🏢 区分マンション", "🏠 一戸建て", "🏬 アパート・一棟ビル", "❓ その他"]
        },
        3: {
          reply: "ありがとうございます。\n現在の物件のご状況はいかがでしょうか？",
          options: ["🔑 現在空室", "🚪 近々退去予定", "🏃 他社で募集中", "💭 今後の参考に"]
        },
        4: {
          reply: "承知いたしました。\n今回はどのようなサポートをご希望でしょうか？",
          options: ["💡 無料で賃料査定したい", "🛠️ 管理会社を変更したい", "🔍 空室対策・集客の相談", "❓ 検討中"]
        },
        5: {
          reply: "詳しく教えていただきありがとうございます！\n地域の賃貸市場に精通したスタッフが適切な査定・プランをご提案いたします。\n画面下部のお問い合わせボタンよりご相談をお待ちしております。",
          options: []
        }
      },

      // 3. 売却したい
      owner_sell: {
        1: {
          reply: "ご売却のご相談ですね！\nご売却をご検討中の物件エリアをお聞かせください。",
          options: ["📍 赤羽・北区エリア", "📍 川口エリア", "📍 板橋区エリア", "📍 その他"]
        },
        2: {
          reply: "ありがとうございます。\n物件の種別について教えていただけますか？",
          options: ["🏢 分譲マンション", "🏠 一戸建て", "🧱 土地・一棟", "❓ その他"]
        },
        3: {
          reply: "承知いたしました。\nご売却のご希望時期はお決まりでしょうか？",
          options: ["⚡ できるだけ早く", "📅 半年以内", "📅 1年以内", "📊 まずは査定額だけ知りたい"]
        },
        4: {
          reply: "ありがとうございます。\nご売却にあたって一番重視されるポイントは何でしょうか？",
          options: ["💰 売却価格の高さ", "⚡ スピード重視", "🔒 周囲に秘密で売却", "💬 丁寧なサポート"]
        },
        5: {
          reply: "ご回答いただきありがとうございます！\n赤羽・北区・川口・板橋エリアに強い当社の専任担当が迅速に査定いたします。\n画面下部のお問い合わせボタンよりお気軽にご依頼ください。",
          options: []
        }
      },

      // 4. 購入したい
      buy: {
        1: {
          reply: "物件購入のご相談ですね！\nご希望のエリアをお聞かせいただけますか？",
          options: ["📍 赤羽・北区エリア", "📍 川口エリア", "📍 板橋区エリア", "📍 その他"]
        },
        2: {
          reply: "ありがとうございます！\nご検討中の物件種別について教えていただけますか？",
          options: ["🏢 マンション", "🏡 新築・中古戸建て", "🧱 土地", "❓ まだ迷っている"]
        },
        3: {
          reply: "承知いたしました。\nおおよそのご予算感（買い替えの場合は想定額）はおいくら位でしょうか？",
          options: ["💰 3,000万円以下", "💰 3,000〜5,000万円", "💰 5,000〜7,000万円", "💰 7,000万円以上"]
        },
        4: {
          reply: "ありがとうございます。\nご購入のご希望時期はいつ頃をお考えですか？",
          options: ["⚡ 良い物件があればすぐ", "📅 半年以内", "📅 1年以内", "💭 まずは情報収集"]
        },
        5: {
          reply: "条件をお聞かせいただきありがとうございます！\n未公開物件情報も含め、お客様に最適な物件・資金計画をご案内いたします。\n画面下部のお問い合わせボタンよりご相談予約をお待ちしております。",
          options: []
        }
      }
    };

    // 該当するターンとシナリオのデータを取得（5ターン超えたら5ターン目を維持）
    const step = Math.min(turnCount, 5);
    const currentScenario = scenarios[category][step] || scenarios.rent[step];

    return res.status(200).json({
      reply: currentScenario.reply,
      options: currentScenario.options,
      isFinished: step >= 5,
      userCategory: category
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}

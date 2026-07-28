// チャットの状態管理
const chatState = {
    category: null, // 'rent', 'owner', 'sell', 'buy'
    turnCount: 0    // ターン数制限用
};

// 初期表示用選択肢データ
const initialOptions = [
    { text: "🏠 賃貸のお部屋を探したい", value: "rent" },
    { text: "🔑 物件を貸したい（オーナー様）", value: "owner" },
    { text: "🏢 物件を売却したい", value: "sell" },
    { text: "🏡 物件を購入したい", value: "buy" }
];

// ウェルカムメッセージ取得
function getWelcomeMessage() {
    return {
        text: "いらっしゃいませ！\n不動産のご案内AIアシスタントです。\n\n本日はどのようなご相談でしょうか？\n下の選択肢よりお選びください。",
        options: initialOptions
    };
}

// チャット応答ロジック
function sendChatMessage(userInputText) {
    chatState.turnCount++;

    // 5ターン目以降はフォーム・相談窓口へ誘導
    if (chatState.turnCount >= 5) {
        return {
            text: "詳細なご条件やお問合せにつきましては、担当スタッフより詳しく丁寧にご案内いたします。\n\nお手数ですが、下記よりお気軽にお問い合わせくださいませ。",
            options: [
                { text: "📅 無料相談・お問い合わせ", value: "contact", isPrimary: true }
            ]
        };
    }

    // 初回カテゴリ未選択の場合
    if (!chatState.category) {
        if (userInputText.includes("賃貸") || userInputText.includes("借り")) {
            chatState.category = "rent";
            return {
                text: "お部屋探しですね！\nご希望のエリア、間取り、ご予算、ペット飼育などのこだわり条件はございますか？\n\n差し支えない範囲で教えていただけますと幸いです！",
                options: [
                    { text: "💰 家賃相場について確認する", value: "rent_market" },
                    { text: "💭 条件（ペット・間取り等）を伝える", value: "rent_condition" },
                    { text: "📅 無料で内見予約・物件問合せをする", value: "contact", isPrimary: true }
                ]
            };
        } else if (userInputText.includes("貸したい") || userInputText.includes("オーナー")) {
            chatState.category = "owner";
            return {
                text: "賃貸管理のご相談ですね！\n所有されている物件のエリアや種別（マンション・戸建てなど）、現在のお悩みについて教えていただけますか？",
                options: [
                    { text: "🏢 物件種別・エリアを伝える", value: "owner_info" },
                    { text: "❓ 空室対策について相談する", value: "owner_vacancy" },
                    { text: "📋 賃料試算・無料相談を予約する", value: "contact", isPrimary: true }
                ]
            };
        } else if (userInputText.includes("売却") || userInputText.includes("売り")) {
            chatState.category = "sell";
            return {
                text: "ご売却のご相談ですね！\nご売却をご検討中の物件エリアや時期、現状のお悩みなどについて教えていただけますか？",
                options: [
                    { text: "📍 エリア・時期を伝える", value: "sell_info" },
                    { text: "📊 査定の流れを聞く", value: "sell_flow" },
                    { text: "📝 無料査定を申し込む", value: "contact", isPrimary: true }
                ]
            };
        } else if (userInputText.includes("購入") || userInputText.includes("買い")) {
            chatState.category = "buy";
            return {
                text: "物件ご購入のご相談ですね！\nご希望のエリアや種別（新築・中古戸建て・マンションなど）、ご検討のきっかけなどを教えていただけますか？",
                options: [
                    { text: "🏠 希望種別・エリアを伝える", value: "buy_info" },
                    { text: "💡 住宅ローンの相談をする", value: "buy_loan" },
                    { text: "📱 来店・オンライン相談を予約する", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // 専門的トラブル等のハンドリング
    if (userInputText.includes("トラブル") || userInputText.includes("契約") || userInputText.includes("法律") || userInputText.includes("違約金")) {
        return {
            text: "ご質問ありがとうございます。\nお約束事や専門的なご相談につきましては、専門スタッフより詳しくご案内いたします。\n\nお手数ですが直接お問い合わせいただけますでしょうか。",
            options: [
                { text: "📩 専門スタッフに相談する", value: "contact", isPrimary: true }
            ]
        };
    }

    // カテゴリ別のシナリオ回答
    switch (chatState.category) {
        case "rent":
            return {
                text: "詳細なご希望をお知らせいただきありがとうございます！\nご希望の入居時期や、その他の譲れない条件（バストイレ別、2階以上など）はございますか？",
                options: [
                    { text: "🗓 入居時期を伝える", value: "rent_time" },
                    { text: "✨ こだわり条件を伝える", value: "rent_detail" },
                    { text: "📅 無料で内見予約・物件問合せをする", value: "contact", isPrimary: true }
                ]
            };
        case "owner":
            return {
                text: "ありがとうございます！\n現在の運用状況（空室でお困り、現在の管理会社様からの変更をご検討中など）について詳しくお聞かせいただけますか？",
                options: [
                    { text: "📉 空室対策について", value: "owner_detail1" },
                    { text: "🔄 管理会社の変更について", value: "owner_detail2" },
                    { text: "📋 無料で管理・試算相談をする", value: "contact", isPrimary: true }
                ]
            };
        case "sell":
            return {
                text: "承知いたしました。\nおおよそのご売却希望時期（すぐに売却したい、良い条件があればなど）は決まっていらっしゃいますか？",
                options: [
                    { text: "⚡️ なるべく早く売却したい", value: "sell_soon" },
                    { text: "🔍 まずは価格だけ知りたい", value: "sell_price" },
                    { text: "📝 無料査定・ご相談予約へ", value: "contact", isPrimary: true }
                ]
            };
        case "buy":
            return {
                text: "ありがとうございます！\nご予算のイメージや、住宅ローンのご利用計画につきましてはご検討中でしょうか？",
                options: [
                    { text: "💵 予算イメージを伝える", value: "buy_budget" },
                    { text: "🏦 ローンについて相談したい", value: "buy_loan_detail" },
                    { text: "📱 非公開物件の案内・ご相談予約", value: "contact", isPrimary: true }
                ]
            };
        default:
            return {
                text: "お問合せありがとうございます！\nお客様のご要望に合わせた最適なプランをご案内いたします。\n\n下記よりご希望の手続きをお選びください。",
                options: [
                    { text: "📩 お問い合わせフォームへ", value: "contact", isPrimary: true }
                ]
            };
    }
}

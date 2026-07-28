// チャット状態の管理
const chatState = {
    mode: null,       // 'rent', 'owner', 'sell', 'buy'
    step: 0,          // 各フロー内のステップ管理
    area: "",         // エリア情報
    data: {}          // ヒアリングデータの保持
};

// 主要エリアの魅力データ（追加も自由です）
const areaInfo = {
    "赤羽": "JR各線が乗り入れていて都心や埼玉方面へのアクセスが抜群！商店街や飲食店も豊富で生活利便性が非常に高い人気の街です。",
    "新宿": "複数路線が利用可能で通勤・通学の利便性は間違いなくトップクラス！商業施設も揃う大都会の真ん中です。",
    "池袋": "山手線はじめアクセスが良好で、ショッピングやエンタメ施設が充実した非常に便利なエリアです。",
    "横浜": "おしゃれな街並みと優れたアクセス性を兼ね備え、住みやすさで常に上位にランクインする大人気エリアです。"
};

// 初期表示選択肢（ボタン文言は分かりやすく2列表示）
const initialOptions = [
    { text: "🏠 部屋を借りたい（賃貸）", value: "rent" },
    { text: "🔑 物件を貸したい（貸主）", value: "owner" },
    { text: "🏢 物件を売りたい（売却）", value: "sell" },
    { text: "🏡 物件を買いたい（購入）", value: "buy" }
];

// 画面読み込み完了時
document.addEventListener("DOMContentLoaded", () => {
    initChat();
});

function initChat() {
    appendBotMessage("いらっしゃいませ！\n不動産ご案内AIアシスタントです。\n\n本日はどのようなご相談でしょうか？\n下の選択肢よりお選びください。");
    renderOptions(initialOptions);
}

// AIの応答生成メインロジック
function getAIResponse(userInputText) {
    // --- 0. 途中での条件変更・モード切り替え検知 ---
    if (userInputText.includes("借りたい") || userInputText.includes("賃貸を探す")) {
        chatState.mode = "rent";
        chatState.step = 1;
        return {
            text: "お部屋探し（賃貸）のご相談ですね！\nご希望の「エリア（駅名）」をお知らせいただくか、下からお選びください。",
            options: [
                { text: "📍 赤羽エリア", value: "area_akabane" },
                { text: "📍 新宿エリア", value: "area_shinjuku" },
                { text: "📍 池袋エリア", value: "area_ikebukuro" },
                { text: "💡 エリアから相談する", value: "area_other" }
            ]
        };
    } else if (userInputText.includes("貸したい") || userInputText.includes("オーナー")) {
        chatState.mode = "owner";
        chatState.step = 1;
        return {
            text: "物件を貸したい（オーナー様）のご相談ですね！\nご所有物件の「種別」はどちらでしょうか？",
            options: [
                { text: "🏢 マンション（1室/一棟）", value: "mansion" },
                { text: "🏠 一戸建て", value: "house" },
                { text: "🏬 アパート・事業用", value: "apartment" },
                { text: "📋 相談して決める", value: "other" }
            ]
        };
    } else if (userInputText.includes("売りたい") || userInputText.includes("売却")) {
        chatState.mode = "sell";
        chatState.step = 1;
        return {
            text: "物件のご売却のご相談ですね！\nご所有物件の「種別」とおおよその「所在地（エリア）」を教えていただけますか？",
            options: [
                { text: "🏢 マンション（赤羽周辺など）", value: "sell_mansion" },
                { text: "🏠 戸建て・土地", value: "sell_house" },
                { text: "📍 エリアを入力して相談", value: "sell_input" }
            ]
        };
    } else if (userInputText.includes("買いたい") || userInputText.includes("購入")) {
        chatState.mode = "buy";
        chatState.step = 1;
        return {
            text: "物件のご購入のご相談ですね！\nどのような種別をお探しでしょうか？",
            options: [
                { text: "🏢 新築・中古マンション", value: "buy_mansion" },
                { text: "🏡 新築・中古一戸建て", value: "buy_house" },
                { text: "🏞 土地を探している", value: "buy_land" }
            ]
        };
    }

    // エリア名の魅力抽出チェック
    let areaComment = "";
    for (const key in areaInfo) {
        if (userInputText.includes(key)) {
            areaComment = `「${key}」ですね！\n${areaInfo[key]}\n\n`;
            chatState.area = key;
            break;
        }
    }

    // --- ①【賃貸希望】フロー ---
    if (chatState.mode === "rent") {
        if (chatState.step === 1) {
            chatState.step = 2;
            return {
                text: `${areaComment}続いて、ご希望の「ご予算（家賃上限）」を教えてください！`,
                options: [
                    { text: "💴 8万円以内", value: "b_8" },
                    { text: "💴 10万円以内", value: "b_10" },
                    { text: "💴 12万円以内", value: "b_12" },
                    { text: "💴 15万円以上", value: "b_15" }
                ]
            };
        } else if (chatState.step === 2) {
            chatState.step = 3;
            return {
                text: "ご予算について承知いたしました！\n次に、ご希望の「間取り・広さ」をお選びください。",
                options: [
                    { text: "🛋 ワンルーム・1K", value: "1k" },
                    { text: "🛋 1LDK・2DK", value: "1ldk" },
                    { text: "🛋 2LDK以上（ファミリー向け）", value: "2ldk" }
                ]
            };
        } else if (chatState.step === 3) {
            chatState.step = 4;
            return {
                text: "ありがとうございます！\n最後に「譲れないこだわり条件」があれば1〜2点教えてください。（ボタン選択または自由入力）",
                options: [
                    { text: "🛀 バストイレ別", value: "bt" },
                    { text: "🐶 ペット飼育可", value: "pet" },
                    { text: "🔒 オートロック付き", value: "lock" },
                    { text: "🏃‍♂️ 駅から徒歩5分以内", value: "walk5" }
                ]
            };
        } else {
            return {
                text: "ご希望条件をお知らせいただきありがとうございます！\n条件に合うお部屋の検索・詳細データのご用意が整いました。\n\n「内見予約」または「店舗でのご相談」を承ります。下記よりお進みください！",
                options: [
                    { text: "📅 無料で内見予約・相談をする", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // --- ②【貸したい（オーナー）】フロー ---
    if (chatState.mode === "owner") {
        if (chatState.step === 1) {
            chatState.step = 2;
            return {
                text: "ありがとうございます。\n物件のあるおおよその「所在地（市区町村・駅名など）」を教えていただけますか？",
                options: [
                    { text: "📍 赤羽エリア周辺", value: "akabane" },
                    { text: "📍 東京都内", value: "tokyo" },
                    { text: "✍️ メッセージで直接入力", value: "input" }
                ]
            };
        } else if (chatState.step === 2) {
            chatState.step = 3;
            return {
                text: `${areaComment}現在の「お悩み・ご状況」に最も近いものをお選びください。`,
                options: [
                    { text: "❓ 現在、空室で困っている", value: "vacancy" },
                    { text: "🚪 近々、退去予定がある", value: "leaving" },
                    { text: "🏠 現在、自分が居住中", value: "living" },
                    { text: "🔰 初めての賃貸経営", value: "first" }
                ]
            };
        } else {
            return {
                text: "ご状況をお知らせいただきありがとうございます！\n適正な想定賃料の試算や最適な管理プランのご案内が可能です。\n\n担当よりご連絡（資料送付）いたしますので、下記より無料相談をお申し込みください！",
                options: [
                    { text: "📋 賃料試算・無料相談を予約する", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // --- ③【売りたい（売却）】フロー ---
    if (chatState.mode === "sell") {
        if (chatState.step === 1) {
            chatState.step = 2;
            return {
                text: `${areaComment}ご売却の「時期」や「ご理由」はお決まりでしょうか？`,
                options: [
                    { text: "⚡️ なるべく早く売りたい", value: "quick" },
                    { text: "📊 まずは相場を知りたい", value: "market" },
                    { text: "🏡 住み替え・買い替えのため", value: "change" }
                ]
            };
        } else if (chatState.step === 2) {
            chatState.step = 3;
            return {
                text: "承知いたしました！ご希望の「査定方法」をお選びください。\n\n・机上査定：データに基づく簡単な相場把握\n・訪問査定：現地を確認する正確な価格査定",
                options: [
                    { text: "💻 簡単な相場を知る（机上査定）", value: "desk" },
                    { text: "🏠 正確な価格を知る（訪問査定）", value: "visit" }
                ]
            };
        } else {
            return {
                text: "ありがとうございます！\n無料査定の受付けを開始いたします。下記フォームよりお気軽にお申し込みください！",
                options: [
                    { text: "📝 無料査定・相談を申し込む", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // --- ④【買いたい（購入）】フロー ---
    if (chatState.mode === "buy") {
        if (chatState.step === 1) {
            chatState.step = 2;
            return {
                text: "ありがとうございます！\nご希望の「エリア（駅名）」と総額の「ご予算イメージ」を教えていただけますか？",
                options: [
                    { text: "📍 赤羽エリア（3,000万〜5,000万円）", value: "buy_akabane" },
                    { text: "📍 都心エリア（5,000万〜8,000万円）", value: "buy_tokyo" },
                    { text: "💬 予算・エリアを直接入力する", value: "buy_input" }
                ]
            };
        } else if (chatState.step === 2) {
            chatState.step = 3;
            return {
                text: `${areaComment}購入時期や、住宅ローンの事前審査状況についてはいかがでしょうか？`,
                options: [
                    { text: "🗓 いい物件があればすぐにでも", value: "soon" },
                    { text: "💡 住宅ローンの相談もしたい", value: "loan_help" },
                    { text: "🔍 まずは情報収集段階", value: "info" }
                ]
            };
        } else {
            return {
                text: "ありがとうございます！\nWebには掲載されていない「非公開物件」の情報含め、専門スタッフよりご提案させていただきます。\n\n下記よりご来店またはオンライン相談をご予約ください！",
                options: [
                    { text: "📱 非公開物件のご案内・ご来店予約", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // --- デフォルト（新規スタート・汎用） ---
    return {
        text: `「${userInputText}」ですね！承知いたしました。\nどのようなご相談（借りる・貸す・買う・売る）をお望みでしょうか？`,
        options: initialOptions
    };
}

// UI更新用ヘルパー関数群
function appendBotMessage(text) {
    const container = document.getElementById("chatMessages");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "message bot";
    div.innerText = text;
    container.appendChild(div);
    scrollToBottom();
}

function appendUserMessage(text) {
    const container = document.getElementById("chatMessages");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "message user";
    div.innerText = text;
    container.appendChild(div);
    scrollToBottom();
}

function renderOptions(options) {
    const container = document.getElementById("chatOptions");
    if (!container) return;
    container.innerHTML = "";

    if (!options || options.length === 0) return;

    const normalOptions = options.filter(opt => !opt.isPrimary);
    const primaryOptions = options.filter(opt => opt.isPrimary);

    if (normalOptions.length > 0) {
        const gridDiv = document.createElement("div");
        gridDiv.className = "options-grid";
        normalOptions.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerText = opt.text;
            btn.onclick = () => handleOptionClick(opt.text);
            gridDiv.appendChild(btn);
        });
        container.appendChild(gridDiv);
    }

    primaryOptions.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn primary";
        btn.innerText = opt.text;
        btn.onclick = () => handleOptionClick(opt.text);
        container.appendChild(btn);
    });

    scrollToBottom();
}

function handleOptionClick(selectedText) {
    appendUserMessage(selectedText);

    if (selectedText.includes("予約") || selectedText.includes("申込む") || selectedText.includes("問合せ")) {
        setTimeout(() => {
            appendBotMessage("ご希望いただきありがとうございます！\n下記のお問い合わせ窓口（またはフォーム）よりお進みくださいませ。");
            document.getElementById("chatOptions").innerHTML = "";
        }, 300);
        return;
    }

    setTimeout(() => {
        const response = getAIResponse(selectedText);
        appendBotMessage(response.text);
        renderOptions(response.options);
    }, 300);
}

function sendMessage() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (text === "") return;

    appendUserMessage(text);
    input.value = "";

    setTimeout(() => {
        const response = getAIResponse(text);
        appendBotMessage(response.text);
        renderOptions(response.options);
    }, 300);
}

function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

function scrollToBottom() {
    const container = document.getElementById("chatMessages");
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

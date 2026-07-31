// ==========================================
// 1. 設定項目（お問い合わせ先URL）
// ==========================================
const IELOVE_FORM_URL = "https://www.noahlivehome.jp/contact/";

// ==========================================
// 2. チャット状態の管理
// ==========================================
const chatState = {
    mode: null,
    step: 0,
    area: "",
    data: {},
    history: []
};

// ② エリア魅力データ（新しいエリア名に対応）
const areaInfo = {
    "赤羽・北区": "JR各線が乗り入れていて都心や埼玉方面へのアクセスが抜群！商店街や飲食店も豊富で生活利便性が非常に高い人気のエリアです。",
    "その他23区": "東京23区内は交通網が充実しており、通勤・通学やショッピングの利便性がトップクラスです。",
    "埼玉県": "都心へのアクセスが良く、賃料コストパフォーマンスに優れた住みやすいおすすめのエリアです。"
};

// ① 初期表示選択肢（カッコ表記を削除）
const initialOptions = [
    { text: "🏠 部屋を借りたい", value: "rent" },
    { text: "🔑 物件を貸したい", value: "owner" },
    { text: "🏢 物件を売りたい", value: "sell" },
    { text: "🏡 物件を買いたい", value: "buy" }
];

// 画面読み込み完了時に初期メッセージを表示
window.addEventListener("load", () => {
    initChat();
});

function initChat() {
    const msgContainer = document.getElementById("chatMessages");
    if (msgContainer) msgContainer.innerHTML = "";
    
    appendBotMessage("いらっしゃいませ！\n不動産ご案内AIアシスタントです。\n\n本日はどのようなご相談でしょうか？\n下の選択肢よりお選びください。");
    renderOptions(initialOptions);
}

// ==========================================
// 3. AI会話分岐ロジック
// ==========================================
function getAIResponse(userInputText) {
    // モード切り替え判定
    if (userInputText.includes("借りたい") || userInputText.includes("賃貸を探す")) {
        chatState.mode = "rent";
        chatState.step = 1;
        chatState.data = {};
        // ② エリア選択肢の変更（常に4つ）
        return {
            text: "お部屋探し（賃貸）のご相談ですね！\nご希望の「エリア（駅名）」をお知らせいただくか、下からお選びください。",
            options: [
                { text: "📍 赤羽・北区エリア", value: "area_akabane" },
                { text: "📍 その他23区", value: "area_23ku" },
                { text: "📍 埼玉県", value: "area_saitama" },
                { text: "💡 条件から相談する", value: "area_other" }
            ]
        };
    } else if (userInputText.includes("貸したい") || userInputText.includes("オーナー")) {
        chatState.mode = "owner";
        chatState.step = 1;
        chatState.data = {};
        // ③ 選択肢を4つに調整
        return {
            text: "物件を貸したい（オーナー様）のご相談ですね！\nご所有物件の「種別」はどちらでしょうか？",
            options: [
                { text: "🏢 マンション（1室）", value: "mansion_single" },
                { text: "🏢 一棟マンション・ビル", value: "mansion_building" },
                { text: "🏠 一戸建て", value: "house" },
                { text: "🏬 アパート・店舗事務所", value: "apartment" }
            ]
        };
    } else if (userInputText.includes("売りたい") || userInputText.includes("売却")) {
        chatState.mode = "sell";
        chatState.step = 1;
        chatState.data = {};
        // ③ 選択肢を4つに調整
        return {
            text: "物件のご売却のご相談ですね！\nご所有物件の「種別」をお選びください。",
            options: [
                { text: "🏢 マンション", value: "sell_mansion" },
                { text: "🏠 一戸建て", value: "sell_house" },
                { text: "🏞 土地", value: "sell_land" },
                { text: "🏬 一棟ビル・アパート", value: "sell_building" }
            ]
        };
    } else if (userInputText.includes("買いたい") || userInputText.includes("購入")) {
        chatState.mode = "buy";
        chatState.step = 1;
        chatState.data = {};
        // ③ 選択肢を4つに調整
        return {
            text: "物件のご購入のご相談ですね！\nどのような種別をお探しでしょうか？",
            options: [
                { text: "🏢 新築・中古マンション", value: "buy_mansion" },
                { text: "🏡 新築・中古一戸建て", value: "buy_house" },
                { text: "🏞 土地", value: "buy_land" },
                { text: "🏬 投資用・事業用物件", value: "buy_invest" }
            ]
        };
    }

    // ② エリアキーワード判定（魅力データの引き当て）
    let areaComment = "";
    for (const key in areaInfo) {
        if (userInputText.includes(key) || (key === "赤羽・北区" && (userInputText.includes("赤羽") || userInputText.includes("北区")))) {
            areaComment = `「${key}」ですね！\n${areaInfo[key]}\n\n`;
            chatState.area = key;
            break;
        }
    }

    // ①【借りたい（賃貸）】ステップ進行（選択肢は各4つ）
    if (chatState.mode === "rent") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["希望エリア"] = userInputText;
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
            chatState.data["希望予算"] = userInputText;
            return {
                text: "ご予算について承知いたしました！\n次に、ご希望の「間取り・広さ」をお選びください。",
                options: [
                    { text: "🛋 ワンルーム・1K", value: "1k" },
                    { text: "🛋 1DK・1LDK", value: "1ldk" },
                    { text: "🛋 2K・2DK・2LDK", value: "2ldk" },
                    { text: "🛋 3LDK以上", value: "3ldk" }
                ]
            };
        } else if (chatState.step === 3) {
            chatState.step = 4;
            chatState.data["希望間取り"] = userInputText;
            return {
                text: "ありがとうございます！\n最後に「譲れないこだわり条件」があれば教えてください。",
                options: [
                    { text: "🛀 バストイレ別", value: "bt" },
                    { text: "🐶 ペット飼育可", value: "pet" },
                    { text: "🔒 オートロック付き", value: "lock" },
                    { text: "🚃 駅から徒歩5分以内", value: "station" }
                ]
            };
        } else {
            chatState.data["こだわり条件"] = userInputText;
            return {
                text: "ご希望条件をお知らせいただきありがとうございます！\n条件に合うお部屋の検索・詳細データのご用意が整いました。\n\nお問合せフォームへ自動引き継ぎいたしますので、下記よりお進みください！",
                options: [
                    { text: "📅 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // ②【貸したい（オーナー）】ステップ進行（選択肢は各4つ）
    if (chatState.mode === "owner") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["物件種別"] = userInputText;
            return {
                text: "ありがとうございます。\n物件のおおよその「所在地（エリア）」を教えていただけますか？",
                options: [
                    { text: "📍 赤羽・北区エリア周辺", value: "akabane" },
                    { text: "📍 その他東京23区内", value: "tokyo23" },
                    { text: "📍 埼玉県内", value: "saitama" },
                    { text: "📍 その他の地域", value: "other" }
                ]
            };
        } else if (chatState.step === 2) {
            chatState.step = 3;
            chatState.data["物件所在地"] = userInputText;
            return {
                text: "承知いたしました。\n現在の「お悩み・ご状況」に一番近いものをお選びください。",
                options: [
                    { text: "❓ 現在、空室で困っている", value: "vacancy" },
                    { text: "🚪 近々、退去予定がある", value: "leaving" },
                    { text: "🏠 現在、自分が居住中", value: "living" },
                    { text: "🔰 初めての賃貸管理", value: "first" }
                ]
            };
        } else {
            chatState.data["ご相談内容"] = userInputText;
            return {
                text: "ご状況をお知らせいただきありがとうございます！\n適正な想定賃料の試算や管理プランをご案内いたします。\n\n下記ボタンより、お問合せ・無料査定へお進みください！",
                options: [
                    { text: "📋 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // ③【売りたい（売却）】ステップ進行（選択肢は各4つ）
    if (chatState.mode === "sell") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["物件種別"] = userInputText;
            return {
                text: "承知いたしました。\nご売却をご検討の「時期」をお選びください。",
                options: [
                    { text: "⚡️ なるべく早く売りたい", value: "quick" },
                    { text: "📊 まずは相場を知りたい", value: "market" },
                    { text: "🏡 住み替えに合わせて", value: "change" },
                    { text: "🗓 半年〜1年以内", value: "future" }
                ]
            };
        } else {
            chatState.data["売却ご希望時期"] = userInputText;
            return {
                text: "ありがとうございます！\n無料査定のお申込みを承ります。\n\n下記ボタンより、お問合せへお進みください！",
                options: [
                    { text: "📝 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // ④【買いたい（購入）】ステップ進行（選択肢は各4つ）
    if (chatState.mode === "buy") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["購入種別"] = userInputText;
            return {
                text: "ありがとうございます！\nご希望の「予算イメージ」をお選びください。",
                options: [
                    { text: "💰 3,000万円以内", value: "3000" },
                    { text: "💰 5,000万円以内", value: "5000" },
                    { text: "💰 7,000万円以内", value: "7000" },
                    { text: "💰 7,000万円以上", value: "over7000" }
                ]
            };
        } else {
            chatState.data["ご予算イメージ"] = userInputText;
            return {
                text: "ありがとうございます！\n未公開物件の情報含め、スタッフよりご提案させていただきます。\n\n下記ボタンより、お問合せへお進みください！",
                options: [
                    { text: "📱 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // デフォルト応答
    return {
        text: `「${userInputText}」ですね！承知いたしました。\nどのようなご相談をお望みでしょうか？`,
        options: initialOptions
    };
}

// ==========================================
// 4. UI描画・操作イベント処理
// ==========================================
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

// ボタン選択時 & いえらぶ自動連携処理
function handleOptionClick(selectedText) {
    appendUserMessage(selectedText);

    // 予約・問合せボタンが押された時の「自動引き継ぎ処理」
    if (selectedText.includes("予約") || selectedText.includes("申込む") || selectedText.includes("問合せ") || selectedText.includes("進む")) {
        setTimeout(() => {
            appendBotMessage("ありがとうございます！\n入力いただいた条件を添えて、お問合せフォームへ自動遷移します...");
            
            const optContainer = document.getElementById("chatOptions");
            if (optContainer) optContainer.innerHTML = "";

            setTimeout(() => {
                // 1. チャットで入力された条件テキストを組み立て
                let summaryText = `【AIチャットからの引き継ぎ条件】\n`;
                
                const modeNames = {
                    rent: "お部屋探し（賃貸希望）",
                    owner: "物件の賃貸管理・貸出（オーナー様）",
                    sell: "物件のご売却（売却希望）",
                    buy: "物件のご購入（購入希望）"
                };
                
                if (chatState.mode) summaryText += `ご相談区分：${modeNames[chatState.mode] || chatState.mode}\n`;
                
                // ヒアリングした詳細データの流し込み
                Object.keys(chatState.data).forEach(key => {
                    summaryText += `・${key} : ${chatState.data[key]}\n`;
                });

                // 2. いえらぶの「message（#message）」へ自動代入するURLを生成して遷移
                const targetUrl = `${IELOVE_FORM_URL}?message=${encodeURIComponent(summaryText)}`;
                window.location.href = targetUrl;

            }, 1200);

        }, 300);
        return;
    }

    setTimeout(() => {
        const response = getAIResponse(selectedText);
        appendBotMessage(response.text);
        renderOptions(response.options);
    }, 300);
}

// 自由入力テキストの送信処理
function sendMessage() {
    const input = document.getElementById("userInput");
    if (!input) return;
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

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

// エリア魅力データ
const areaInfo = {
    "赤羽・北区": "JR各線が乗り入れていて都心や埼玉方面へのアクセスが抜群！商店街や飲食店も豊富で生活利便性が非常に高い人気のエリアです。",
    "その他23区": "東京23区内は交通網が充実しており、通勤・通学やショッピングの利便性がトップクラスです。",
    "埼玉県": "都心へのアクセスが良く、賃料コストパフォーマンスに優れた住みやすいおすすめのエリアです。"
};

// 初期表示選択肢（4つ）
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
// 3. AI会話分岐ロジック（7ターン拡張版）
// ==========================================
function getAIResponse(userInputText) {
    // --------------------------------------
    // モード切り替え判定 (Step 1 開始)
    // --------------------------------------
    if (userInputText.includes("借りたい") || userInputText.includes("賃貸を探す")) {
        chatState.mode = "rent";
        chatState.step = 1;
        chatState.data = {};
        return {
            text: "お部屋探し（賃貸）のご相談ですね！\nご希望の「エリア（駅名）」をお選びいただくか、ご入力ください。",
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
        return {
            text: "物件を貸したい（オーナー様）のご相談ですね！\nご所有物件の「種別」をお選びください。",
            options: [
                { text: "🏢 マンション・アパート", value: "mansion_single" },
                { text: "🏢 一棟マンション・ビル", value: "mansion_building" },
                { text: "🏠 一戸建て", value: "house" },
                { text: "🏬 店舗事務所・その他", value: "apartment" }
            ]
        };
    } else if (userInputText.includes("売りたい") || userInputText.includes("売却")) {
        chatState.mode = "sell";
        chatState.step = 1;
        chatState.data = {};
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
        return {
            text: "物件のご購入のご相談ですね！\nどのような「種別」をお探しでしょうか？",
            options: [
                { text: "🏢 新築・中古マンション", value: "buy_mansion" },
                { text: "🏡 新築・中古一戸建て", value: "buy_house" },
                { text: "🏞 土地", value: "buy_land" },
                { text: "🏬 投資用・事業用物件", value: "buy_invest" }
            ]
        };
    }

    // エリアキーワード判定（魅力コメント）
    let areaComment = "";
    for (const key in areaInfo) {
        if (userInputText.includes(key) || (key === "赤羽・北区" && (userInputText.includes("赤羽") || userInputText.includes("北区")))) {
            areaComment = `「${key}」ですね！\n${areaInfo[key]}\n\n`;
            chatState.area = key;
            break;
        }
    }

    // --------------------------------------
    // ①【部屋を借りたい（賃貸）】7ターン
    // --------------------------------------
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
                text: "ご予算について承知いたしました！\n次にご希望の「間取り」をお選びください。",
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
                text: "お部屋の広さ・築年数に関するご希望はありますか？",
                options: [
                    { text: "✨ 築浅（築10年以内）希望", value: "new" },
                    { text: "📐 広さ重視（広めが良い）", value: "wide" },
                    { text: "💰 築年数は気にしない（安さ重視）", value: "cheap" },
                    { text: "⚖️ バランス重視（標準的）", value: "normal" }
                ]
            };
        } else if (chatState.step === 4) {
            chatState.step = 5;
            chatState.data["築年数・広さ希望"] = userInputText;
            return {
                text: "入居ご希望の「時期」はいつ頃をお考えでしょうか？",
                options: [
                    { text: "⚡️ 即入居・今すぐ", value: "now" },
                    { text: "🗓 1ヶ月以内", value: "1month" },
                    { text: "🗓 2〜3ヶ月以内", value: "3months" },
                    { text: "🔍 良い物件があれば検討", value: "someday" }
                ]
            };
        } else if (chatState.step === 5) {
            chatState.step = 6;
            chatState.data["入居時期"] = userInputText;
            return {
                text: "ありがとうございます！\n最後に「譲れないこだわり条件」をお選びください。",
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
                text: "たくさんの条件をお知らせいただきありがとうございます！\nご希望にマッチする最新のお部屋データをご用意いたしました。\n\nお問合せフォームへ自動引き継ぎいたしますので、下記よりお進みください！",
                options: [
                    { text: "📅 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // --------------------------------------
    // ②【物件を貸したい（オーナー）】7ターン
    // --------------------------------------
    if (chatState.mode === "owner") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["物件種別"] = userInputText;
            return {
                text: "ありがとうございます。\n物件のおおよその「所在地（エリア）」をお選びください。",
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
                text: "ご所有物件の「間取り」を教えていただけますか？",
                options: [
                    { text: "🛋 単身用（1K〜1LDK）", value: "single" },
                    { text: "🛋 ファミリー用（2LDK〜3LDK）", value: "family" },
                    { text: "🏠 大型・戸建て（4LDK以上）", value: "large" },
                    { text: "🏢 一棟まるごと（複数室）", value: "building" }
                ]
            };
        } else if (chatState.step === 3) {
            chatState.step = 4;
            chatState.data["物件の間取り"] = userInputText;
            return {
                text: "おおよその「築年数」はどちらになりますでしょうか？",
                options: [
                    { text: "✨ 築10年未満（築浅）", value: "under10" },
                    { text: "🏢 築10年〜20年程度", value: "under20" },
                    { text: "🏚 築20年以上", value: "over20" },
                    { text: "❓ 不明・要確認", value: "unknown" }
                ]
            };
        } else if (chatState.step === 4) {
            chatState.step = 5;
            chatState.data["築年数"] = userInputText;
            return {
                text: "現在の「お部屋の現況（稼働状況）」を教えてください。",
                options: [
                    { text: "❓ 現在、空室中", value: "vacancy" },
                    { text: "🚪 近々、退去予定", value: "leaving" },
                    { text: "🏠 現在、満室稼働中", value: "full" },
                    { text: "👤 居住中（貸出検討段階）", value: "living" }
                ]
            };
        } else if (chatState.step === 5) {
            chatState.step = 6;
            chatState.data["現況"] = userInputText;
            return {
                text: "ご検討されている「管理・貸出形態」はございますか？",
                options: [
                    { text: "🤝 入居者募集", value: "manage" },
                    { text: "🛡 管理を任せたい", value: "sublease" },
                    { text: "💰 査定賃料だけ知りたい", value: "estimate" },
                    { text: "💡 初めてなので相談して決めたい", value: "consult" }
                ]
            };
        } else {
            chatState.data["ご希望の管理形態"] = userInputText;
            return {
                text: "詳細な情報をお知らせいただきありがとうございます！\n適正な賃料試算および最適な管理プランをご案内いたします。\n\n下記ボタンより、お問合せ・無料査定へお進みください！",
                options: [
                    { text: "📋 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // --------------------------------------
    // ③【物件を売りたい（売却）】7ターン
    // --------------------------------------
    if (chatState.mode === "sell") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["物件種別"] = userInputText;
            return {
                text: "承知いたしました。\nご売却をご検討中の「所在地（エリア）」をお選びください。",
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
                text: "ご売却物件の「間取り・広さの目安」を教えてください。",
                options: [
                    { text: "🛋 コンパクト（〜50㎡程度 / 1〜2LDK）", value: "small" },
                    { text: "🏠 標準ファミリー（50〜80㎡程度 / 3LDK）", value: "medium" },
                    { text: "🏡 大型（80㎡以上 / 4LDK以上）", value: "large" },
                    { text: "🏢 一棟物件・土地", value: "land_building" }
                ]
            };
        } else if (chatState.step === 3) {
            chatState.step = 4;
            chatState.data["間取り・広さ"] = userInputText;
            return {
                text: "おおよその「築年数」はお分かりでしょうか？",
                options: [
                    { text: "✨ 築10年以内", value: "under10" },
                    { text: "🏢 築10年〜20年程度", value: "under20" },
                    { text: "🏚 築20年以上", value: "over20" },
                    { text: "🏞 土地のため築年数なし", value: "none" }
                ]
            };
        } else if (chatState.step === 4) {
            chatState.step = 5;
            chatState.data["築年数"] = userInputText;
            return {
                text: "現在の「ご所有物件の現況」をお知らせください。",
                options: [
                    { text: "👤 自身で居住中", value: "living" },
                    { text: "🚪 現在、空家・空室", value: "empty" },
                    { text: "💰 賃貸中（オーナーチェンジ）", value: "rented" },
                    { text: "👨‍👩‍👧 相続・代理所有", value: "inherited" }
                ]
            };
        } else if (chatState.step === 5) {
            chatState.step = 6;
            chatState.data["物件の現況"] = userInputText;
            return {
                text: "ご売却をご検討の「時期・目的」をお選びください。",
                options: [
                    { text: "⚡️ なるべく早く売却したい", value: "quick" },
                    { text: "📊 まずは簡易査定で価格を知りたい", value: "market" },
                    { text: "🏡 住み替え（買換え）に合わせて", value: "change" },
                    { text: "🗓 半年〜1年以内に売却検討", value: "future" }
                ]
            };
        } else {
            chatState.data["売却ご希望時期"] = userInputText;
            return {
                text: "詳細をご入力いただきありがとうございます！\n周辺相場や取引実績をもとに、精度が高い無料査定を行います。\n\n下記ボタンより、お問合せへお進みください！",
                options: [
                    { text: "📝 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // --------------------------------------
    // ④【物件を買いたい（購入）】7ターン
    // --------------------------------------
    if (chatState.mode === "buy") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["購入希望種別"] = userInputText;
            return {
                text: "ありがとうございます！\nご購入をご希望の「エリア（地域）」はお決まりでしょうか？",
                options: [
                    { text: "📍 赤羽・北区エリア限定", value: "akabane" },
                    { text: "📍 その他東京23区内", value: "tokyo23" },
                    { text: "📍 埼玉県内", value: "saitama" },
                    { text: "💡 広域で探している", value: "wide" }
                ]
            };
        } else if (chatState.step === 2) {
            chatState.step = 3;
            chatState.data["希望エリア"] = userInputText;
            return {
                text: "ご予算の「イメージ上限」をお選びください。",
                options: [
                    { text: "💰 3,000万円以内", value: "3000" },
                    { text: "💰 5,000万円以内", value: "5000" },
                    { text: "💰 7,000万円以内", value: "7000" },
                    { text: "💰 7,000万円以上", value: "over7000" }
                ]
            };
        } else if (chatState.step === 3) {
            chatState.step = 4;
            chatState.data["ご予算上限"] = userInputText;
            return {
                text: "ご希望の「間取り・広さ」をお聞かせください。",
                options: [
                    { text: "🛋 1LDK〜2DK（単身・二人暮らし）", value: "1ldk" },
                    { text: "🛋 2LDK〜3LDK（ファミリー）", value: "3ldk" },
                    { text: "🏠 4LDK以上（広め・戸建て）", value: "4ldk" },
                    { text: "🏬 一棟・事業用・投資用", value: "business" }
                ]
            };
        } else if (chatState.step === 4) {
            chatState.step = 5;
            chatState.data["希望間取り"] = userInputText;
            return {
                text: "「築年数」のご希望はいかがでしょうか？",
                options: [
                    { text: "✨ 新築・築浅（築10年以内）", value: "new" },
                    { text: "🏢 築20年以内（新耐震基準）", value: "under20" },
                    { text: "🛠 築古リノベーション・リフォーム前提", value: "renovation" },
                    { text: "⚖️ 特に拘らない（価格・立地優先）", value: "any" }
                ]
            };
        } else if (chatState.step === 5) {
            chatState.step = 6;
            chatState.data["希望築年数"] = userInputText;
            return {
                text: "「住宅ローンのご相談」やご検討状況はいかがでしょうか？",
                options: [
                    { text: "🏦 住宅ローンの事もあわせて相談したい", value: "loan_consult" },
                    { text: "👍 事前審査通過済み・自己資金あり", value: "loan_ok" },
                    { text: "🏡 現在の自宅を売却して買換え希望", value: "trade_in" },
                    { text: "💡 まずは物件探しから始めたい", value: "first_search" }
                ]
            };
        } else {
            chatState.data["住宅ローン・ご状況"] = userInputText;
            return {
                text: "たくさんのご条件をお知らせいただきありがとうございます！\nネット非公開の未公開物件情報も含めてご案内させていただきます。\n\n下記ボタンより、お問合せへお進みください！",
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

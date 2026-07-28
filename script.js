// チャット状態の管理
const chatState = {
    mode: null,
    step: 0,
    area: "",
    data: {},
    history: []
};

// エリア魅力データ
const areaInfo = {
    "赤羽": "JR各線が乗り入れていて都心や埼玉方面へのアクセスが抜群！商店街や飲食店も豊富で生活利便性が非常に高い人気の街です。",
    "新宿": "複数路線が利用可能で通勤・通学の利便性は間違いなくトップクラス！商業施設も揃う大都会の真ん中です。",
    "池袋": "山手線をはじめアクセスが良好で、ショッピングやエンタメ施設が充実した非常に便利なエリアです。"
};

// 初期表示選択肢
const initialOptions = [
    { text: "🏠 部屋を借りたい（賃貸）", value: "rent" },
    { text: "🔑 物件を貸したい（貸主）", value: "owner" },
    { text: "🏢 物件を売りたい（売却）", value: "sell" },
    { text: "🏡 物件を買いたい（購入）", value: "buy" }
];

// 画面の読み込みが完了したら初期メッセージを表示する
window.addEventListener("load", () => {
    initChat();
});

function initChat() {
    // 既存メッセージを一度クリア
    const msgContainer = document.getElementById("chatMessages");
    if (msgContainer) msgContainer.innerHTML = "";
    
    appendBotMessage("いらっしゃいませ！\n不動産ご案内AIアシスタントです。\n\n本日はどのようなご相談でしょうか？\n下の選択肢よりお選びください。");
    renderOptions(initialOptions);
}

// AI応答メインロジック
function getAIResponse(userInputText) {
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
                { text: "🏢 マンション・アパート", value: "mansion" },
                { text: "🏠 一戸建て", value: "house" },
                { text: "🏬 事業用・事務所", value: "apartment" }
            ]
        };
    } else if (userInputText.includes("売りたい") || userInputText.includes("売却")) {
        chatState.mode = "sell";
        chatState.step = 1;
        return {
            text: "物件のご売却のご相談ですね！\nご所有物件の「種別」をお選びください。",
            options: [
                { text: "🏢 マンション", value: "sell_mansion" },
                { text: "🏠 戸建て・土地", value: "sell_house" }
            ]
        };
    } else if (userInputText.includes("買いたい") || userInputText.includes("購入")) {
        chatState.mode = "buy";
        chatState.step = 1;
        return {
            text: "物件のご購入のご相談ですね！\nどのような種別をお探しでしょうか？",
            options: [
                { text: "🏢 新築・中古マンション", value: "buy_mansion" },
                { text: "🏡 新築・中古一戸建て", value: "buy_house" }
            ]
        };
    }

    // エリアの魅力チェック
    let areaComment = "";
    for (const key in areaInfo) {
        if (userInputText.includes(key)) {
            areaComment = `「${key}」ですね！\n${areaInfo[key]}\n\n`;
            chatState.area = key;
            break;
        }
    }

    if (chatState.mode === "rent") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data.area = userInputText;
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
            chatState.data.budget = userInputText;
            return {
                text: "ご予算について承知いたしました！\n次に、ご希望の「間取り・広さ」をお選びください。",
                options: [
                    { text: "🛋 ワンルーム・1K", value: "1k" },
                    { text: "🛋 1LDK・2DK", value: "1ldk" },
                    { text: "🛋 2LDK以上（ファミリー）", value: "2ldk" }
                ]
            };
        } else if (chatState.step === 3) {
            chatState.step = 4;
            chatState.data.layout = userInputText;
            return {
                text: "ありがとうございます！\n最後に「譲れないこだわり条件」があれば教えてください。",
                options: [
                    { text: "🛀 バストイレ別", value: "bt" },
                    { text: "🐶 ペット飼育可", value: "pet" },
                    { text: "🔒 オートロック付き", value: "lock" }
                ]
            };
        } else {
            chatState.data.condition = userInputText;
            return {
                text: "ご希望条件をお知らせいただきありがとうございます！\n条件に合うお部屋の検索・詳細データのご用意が整いました。\n\n「内見予約」または「店舗でのご相談」を承ります。下記よりお進みください！",
                options: [
                    { text: "📅 無料で内見予約・相談をする", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    return {
        text: `「${userInputText}」ですね！承知いたしました。\nどのようなご相談（借りる・貸す・買う・売る）をお望みでしょうか？`,
        options: initialOptions
    };
}

// メッセージ描画（Bot）
function appendBotMessage(text) {
    const container = document.getElementById("chatMessages");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "message bot";
    div.innerText = text;
    container.appendChild(div);
    scrollToBottom();
}

// メッセージ描画（User）
function appendUserMessage(text) {
    const container = document.getElementById("chatMessages");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "message user";
    div.innerText = text;
    container.appendChild(div);
    scrollToBottom();
}

// ボタン選択肢描画
function renderOptions(options) {
    const container = document.getElementById("chatOptions");
    if (!container) {
        // もし chatOptions がメッセージ欄の中になければ動的に作成
        const chatBox = document.querySelector(".chat-container");
        const inputArea = document.querySelector(".chat-input-area");
        if (chatBox && inputArea) {
            const newOptContainer = document.createElement("div");
            newOptContainer.id = "chatOptions";
            newOptContainer.className = "chat-options-container";
            chatBox.insertBefore(newOptContainer, inputArea);
            return renderOptions(options);
        }
        return;
    }
    
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

// ボタンタップ時処理
function handleOptionClick(selectedText) {
    appendUserMessage(selectedText);

    if (selectedText.includes("予約") || selectedText.includes("申込む") || selectedText.includes("問合せ")) {
        setTimeout(() => {
            appendBotMessage("ご希望いただきありがとうございます！\n入力いただいた条件を保持して、お問い合わせフォームへ案内いたします...");
            const optContainer = document.getElementById("chatOptions");
            if (optContainer) optContainer.innerHTML = "";

            setTimeout(() => {
                const params = new URLSearchParams({
                    mode: chatState.mode || "",
                    area: chatState.area || "",
                    details: JSON.stringify(chatState.data)
                });
                window.location.href = `contact.html?${params.toString()}`;
            }, 1500);

        }, 300);
        return;
    }

    setTimeout(() => {
        const response = getAIResponse(selectedText);
        appendBotMessage(response.text);
        renderOptions(response.options);
    }, 300);
}

// テキスト送信処理
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

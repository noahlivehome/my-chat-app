// チャット状態の管理
const chatState = {
    category: null,
    turnCount: 0
};

// 初期表示の選択肢
const initialOptions = [
    { text: "🏠 賃貸のお部屋を探したい", value: "rent" },
    { text: "🔑 物件を貸したい（オーナー様）", value: "owner" },
    { text: "🏢 物件を売却したい", value: "sell" },
    { text: "🏡 物件を購入したい", value: "buy" }
];

// 画面読み込み完了時に自動実行
document.addEventListener("DOMContentLoaded", () => {
    initChat();
});

function initChat() {
    appendBotMessage("いらっしゃいませ！\n不動産のご案内AIアシスタントです。\n\n本日はどのようなご相談でしょうか？\n下の選択肢よりお選びください。");
    renderOptions(initialOptions);
}

// Botメッセージ描画
function appendBotMessage(text) {
    const messagesContainer = document.getElementById("chatMessages");
    if (!messagesContainer) return;
    const messageDiv = document.createElement("div");
    messageDiv.className = "message bot";
    messageDiv.innerText = text;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// ユーザーメッセージ描画
function appendUserMessage(text) {
    const messagesContainer = document.getElementById("chatMessages");
    if (!messagesContainer) return;
    const messageDiv = document.createElement("div");
    messageDiv.className = "message user";
    messageDiv.innerText = text;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// ボタン選択肢描画（横2列レイアウト）
function renderOptions(options) {
    const optionsContainer = document.getElementById("chatOptions");
    if (!optionsContainer) return;
    optionsContainer.innerHTML = "";

    if (!options || options.length === 0) return;

    const normalOptions = options.filter(opt => !opt.isPrimary);
    const primaryOptions = options.filter(opt => opt.isPrimary);

    // 通常選択肢（横2列）
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
        optionsContainer.appendChild(gridDiv);
    }

    // 主要CVボタン（緑色全幅）
    primaryOptions.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn primary";
        btn.innerText = opt.text;
        btn.onclick = () => handleOptionClick(opt.text);
        optionsContainer.appendChild(btn);
    });

    scrollToBottom();
}

// 選択肢タップ時の会話制御
function handleOptionClick(selectedText) {
    appendUserMessage(selectedText);
    
    // お問い合わせ等を選択した場合
    if (selectedText.includes("問合せ") || selectedText.includes("予約") || selectedText.includes("査定") || selectedText.includes("フォーム")) {
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

// テキスト送信時の会話制御
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

// AIの応答生成ロジック
function getAIResponse(userInputText) {
    chatState.turnCount++;

    // 5ターン目以降はお問い合わせへ誘導
    if (chatState.turnCount >= 5) {
        return {
            text: "詳細なご条件やお問合せにつきましては、担当スタッフより詳しく丁寧にご案内いたします。\n\nお手数ですが、下記よりお気軽にお問い合わせくださいませ。",
            options: [
                { text: "📅 無料相談・お問い合わせ", value: "contact", isPrimary: true }
            ]
        };
    }

    // ① 賃貸を探したい
    if (userInputText.includes("賃貸") || userInputText.includes("部屋")) {
        chatState.category = "rent";
        return {
            text: "お部屋探しですね！\nご希望のエリア、間取り、ご予算、ペット飼育などのこだわり条件はございますか？\n\n差し支えない範囲で教えていただけますと幸いです！",
            options: [
                { text: "💰 家賃相場を確認", value: "rent_market" },
                { text: "💭 条件（ペット等）伝える", value: "rent_condition" },
                { text: "📅 無料で内見予約・物件問合せをする", value: "contact", isPrimary: true }
            ]
        };
    }

    // ② 貸したい（オーナー様）
    if (userInputText.includes("貸したい") || userInputText.includes("オーナー")) {
        chatState.category = "owner";
        return {
            text: "賃貸管理のご相談ですね！\n所有されている物件のエリアや種別（マンション・戸建てなど）、現在のお悩みについて教えていただけますか？",
            options: [
                { text: "🏢 物件・エリアを伝える", value: "owner_info" },
                { text: "❓ 空室対策のご相談", value: "owner_vacancy" },
                { text: "📋 賃料試算・無料相談を予約する", value: "contact", isPrimary: true }
            ]
        };
    }

    // ③ 売却したい
    if (userInputText.includes("売却") || userInputText.includes("売り")) {
        chatState.category = "sell";
        return {
            text: "ご売却のご相談ですね！\nご売却をご検討中の物件エリアや時期、現状のお悩みなどについて教えていただけますか？",
            options: [
                { text: "📍 エリア・時期を伝える", value: "sell_info" },
                { text: "📊 査定の流れを聞く", value: "sell_flow" },
                { text: "📝 無料査定を申し込む", value: "contact", isPrimary: true }
            ]
        };
    }

    // ④ 購入したい
    if (userInputText.includes("購入") || userInputText.includes("買")) {
        chatState.category = "buy";
        return {
            text: "物件ご購入のご相談ですね！\nご希望のエリアや種別（新築・中古戸建て・マンションなど）、ご検討のきっかけなどを教えていただけますか？",
            options: [
                { text: "🏠 希望種別・エリア伝える", value: "buy_info" },
                { text: "💡 住宅ローンの相談", value: "buy_loan" },
                { text: "📱 来店・オンライン相談を予約する", value: "contact", isPrimary: true }
            ]
        };
    }

    // トラブル・法律系への対応
    if (userInputText.includes("トラブル") || userInputText.includes("契約") || userInputText.includes("法律") || userInputText.includes("違約金")) {
        return {
            text: "ご質問ありがとうございます。\nお約束事や専門的なご相談につきましては、専門スタッフより詳しくご案内いたします。\n\nお手数ですが直接お問い合わせいただけますでしょうか。",
            options: [
                { text: "📩 専門スタッフに相談する", value: "contact", isPrimary: true }
            ]
        };
    }

    // 会話継続時の返答
    return {
        text: "ご回答いただきありがとうございます！\n他にご希望や気になる条件などはございますか？\n\nご希望のボタンをお選びいただくか、メッセージで教えてください。",
        options: [
            { text: "✨ その他の条件を伝える", value: "more_detail" },
            { text: "🔍 詳しい相談をしたい", value: "more_consult" },
            { text: "📅 無料で相談予約・問合せをする", value: "contact", isPrimary: true }
        ]
    };
}

// Enterキー対応
function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

// スクロール最下部移動
function scrollToBottom() {
    const messagesContainer = document.getElementById("chatMessages");
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

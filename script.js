window.addEventListener("load", () => {
    initChat();
});

function initChat() {
    if (typeof window.getWelcomeMessage === "function") {
        const welcomeData = window.getWelcomeMessage();
        appendBotMessage(welcomeData.text);
        renderOptions(welcomeData.options);
    } else {
        // 万が一 api/chat.js が読み込めなかった場合のフォールバック表示
        appendBotMessage("いらっしゃいませ！\n不動産のご案内AIアシスタントです。\n\n本日はどのようなご相談でしょうか？");
        renderOptions([
            { text: "🏠 賃貸のお部屋を探したい", value: "rent" },
            { text: "🔑 物件を貸したい（オーナー様）", value: "owner" },
            { text: "🏢 物件を売却したい", value: "sell" },
            { text: "🏡 物件を購入したい", value: "buy" }
        ]);
    }
}

// Botメッセージを表示
function appendBotMessage(text) {
    const messagesContainer = document.getElementById("chatMessages");
    if (!messagesContainer) return;
    const messageDiv = document.createElement("div");
    messageDiv.className = "message bot";
    messageDiv.innerText = text;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// ユーザーメッセージを表示
function appendUserMessage(text) {
    const messagesContainer = document.getElementById("chatMessages");
    if (!messagesContainer) return;
    const messageDiv = document.createElement("div");
    messageDiv.className = "message user";
    messageDiv.innerText = text;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// ボタン選択肢の表示
function renderOptions(options) {
    const optionsContainer = document.getElementById("chatOptions");
    if (!optionsContainer) return;
    optionsContainer.innerHTML = "";

    if (!options || options.length === 0) return;

    const normalOptions = options.filter(opt => !opt.isPrimary);
    const primaryOptions = options.filter(opt => opt.isPrimary);

    // 通常ボタン（横並び）
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

    // CVボタン（緑色全幅）
    primaryOptions.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn primary";
        btn.innerText = opt.text;
        btn.onclick = () => handleOptionClick(opt.text);
        optionsContainer.appendChild(btn);
    });

    scrollToBottom();
}

// 選択肢タップ時の処理
function handleOptionClick(selectedText) {
    appendUserMessage(selectedText);
    
    if (selectedText.includes("問合せ") || selectedText.includes("予約") || selectedText.includes("査定") || selectedText.includes("フォーム")) {
        setTimeout(() => {
            appendBotMessage("ご希望いただきありがとうございます！\n下記のお問い合わせ窓口（またはフォーム）よりお進みくださいませ。");
            document.getElementById("chatOptions").innerHTML = "";
        }, 300);
        return;
    }

    setTimeout(() => {
        if (typeof window.sendChatMessage === "function") {
            const response = window.sendChatMessage(selectedText);
            appendBotMessage(response.text);
            renderOptions(response.options);
        }
    }, 300);
}

// テキスト送信時の処理
function sendMessage() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (text === "") return;

    appendUserMessage(text);
    input.value = "";

    setTimeout(() => {
        if (typeof window.sendChatMessage === "function") {
            const response = window.sendChatMessage(text);
            appendBotMessage(response.text);
            renderOptions(response.options);
        }
    }, 300);
}

// Enterキー制御
function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

// スクロール最下部へ移動
function scrollToBottom() {
    const messagesContainer = document.getElementById("chatMessages");
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

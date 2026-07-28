document.addEventListener("DOMContentLoaded", () => {
    // 初期表示の実行
    initChat();
});

function initChat() {
    if (typeof getWelcomeMessage === "function") {
        const welcomeData = getWelcomeMessage();
        appendBotMessage(welcomeData.text);
        renderOptions(welcomeData.options);
    } else {
        console.error("api/chat.js が正しく読み込まれていません。");
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

// 選択肢タップ時のイベント制御
function handleOptionClick(selectedText) {
    appendUserMessage(selectedText);
    
    if (selectedText.includes("問合せ") || selectedText.includes("予約") || selectedText.includes("査定") || selectedText.includes("フォーム")) {
        setTimeout(() => {
            appendBotMessage("ご希望いただきありがとうございます！\n下記のお問い合わせ窓口（またはフォーム）よりお進みくださいませ。");
            document.getElementById("chatOptions").innerHTML = "";
        }, 400);
        return;
    }

    setTimeout(() => {
        const response = sendChatMessage(selectedText);
        appendBotMessage(response.text);
        renderOptions(response.options);
    }, 400);
}

// テキスト送信時のイベント制御
function sendMessage() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (text === "") return;

    appendUserMessage(text);
    input.value = "";

    setTimeout(() => {
        const response = sendChatMessage(text);
        appendBotMessage(response.text);
        renderOptions(response.options);
    }, 400);
}

// Enterキー押下時
function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

// スクロール制御
function scrollToBottom() {
    const messagesContainer = document.getElementById("chatMessages");
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

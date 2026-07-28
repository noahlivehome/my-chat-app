document.addEventListener("DOMContentLoaded", () => {
    // 初期表示
    const welcomeData = getWelcomeMessage();
    appendBotMessage(welcomeData.text);
    renderOptions(welcomeData.options);
});

// Botメッセージを表示
function appendBotMessage(text) {
    const messagesContainer = document.getElementById("chatMessages");
    const messageDiv = document.createElement("div");
    messageDiv.className = "message bot";
    messageDiv.innerText = text;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// ユーザーメッセージを表示
function appendUserMessage(text) {
    const messagesContainer = document.getElementById("chatMessages");
    const messageDiv = document.createElement("div");
    messageDiv.className = "message user";
    messageDiv.innerText = text;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// ボタン選択肢の表示
function renderOptions(options) {
    const optionsContainer = document.getElementById("chatOptions");
    optionsContainer.innerHTML = "";

    if (!options || options.length === 0) return;

    // 通常ボタンとプライマリ（コンバージョン）ボタンを分類
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

    // メインCVボタン（緑色の全幅ボタン）
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
async function handleOptionClick(selectedText) {
    appendUserMessage(selectedText);
    
    // コンバージョン選択時
    if (selectedText.includes("問合せ") || selectedText.includes("予約") || selectedText.includes("査定") || selectedText.includes("フォーム")) {
        setTimeout(() => {
            appendBotMessage("ご希望いただきありがとうございます！\n下記のお問い合わせ窓口（またはフォーム）よりお進みくださいませ。");
            document.getElementById("chatOptions").innerHTML = "";
        }, 400);
        return;
    }

    // api/chat.jsの応答関数を実行
    const response = await sendChatMessage(selectedText);
    appendBotMessage(response.text);
    renderOptions(response.options);
}

// テキスト送信時のイベント制御
async function sendMessage() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (text === "") return;

    appendUserMessage(text);
    input.value = "";

    // api/chat.jsの応答関数を実行
    const response = await sendChatMessage(text);
    appendBotMessage(response.text);
    renderOptions(response.options);
}

// Enterキー押下時の送信制御
function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

// 画面最下部への自動スクロール
function scrollToBottom() {
    const messagesContainer = document.getElementById("chatMessages");
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

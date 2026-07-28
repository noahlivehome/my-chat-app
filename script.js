window.addEventListener("load", () => {
    initChat();
});

function initChat() {
    if (typeof window.getWelcomeMessage === "function") {
        const welcomeData = window.getWelcomeMessage();
        appendBotMessage(welcomeData.text);
        renderOptions(welcomeData.options);
    }
}

// Botメッセージを画面に追加
function appendBotMessage(text) {
    const messagesContainer = document.getElementById("chatMessages");
    if (!messagesContainer) return;
    const messageDiv = document.createElement("div");
    messageDiv.className = "message bot";
    messageDiv.innerText = text;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// ユーザーメッセージを画面に追加
function appendUserMessage(text) {
    const messagesContainer = document.getElementById("chatMessages");
    if (!messagesContainer) return;
    const messageDiv = document.createElement("div");
    messageDiv.className = "message user";
    messageDiv.innerText = text;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// ボタン選択肢の生成（2列グリッド配置）
function renderOptions(options) {
    const optionsContainer = document.getElementById("chatOptions");
    if (!optionsContainer) return;
    optionsContainer.innerHTML = "";

    if (!options || options.length === 0) return;

    const normalOptions = options.filter(opt => !opt.isPrimary);
    const primaryOptions = options.filter(opt => opt.isPrimary);

    // 通常選択肢（横2列グリッドで配置）
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

    // 主要コンバージョンボタン（緑色全幅）
    primaryOptions.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn primary";
        btn.innerText = opt.text;
        btn.onclick = () => handleOptionClick(opt.text);
        optionsContainer.appendChild(btn);
    });

    scrollToBottom();
}

// 選択肢ボタンがクリックされた時の処理
function handleOptionClick(selectedText) {
    // 1. ユーザーの発話を画面に表示
    appendUserMessage(selectedText);

    // 2. お問い合わせ等を選択した場合の完了制御
    if (selectedText.includes("問合せ") || selectedText.includes("予約") || selectedText.includes("査定") || selectedText.includes("フォーム")) {
        setTimeout(() => {
            appendBotMessage("ご希望いただきありがとうございます！\n下記のお問い合わせ窓口（またはフォーム）よりお進みくださいませ。");
            document.getElementById("chatOptions").innerHTML = "";
        }, 300);
        return;
    }

    // 3. 次の会話コメントと選択肢を生成して画面更新
    setTimeout(() => {
        if (typeof window.sendChatMessage === "function") {
            const response = window.sendChatMessage(selectedText);
            appendBotMessage(response.text);
            renderOptions(response.options);
        }
    }, 300);
}

// メッセージ送信ボタン時の処理
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

// Enterキーでの送信制御
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

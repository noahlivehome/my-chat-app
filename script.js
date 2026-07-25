let conversationHistory = [];

// 💡 選択ボタンを押した時の処理
function sendQuickMessage(text) {
  const inputElement = document.getElementById("user-input");
  inputElement.value = text;
  sendMessage();
}

// 💡 Enterキーで送信する処理
function handleKeyPress(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
}

// メッセージ送信のメイン処理
async function sendMessage() {
  const inputElement = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const message = inputElement.value.trim();

  // 空文字なら送信しない
  if (!message) return;

  // 連打防止のため入力とボタンを一時無効化
  inputElement.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  // 1. ユーザーのメッセージを画面に表示
  appendMessage("user", message);
  inputElement.value = "";

  try {
    // 2. APIに送信
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        message: message,
        history: conversationHistory
      })
    });

    const data = await response.json();

    if (data.reply) {
      // 3. AIの返答を表示
      appendMessage("assistant", data.reply);

      // 4. 会話履歴に記憶させる
      conversationHistory.push({ role: "user", content: message });
      conversationHistory.push({ role: "assistant", content: data.reply });
    } else {
      appendMessage("assistant", "エラーが発生しました。もう一度お試しください。");
    }

  } catch (error) {
    console.error("送信エラー:", error);
    appendMessage("assistant", "通信エラーが発生しました。");
  } finally {
    // 送信完了後に入力とボタンを再有効化
    inputElement.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    inputElement.focus();
  }
}

// メッセージを画面に追加表示する関数
function appendMessage(sender, text) {
  const chatLogs = document.getElementById("chat-logs");
  if (!chatLogs) return;

  const messageElement = document.createElement("div");
  messageElement.className = `message ${sender}`;
  messageElement.textContent = text;

  chatLogs.appendChild(messageElement);
  chatLogs.scrollTop = chatLogs.scrollHeight;
}

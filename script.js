let conversationHistory = [];

// クイック選択ボタンが押されたとき
function sendQuickMessage(text) {
  const inputElement = document.getElementById("user-input");
  if (inputElement) {
    inputElement.value = text;
    sendMessage();
  }
}

// Enterキーが押されたとき
function handleKeyPress(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
}

// メッセージ送信メイン処理
async function sendMessage() {
  const inputElement = document.getElementById("user-input");
  if (!inputElement) return;

  const message = inputElement.value.trim();
  if (!message) return;

  // 1. ユーザーの吹き出しを画面に追加
  appendMessage("user-message", message);
  inputElement.value = "";

  try {
    // 2. サーバー（Groq API）に送信
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
      appendMessage("bot-message", data.reply);

      // 4. 履歴を蓄積
      conversationHistory.push({ role: "user", content: message });
      conversationHistory.push({ role: "assistant", content: data.reply });
    } else {
      appendMessage("bot-message", "エラーが発生しました。もう一度お試しください。");
    }

  } catch (error) {
    console.error("送信エラー:", error);
    appendMessage("bot-message", "通信エラーが発生しました。");
  }
}

// 画面にメッセージを表示する補助関数
function appendMessage(senderClass, text) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const messageElement = document.createElement("div");
  messageElement.className = `message ${senderClass}`;
  
  // 改行を <br> に変換
  messageElement.innerHTML = text.replace(/\n/g, '<br>');

  chatBody.appendChild(messageElement);
  
  // 自動スクロール
  chatBody.scrollTop = chatBody.scrollHeight;
}

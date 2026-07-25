// 会話の履歴を保存しておくための配列（変数は一番上で定義）
let conversationHistory = [];

// チャット送信処理の関数
async function sendMessage() {
  const inputElement = document.getElementById("user-input"); // 入力欄のID（お使いのIDに合わせて変更してください）
  const message = inputElement.value.trim();

  // 空文字の場合は送信しない
  if (!message) return;

  // 1. ユーザーのメッセージを画面に表示
  appendMessage("user", message);
  inputElement.value = ""; // 入力欄をクリア

  try {
    // 2. バックエンド API にリクエストを送信
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      // ★ここが重要：現在のメッセージと一緒に過去の会話履歴 (history) を送る
      body: JSON.stringify({
        message: message,
        history: conversationHistory
      })
    });

    const data = await response.json();

    if (data.reply) {
      // 3. AIの返答を画面に表示
      appendMessage("assistant", data.reply);

      // 4. ★最重要：今回のやり取りを会話履歴に追加して記憶させる
      conversationHistory.push({ role: "user", content: message });
      conversationHistory.push({ role: "assistant", content: data.reply });

    } else {
      appendMessage("assistant", "エラーが発生しました。もう一度お試しください。");
    }

  } catch (error) {
    console.error("送信エラー:", error);
    appendMessage("assistant", "通信エラーが発生しました。");
  }
}

// 画面にメッセージを追加表示するための補助関数
function appendMessage(sender, text) {
  const chatLogs = document.getElementById("chat-logs"); // チャット表示領域のID
  if (!chatLogs) return;

  const messageElement = document.createElement("div");
  messageElement.className = `message ${sender}`;
  messageElement.textContent = text;

  chatLogs.appendChild(messageElement);
  
  // 常に一番下まで自動スクロール
  chatLogs.scrollTop = chatLogs.scrollHeight;
}

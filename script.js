let conversationHistory = [];
let turnCount = 0; // 会話のラリー回数

// 画面読み込み時の初期設定
document.addEventListener("DOMContentLoaded", function() {
  const sendBtn = document.getElementById("send-btn");
  const userInput = document.getElementById("user-input");

  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
  }

  if (userInput) {
    userInput.addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
      }
    });
  }
});

// クイック選択ボタンが押されたとき
function sendQuickMessage(text) {
  const userInput = document.getElementById("user-input");
  if (userInput) {
    userInput.value = text;
    sendMessage();
  }
}

// 送信メイン処理
async function sendMessage() {
  const userInput = document.getElementById("user-input");
  if (!userInput) return;

  const message = userInput.value.trim();
  if (!message) return;

  // 1. ユーザーのメッセージを表示
  appendMessage("user-message", message);
  userInput.value = "";
  turnCount++; // ラリー回数を加算

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

    if (response.ok && data.reply) {
      // 3. AIの返答を表示
      appendMessage("bot-message", data.reply);

      // 4. 会話履歴を更新
      conversationHistory.push({ role: "user", content: message });
      conversationHistory.push({ role: "assistant", content: data.reply });

      // 5. ボタンと入力欄の更新
      updateQuickButtons(message);

    } else {
      console.error("API Error:", data);
      appendMessage("bot-message", `エラーが発生しました: ${data.error || "通信失敗"}`);
    }

  } catch (error) {
    console.error("送信エラー:", error);
    appendMessage("bot-message", "通信エラーが発生しました。時間を置いて再度お試しください。");
  }
}

// メッセージ表示関数
function appendMessage(senderClass, text) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const messageElement = document.createElement("div");
  messageElement.className = `message ${senderClass}`;
  
  const cleanText = text.replace(/\*\*/g, '');
  messageElement.innerHTML = cleanText.replace(/\n/g, '<br>');

  chatBody.appendChild(messageElement);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// ボタン表示制御および入力制御関数
function updateQuickButtons(lastMessage) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  if (!quickButtonsDiv) return;

  const contactUrl = "https://www.noahlivehome.jp/contact/"; 
  let newButtons = [];

  // ★ 5回以上のラリー達成時の処理
  if (turnCount >= 5) {
    newButtons = [
      { label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];

    // 入力エリアを無効化（案内完了のため）
    if (userInput) {
      userInput.placeholder = "お問い合わせ画面へお進みください";
      userInput.disabled = true;
    }
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.style.opacity = "0.5";
      sendBtn.style.cursor = "not-allowed";
    }

  } 
  // 1〜4回目のラリー中
  else if (lastMessage.includes("貸したい") || lastMessage.includes("売却")) {
    newButtons = [
      { label: "📊 無料査定を依頼する", url: contactUrl },
      { label: "💵 費用や手数料を聞く", text: "かかる費用や手数料について知りたい" },
      { label: "💡 他にも質問する", text: "他にも質問があります" }
    ];
  } else if (lastMessage.includes("賃貸") || lastMessage.includes("借りたい") || lastMessage.includes("探したい")) {
    newButtons = [
      { label: "📍 おすすめエリア・条件を相談", text: "おすすめのエリアや家賃相場を教えてほしい" },
      { label: "📝 内見・申し込みの流れを聞く", text: "内見や申し込みの手順はどうなりますか？" },
      { label: "📩 今すぐ相談する", url: contactUrl }
    ];
  } else {
    newButtons = [
      { label: "📩 お問い合わせ画面へ", url: contactUrl },
      { label: "💡 詳しく聞く", text: "もう少し詳しく教えてください" },
      { label: "🔄 最初に戻る", text: "最初に戻る" }
    ];
  }

  // ボタンエリア描画
  quickButtonsDiv.innerHTML = "";
  
  newButtons.forEach(btn => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = btn.label;
    
    if (btn.isPrimary) {
      button.className = "primary-action-btn";
    }

    button.addEventListener("click", function(e) {
      e.preventDefault();
      if (btn.url) {
        window.open(btn.url, '_blank');
      } else if (btn.text) {
        sendQuickMessage(btn.text);
      }
    });
    
    quickButtonsDiv.appendChild(button);
  });
}

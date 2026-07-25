let conversationHistory = [];

// ボタンを押した時の処理
function sendQuickMessage(text) {
  const inputElement = document.getElementById("user-input");
  if (inputElement) {
    inputElement.value = text;
    sendMessage();
  }
}

// Enterキーで送信
function handleKeyPress(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
}

// 送信処理
async function sendMessage() {
  const inputElement = document.getElementById("user-input");
  if (!inputElement) return;

  const message = inputElement.value.trim();
  if (!message) return;

  // 1. ユーザーのメッセージを表示
  appendMessage("user-message", message);
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

    if (response.ok && data.reply) {
      // 3. AIの返答を表示
      appendMessage("bot-message", data.reply);

      // 4. 会話履歴を更新
      conversationHistory.push({ role: "user", content: message });
      conversationHistory.push({ role: "assistant", content: data.reply });

      // 5. 💡 次の状況に合わせた「次のボタン」を動的にセットする
      updateQuickButtons(message);

    } else {
      console.error("API Error Details:", data);
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
  messageElement.innerHTML = text.replace(/\n/g, '<br>');

  chatBody.appendChild(messageElement);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// 💡 相談の流れに合わせて「次のボタン」を更新する関数
function updateQuickButtons(lastMessage) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  let newButtons = [];

  if (lastMessage.includes("賃貸") || lastMessage.includes("探したい")) {
    newButtons = [
      { label: "📍 エリア・駅の相談", text: "おすすめのエリアを教えてほしいです" },
      { label: "💰 家賃相場を知りたい", text: "家賃の相場について教えてください" },
      { label: "📝 審査や費用の相談", text: "初期費用はどれくらいかかりますか？" },
      { label: "🏠 相談をやり直す", text: "最初に戻る" }
    ];
  } else if (lastMessage.includes("売却")) {
    newButtons = [
      { label: "📊 査定の流れ", text: "売却査定の流れを教えてください" },
      { label: "💵 手数料や税金", text: "売却にかかる費用や税金は？" },
      { label: "🏠 相談をやり直す", text: "最初に戻る" }
    ];
  } else if (lastMessage.includes("最初に戻る")) {
    newButtons = [
      { label: "🔍 賃貸を探したい", text: "賃貸物件を探したい" },
      { label: "🔑 貸したい", text: "貸したい" },
      { label: "🏠 売却したい", text: "売却したい" },
      { label: "💰 購入したい", text: "購入したい" }
    ];
  } else {
    // デフォルトの追質問ボタン
    newButtons = [
      { label: "💡 詳しく聞く", text: "もう少し詳しく教えてください" },
      { label: "📞 担当者に相談したい", text: "店舗や担当者と直接話すにはどうすればいいですか？" },
      { label: "🔄 別の相談をする", text: "最初に戻る" }
    ];
  }

  // ボタンエリアを書き換え
  quickButtonsDiv.innerHTML = newButtons.map(btn => 
    `<button type="button" onclick="sendQuickMessage('${btn.text}')">${btn.label}</button>`
  ).join('');
}

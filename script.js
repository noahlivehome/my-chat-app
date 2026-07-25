let conversationHistory = [];
let turnCount = 0; // 会話のラリー回数をカウント

// クイック選択ボタンが押されたとき
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

// 送信メイン処理
async function sendMessage() {
  const inputElement = document.getElementById("user-input");
  if (!inputElement) return;

  const message = inputElement.value.trim();
  if (!message) return;

  // 1. ユーザーのメッセージを表示
  appendMessage("user-message", message);
  inputElement.value = "";
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

      // 5. 次の選択肢ボタンを更新（会話数に応じて問い合わせも提案）
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
  
  // マークダウン除去＆改行処理
  const cleanText = text.replace(/\*\*/g, '');
  messageElement.innerHTML = cleanText.replace(/\n/g, '<br>');

  chatBody.appendChild(messageElement);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// 💡 会話の流れや回数に応じて「次のボタン」を動的に更新する関数
function updateQuickButtons(lastMessage) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  let newButtons = [];

  // お問い合わせURL（※自社のフォームURL等に書き換えてください）
  const contactUrl = "https://example.com/contact"; 

  // 1. ユーザーが直接「問い合わせ」を求めた、または会話が一定数（2ターン以上）進んだ場合
  if (lastMessage.includes("相談したい") || lastMessage.includes("問合せ") || turnCount >= 2) {
    newButtons = [
      { label: "📩 フォームで問い合わせる", action: () => window.open(contactUrl, '_blank') },
      { label: "📞 担当者に電話で相談", text: "電話で相談したいです" },
      { label: "💡 質問を続ける", text: "もう少し質問があります" },
      { label: "🔄 最初に戻る", text: "最初に戻る" }
    ];
  } 
  // 2. 賃貸・購入など最初のカテゴリ選択直後
  else if (lastMessage.includes("賃貸") || lastMessage.includes("探したい")) {
    newButtons = [
      { label: "📍 おすすめエリア・条件", text: "おすすめのエリアや家賃相場を教えてほしい" },
      { label: "📝 内見・申し込みの流れ", text: "内見や申し込みの手順はどうなりますか？" },
      { label: "📩 無料で店舗に相談する", action: () => window.open(contactUrl, '_blank') },
      { label: "🏠 最初に戻る", text: "最初に戻る" }
    ];
  } else if (lastMessage.includes("売却")) {
    newButtons = [
      { label: "📊 無料で査定を依頼する", action: () => window.open(contactUrl, '_blank') },
      { label: "💵 売却にかかる費用", text: "売却にかかる費用や税金について知りたい" },
      { label: "🏠 最初に戻る", text: "最初に戻る" }
    ];
  } else {
    // デフォルト
    newButtons = [
      { label: "📩 お問い合わせ画面へ", action: () => window.open(contactUrl, '_blank') },
      { label: "💡 詳しく聞く", text: "もう少し詳しく教えてください" },
      { label: "🔄 最初に戻る", text: "最初に戻る" }
    ];
  }

  // ボタンエリアを再構築
  quickButtonsDiv.innerHTML = "";
  newButtons.forEach(btn => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = btn.label;
    
    // 問い合わせ等でURLを開く場合と、チャット送信の場合で処理を分岐
    if (btn.action) {
      button.onclick = btn.action;
      button.style.fontWeight = "bold"; // 問い合わせを目立たせる
    } else {
      button.onclick = () => sendQuickMessage(btn.text);
    }
    
    quickButtonsDiv.appendChild(button);
  });
}

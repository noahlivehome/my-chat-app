let conversationHistory = [];
let turnCount = 0; // ラリー回数

// ページ読み込み完了時にイベントを確実にバインド
window.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("send-btn");
  const userInput = document.getElementById("user-input");

  if (sendBtn) {
    sendBtn.onclick = (e) => {
      e.preventDefault();
      sendMessage();
    };
  }

  if (userInput) {
    userInput.onkeypress = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    };
  }
});

// クイック選択ボタン押下時
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
  if (!message) return; // 空文字送信防止

  // 1. ユーザーメッセージ表示
  appendMessage("user-message", message);
  userInput.value = "";
  turnCount++; // ラリー数加算

  try {
    // 2. API送信
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

      // 4. 会話履歴更新
      conversationHistory.push({ role: "user", content: message });
      conversationHistory.push({ role: "assistant", content: data.reply });

      // 5. ボタン群を更新
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

// メッセージ描画
function appendMessage(senderClass, text) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const messageElement = document.createElement("div");
  messageElement.className = `message ${senderClass}`;
  
  // マークダウン記号除去＆改行適用
  const cleanText = text.replace(/\*\*/g, '');
  messageElement.innerHTML = cleanText.replace(/\n/g, '<br>');

  chatBody.appendChild(messageElement);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// 💡 動的ボタン更新処理
function updateQuickButtons(lastMessage) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  const contactUrl = "https://www.noahlivehome.jp/contact/"; 
  let newButtons = [];

  // ★ 5回以上のラリー達成時（お問い合わせ専用ボタンに統一）
  if (turnCount >= 5) {
    newButtons = [
      { label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 1. 🔑 貸したい（オーナー様向け）
  else if (lastMessage.includes("貸したい") || lastMessage.includes("賃貸経営") || lastMessage.includes("管理")) {
    newButtons = [
      { label: "📊 無料で賃料査定・管理相談を申込む", url: contactUrl, isPrimary: true },
      { label: "🏠 ノアリブホームの管理サポートを聞く", text: "どんな管理サポートや空室対策がありますか？" },
      { label: "💡 貸し出しまでの全体の流れを知りたい", text: "賃貸として貸し出すまでの流れを教えてください" }
    ];
  } 
  // 2. 🏠 売却したい（売主様向け）
  else if (lastMessage.includes("売却") || lastMessage.includes("売りたい")) {
    newButtons = [
      { label: "📊 無料で売却査定を依頼する", url: contactUrl, isPrimary: true },
      { label: "🤝 売却・預かり（媒介）の流れを聞く", text: "売却の手順や売却活動の流れについて教えてください" },
      { label: "💡 売却時のサポート内容を知りたい", text: "ノアリブホームの売却サポートの特徴は何ですか？" }
    ];
  } 
  // 3. 🔍 賃貸を探したい（お部屋探し）
  else if (lastMessage.includes("賃貸") || lastMessage.includes("借りたい") || lastMessage.includes("探したい")) {
    newButtons = [
      { label: "📅 無料で内見予約・物件問合せをする", url: contactUrl, isPrimary: true },
      { label: "📍 おすすめエリア・家賃相場を相談", text: "おすすめのエリアや家賃相場を教えてほしい" },
      { label: "📝 内見から契約までの流れを聞く", text: "内見や申し込みの手順はどうなりますか？" }
    ];
  } 
  // 4. 💰 購入したい（住宅購入）
  else if (lastMessage.includes("購入") || lastMessage.includes("買いたい") || lastMessage.includes("マイホーム")) {
    newButtons = [
      { label: "💬 個別提案・購入のご相談（予約）", url: contactUrl, isPrimary: true },
      { label: "🏦 住宅ローンの進め方・資金計画を聞く", text: "住宅ローンや資金計画の進め方について教えてください" },
      { label: "🏡 物件選びのポイントを知りたい", text: "失敗しない物件選びのポイントは何ですか？" }
    ];
  } 
  // 初期・その他
  else {
    newButtons = [
      { label: "📩 お問い合わせ画面へ", url: contactUrl, isPrimary: true },
      { label: "💡 詳しく聞く", text: "もう少し詳しく教えてください" }
    ];
  }

  // ボタン再描画
  quickButtonsDiv.innerHTML = "";
  
  newButtons.forEach(btn => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = btn.label;
    
    if (btn.isPrimary) {
      button.className = "primary-action-btn";
    }

    button.onclick = (e) => {
      e.preventDefault();
      if (btn.url) {
        window.open(btn.url, '_blank');
      } else if (btn.text) {
        sendQuickMessage(btn.text);
      }
    };
    
    quickButtonsDiv.appendChild(button);
  });
}

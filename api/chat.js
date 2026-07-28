let conversationHistory = [];
let turnCount = 0;
let isSending = false;
let usedButtonTexts = [];
const contactUrl = "https://www.noahlivehome.jp/contact/";

// キーボードのEnterキー対応
document.addEventListener("DOMContentLoaded", () => {
  const userInput = document.getElementById("user-input");
  if (userInput) {
    userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});

// クイックボタン押下時
function sendQuickMessage(text) {
  if (isSending) return;
  sendMessage(text);
}

// 送信メイン処理
async function sendMessage(textFromButton) {
  if (isSending) return;

  const userInput = document.getElementById("user-input");
  let message = "";

  if (typeof textFromButton === "string" && textFromButton.trim() !== "") {
    message = textFromButton.trim();
  } else if (userInput && userInput.value.trim() !== "") {
    message = userInput.value.trim();
  }

  if (!message) return;

  usedButtonTexts.push(message);
  isSending = true;

  if (userInput) userInput.value = "";

  // 1. ユーザーメッセージ表示
  appendMessage("user-message", message);
  turnCount++;

  try {
    let replyText = "";
    let optionsData = null;

    // 2. API通信（未接続時はテスト用モック返答）
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ message: message, history: conversationHistory })
      });

      if (response.ok) {
        const data = await response.json();
        replyText = data.reply;
        optionsData = data.options;
      } else {
        throw new Error("APIエラー");
      }
    } catch (e) {
      // APIがない場合のダミー応答
      replyText = `「${message}」ですね。承りました！具体的にご希望のエリアや条件はお決まりでしょうか？`;
    }

    // 3. AIの返答を表示
    appendMessage("bot-message", replyText);
    conversationHistory.push({ role: "user", content: message });
    conversationHistory.push({ role: "assistant", content: replyText });

    // 4. ボタン更新
    if (optionsData && optionsData.length > 0) {
      renderApiButtons(optionsData);
    } else {
      renderAdaptiveButtons(message, replyText);
    }

  } catch (error) {
    console.error(error);
    appendMessage("bot-message", "送信中にエラーが発生しました。");
  } finally {
    isSending = false;
  }
}

// メッセージ表示関数
function appendMessage(senderClass, text) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const messageElement = document.createElement("div");
  messageElement.className = `message ${senderClass}`;

  let cleanText = String(text).replace(/\[OPTIONS\].*/g, '').replace(/\*\*/g, '').trim();
  messageElement.innerHTML = cleanText.replace(/\n/g, '<br>');

  chatBody.appendChild(messageElement);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// APIボタン描画
function renderApiButtons(options) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;
  quickButtonsDiv.innerHTML = "";

  options.forEach(optText => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = optText;
    button.onclick = () => sendQuickMessage(optText);
    quickButtonsDiv.appendChild(button);
  });
}

// 動的ボタン切替関数
function renderAdaptiveButtons(userMsg, aiReply) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  const uMsg = userMsg ? String(userMsg) : "";
  const aReply = aiReply ? String(aiReply) : "";
  let candidateButtons = [];

  if (turnCount >= 5) {
    candidateButtons = [
      { label: "💬 条件や日程について相談する", text: "希望の条件や相談したい日程があります" },
      { label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  } else if (uMsg.includes("賃貸") || uMsg.includes("借りたい") || uMsg.includes("部屋")) {
    candidateButtons = [
      { label: "📍 赤羽・北区エリアで探したい", text: "赤羽・北区エリアで探したいです" },
      { label: "📍 川口エリアで探したい", text: "川口エリアで探したいです" },
      { label: "📍 板橋区エリアで探したい", text: "板橋区エリアで探したいです" },
      { label: "💬 条件（ペット・間取り等）を相談", text: "こだわり条件について相談したいです" },
      { label: "📅 無料で内見予約・問合せをする", url: contactUrl, isPrimary: true }
    ];
  } else if (aReply.includes("管理") || aReply.includes("空室") || uMsg.includes("貸したい")) {
    candidateButtons = [
      { label: "🏠 ノアリブホームの管理サポートを聞く", text: "どんな管理サポートや空室対策がありますか？" },
      { label: "💡 賃貸として貸し出す流れを聞く", text: "賃貸として貸し出すまでの流れを教えてください" },
      { label: "📊 無料で賃料査定・管理相談を申込む", url: contactUrl, isPrimary: true }
    ];
  } else if (aReply.includes("査定") || uMsg.includes("売却") || uMsg.includes("売りたい")) {
    candidateButtons = [
      { label: "🤝 売却の手順や費用を聞く", text: "売却の手順や費用について教えてください" },
      { label: "💡 ノアリブホームの強みを聞く", text: "ノアリブホームの売却サポートの特徴は何ですか？" },
      { label: "📊 無料で売却査定を依頼する", url: contactUrl, isPrimary: true }
    ];
  } else if (uMsg.includes("購入") || uMsg.includes("買いたい")) {
    candidateButtons = [
      { label: "📍 赤羽・北区エリアで買いたい", text: "赤羽・北区エリアで物件を探しています" },
      { label: "📍 川口・板橋エリアで買いたい", text: "川口・板橋エリアで物件を探しています" },
      { label: "🏦 住宅ローンについて相談する", text: "住宅ローンや資金計画について相談したいです" },
      { label: "📩 個別のご相談予約（店舗・オンライン）", url: contactUrl, isPrimary: true }
    ];
  } else {
    candidateButtons = [
      { label: "💡 具体的におすすめ物件・提案を聞く", text: "おすすめの条件や物件の選び方を教えてください" },
      { label: "💬 条件について詳しく相談する", text: "希望条件やお悩みについて直接相談したいです" },
      { label: "📩 お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  }

  const filteredButtons = candidateButtons.filter(btn => btn.url || !usedButtonTexts.includes(btn.text));
  if (filteredButtons.length === 0) {
    filteredButtons.push({ label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true });
  }

  quickButtonsDiv.innerHTML = "";
  filteredButtons.forEach(btn => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = btn.label;
    if (btn.isPrimary) button.className = "primary-action-btn";

    button.onclick = () => {
      if (btn.url) window.open(btn.url, '_blank');
      else if (btn.text) sendQuickMessage(btn.text);
    };
    quickButtonsDiv.appendChild(button);
  });
}

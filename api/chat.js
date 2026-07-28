let conversationHistory = [];
let turnCount = 0;
let isSending = false;
let usedButtonTexts = [];
const contactUrl = "https://www.noahlivehome.jp/contact/";

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

// クイックボタン押下処理
function sendQuickMessage(text) {
  if (isSending) return;
  sendMessage(text);
}
window.sendQuickMessage = sendQuickMessage;

// メイン送信処理
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
  turnCount++; // ラリー数カウント

  let replyText = "";
  let optionsData = null;

  try {
    // 2. API送信
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ message: message, history: conversationHistory })
    });

    const data = await response.json();

    if (response.ok && data.reply) {
      replyText = data.reply;
      optionsData = data.options;
    } else {
      // API未接続やエラー時のセーフティフォールバック
      replyText = getFallbackReply(message);
    }
  } catch (error) {
    console.warn("通信またはAPIエラー、フォールバック作動:", error);
    replyText = getFallbackReply(message);
  } finally {
    // 3. AI返答表示と履歴追加
    appendMessage("bot-message", replyText);
    conversationHistory.push({ role: "user", content: message });
    conversationHistory.push({ role: "assistant", content: replyText });

    // 4. ボタン更新（5ラリー以降の制御を含む）
    if (turnCount >= 5) {
      renderContactButtonOnly();
    } else if (optionsData && optionsData.length > 0) {
      renderApiButtons(optionsData);
    } else {
      renderAdaptiveButtons(message, replyText);
    }

    isSending = false;
  }
}
window.sendMessage = sendMessage;

// フォールバック返答
function getFallbackReply(msg) {
  if (turnCount >= 5) {
    return "これまでのご希望条件を元に、専門スタッフが最適なご提案資料をご用意いたします。詳しいご相談や最新の空室状況につきましては、下記のお問い合わせ画面よりお気軽にお進みくださいませ。";
  }
  if (msg.includes("賃貸") || msg.includes("探したい")) {
    return "ご希望のエリア、間取り、ご予算、ペット飼育などのこだわり条件はございますか？差し支えない範囲で教えていただけますと幸いです！";
  } else if (msg.includes("貸したい") || msg.includes("管理")) {
    return "所有されている物件のエリアや種別（マンション・戸建てなど）、現在お困りのことについて教えていただけますか？";
  } else if (msg.includes("売却") || msg.includes("売りたい")) {
    return "ご売却をご検討中の物件エリアや時期、現状のお悩みなどについて教えていただけますか？";
  } else if (msg.includes("購入") || msg.includes("買いたい")) {
    return "ご希望のエリアや種別（新築・中古戸建て・マンションなど）、ご検討のきっかけなどを教えていただけますか？";
  }
  return "ご要望について承りました。さらに詳しい条件を教えていただけますか？";
}

// メッセージ表示処理（マークダウン記号を完全除去）
function appendMessage(senderClass, text) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const messageElement = document.createElement("div");
  messageElement.className = `message ${senderClass}`;

  let cleanText = String(text)
    .replace(/\[OPTIONS\].*/gs, '')
    .replace(/\*\*/g, '')
    .replace(/#/g, '')
    .trim();

  messageElement.innerHTML = cleanText.replace(/\n/g, '<br>');

  chatBody.appendChild(messageElement);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// 5ラリー目以降：お問い合わせボタンのみをフル幅で表示
function renderContactButtonOnly() {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  quickButtonsDiv.innerHTML = "";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "full-width";
  button.innerText = "📩 無料相談・お問い合わせ画面へ進む";
  button.onclick = () => window.open(contactUrl, '_blank');
  quickButtonsDiv.appendChild(button);
}

// API指定ボタン描画
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

// 1〜4ラリー目の動的ボタン切替
function renderAdaptiveButtons(userMsg, aiReply) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  const uMsg = userMsg ? String(userMsg) : "";
  let candidateButtons = [];

  if (uMsg.includes("賃貸") || uMsg.includes("探したい")) {
    candidateButtons = [
      { label: "📍 エリア・間取りを伝える", text: "希望のエリアや間取りの条件があります" },
      { label: "💰 ご予算について伝える", text: "予算や家賃の希望について相談したいです" },
      { label: "🐾 こだわり条件を伝える", text: "ペット飼育や設備などのこだわり条件があります" },
      { label: "💬 その他スタッフに相談", text: "スタッフに直接相談したいことがあります" }
    ];
  } else if (uMsg.includes("貸したい")) {
    candidateButtons = [
      { label: "🏢 物件のエリア・種別を伝える", text: "所有物件のエリアや種別について伝えたいです" },
      { label: "💡 空室対策・管理について聞く", text: "空室対策や管理サポートについて詳しく知りたいです" }
    ];
  } else if (uMsg.includes("売りたい")) {
    candidateButtons = [
      { label: "🏠 売却検討の物件情報を伝える", text: "売却を検討している物件の情報を伝えたいです" },
      { label: "📈 売却の流れや査定について", text: "売却の流れや無料査定について詳しく知りたいです" }
    ];
  } else if (uMsg.includes("買いたい")) {
    candidateButtons = [
      { label: "🔍 希望エリア・種別を伝える", text: "探しているエリアや物件の種別を伝えたいです" },
      { label: "🏦 資金計画・ローン相談", text: "資金計画や住宅ローンについて相談したいです" }
    ];
  } else {
    candidateButtons = [
      { label: "🔍 詳しく条件を伝える", text: "もう少し詳しい条件を伝えます" },
      { label: "💬 専門スタッフに相談する", text: "専門スタッフに詳しく相談したいです" }
    ];
  }

  const filteredButtons = candidateButtons.filter(btn => !usedButtonTexts.includes(btn.text));

  quickButtonsDiv.innerHTML = "";
  filteredButtons.forEach(btn => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = btn.label;
    button.onclick = () => sendQuickMessage(btn.text);
    quickButtonsDiv.appendChild(button);
  });
}

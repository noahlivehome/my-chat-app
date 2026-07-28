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

function sendQuickMessage(text) {
  if (isSending) return;
  sendMessage(text);
}
window.sendQuickMessage = sendQuickMessage;

function sendMessage(textFromButton) {
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

  // 2. 返答文を作成
  setTimeout(() => {
    let replyText = getFallbackReply(message);

    // 3. AI返答表示
    appendMessage("bot-message", replyText);
    conversationHistory.push({ role: "user", content: message });
    conversationHistory.push({ role: "assistant", content: replyText });

    // 4. ボタン更新（5ラリー目の制御を含む）
    if (turnCount >= 5) {
      renderContactButtonOnly();
    } else {
      renderAdaptiveButtons(message);
    }

    isSending = false;
  }, 300);
}
window.sendMessage = sendMessage;

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

function renderAdaptiveButtons(userMsg) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  const uMsg = userMsg ? String(userMsg) : "";
  let candidateTexts = [];

  if (uMsg.includes("賃貸") || uMsg.includes("探したい")) {
    candidateTexts = [
      "📍 エリア・間取りを相談したい",
      "💰 家賃やご予算について相談したい",
      "🐾 ペット可などこだわり条件がある",
      "💬 直接スタッフに相談したい"
    ];
  } else if (uMsg.includes("貸したい")) {
    candidateTexts = [
      "🏢 所有物件のエリアや種別を伝える",
      "💡 空室対策や管理内容を聞きたい"
    ];
  } else if (uMsg.includes("売りたい")) {
    candidateTexts = [
      "🏠 売却したい物件情報を伝える",
      "📈 売却の流れや無料査定について聞く"
    ];
  } else if (uMsg.includes("買いたい")) {
    candidateTexts = [
      "🔍 探しているエリアや種別を伝える",
      "🏦 住宅ローンや資金計画の相談をする"
    ];
  } else {
    candidateTexts = [
      "🔍 詳しい希望条件を伝える",
      "💬 専門スタッフに直接相談する"
    ];
  }

  const filteredTexts = candidateTexts.filter(text => !usedButtonTexts.includes(text));

  quickButtonsDiv.innerHTML = "";
  filteredTexts.forEach(text => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = text;
    button.onclick = () => sendQuickMessage(text);
    quickButtonsDiv.appendChild(button);
  });
}

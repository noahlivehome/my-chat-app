let conversationHistory = [];
let turnCount = 0;
let isSending = false;
let usedButtonTexts = [];
const contactUrl = "https://www.noahlivehome.jp/contact/";

// キーボードのEnterキー送信対応
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

// クイックボタン押下処理（どこから呼ばれても動作するよう完全グローバル化）
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
  turnCount++; // ラリー数をカウントアップ

  try {
    let replyText = "";
    let optionsData = null;

    // 2. API送信（未接続時のフォールバック動作を含む）
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
        throw new Error("API通信不可");
      }
    } catch (e) {
      // テスト用返答
      if (message.includes("賃貸")) {
        replyText = "賃貸物件のお探しですね！ご希望のエリア（赤羽・川口・板橋など）や間取りはございますか？";
      } else if (message.includes("買いたい")) {
        replyText = "不動産のご購入をご検討ですね！ご希望のエリアやご予算についてお決まりでしょうか？";
      } else if (message.includes("売りたい")) {
        replyText = "不動産の売却・査定のご相談ですね。ご所有物件の種別（マンション・戸建て等）をお知らせください。";
      } else if (message.includes("貸したい")) {
        replyText = "所有物件のご活用・賃貸管理のご相談ですね。ノアリブホームの管理サポートについてご説明いたします。";
      } else {
        replyText = `「${message}」について承りました！詳しい条件やご質問はございますか？`;
      }
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
window.sendMessage = sendMessage;

// メッセージ表示
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

// 動的ボタン切替（5ラリー後にのみお問い合わせボタンを生成）
function renderAdaptiveButtons(userMsg, aiReply) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  const uMsg = userMsg ? String(userMsg) : "";
  const aReply = aiReply ? String(aiReply) : "";
  let candidateButtons = [];

  // ★ 5ラリー以上の場合：お問い合わせ誘導ボタンを前面に表示
  if (turnCount >= 5) {
    candidateButtons = [
      { label: "💬 条件や日程について詳しく相談する", text: "希望の条件や相談したい日程があります" },
      { label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 賃貸
  else if (uMsg.includes("賃貸") || uMsg.includes("借りたい") || uMsg.includes("部屋")) {
    candidateButtons = [
      { label: "📍 赤羽・北区エリアで探したい", text: "赤羽・北区エリアで探したいです" },
      { label: "📍 川口エリアで探したい", text: "川口エリアで探したいです" },
      { label: "📍 板橋区エリアで探したい", text: "板橋区エリアで探したいです" },
      { label: "💬 条件（ペット・間取り等）を相談", text: "こだわり条件について相談したいです" }
    ];
  } 
  // 貸したい・管理
  else if (aReply.includes("管理") || aReply.includes("空室") || uMsg.includes("貸したい")) {
    candidateButtons = [
      { label: "🏠 ノアリブホームの管理サポートを聞く", text: "どんな管理サポートや空室対策がありますか？" },
      { label: "💡 賃貸として貸し出す流れを聞く", text: "賃貸として貸し出すまでの流れを教えてください" }
    ];
  } 
  // 売りたい・査定
  else if (aReply.includes("査定") || uMsg.includes("売却") || uMsg.includes("売りたい")) {
    candidateButtons = [
      { label: "🤝 売却の手順や費用を聞く", text: "売却の手順や費用について教えてください" },
      { label: "💡 ノアリブホームの強みを聞く", text: "ノアリブホームの売却サポートの特徴は何ですか？" }
    ];
  } 
  // 買いたい
  else if (uMsg.includes("購入") || uMsg.includes("買いたい")) {
    candidateButtons = [
      { label: "📍 赤羽・北区エリアで買いたい", text: "赤羽・北区エリアで物件を探しています" },
      { label: "📍 川口・板橋エリアで買いたい", text: "川口・板橋エリアで物件を探しています" },
      { label: "🏦 住宅ローンについて相談する", text: "住宅ローンや資金計画について相談したいです" }
    ];
  } 
  // 汎用（5ラリー未満の通常時）
  else {
    candidateButtons = [
      { label: "💡 具体的におすすめ物件・提案を聞く", text: "おすすめの条件や物件の選び方を教えてください" },
      { label: "💬 条件について詳しく相談する", text: "希望条件やお悩みについて直接相談したいです" }
    ];
  }

  // 押し済みのテキストボタンは除外
  const filteredButtons = candidateButtons.filter(btn => btn.url || !usedButtonTexts.includes(btn.text));

  quickButtonsDiv.innerHTML = "";
  filteredButtons.forEach(btn => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = btn.label;
    if (btn.isPrimary) button.className = "primary-action-btn";

    button.onclick = () => {
      if (btn.url) {
        window.open(btn.url, '_blank');
      } else if (btn.text) {
        sendQuickMessage(btn.text);
      }
    };
    quickButtonsDiv.appendChild(button);
  });
}

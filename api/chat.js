let conversationHistory = [];
let turnCount = 0;
let isSending = false;
let usedButtonTexts = [];
const contactUrl = "https://www.noahlivehome.jp/contact/";

// DOMイベント初期化
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

// クイックボタン押下時（HTMLのonclickから呼ばれるようにwindowに登録）
window.sendQuickMessage = function(text) {
  if (isSending) return;
  sendMessage(text);
};

// メイン送信処理
window.sendMessage = async function(textFromButton) {
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

  // 1. ユーザーメッセージを画面に追加
  appendMessage("user-message", message);
  turnCount++;

  try {
    let replyText = "";
    let optionsData = null;

    // 2. API送信（非接続時はダミー返答で動作継続）
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
        throw new Error("API通信エラー");
      }
    } catch (e) {
      // API未接続時の自動テスト応答（本番環境API稼働時には自動で本物に切り替わります）
      if (message.includes("買いたい")) {
        replyText = "不動産のご購入をご検討ですね！ご希望のエリアや予算感についてお決まりでしょうか？";
      } else if (message.includes("売りたい")) {
        replyText = "不動産の売却・査定のご相談ですね。ご所有物件の種別（マンション・戸建て・土地等）をお知らせいただくか、無料査定をお申し込みいただけます！";
      } else {
        replyText = `「${message}」について承りました！詳しいご希望やご質問はございますか？`;
      }
    }

    // 3. AIの返答を表示
    appendMessage("bot-message", replyText);
    conversationHistory.push({ role: "user", content: message });
    conversationHistory.push({ role: "assistant", content: replyText });

    // 4. 次の選択肢ボタンに切り替え
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
};

// メッセージ画面追加
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

// APIからのボタン描画
function renderApiButtons(options) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;
  quickButtonsDiv.innerHTML = "";

  options.forEach(optText => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = optText;
    button.onclick = () => window.sendQuickMessage(optText);
    quickButtonsDiv.appendChild(button);
  });
}

// 文脈に応じた次ボタンの自動切替関数（分離対応版）
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
  } 
  // 賃貸
  else if (uMsg.includes("賃貸") || uMsg.includes("借りたい") || uMsg.includes("部屋")) {
    candidateButtons = [
      { label: "📍 赤羽・北区エリアで探したい", text: "赤羽・北区エリアで探したいです" },
      { label: "📍 川口エリアで探したい", text: "川口エリアで探したいです" },
      { label: "📍 板橋区エリアで探したい", text: "板橋区エリアで探したいです" },
      { label: "💬 条件（ペット・間取り等）を相談", text: "こだわり条件について相談したいです" },
      { label: "📅 無料で内見予約・問合せをする", url: contactUrl, isPrimary: true }
    ];
  } 
  // 貸したい・管理（オーナー向け）
  else if (aReply.includes("管理") || aReply.includes("空室") || uMsg.includes("貸したい")) {
    candidateButtons = [
      { label: "🏠 ノアリブホームの管理サポートを聞く", text: "どんな管理サポートや空室対策がありますか？" },
      { label: "💡 賃貸として貸し出す流れを聞く", text: "賃貸として貸し出すまでの流れを教えてください" },
      { label: "📊 無料で賃料査定・管理相談を申込む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 売りたい・査定（売主向け）
  else if (aReply.includes("査定") || uMsg.includes("売却") || uMsg.includes("売りたい")) {
    candidateButtons = [
      { label: "🤝 売却の手順や費用を聞く", text: "売却の手順や費用について教えてください" },
      { label: "💡 ノアリブホームの強みを聞く", text: "ノアリブホームの売却サポートの特徴は何ですか？" },
      { label: "📊 無料で売却査定を依頼する", url: contactUrl, isPrimary: true }
    ];
  } 
  // 買いたい（買主向け）
  else if (uMsg.includes("購入") || uMsg.includes("買いたい")) {
    candidateButtons = [
      { label: "📍 赤羽・北区エリアで買いたい", text: "赤羽・北区エリアで物件を探しています" },
      { label: "📍 川口・板橋エリアで買いたい", text: "川口・板橋エリアで物件を探しています" },
      { label: "🏦 住宅ローンについて相談する", text: "住宅ローンや資金計画について相談したいです" },
      { label: "📩 個別のご相談予約（店舗・オンライン）", url: contactUrl, isPrimary: true }
    ];
  } 
  // 汎用
  else {
    candidateButtons = [
      { label: "💡 具体的におすすめ物件・提案を聞く", text: "おすすめの条件や物件の選び方を教えてください" },
      { label: "💬 条件について詳しく相談する", text: "希望条件やお悩みについて直接相談したいです" },
      { label: "📩 お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  }

  // 押し済みのボタンを除外
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
      else if (btn.text) window.sendQuickMessage(btn.text);
    };
    quickButtonsDiv.appendChild(button);
  });
}

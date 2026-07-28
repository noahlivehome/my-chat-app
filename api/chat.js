let conversationHistory = [];
let turnCount = 0; // ラリー回数
let isSending = false; // 二重送信防止用フラグ
let usedButtonTexts = []; // 押されたボタンのテキストを記録する配列
const contactUrl = "https://www.noahlivehome.jp/contact/"; 

// アプリの初期化（DOM読み込み完了時）
function initChat() {
  const form = document.getElementById("chat-form");
  const sendBtn = document.getElementById("send-btn");
  const userInput = document.getElementById("user-input");

  // フォームの送信（Enterキー / 送信ボタンクリック）をハンドリング
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      sendMessage();
    });
  } else if (sendBtn) {
    sendBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sendMessage();
    });
  }

  // 初回用ボタンを描画
  renderAdaptiveButtons("", "");
}

// DOMContentLoaded または 即時実行のフォールバック
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChat);
} else {
  initChat();
}

// クイック選択ボタン押下時
function sendQuickMessage(text) {
  if (isSending) return;
  sendMessage(text);
}

// 送信メイン処理
async function sendMessage(textFromButton) {
  if (isSending) return;

  const userInput = document.getElementById("user-input");
  
  // 入力テキスト取得
  let message = "";
  if (typeof textFromButton === "string" && textFromButton.trim() !== "") {
    message = textFromButton.trim();
  } else if (userInput && userInput.value.trim() !== "") {
    message = userInput.value.trim();
  }

  if (!message) return; // 空文字チェック

  // ボタンテキストの重複排除記録
  usedButtonTexts.push(message);

  // フラグ設定＆入力欄クリア
  isSending = true;
  if (userInput) userInput.value = "";

  // 1. ユーザーメッセージ表示
  appendMessage("user-message", message);
  turnCount++;

  try {
    let replyText = "";
    let optionsData = null;

    // 2. API送信（APIが利用できない場合はモック返答フォールバック）
    try {
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

      if (response.ok) {
        const data = await response.json();
        replyText = data.reply;
        optionsData = data.options;
      } else {
        throw new Error("APIレスポンスエラー");
      }
    } catch (apiErr) {
      // APIサーバーが未接続の場合のテスト用ダミー応答
      console.warn("API非接続のためモック返答を適用します:", apiErr);
      replyText = `「${message}」について承りました。担当者にお繋ぎするか、以下の候補より選択してください。`;
    }

    // 3. AIの返答表示
    appendMessage("bot-message", replyText);

    // 4. 会話履歴更新
    conversationHistory.push({ role: "user", content: message });
    conversationHistory.push({ role: "assistant", content: replyText });

    // 5. ボタンエリア更新
    if (optionsData && optionsData.length > 0) {
      renderApiButtons(optionsData);
    } else {
      renderAdaptiveButtons(message, replyText);
    }

  } catch (error) {
    console.error("送信通信エラー:", error);
    appendMessage("bot-message", "申し訳ありません。送信中にエラーが発生しました。");
  } finally {
    isSending = false;
  }
}

// メッセージ描画
function appendMessage(senderClass, text) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const messageElement = document.createElement("div");
  messageElement.className = `message ${senderClass}`;
  
  let cleanText = String(text);
  if (cleanText.includes("[OPTIONS]")) {
    cleanText = cleanText.split("[OPTIONS]")[0];
  }

  cleanText = cleanText.replace(/\*\*/g, '').trim();
  messageElement.innerHTML = cleanText.replace(/\n/g, '<br>');

  chatBody.appendChild(messageElement);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// APIからの指定ボタン（data.options）描画
function renderApiButtons(options) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  quickButtonsDiv.innerHTML = "";

  options.forEach(optText => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = optText;

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      sendQuickMessage(optText);
    });

    quickButtonsDiv.appendChild(button);
  });
}

// コンテキスト適応型ボタン生成関数
function renderAdaptiveButtons(userMsg, aiReply) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  const uMsg = userMsg ? String(userMsg) : "";
  const aReply = aiReply ? String(aiReply) : "";

  let candidateButtons = [];

  // 0. 初回表示時（入力も返答もないとき）
  if (!uMsg && !aReply) {
    candidateButtons = [
      { label: "🏠 賃貸物件を探したい", text: "賃貸物件を探したいです" },
      { label: "🔑 部屋を貸したい・管理相談", text: "所有している部屋を貸したい・管理の相談がしたいです" },
      { label: "🏢 不動産を買いたい・売りたい", text: "不動産の売買（購入・売却）について相談したいです" },
      { label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  }
  // 1. 5回以上のラリー
  else if (turnCount >= 5) {
    candidateButtons = [
      { label: "💬 条件や日程について相談する", text: "希望の条件や相談したい日程があります" },
      { label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 2. 賃貸系キーワード
  else if (uMsg.includes("賃貸") || uMsg.includes("借りたい") || uMsg.includes("部屋")) {
    candidateButtons = [
      { label: "📍 赤羽・北区エリアで探したい", text: "赤羽・北区エリアで探したいです" },
      { label: "📍 川口エリアで探したい", text: "川口エリアで探したいです" },
      { label: "📍 板橋区エリアで探したい", text: "板橋区エリアで探したいです" },
      { label: "💬 条件（ペット・間取り等）を相談", text: "こだわり条件について相談したいです" },
      { label: "📅 無料で内見予約・問合せをする", url: contactUrl, isPrimary: true }
    ];
  }
  // 3. オーナー様向け
  else if (aReply.includes("管理") || aReply.includes("空室") || uMsg.includes("貸したい")) {
    candidateButtons = [
      { label: "🏠 ノアリブホームの管理サポートを聞く", text: "どんな管理サポートや空室対策がありますか？" },
      { label: "💡 賃貸として貸し出す流れを聞く", text: "賃貸として貸し出すまでの流れを教えてください" },
      { label: "📊 無料で賃料査定・管理相談を申込む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 4. 売主様向け
  else if (aReply.includes("査定") || uMsg.includes("売却") || uMsg.includes("売りたい")) {
    candidateButtons = [
      { label: "🤝 売却の手順や費用を聞く", text: "売却の手順や費用について教えてください" },
      { label: "💡 ノアリブホームの強みを聞く", text: "ノアリブホームの売却サポートの特徴は何ですか？" },
      { label: "📊 無料で売却査定を依頼する", url: contactUrl, isPrimary: true }
    ];
  }
  // 5. 購入系キーワード
  else if (uMsg.includes("購入") || uMsg.includes("買いたい")) {
    candidateButtons = [
      { label: "📍 赤羽・北区エリアで買いたい", text: "赤羽・北区エリアで物件を探しています" },
      { label: "📍 川口・板橋エリアで買いたい", text: "川口・板橋エリアで物件を探しています" },
      { label: "🏦 住宅ローンについて相談する", text: "住宅ローンや資金計画について相談したいです" },
      { label: "📩 個別のご相談予約（店舗・オンライン）", url: contactUrl, isPrimary: true }
    ];
  }
  // 6. デフォルト（汎用）
  else {
    candidateButtons = [
      { label: "💡 具体的におすすめ物件・提案を聞く", text: "おすすめの条件や物件の選び方を教えてください" },
      { label: "💬 条件について詳しく相談する", text: "希望条件やお悩みについて直接相談したいです" },
      { label: "📩 お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  }

  // 既に使用したテキストボタンを除外
  const filteredButtons = candidateButtons.filter(btn => {
    if (btn.url) return true;
    return !usedButtonTexts.includes(btn.text);
  });

  if (filteredButtons.length === 0) {
    filteredButtons.push({ label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true });
  }

  // ボタン生成
  quickButtonsDiv.innerHTML = "";
  
  filteredButtons.forEach(btn => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = btn.label;
    
    if (btn.isPrimary) {
      button.className = "primary-action-btn";
    }

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.url) {
        window.open(btn.url, '_blank');
      } else if (btn.text) {
        sendQuickMessage(btn.text);
      }
    });
    
    quickButtonsDiv.appendChild(button);
  });
}

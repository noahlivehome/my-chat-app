let conversationHistory = [];
let turnCount = 0; // ラリー回数
let isSending = false; // 二重送信・フリーズ防止用フラグ
let usedButtonTexts = []; // 押されたボタンのテキストを記録する配列
const contactUrl = "https://www.noahlivehome.jp/contact/"; 

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
  if (isSending) return; // 送信中なら連打防止
  sendMessage(text);
}

// 送信メイン処理
async function sendMessage(textFromButton) {
  if (isSending) return; // 処理中なら弾く

  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const quickButtonsDiv = document.getElementById("quick-buttons");
  
  // ボタンからのテキスト、または入力欄のテキストを取得
  let message = "";
  if (typeof textFromButton === "string" && textFromButton.trim() !== "") {
    message = textFromButton.trim();
  } else if (userInput && userInput.value.trim() !== "") {
    message = userInput.value.trim();
  }

  if (!message) return; // 空文字送信防止

  // 押されたテキストを記録（一度押したボタンを除外するため）
  usedButtonTexts.push(message);

  // 送信中フラグをオン＆UI無効化
  isSending = true;
  if (userInput) {
    userInput.value = "";
    userInput.disabled = true;
  }
  if (sendBtn) sendBtn.disabled = true;

  // 送信直後にボタン群を消去して連打を防ぐ
  if (quickButtonsDiv) quickButtonsDiv.innerHTML = "";

  // 1. ユーザーメッセージ表示
  appendMessage("user-message", message);
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

      // 5. APIから返ってきた options または 最終ターン判定に応じてボタンを描画
      if (data.isFinished) {
        renderFinalCTAButton(data.userCategory);
      } else {
        renderButtonsFromAPI(data.options);
      }

    } else {
      console.error("API Error Response:", data);
      appendMessage("bot-message", `エラーが発生しました: ${data.error || "通信失敗"}`);
    }

  } catch (error) {
    console.error("送信通信エラー:", error);
    appendMessage("bot-message", "通信エラーが発生しました。時間を置いて再度お試しください。");
  } finally {
    // 処理完了後にフラグ解除＆UI有効化
    isSending = false;
    if (userInput) {
      userInput.disabled = false;
      userInput.focus();
    }
    if (sendBtn) sendBtn.disabled = false;
  }
}

// メッセージ描画
function appendMessage(senderClass, text) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const messageElement = document.createElement("div");
  messageElement.className = `message ${senderClass}`;
  
  // 万が一 [OPTIONS] が含まれていた場合、本文だけを抽出して表示
  let cleanText = String(text);
  if (cleanText.includes("[OPTIONS]")) {
    cleanText = cleanText.split("[OPTIONS]")[0];
  }

  cleanText = cleanText.replace(/\*\*/g, '').trim();
  messageElement.innerHTML = cleanText.replace(/\n/g, '<br>');

  chatBody.appendChild(messageElement);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// 💡 API（AI）から返ってきた選択肢（data.options）をもとにボタンを動的生成する関数
function renderButtonsFromAPI(options) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  quickButtonsDiv.innerHTML = "";

  // 重複・使用済みテキストを除外
  let availableOptions = [];
  if (Array.isArray(options)) {
    availableOptions = options.filter(optText => {
      const cleanOpt = optText.trim();
      return !usedButtonTexts.some(used => used.trim() === cleanOpt);
    });
  }

  // もしAPIからのボタンが全滅した場合は、デフォルトのお問い合わせ導線を表示
  if (availableOptions.length === 0) {
    renderFinalCTAButton();
    return;
  }

  // 1〜4ターン目の選択肢ボタンを描画
  availableOptions.forEach(optText => {
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

// 💡 5ターン目（最終ターン）のお問い合わせ用メインCTAボタン描画関数
function renderFinalCTAButton(category) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  quickButtonsDiv.innerHTML = "";

  let ctaLabel = "📩 お問い合わせ・ご相談画面へ進む";
  if (category === "owner_rent" || category === "owner_sell") {
    ctaLabel = "📊 無料査定・ご相談画面へ進む";
  } else if (category === "buy") {
    ctaLabel = "🔑 個別相談・お問い合わせ画面へ進む";
  }

  const button = document.createElement("button");
  button.type = "button";
  button.innerText = ctaLabel;
  button.className = "primary-action-btn"; // 強調表示用クラス

  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(contactUrl, '_blank');
  });

  quickButtonsDiv.appendChild(button);
}

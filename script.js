let conversationHistory = [];
let turnCount = 0; // ラリー回数
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
  const userInput = document.getElementById("user-input");
  if (userInput) {
    userInput.value = text;
  }
  sendMessage(text);
}

// 送信メイン処理
async function sendMessage(textFromButton) {
  const userInput = document.getElementById("user-input");
  
  // ボタンからのテキスト、または入力欄のテキストを取得
  let message = "";
  if (typeof textFromButton === "string" && textFromButton.trim() !== "") {
    message = textFromButton.trim();
  } else if (userInput && userInput.value.trim() !== "") {
    message = userInput.value.trim();
  }

  if (!message) return; // 空文字送信防止

  // 入力欄をクリア
  if (userInput) userInput.value = "";

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

      // 5. カテゴリ・ステップ判定して固定ボタンを表示
      renderCategoryFixedButtons(message);

    } else {
      console.error("API Error Response:", data);
      appendMessage("bot-message", `エラーが発生しました: ${data.error || "通信失敗"}`);
    }

  } catch (error) {
    console.error("送信通信エラー:", error);
    appendMessage("bot-message", "通信エラーが発生しました。時間を置いて再度お試しください。");
  }
}

// メッセージ描画
function appendMessage(senderClass, text) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const messageElement = document.createElement("div");
  messageElement.className = `message ${senderClass}`;
  
  // ★ 万が一 [OPTIONS] が含まれていた場合、本文だけを抽出して表示
  let cleanText = String(text);
  if (cleanText.includes("[OPTIONS]")) {
    cleanText = cleanText.split("[OPTIONS]")[0];
  }

  cleanText = cleanText.replace(/\*\*/g, '').trim();
  messageElement.innerHTML = cleanText.replace(/\n/g, '<br>');

  chatBody.appendChild(messageElement);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// 💡 ★ カテゴリごとの固定ボタン制御関数（ステップ対応・重複防止版） ★
function renderCategoryFixedButtons(lastMessage) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  let newButtons = [];

  // 1. 5回以上のラリー達成時（お問い合わせへ統一）
  if (turnCount >= 5) {
    newButtons = [
      { label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 2-A. 🏙️ すでに東京・埼玉等のエリアを選択した後のボタン（次のステップへ進める）
  else if (lastMessage.includes("東京都内") || lastMessage.includes("埼玉県内")) {
    newButtons = [
      { label: "📍 具体的におすすめの駅・エリアを聞く", text: "おすすめの駅やエリアを提案してください" },
      { label: "💬 条件（ペット・間取り・予算等）を伝える", text: "ペット可などの希望条件について相談したい" },
      { label: "📅 無料で内見予約・物件問合せをする", url: contactUrl, isPrimary: true }
    ];
  }
  // 2-B. 🔍 賃貸を探したい（初回メッセージ時のみ表示）
  else if (lastMessage.includes("賃貸") || lastMessage.includes("借りたい") || lastMessage.includes("部屋")) {
    newButtons = [
      { label: "🏙️ 東京都内で探したい", text: "東京都内で探したい" },
      { label: "埼玉 県内で探したい", text: "埼玉県内で探したい" },
      { label: "💬 条件（ペット・間取り等）を相談", text: "ペット可などのこだわり条件について相談したい" },
      { label: "📅 無料で内見予約・問合せをする", url: contactUrl, isPrimary: true }
    ];
  } 
  // 3. 🔑 貸したい（オーナー様向けの固定選択肢）
  else if (lastMessage.includes("貸したい") || lastMessage.includes("賃賃経営") || lastMessage.includes("管理")) {
    newButtons = [
      { label: "🏠 ノアリブホームの管理サポートを聞く", text: "どんな管理サポートや空室対策がありますか？" },
      { label: "💡 貸し出しまでの流れを知りたい", text: "賃貸として貸し出すまでの流れを教えてください" },
      { label: "📊 無料で賃料査定・管理相談を申込む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 4. 🏠 売却したい（売主様向けの固定選択肢）
  else if (lastMessage.includes("売却") || lastMessage.includes("売りたい")) {
    newButtons = [
      { label: "🤝 売却の流れや手順を聞く", text: "売却の手順や流れについて教えてください" },
      { label: "💡 売却時のサポート特徴を聞く", text: "ノアリブホームの売却サポートの特徴は何ですか？" },
      { label: "📊 無料で売却査定を依頼する", url: contactUrl, isPrimary: true }
    ];
  } 
  // 5. 💰 購入したい（住宅購入向けの固定選択肢）
  else if (lastMessage.includes("購入") || lastMessage.includes("買いたい") || lastMessage.includes("マイホーム")) {
    newButtons = [
      { label: "🏦 住宅ローン・資金計画について聞く", text: "住宅ローンや資金計画の進め方について教えてください" },
      { label: "🏡 物件選びのポイントを聞く", text: "失敗しない物件選びのポイントは何ですか？" },
      { label: "💬 個別提案・購入のご相談（予約）", url: contactUrl, isPrimary: true }
    ];
  } 
  // デフォルト（会話が進んできた場合）
  else {
    newButtons = [
      { label: "💡 詳しく聞く", text: "もう少し詳しく教えてください" },
      { label: "📩 お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  }

  // ボタン描画処理
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

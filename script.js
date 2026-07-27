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

  // 送信中フラグをオン
  isSending = true;

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

      // 5. ★ AIの返答内容(data.reply)とユーザーメッセージ(message)を見て動的にボタン表示 ★
      renderAdaptiveButtons(message, data.reply);

    } else {
      console.error("API Error Response:", data);
      appendMessage("bot-message", `エラーが発生しました: ${data.error || "通信失敗"}`);
    }

  } catch (error) {
    console.error("送信通信エラー:", error);
    appendMessage("bot-message", "通信エラーが発生しました。時間を置いて再度お試しください。");
  } finally {
    // 処理完了後にフラグ解除
    isSending = false;
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

// 💡 ★ AIの返答内容に適応した動的ボタン生成関数 ★
function renderAdaptiveButtons(userMsg, aiReply) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  let candidateButtons = [];

  // ----------------------------------------------------
  // AIの回答テキスト (aiReply) や ユーザー入力 (userMsg) からコンテキストを判別
  // ----------------------------------------------------

  // 1. 5回以上のラリー（お問い合わせへの誘導を最優先）
  if (turnCount >= 5) {
    candidateButtons = [
      { label: "💬 条件や日程について相談する", text: "希望の条件や相談したい日程があります" },
      { label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 2. AIが「エリア・場所・駅」について聞いている・答えている場合
  else if (aiReply.includes("エリア") || aiReply.includes("地域") || aiReply.includes("駅") || userMsg.includes("東京都内") || userMsg.includes("埼玉県内")) {
    candidateButtons = [
      { label: "📍 具体的におすすめの駅を聞く", text: "通勤・通学に便利なおすすめの駅を提案してください" },
      { label: "💰 家賃相場について確認する", text: "このエリアの家賃相場を教えてください" },
      { label: "💬 条件（ペット・間取り等）を伝える", text: "ペット可や希望の間取りについて相談したい" },
      { label: "📅 無料で内見予約・物件問合せをする", url: contactUrl, isPrimary: true }
    ];
  }
  // 3. AIが「費用・家賃・予算・初期費用」について答えている場合
  else if (aiReply.includes("費用") || aiReply.includes("家賃") || aiReply.includes("予算") || aiReply.includes("敷金") || aiReply.includes("ローン")) {
    candidateButtons = [
      { label: "💡 初期費用を抑えるポイントを聞く", text: "初期費用を少しでも安く抑えるコツはありますか？" },
      { label: "📊 必要なトータル概算費用を聞く", text: "契約時に必要な費用の目安を教えてください" },
      { label: "📩 詳しい見積もり・ご相談はこちら", url: contactUrl, isPrimary: true }
    ];
  }
  // 4. AIが「流れ・手続・必要書類」について答えている場合
  else if (aiReply.includes("流れ") || aiReply.includes("手順") || aiReply.includes("書類") || aiReply.includes("審査")) {
    candidateButtons = [
      { label: "⏱ 入居/契約までにかかる期間を聞く", text: "申し込みから契約・入居までどれくらいかかりますか？" },
      { label: "📄 審査に必要な書類について聞く", text: "審査に必要な書類にはどんなものがありますか？" },
      { label: "📩 個別のご相談・お問合せはこちら", url: contactUrl, isPrimary: true }
    ];
  }
  // 5. 🔑 オーナー様向け（貸したい・管理・査定の文脈）
  else if (aiReply.includes("管理") || aiReply.includes("空室") || userMsg.includes("貸したい")) {
    candidateButtons = [
      { label: "🏠 ノアリブホームの管理サポートを聞く", text: "どんな管理サポートや空室対策がありますか？" },
      { label: "💡 賃貸として貸し出す流れを聞く", text: "賃貸として貸し出すまでの流れを教えてください" },
      { label: "📊 無料で賃料査定・管理相談を申込む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 6. 🏠 売主様向け（売却・査定の文脈）
  else if (aiReply.includes("査定") || userMsg.includes("売却") || userMsg.includes("売りたい")) {
    candidateButtons = [
      { label: "🤝 売却の手順や費用を聞く", text: "売却の手順や手数料などの費用について教えてください" },
      { label: "💡 ノアリブホームの強みを聞く", text: "ノアリブホームの売却サポートの特徴は何ですか？" },
      { label: "📊 無料で売却査定を依頼する", url: contactUrl, isPrimary: true }
    ];
  }
  // 7. 🔍 初回の「探したい・借りたい」カテゴリ
  else if (userMsg.includes("賃貸") || userMsg.includes("借りたい") || userMsg.includes("部屋")) {
    candidateButtons = [
      { label: "🏙️ 東京都内で探したい", text: "東京都内で探したい" },
      { label: "埼玉 県内で探したい", text: "埼玉県内で探したい" },
      { label: "💬 条件（ペット・間取り等）を相談", text: "ペット可などのこだわり条件について相談したい" },
      { label: "📅 無料で内見予約・問合せをする", url: contactUrl, isPrimary: true }
    ];
  }
  // 8. デフォルト（AIの返答に対する汎用ボタン）
  else {
    candidateButtons = [
      { label: "💡 具体的におすすめ物件・提案を聞く", text: "おすすめの条件や物件の選び方を教えてください" },
      { label: "💬 条件について詳しく相談する", text: "希望条件やお悩みについて直接相談したいです" },
      { label: "📩 お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  }

  // ★ 過去に押されたテキストを持つボタンを除外（URLボタンは常に残す）
  const filteredButtons = candidateButtons.filter(btn => {
    if (btn.url) return true;
    return !usedButtonTexts.includes(btn.text);
  });

  // 万が一テキスト系ボタンが全滅した場合はお問い合わせボタンを補填
  if (filteredButtons.length === 0) {
    filteredButtons.push({ label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true });
  }

  // ボタン描画処理
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

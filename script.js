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

  // ★ 押されたテキストを記録（一度押したボタンを除外するため）
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

      // 5. AIの返答内容とユーザーメッセージを見て動的にボタン表示
      renderAdaptiveButtons(message, data.reply);

    } else {
      console.error("API Error Response:", data);
      appendMessage("bot-message", `エラーが発生しました: ${data.error || "API呼び出しエラーが発生しました。"}`);
      // エラー時でもユーザーの次のアクション用にボタンを更新
      renderAdaptiveButtons(message, "");
    }

  } catch (error) {
    console.error("送信通信エラー:", error);
    appendMessage("bot-message", "通信エラーが発生しました。時間を置いて再度お試しください。");
    renderAdaptiveButtons(message, "");
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

  // 1. 5回以上のラリー（お問い合わせへの誘導を最優先）
  if (turnCount >= 5) {
    candidateButtons = [
      { label: "💬 条件や日程について相談する", text: "希望の条件や相談したい日程があります" },
      { label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 2. 🔑 オーナー様向け（「貸したい」「管理」「空室」「オーナー」など）
  else if (userMsg.includes("貸したい") || userMsg.includes("管理") || aiReply.includes("オーナー") || aiReply.includes("賃料査定")) {
    candidateButtons = [
      { label: "🏠 ノアリブホームの管理サポートを聞く", text: "どんな管理サポートや空室対策がありますか？" },
      { label: "💡 貸し出しまでの流れを聞く", text: "賃貸として貸し出すまでの流れを教えてください" },
      { label: "📊 無料で賃料査定・管理相談を申込む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 3. 🏠 売主様向け（「売却」「売りたい」「売却査定」など）
  else if (userMsg.includes("売却") || userMsg.includes("売りたい") || aiReply.includes("ご売却")) {
    candidateButtons = [
      { label: "🤝 売却の手順や費用を聞く", text: "売却の手順や手数料などの費用について教えてください" },
      { label: "💡 ノアリブホームの強みを聞く", text: "ノアリブホームの売却サポートの特徴は何ですか？" },
      { label: "📊 無料で売却査定を依頼する", url: contactUrl, isPrimary: true }
    ];
  }
  // 4. 💰 購入検討者様向け（「購入」「買いたい」「マイホーム」「住宅ローン」など）
  else if (userMsg.includes("購入") || userMsg.includes("買いたい") || userMsg.includes("マイホーム") || aiReply.includes("ご購入")) {
    candidateButtons = [
      { label: "🏦 住宅ローン・資金計画について聞く", text: "住宅ローンや資金計画の進め方について教えてください" },
      { label: "🏡 物件選びのポイントを聞く", text: "失敗しない物件選びのポイントは何ですか？" },
      { label: "💬 個別提案・購入のご相談（予約）", url: contactUrl, isPrimary: true }
    ];
  }
  // 5. 🔍 賃貸「お部屋探し」初回の選択時
  else if (userMsg.includes("賃貸") || userMsg.includes("借りたい") || userMsg.includes("部屋")) {
    candidateButtons = [
      { label: "🏙️ 東京都内で探したい", text: "東京都内で探したい" },
      { label: "埼玉 県内で探したい", text: "埼玉県内で探したい" },
      { label: "💬 条件（ペット・間取り等）を相談", text: "ペット可などのこだわり条件について相談したい" },
      { label: "📅 無料で内見予約・問合せをする", url: contactUrl, isPrimary: true }
    ];
  }
  // 6. 賃貸の会話内で「エリア・場所・駅」の話題の場合
  else if (aiReply.includes("エリア") || aiReply.includes("地域") || aiReply.includes("駅") || userMsg.includes("東京都内") || userMsg.includes("埼玉県内")) {
    candidateButtons = [
      { label: "📍 具体的におすすめの駅を聞く", text: "通勤・通学に便利なおすすめの駅を提案してください" },
      { label: "💰 家賃相場について確認する", text: "このエリアの家賃相場を教えてください" },
      { label: "💬 条件（ペット・間取り等）を伝える", text: "ペット可や希望の間取りについて相談したい" },
      { label: "📅 無料で内見予約・物件問合せをする", url: contactUrl, isPrimary: true }
    ];
  }
  // 7. 会話内で「費用・家賃・予算・手続き」の話題が出ている場合
  else if (aiReply.includes("費用") || aiReply.includes("家賃") || aiReply.includes("予算") || aiReply.includes("初期費用")) {
    candidateButtons = [
      { label: "💡 初期費用を抑えるポイントを聞く", text: "初期費用を少しでも安く抑えるコツはありますか？" },
      { label: "📊 必要なトータル概算費用を聞く", text: "契約時に必要な費用の目安を教えてください" },
      { label: "📩 詳しい見積もり・ご相談はこちら", url: contactUrl, isPrimary: true }
    ];
  }
  // 8. デフォルト
  else {
    candidateButtons = [
      { label: "💡 具体的におすすめや選び方を聞く", text: "おすすめの選択肢やポイントを教えてください" },
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

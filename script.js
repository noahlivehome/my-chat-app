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
    sendMessage();
  }
}

// 送信メイン処理
async function sendMessage() {
  const userInput = document.getElementById("user-input");
  if (!userInput) return;

  const message = userInput.value.trim();
  if (!message) return; // 空文字送信防止

  // 1. ユーザーメッセージ表示
  appendMessage("user-message", message);
  userInput.value = "";
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
      let fullText = data.reply;
      let chatText = fullText;
      let options = [];

      // ★ [OPTIONS] タグが含まれていればテキストと選択肢を分解する
      if (fullText.includes("[OPTIONS]")) {
        const parts = fullText.split("[OPTIONS]");
        chatText = parts[0].trim(); // チャットバブルに表示する本文
        
        // 選択肢テキストを配列化（「- 」や空白を除去）
        options = parts[1]
          .split("\n")
          .map(line => line.replace(/^-\s*/, '').trim())
          .filter(line => line.length > 0);
      }

      // 3. AIの返答（本文のみ）を表示
      appendMessage("bot-message", chatText);

      // 4. 会話履歴更新（AIにはフルテキストを記憶させる）
      conversationHistory.push({ role: "user", content: message });
      conversationHistory.push({ role: "assistant", content: fullText });

      // 5. ボタン群を動的に描画
      renderDynamicButtons(options);

    } else {
      console.error("API Error:", data);
      appendMessage("bot-message", `エラーが発生しました: ${data.error || "通信失敗"}`);
    }

  } catch (error) {
    console.error("送信エラー:", error);
    appendMessage("bot-message", "通信エラーが発生しました。時間を置いて再度お試しください。");
  }
}

// メッセージ描画
function appendMessage(senderClass, text) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const messageElement = document.createElement("div");
  messageElement.className = `message ${senderClass}`;
  
  // マークダウン記号除去＆改行適用
  const cleanText = text.replace(/\*\*/g, '');
  messageElement.innerHTML = cleanText.replace(/\n/g, '<br>');

  chatBody.appendChild(messageElement);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// 💡 動的ボタン生成処理
function renderDynamicButtons(aiOptions) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  quickButtonsDiv.innerHTML = "";
  let newButtons = [];

  // ★ 5回以上のラリー達成時は強制でお問い合わせ専用ボタンのみに
  if (turnCount >= 5) {
    newButtons = [
      { label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  } 
  // ★ AIから選択肢(options)が生成されている場合
  else if (aiOptions && aiOptions.length > 0) {
    // AIの提案をそのままテキスト送信用のボタンにする
    newButtons = aiOptions.map(opt => {
      return { label: opt, text: opt };
    });
    // AIの提案に関わらず、いつでもお問い合わせに飛べるボタンを最後に一つ添えておく（離脱防止）
    newButtons.push({ label: "📩 お問い合わせ画面へ", url: contactUrl, isPrimary: true });
  } 
  // ★ 万が一AIが選択肢を生成しなかった場合のデフォルトフォールバック
  else {
    newButtons = [
      { label: "💡 詳しく聞く", text: "もう少し詳しく教えてください" },
      { label: "📩 お問い合わせ画面へ", url: contactUrl, isPrimary: true }
    ];
  }

  // ボタンを画面に追加
  newButtons.forEach(btn => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = btn.label;
    
    if (btn.isPrimary) {
      button.className = "primary-action-btn"; // CSSで目立たせる用のクラス
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

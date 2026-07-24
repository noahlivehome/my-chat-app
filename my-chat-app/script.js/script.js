// アイコンの初期化（Lucide icons）
lucide.createIcons();

const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

// 会話の履歴を保持する配列
let conversationHistory = [];

// メッセージを画面（UI）に追加する関数
function addMessageToUI(senderClass, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${senderClass}`;
  msgDiv.innerHTML = text.replace(/\n/g, '<br>');
  chatBody.appendChild(msgDiv);
  
  // 自動スクロール（最新メッセージへ）
  chatBody.scrollTop = chatBody.scrollHeight;
  return msgDiv;
}

// AIへの送信処理
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  // 1. ユーザーの入力内容を画面に表示
  addMessageToUI('user-message', text);
  chatInput.value = '';
  
  // 会話履歴に追加
  conversationHistory.push({ role: 'user', content: text });

  // 2. 「回答を作成中...」の仮メッセージを表示
  const loadingMsg = addMessageToUI('bot-message', '回答を作成中...');

  try {
    // 3. VercelのAPI（/api/chat）に送信してGeminiからの返答を取得
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory })
    });

    const data = await response.json();

    if (data.reply) {
      loadingMsg.innerHTML = data.reply.replace(/\n/g, '<br>');
      conversationHistory.push({ role: 'assistant', content: data.reply });
    } else {
      loadingMsg.textContent = 'エラーが発生しました。';
    }

  } catch (error) {
    console.error('Error:', error);
    loadingMsg.textContent = '通信エラーが発生しました。';
  }
}

// イベントの設定（ボタンクリック ＆ Enterキーで送信）
sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
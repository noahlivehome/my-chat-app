// メッセージ描画（修正版）
function appendMessage(senderClass, text) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const messageElement = document.createElement("div");
  messageElement.className = `message ${senderClass}`;
  
  // ★ 万が一 [OPTIONS] が含まれていた場合、それ以降の文字列を削除して本文だけにする
  let cleanText = String(text);
  if (cleanText.includes("[OPTIONS]")) {
    cleanText = cleanText.split("[OPTIONS]")[0];
  }

  // マークダウン記号の除去と改行変換
  cleanText = cleanText.replace(/\*\*/g, '').trim();
  messageElement.innerHTML = cleanText.replace(/\n/g, '<br>');

  chatBody.appendChild(messageElement);
  chatBody.scrollTop = chatBody.scrollHeight;
}

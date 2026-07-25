// 💡 会話の流れや回数に応じて「次のボタン」を動的に更新する関数
function updateQuickButtons(lastMessage) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  let newButtons = [];

  // ★ お問い合わせURL
  const contactUrl = "https://www.noahlivehome.jp/contact/"; 

  // 【重要】5回以上ラリーが続いたら、他のボタンを消してお問い合わせボタン1つのみにする！
  if (turnCount >= 5) {
    newButtons = [
      { label: "📩 無料相談・お問い合わせ画面へ進む", action: () => window.open(contactUrl, '_blank'), isPrimary: true }
    ];
  } 
  // 1〜4回目のラリー中：文脈に合わせた選択肢を表示
  else if (lastMessage.includes("貸したい") || lastMessage.includes("売却")) {
    newButtons = [
      { label: "📊 無料査定を依頼する", action: () => window.open(contactUrl, '_blank') },
      { label: "💵 貸し出し・売却の費用を聞く", text: "かかる費用や手数料について知りたい" },
      { label: "💡 質問を続ける", text: "他にも質問があります" }
    ];
  } else if (lastMessage.includes("賃貸") || lastMessage.includes("借りたい") || lastMessage.includes("探したい")) {
    newButtons = [
      { label: "📍 おすすめエリア・条件を相談", text: "おすすめのエリアや家賃相場を教えてほしい" },
      { label: "📝 内見・申し込みの流れを聞く", text: "内見や申し込みの手順はどうなりますか？" },
      { label: "📩 今すぐ相談する", action: () => window.open(contactUrl, '_blank') }
    ];
  } else {
    // 途中経過（通常の会話時）
    newButtons = [
      { label: "📩 お問い合わせ画面へ", action: () => window.open(contactUrl, '_blank') },
      { label: "💡 詳しく聞く", text: "もう少し詳しく教えてください" },
      { label: "🔄 最初に戻る", text: "最初に戻る" }
    ];
  }

  // ボタンエリアを再構築
  quickButtonsDiv.innerHTML = "";
  newButtons.forEach(btn => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = btn.label;
    
    // 5回達成時の目立つメインボタンデザイン
    if (btn.isPrimary) {
      button.style.width = "100%";
      button.style.backgroundColor = "#8fad88"; // テーマカラーのグリーン
      button.style.color = "#ffffff";
      button.style.fontWeight = "bold";
      button.style.padding = "14px";
      button.style.fontSize = "16px";
      button.style.border = "none";
      button.style.borderRadius = "8px";
      button.style.cursor = "pointer";
      button.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
    }

    // URL送信 or テキスト送信の処理分岐
    if (btn.action) {
      button.onclick = btn.action;
    } else {
      button.onclick = () => sendQuickMessage(btn.text);
    }
    
    quickButtonsDiv.appendChild(button);
  });
}

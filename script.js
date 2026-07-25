// ボタン表示制御および入力制御関数
function updateQuickButtons(lastMessage) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  if (!quickButtonsDiv) return;

  const contactUrl = "https://www.noahlivehome.jp/contact/"; 
  let newButtons = [];

  // ★ 5回以上のラリー達成時（全カテゴリ共通でお問い合わせへ固定）
  if (turnCount >= 5) {
    newButtons = [
      { label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];

    if (userInput) {
      userInput.placeholder = "お問い合わせ画面へお進みください";
      userInput.disabled = true;
    }
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.style.opacity = "0.5";
      sendBtn.style.cursor = "not-allowed";
    }

  } 
  // 1. 🔑 貸したい（オーナー様向け導線）
  else if (lastMessage.includes("貸したい") || lastMessage.includes("賃貸経営") || lastMessage.includes("管理")) {
    newButtons = [
      { label: "📊 無料で賃料査定・管理相談を申込む", url: contactUrl, isPrimary: true },
      { label: "🏠 ノアリブホームの管理サポートを聞く", text: "どんな管理サポートや空室対策がありますか？" },
      { label: "💡 貸し出しまでの全体の流れを知りたい", text: "賃貸として貸し出すまでの流れを教えてください" }
    ];
  } 
  // 2. 🏠 売却したい（売主様向け導線）
  else if (lastMessage.includes("売却") || lastMessage.includes("売りたい")) {
    newButtons = [
      { label: "📊 無料で売却査定を依頼する", url: contactUrl, isPrimary: true },
      { label: "🤝 売却・預かり（媒介）の流れを聞く", text: "売却の手順や売却活動の流れについて教えてください" },
      { label: "💡 売却時のサポート内容を知りたい", text: "ノアリブホームの売却サポートの特徴は何ですか？" }
    ];
  } 
  // 3. 🔍 賃貸を探したい（お部屋探し向け導线）
  else if (lastMessage.includes("賃貸") || lastMessage.includes("借りたい") || lastMessage.includes("探したい")) {
    newButtons = [
      { label: "📅 無料で内見予約・物件問合せをする", url: contactUrl, isPrimary: true },
      { label: "📍 おすすめエリア・家賃相場を相談", text: "おすすめのエリアや家賃相場を教えてほしい" },
      { label: "📝 内見から契約までの流れを聞く", text: "内見や申し込みの手順はどうなりますか？" }
    ];
  } 
  // 4. 💰 購入したい（住宅購入向け導線）
  else if (lastMessage.includes("購入") || lastMessage.includes("買いたい") || lastMessage.includes("マイホーム")) {
    newButtons = [
      { label: "💬 個別提案・購入のご相談（予約）", url: contactUrl, isPrimary: true },
      { label: "🏦 住宅ローンの進め方・資金計画を聞く", text: "住宅ローンや資金計画の進め方について教えてください" },
      { label: "🏡 物件選びのポイントを知りたい", text: "失敗しない物件選びのポイントは何ですか？" }
    ];
  } 
  // 初期・その他
  else {
    newButtons = [
      { label: "📩 お問い合わせ画面へ", url: contactUrl, isPrimary: true },
      { label: "💡 詳しく聞く", text: "もう少し詳しく教えてください" },
      { label: "🔄 最初に戻る", text: "最初に戻る" }
    ];
  }

  // ボタンエリア描画
  quickButtonsDiv.innerHTML = "";
  
  newButtons.forEach(btn => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = btn.label;
    
    if (btn.isPrimary) {
      button.className = "primary-action-btn";
    }

    button.addEventListener("click", function(e) {
      e.preventDefault();
      if (btn.url) {
        window.open(btn.url, '_blank');
      } else if (btn.text) {
        sendQuickMessage(btn.text);
      }
    });
    
    quickButtonsDiv.appendChild(button);
  });
}

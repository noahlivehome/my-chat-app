// 💡 ★ カテゴリごとの固定ボタン制御関数（ループ防止・進行最適化版） ★
function renderCategoryFixedButtons(lastMessage) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  let newButtons = [];

  // 1. 5回以上のラリー、または「詳しく聞く」等で会話が進んだ場合（お問い合わせへの誘導を強める）
  if (turnCount >= 4 || lastMessage.includes("詳しく") || lastMessage.includes("提案")) {
    newButtons = [
      { label: "💬 条件（予算・間取り等）について相談する", text: "詳しい条件や希望について相談したいです" },
      { label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 2-A. 🏙️ すでに東京・埼玉等のエリアを選択した後のボタン
  else if (lastMessage.includes("東京都内") || lastMessage.includes("埼玉県内")) {
    newButtons = [
      { label: "📍 具体的におすすめの駅・エリアを聞く", text: "おすすめの駅やエリアを提案してください" },
      { label: "💬 条件（ペット・間取り・予算等）を伝える", text: "ペット可などの希望条件について相談したい" },
      { label: "📅 無料で内見予約・物件問合せをする", url: contactUrl, isPrimary: true }
    ];
  }
  // 2-B. 🔍 賃貸を探したい（初回）
  else if (lastMessage.includes("賃貸") || lastMessage.includes("借りたい") || lastMessage.includes("部屋")) {
    newButtons = [
      { label: "🏙️ 東京都内で探したい", text: "東京都内で探したい" },
      { label: "埼玉 県内で探したい", text: "埼玉県内で探したい" },
      { label: "💬 条件（ペット・間取り等）を相談", text: "ペット可などのこだわり条件について相談したい" },
      { label: "📅 無料で内見予約・問合せをする", url: contactUrl, isPrimary: true }
    ];
  } 
  // 3. 🔑 貸したい（オーナー様向け）
  else if (lastMessage.includes("貸したい") || lastMessage.includes("賃貸経営") || lastMessage.includes("管理")) {
    newButtons = [
      { label: "🏠 ノアリブホームの管理サポートを聞く", text: "どんな管理サポートや空室対策がありますか？" },
      { label: "💡 貸し出しまでの流れを知りたい", text: "賃貸として貸し出すまでの流れを教えてください" },
      { label: "📊 無料で賃料査定・管理相談を申込む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 4. 🏠 売却したい（売主様向け）
  else if (lastMessage.includes("売却") || lastMessage.includes("売りたい")) {
    newButtons = [
      { label: "🤝 売却の流れや手順を聞く", text: "売却の手順や流れについて教えてください" },
      { label: "💡 売却時のサポート特徴を聞く", text: "ノアリブホームの売却サポートの特徴は何ですか？" },
      { label: "📊 無料で売却査定を依頼する", url: contactUrl, isPrimary: true }
    ];
  } 
  // 5. 💰 購入したい（住宅購入向け）
  else if (lastMessage.includes("購入") || lastMessage.includes("買いたい") || lastMessage.includes("マイホーム")) {
    newButtons = [
      { label: "🏦 住宅ローン・資金計画について聞く", text: "住宅ローンや資金計画の進め方について教えてください" },
      { label: "🏡 物件選びのポイントを聞く", text: "失敗しない物件選びのポイントは何ですか？" },
      { label: "💬 個別提案・購入のご相談（予約）", url: contactUrl, isPrimary: true }
    ];
  } 
  // デフォルト
  else {
    newButtons = [
      { label: "💬 希望条件を直接相談する", text: "希望の条件やお悩みについて詳しく相談したいです" },
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

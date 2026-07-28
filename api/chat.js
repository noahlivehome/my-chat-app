// ★ 修正版：エリア特化＆コンテキスト適応型ボタン生成関数 ★
function renderAdaptiveButtons(userMsg, aiReply) {
  const quickButtonsDiv = document.getElementById("quick-buttons");
  if (!quickButtonsDiv) return;

  // 安全のため、nullやundefined対策をして文字列化
  const uMsg = userMsg ? String(userMsg) : "";
  const aReply = aiReply ? String(aiReply) : "";

  let candidateButtons = [];

  // 0. ★【追加】初回表示時（メッセージが空のとき）★
  if (!uMsg && !aReply) {
    candidateButtons = [
      { label: "🏠 賃貸物件を探したい", text: "賃貸物件を探したいです" },
      { label: "🔑 部屋を貸したい・管理相談", text: "所有している部屋を貸したい・管理の相談がしたいです" },
      { label: "🏢 不動産を買いたい・売りたい", text: "不動産の売買（購入・売却）について相談したいです" },
      { label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  }
  // 1. 5回以上のラリー（お問い合わせへの誘導を最優先）
  else if (turnCount >= 5) {
    candidateButtons = [
      { label: "💬 条件や日程について相談する", text: "希望の条件や相談したい日程があります" },
      { label: "📩 無料相談・お問い合わせ画面へ進む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 2. 賃貸探しでエリアを聞かれたとき（赤羽・北区・川口・板橋エリアに特化）
  else if (uMsg.includes("賃貸") || uMsg.includes("借りたい") || uMsg.includes("部屋")) {
    candidateButtons = [
      { label: "📍 赤羽・北区エリアで探したい", text: "赤羽・北区エリアで探したいです" },
      { label: "📍 川口エリアで探したい", text: "川口エリアで探したいです" },
      { label: "📍 板橋区エリアで探したい", text: "板橋区エリアで探したいです" },
      { label: "💬 条件（ペット・間取り等）を相談", text: "こだわり条件について相談したいです" },
      { label: "📅 無料で内見予約・問合せをする", url: contactUrl, isPrimary: true }
    ];
  }
  // 3. 🔑 オーナー様向け（貸したい・管理の文脈）
  else if (aReply.includes("管理") || aReply.includes("空室") || uMsg.includes("貸したい")) {
    candidateButtons = [
      { label: "🏠 ノアリブホームの管理サポートを聞く", text: "どんな管理サポートや空室対策がありますか？" },
      { label: "💡 賃貸として貸し出す流れを聞く", text: "賃貸として貸し出すまでの流れを教えてください" },
      { label: "📊 無料で賃料査定・管理相談を申込む", url: contactUrl, isPrimary: true }
    ];
  } 
  // 4. 🏠 売主様向け（売却・査定の文脈）
  else if (aReply.includes("査定") || uMsg.includes("売却") || uMsg.includes("売りたい")) {
    candidateButtons = [
      { label: "🤝 売却の手順や費用を聞く", text: "売却の手順や費用について教えてください" },
      { label: "💡 ノアリブホームの強みを聞く", text: "ノアリブホームの売却サポートの特徴は何ですか？" },
      { label: "📊 無料で売却査定を依頼する", url: contactUrl, isPrimary: true }
    ];
  }
  // 5. 💰 購入したい（売買購入の文脈）
  else if (uMsg.includes("購入") || uMsg.includes("買いたい")) {
    candidateButtons = [
      { label: "📍 赤羽・北区エリアで買いたい", text: "赤羽・北区エリアで物件を探しています" },
      { label: "📍 川口・板橋エリアで買いたい", text: "川口・板橋エリアで物件を探しています" },
      { label: "🏦 住宅ローンについて相談する", text: "住宅ローンや資金計画について相談したいです" },
      { label: "📩 個別のご相談予約（店舗・オンライン）", url: contactUrl, isPrimary: true }
    ];
  }
  // 6. デフォルト（汎用ボタン）
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

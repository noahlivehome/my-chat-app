// ==========================================
// 1. 設定項目（お問い合わせ先URL & NGワード）
// ==========================================
const IELOVE_FORM_URL = "https://www.noahlivehome.jp/contact/";

// 不適切な言葉のリスト
const NG_WORDS = [
    'くそ', 'クソ', 'ばか', 'バカ', '馬鹿', 'あほ', 'アホ', 
    '死ね', 'シネ', '殺す', 'ゴミ', 'カス', 'きも', 'キモ', 'うざ', 'ウザ',
    'ぶす', 'ブス', 'へたくそ', 'ヘタクソ', 'き違い', 'キチガイ'
];

// ==========================================
// 2. チャット状態の管理
// ==========================================
const chatState = {
    mode: null,
    step: 0,
    area: "",
    data: {},
    history: []
};

// 初期表示選択肢
const initialOptions = [
    { text: "🏠 部屋を借りたい", value: "rent" },
    { text: "🔑 物件を貸したい", value: "owner" },
    { text: "🏢 物件を売りたい", value: "sell" },
    { text: "🏡 物件を買いたい", value: "buy" }
];

// 相槌のバリエーションをランダムに返す関数
function getRandomAizuchi(word) {
    const patterns = [
        `「${word}」ですね！承知いたしました。`,
        `「${word}」についてですね！`,
        `「${word}」ですね！教えていただきありがとうございます！`,
        `なるほど、「${word}」ですね！`,
        `「${word}」のご希望、しっかりメモいたしました！`
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
}

// スマートコメントを取得する関数
function getSmartComment(mode, step) {
    const comments = {
        rent: {
            1: "💡【エリア】人気のエリアですね！利便性や住環境も含めてぴったりのお部屋をご提案いたします！",
            2: "💡【予算】ご予算に合わせて、無理なく快適に暮らせる好条件な物件を厳選いたします。",
            3: "💡【間取り】ライフスタイルにピッタリフィットする使い勝手の良い間取りを探しますね！",
            4: "💡【こだわり】綺麗さ重視か、コスパ重視かに合わせて最適な選択肢をご提示します！",
            5: "💡【時期】ご希望の時期に合わせて、一番良いタイミングで最新の空室状況をお届けします。"
        },
        owner: {
            1: "💡【種別】物件種別の強みを活かした最適な賃貸運用プランをご提案します！",
            2: "💡【エリア】周辺の賃貸需要や競合を分析し、空室リスクを抑えたご提案をいたします！",
            3: "💡【間取り】ターゲット層に合わせた設備訴求で、長期入居につながる提案をします✨",
            4: "💡【築年数】経年変化に合わせたメンテナンス計画で、安定した賃貸経営をサポートします！",
            5: "💡【現況】現在の稼働状況を踏まえ、オーナー様に最適な運用方法を一緒に考えます！"
        },
        sell: {
            1: "💡【種別】市場需要を把握し、一番良い条件で売却できるルートを探ります👍",
            2: "💡【エリア】地域の最新成約事例を分析し、適正価格をご提示します！",
            3: "💡【広さ】物件の魅力を最大限に伝えるPR戦略をご提案いたします！",
            4: "💡【築年数】リフォーム履歴などの付加価値も査定金額にしっかり反映させます！",
            5: "💡【時期】ご希望のタイミングに合わせたスケジュールで安心して進められるよう伴走いたします！"
        },
        buy: {
            1: "💡【種別】将来の資産価値も見据えた、失敗しない物件選びをお手伝いします！",
            2: "💡【予算】住宅ローンや諸費用も含めた、無理のない資金計画をご提案いたします👍",
            3: "💡【エリア】周辺環境や利便性も考慮し、価値あるエリアから厳選します！",
            4: "💡【間取り】ご家族の暮らしやすさを第一に考慮した間取りをご案内します✨",
            5: "💡【築年数】耐震基準や修繕履歴もしっかりチェックしてご案内いたします！"
        }
    };
    return comments[mode]?.[step] || "";
}

// 画面読み込み完了時
window.addEventListener("load", () => {
    initChat();
});

function initChat() {
    const msgContainer = document.getElementById("chatMessages");
    if (msgContainer) msgContainer.innerHTML = "";
    
    appendBotMessage("いらっしゃいませ！\nノアリブホーム AIコンシェルジュのノアです✨\n\n本日はどのようなご相談でしょうか？\n下の選択肢から選んでいただくか、チャット欄に「赤羽で賃貸探したい」「マンション売りたい」など直接メッセージを入力してくださいね！");
    renderOptions(initialOptions);
}

// ==========================================
// 現在のステップに応じた質問・選択肢を取得
// ==========================================
function getCurrentStepPrompt() {
    const mode = chatState.mode;
    const step = chatState.step;

    if (mode === "rent") {
        if (step === 1) return { text: "ご希望の「エリア（駅名や市区町村）」を教えてください！\n（例：赤羽駅、北区、川口など）", options: [{ text: "📍 赤羽・北区エリア", value: "赤羽・北区エリア" }, { text: "📍 その他23区", value: "その他23区" }, { text: "📍 埼玉県", value: "埼玉県" }, { text: "💡 条件から相談する", value: "条件から相談" }] };
        if (step === 2) return { text: "ご希望の「ご予算（家賃の上限）」はおいくら位でお考えですか？", options: [{ text: "💴 8万円以内", value: "8万円以内" }, { text: "💴 10万円以内", value: "10万円以内" }, { text: "💴 12万円以内", value: "12万円以内" }, { text: "💴 15万円以上", value: "15万円以上" }] };
        if (step === 3) return { text: "ご希望の「間取り」を教えていただけますか？", options: [{ text: "🛋 ワンルーム・1K", value: "ワンルーム・1K" }, { text: "🛋 1DK・1LDK", value: "1DK・1LDK" }, { text: "🛋 2K・2DK・2LDK", value: "2K・2DK・2LDK" }, { text: "🛋 3LDK以上", value: "3LDK以上" }] };
        if (step === 4) return { text: "「広さや築年数」について何かこだわりはありますか？", options: [{ text: "✨ 築浅希望（10年以内）", value: "築浅希望" }, { text: "📐 広さ重視", value: "広さ重視" }, { text: "💰 安さ重視（築年数不問）", value: "安さ重視" }, { text: "⚖️ バランス重視", value: "バランス重視" }] };
        if (step === 5) return { text: "お引っ越しの「ご希望時期」はいつ頃をお考えでしょうか？", options: [{ text: "⚡️ 即入居・今すぐ", value: "即入居・今すぐ" }, { text: "🗓 1ヶ月以内", value: "1ヶ月以内" }, { text: "🗓 2〜3ヶ月以内", value: "2〜3ヶ月以内" }, { text: "🔍 良い物件があれば", value: "良い物件があれば検討" }] };
        if (step === 6) return { text: "ありがとうございます！\n最後に「2階以上」「バストイレ別」など、譲れない条件やご質問はありますか？\n\n特になければ、下のボタンからお問合せへお進みください！", options: [{ text: "📅 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
    }

    if (mode === "owner") {
        if (step === 1) return { text: "ご所有物件の「種別」を教えてください。", options: [{ text: "🏢 マンション・アパート", value: "マンション・アパート" }, { text: "🏢 一棟マンション・ビル", value: "一棟マンション・ビル" }, { text: "🏠 一戸建て", value: "一戸建て" }, { text: "🏬 店舗事務所・その他", value: "店舗事務所・その他" }] };
        if (step === 2) return { text: "物件の「所在地（エリア）」はどちらになりますか？", options: [{ text: "📍 赤羽・北区エリア", value: "赤羽・北区エリア" }, { text: "📍 その他東京23区内", value: "東京23区内" }, { text: "📍 埼玉県内", value: "埼玉県内" }] };
        if (step === 3) return { text: "物件の「間取り」を教えていただけますか？", options: [{ text: "🛋 単身用（1K〜1LDK）", value: "単身用" }, { text: "🛋 ファミリー用（2LDK〜）", value: "ファミリー用" }, { text: "🏢 一棟まるごと", value: "一棟まるごと" }] };
        if (step === 4) return { text: "おおよその「築年数」はどのくらいでしょうか？", options: [{ text: "✨ 築10年未満", value: "築10年未満" }, { text: "🏢 築10年〜20年", value: "築10年〜20年" }, { text: "🏚 築20年以上", value: "築20年以上" }] };
        if (step === 5) return { text: "現在の「お部屋の現況（空室、賃貸中など）」を教えてください。", options: [{ text: "❓ 現在、空室中", value: "空室中" }, { text: "🚪 近々、退去予定", value: "退去予定" }, { text: "🏠 満室稼働中", value: "満室稼働中" }] };
        if (step === 6) return { text: "ご検討中の「管理スタイルやご要望」はございますか？", options: [{ text: "🤝 全て任せたい（募集・管理）", value: "全て任せたい" }, { text: "📢 募集のみ頼みたい", value: "募集のみ" }, { text: "💡 賃料査定・相談のみ", value: "賃料査定のみ" }] };
        if (step === 7) return { text: "ありがとうございます！条件の整理ができました。\n下記ボタンよりお問合せへお進みください✨", options: [{ text: "📋 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
    }

    if (mode === "sell") {
        if (step === 1) return { text: "ご所有物件の「種別」をお聞かせください。", options: [{ text: "🏢 マンション", value: "マンション" }, { text: "🏠 一戸建て", value: "一戸建て" }, { text: "🏞 土地", value: "土地" }, { text: "🏬 一棟ビル・アパート", value: "一棟ビル・アパート" }] };
        if (step === 2) return { text: "物件の「所在地（エリア）」はどちらでしょうか？", options: [{ text: "📍 赤羽・北区エリア", value: "赤羽・北区エリア" }, { text: "📍 その他東京23区内", value: "東京23区内" }, { text: "📍 埼玉県内", value: "埼玉県内" }] };
        if (step === 3) return { text: "広さや間取りの目安を教えてください。", options: [{ text: "🛋 コンパクト（〜50㎡）", value: "コンパクト（〜50㎡）" }, { text: "🏠 ファミリー（50〜80㎡）", value: "ファミリー（50〜80㎡）" }, { text: "🏡 大型（80㎡以上）", value: "大型（80㎡以上）" }] };
        if (step === 4) return { text: "「築年数」の目安を教えていただけますか？", options: [{ text: "✨ 築10年未満", value: "築10年未満" }, { text: "🏢 築10年〜20年", value: "築10年〜20年" }, { text: "🏚 築20年以上", value: "築20年以上" }] };
        if (step === 5) return { text: "現在の「ご利用状況や売却のご希望時期」はいかがですか？", options: [{ text: "👤 居住中（早期希望）", value: "居住中（早期希望）" }, { text: "🚪 空家・空室", value: "空家・空室" }, { text: "🗓 条件が合えば検討", value: "条件が合えば検討" }] };
        if (step === 6) return { text: "ご入力ありがとうございます！\n売却に関するヒアリングが完了しました。詳細査定のお申込みへお進みください！", options: [{ text: "📝 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
    }

    if (mode === "buy") {
        if (step === 1) return { text: "どのような「種別」の物件をお探しですか？", options: [{ text: "🏢 新築・中古マンション", value: "マンション" }, { text: "🏡 新築・中古一戸建て", value: "一戸建て" }, { text: "🏞 土地", value: "土地" }] };
        if (step === 2) return { text: "ご予算の「上限イメージ」を教えてください。", options: [{ text: "💰 3,000万円以内", value: "3,000万円以内" }, { text: "💰 5,000万円以内", value: "5,000万円以内" }, { text: "💰 7,000万円以内", value: "7,000万円以内" }, { text: "💰 7,000万円以上", value: "7,000万円以上" }] };
        if (step === 3) return { text: "ご購入をご希望の「エリア（駅・地域）」はどちらですか？", options: [{ text: "📍 赤羽・北区エリア", value: "赤羽・北区エリア" }, { text: "📍 その他東京23区内", value: "東京23区内" }, { text: "📍 埼玉県内", value: "埼玉県内" }] };
        if (step === 4) return { text: "ご希望の「間取りや広さ」はいかがでしょうか？", options: [{ text: "🛋 1LDK〜2DK", value: "1LDK〜2DK" }, { text: "🛋 2LDK〜3LDK", value: "2LDK〜3LDK" }, { text: "🏠 4LDK以上", value: "4LDK以上" }] };
        if (step === 5) return { text: "「築年数」のご希望はございますか？", options: [{ text: "✨ 新築・築浅（10年以内）", value: "築浅希望" }, { text: "🏢 築20年以内", value: "築20年以内" }, { text: "🛠 リノベーション前提", value: "リノベ前提" }] };
        if (step === 6) return { text: "ありがとうございます！お伺いした条件でぴったりな物件をお探しします✨\n下記ボタンよりお問い合わせください！", options: [{ text: "📱 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
    }

    return { text: "まずはどのようなご相談をお望みか、下記よりお選びいただけますか？", options: initialOptions };
}

// ステップのフィールド名を取得
function getStepFieldName(mode, step) {
    const fields = {
        rent: { 1: "希望エリア", 2: "希望予算", 3: "希望間取り", 4: "築年数・広さ希望", 5: "入居時期" },
        owner: { 1: "物件種別", 2: "物件所在地", 3: "物件の間取り", 4: "築年数", 5: "現況", 6: "ご希望の管理形態" },
        sell: { 1: "物件種別", 2: "物件所在地", 3: "間取り・広さ", 4: "築年数", 5: "現況・売却時期" },
        buy: { 1: "購入希望種別", 2: "ご予算上限", 3: "希望エリア", 4: "希望間取り", 5: "希望築年数" }
    };
    return fields[mode]?.[step] || "条件";
}

// ==========================================
// 3. 臨機応変なAI会話ロジック
// ==========================================
function getAIResponse(userInputText, isFromButton = false) {
    const text = userInputText.trim();

    // --------------------------------------
    // ★1. NGワード判定
    // --------------------------------------
    const hasNgWord = NG_WORDS.some(word => text.includes(word));
    if (hasNgWord) {
        const currentPrompt = getCurrentStepPrompt();
        return {
            text: "恐れ入りますが、適切な言葉遣いでのご入力をお願いいたします。\nご相談がございましたら、お気軽にお知らせくださいね！",
            options: currentPrompt.options
        };
    }

    // --------------------------------------
    // ★2. モード未決定の場合の判定
    // --------------------------------------
    if (!chatState.mode) {
        if (text.includes("借り") || text.includes("賃貸") || text.includes("部屋探し")) chatState.mode = "rent";
        else if (text.includes("貸し") || text.includes("オーナー") || text.includes("管理")) chatState.mode = "owner";
        else if (text.includes("売り") || text.includes("売却") || text.includes("査定")) chatState.mode = "sell";
        else if (text.includes("買い") || text.includes("購入")) chatState.mode = "buy";

        if (chatState.mode) {
            chatState.step = 1;
            const prompt = getCurrentStepPrompt();
            const modeNames = { rent: "お部屋探し（賃貸）", owner: "物件を貸したい（オーナー様）", sell: "物件のご売却", buy: "物件のご購入" };
            return {
                text: `${modeNames[chatState.mode]}のご相談ですね！かしこまりました😊\n\n${prompt.text}`,
                options: prompt.options
            };
        }
    }

    // --------------------------------------
    // ★3. ユーザーからの個別質問・雑談への回答（自由入力時）
    // --------------------------------------
    if (!isFromButton) {
        let answer = "";

        // 「おすすめ」に関する質問
        if (text.includes("おすすめ") || text.includes("オススメ") || text.includes("イチオシ")) {
            answer = "ノアリブホームでは、赤羽・北区エリアを中心に、リノベーション物件や駅近の好立地物件など、お値打ちなおすすめ物件を多数取り扱っております！\nお客様にピッタリのおすすめをお出しするために、まずはご希望の条件を教えてくださいね✨";
        }
        // 「アクセス」に関する質問
        else if (text.includes("アクセス") || text.includes("交通") || text.includes("通勤") || text.includes("通学")) {
            answer = "赤羽エリアはJR各線（埼京線・京浜東北線・高崎線など）が通っており、新宿・東京・池袋へも電車で15分前後とアクセス抜群の人気エリアです！\nご通勤・ご通学先に合わせたおすすめ駅のご案内も可能です👍";
        }
        // 「ローン」に関する質問
        else if (text.includes("ローン") || text.includes("金利") || text.includes("借入")) {
            answer = "住宅ローンについてですね！都市銀行からネット銀行まで、お客様の働き方や資金計画に合わせた最適なローン選びを無料サポートしております。\n事前審査のお手伝いも可能ですのでご安心ください！";
        }
        // 「費用」に関する質問
        else if (text.includes("費用") || text.includes("料金") || text.includes("いくら") || text.includes("無料") || text.includes("手数料")) {
            answer = "ご安心ください！ノアリブホームでのご相談やご提案、物件の査定などは【すべて無料】で行っております✨";
        }

        // 個別回答があれば、その後に現在進行中の質問を再提示する
        if (answer !== "") {
            const currentPrompt = getCurrentStepPrompt();
            return {
                text: `${answer}\n\n引き続き、下記の質問についてもぜひ教えていただけますか？😊\n\n${currentPrompt.text}`,
                options: currentPrompt.options
            };
        }
    }

    // --------------------------------------
    // ★4. ヒアリング完了後の会話対応
    // --------------------------------------
    const maxSteps = { rent: 5, owner: 6, sell: 5, buy: 5 };
    if (chatState.mode && chatState.step > maxSteps[chatState.mode]) {
        if (chatState.data["ご要望・補足"]) {
            chatState.data["ご要望・補足"] += ` / ${text}`;
        } else {
            chatState.data["ご要望・補足"] = text;
        }
        return {
            text: `「${text}」ですね！ご要望としてしっかりメモいたしました！\n下記ボタンよりお気軽にお問合せフォームへお進みください✨`,
            options: [{ text: "📅 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }]
        };
    }

    // --------------------------------------
    // ★5. 通常のステップ進行（自由入力・ボタン共通）
    // --------------------------------------
    if (chatState.mode) {
        const currentFieldName = getStepFieldName(chatState.mode, chatState.step);
        chatState.data[currentFieldName] = text;

        const currentStep = chatState.step;
        chatState.step++; // ステップを進める

        let aizuchi = getRandomAizuchi(text);
        let comment = getSmartComment(chatState.mode, currentStep);
        let nextPrompt = getCurrentStepPrompt();

        let responseText = `${aizuchi}`;
        if (comment) responseText += `\n\n${comment}`;
        responseText += `\n\n${nextPrompt.text}`;

        return {
            text: responseText,
            options: nextPrompt.options
        };
    }

    // 初期状態への安全弁
    let aizuchi = getRandomAizuchi(text);
    return {
        text: `${aizuchi}\nまずはどのようなご相談をお望みか、下記よりお選びいただけますか？`,
        options: initialOptions
    };
}

// ==========================================
// 4. UI描画・操作イベント処理
// ==========================================
function appendBotMessage(text) {
    const container = document.getElementById("chatMessages");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "message bot";
    div.innerText = text;
    container.appendChild(div);
    scrollToBottom();
}

function appendUserMessage(text) {
    const container = document.getElementById("chatMessages");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "message user";
    div.innerText = text;
    container.appendChild(div);
    scrollToBottom();
}

function renderOptions(options) {
    const container = document.getElementById("chatOptions");
    if (!container) return;
    
    container.innerHTML = "";
    if (!options || options.length === 0) return;

    const normalOptions = options.filter(opt => !opt.isPrimary);
    const primaryOptions = options.filter(opt => opt.isPrimary);

    if (normalOptions.length > 0) {
        const gridDiv = document.createElement("div");
        gridDiv.className = "options-grid";
        normalOptions.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerText = opt.text;
            btn.onclick = () => handleOptionClick(opt.value || opt.text);
            gridDiv.appendChild(btn);
        });
        container.appendChild(gridDiv);
    }

    primaryOptions.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn primary";
        btn.innerText = opt.text;
        btn.onclick = () => handleOptionClick(opt.value || opt.text);
        container.appendChild(btn);
    });

    scrollToBottom();
}

// ボタン選択・テキスト送信の共通処理
function processUserInput(text, isFromButton = false) {
    appendUserMessage(text);

    // フォーム遷移・お問合せボタン時の挙動
    if (text.includes("予約") || text.includes("申込む") || text.includes("問合せ") || text.includes("進む") || text === "contact") {
        setTimeout(() => {
            appendBotMessage("ありがとうございます！\nこれまでのご相談内容をお問い合わせフォームへ自動で引き継ぎます。\n\nまもなくお問合せページへ移動しますので、そのまま送信してくださいね✨");
            
            const optContainer = document.getElementById("chatOptions");
            if (optContainer) optContainer.innerHTML = "";

            setTimeout(() => {
                let summaryText = `【AIコンシェルジュ ノアからの引き継ぎ条件】\n`;
                const modeNames = {
                    rent: "お部屋探し（賃貸希望）",
                    owner: "物件の賃貸管理・貸出（オーナー様）",
                    sell: "物件のご売却（売却希望）",
                    buy: "物件のご購入（購入希望）"
                };
                
                if (chatState.mode) summaryText += `ご相談区分：${modeNames[chatState.mode] || chatState.mode}\n`;
                
                Object.keys(chatState.data).forEach(key => {
                    summaryText += `・${key} : ${chatState.data[key]}\n`;
                });

                const targetUrl = `${IELOVE_FORM_URL}?message=${encodeURIComponent(summaryText)}`;
                window.location.href = targetUrl;
            }, 1800);
        }, 300);
        return;
    }

    // AIからのレスポンスを生成して描画
    setTimeout(() => {
        const response = getAIResponse(text, isFromButton);
        appendBotMessage(response.text);
        renderOptions(response.options);
    }, 300);
}

function handleOptionClick(selectedText) {
    processUserInput(selectedText, true);
}

function sendMessage() {
    const input = document.getElementById("userInput");
    if (!input) return;
    const text = input.value.trim();
    if (text === "") return;

    input.value = "";
    processUserInput(text, false);
}

function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

function scrollToBottom() {
    const container = document.getElementById("chatMessages");
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

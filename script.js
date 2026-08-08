// ==========================================
// 1. 設定項目（お問い合わせ先URL / NGワード）
// ==========================================
const IELOVE_FORM_URL = "https://www.noahlivehome.jp/contact/";

const NG_WORDS = [
    "死ね", "殺す", "バカ", "馬鹿", "アホ", "ゴミ", "カス", 
    "キチガイ", "詐欺", "風俗", "金よこせ"
];

// ==========================================
// 2. チャット状態の管理
// ==========================================
const chatState = {
    mode: null,
    step: 0,
    data: {}
};

// 初期表示選択肢
const initialOptions = [
    { text: "🏠 部屋を借りたい", value: "rent" },
    { text: "🔑 物件を貸したい", value: "owner" },
    { text: "🏢 物件を売りたい", value: "sell" },
    { text: "🏡 物件を買いたい", value: "buy" }
];

function getRandomAizuchi(word) {
    const patterns = [
        `「${word}」ですね！承知いたしました。`,
        `「${word}」についてのご回答、ありがとうございます！`,
        `「${word}」ですね！ご入力ありがとうございます！`
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
}

// ------------------------------------------
// プロの知識一言コメント
// ------------------------------------------
function getSmartComment(mode, step, text) {
    const comments = {
        rent: {
            1: ["💡【エリア】主要路線へのアクセスや急行停車の有無など、利便性もあわせて比較検討いたします。"],
            2: ["💡【予算】適正家賃は「手取りの1/3以内」が目安です。管理費や共益費を含めた総額で最適化します！"],
            3: ["💡【間取り】生活動線や手持ちの家具サイズ、テレワークスペースの有無を考慮するのがポイントです。"],
            4: ["💡【築年数】1981年6月以降の新耐震基準物件であれば安心。築古でもリノベ済みはお得感があります！"],
            5: ["💡【時期】解約予告期間（通常1ヶ月前）との重複家賃を最小限に抑えるスケジュールをご提案します！"]
        },
        owner: {
            1: ["💡【種別】区分・戸建て・一棟など、種別ごとに最適な賃料設定とターゲット層の絞り込みを行います！"],
            2: ["💡【エリア】競合物件の成約事例をデータベースから分析し、空室リスクを抑えた適正賃料を算出します！"],
            3: ["💡【設備】宅配ボックスや無料Wi-Fiなど、ニーズの高い人気設備の導入提案も行っております！"],
            4: ["💡【維持】費用対効果（ROI）の高い原状回復や予防保全的なメンテナンス計画をご案内します！"],
            5: ["💡【運用】退去予定の段階から先行募集を打つことで、空室期間を最小化させます！"]
        },
        sell: {
            1: ["💡【種別】「高値追求の仲介売却」と「早期現金化の買取」のメリット・デメリットを比較提示いたします！"],
            2: ["💡【エリア】直近のレインズ成約データに基づき、客観的で適正な販売査定価格を算出します！"],
            3: ["💡【プライシング】専有面積や坪単価を分析し、周辺類似物件の中で競争力を発揮できる価格を設定します！"],
            4: ["💡【築年数】建物状況調査（インスペクション）の活用で、買主様に安心感を提供し値引きを防ぎます！"],
            5: ["💡【税制】「3000万円特別控除」など、控除や特例を最大限活かせるタイミングをアドバイスします！"]
        },
        buy: {
            1: ["💡【種別】新築・中古の比較から、将来の資産維持率（リセールバリュー）まで見据えてご提案します！"],
            2: ["💡【資金】物件価格だけでなく、登記費用やローン手数料などの諸費用を含めた総額で計画を立てます！"],
            3: ["💡【環境】ハザードマップや地盤強度、将来の周辺環境変化リスクもチェックいたします！"],
            4: ["💡【構造】将来の家族構成変化に対応できる可動性や、リフォーム可能な構造かどうかも見極めます！"],
            5: ["💡【管理】中古物件は管理組合の財務状況や修繕積立金の蓄積状況までプロの目で調査します！"]
        },
        // 自由入力から入った「ローン相談」専用のプロ知識
        loan: {
            1: ["💡【雇用形態・年収】事前審査では勤続年数や雇用形態も確認されます。状況に合わせた最適な金融機関を選定します！"],
            2: ["💡【予算・金利】変動金利・固定金利の特性を踏まえ、返済負担率（DTI）が安全圏におさまる資金計画を立てます！"],
            3: ["💡【優遇・控除】住宅ローン控除の適用条件や、各銀行の金利優遇幅を比較してトータルコストを抑えます！"]
        }
    };

    if (comments[mode] && comments[mode][step]) {
        const list = comments[mode][step];
        return list[Math.floor(Math.random() * list.length)];
    }
    return "";
}

window.addEventListener("load", () => {
    initChat();
});

function initChat() {
    const msgContainer = document.getElementById("chatMessages");
    if (msgContainer) msgContainer.innerHTML = "";
    
    appendBotMessage("いらっしゃいませ！\nノアリブホームAI住まいアシスタントです。\n\n本日はどのようなご相談でしょうか？\n選択肢から選ぶか、ご相談内容をそのまま入力してくださいね！");
    renderOptions(initialOptions);
}

// ==========================================
// 現在のステップに応じた質問・選択肢を取得
// ==========================================
function getCurrentStepPrompt() {
    const mode = chatState.mode;
    const step = chatState.step;

    // --- フリーワード「ローン相談」などの専用会話フロー ---
    if (mode === "loan") {
        if (step === 1) return {
            text: "住宅ローンのご相談ですね！プロの立場から丁寧にご案内いたします。\n\nまずは、現在「住宅ローンの事前審査」はお済みでしょうか？",
            options: [
                { text: "📝 これから検討・審査したい", value: "before_review" },
                { text: "✅ すでに審査通過済み", value: "after_review" },
                { text: "❓ 審査に通るか不安がある", value: "worry_review" }
            ]
        };
        if (step === 2) return {
            text: "承知いたしました！\nご検討中の「借入ご希望額」または「物件のご予算」はお決まりでしょうか？",
            options: [
                { text: "💰 3,000万円前後", value: "loan_3000" },
                { text: "💰 5,000万円前後", value: "loan_5000" },
                { text: "💰 7,000万円以上", value: "loan_7000" },
                { text: "💡 年収から借入上限を知りたい", value: "loan_income" }
            ]
        };
        if (step === 3) return {
            text: "ありがとうございます！\n金利タイプ（変動金利・固定金利）や、月々の返済額シミュレーションなどのご希望はございますか？",
            options: [
                { text: "📉 低金利な「変動金利」重視", value: "variable" },
                { text: "🔒 安定の「固定金利」重視", value: "fixed" },
                { text: "📊 プロに提案してほしい", value: "proposal" }
            ]
        };
        if (step === 4) return {
            text: "詳しく教えていただきありがとうございます！\nローンのヒアリング内容がまとまりました。\n\nほかにも気になる点があれば入力いただくか、下記ボタンよりお問合せへお進みください😊",
            options: [
                { text: "📩 この内容でお問合せへ進む", value: "contact", isPrimary: true },
                { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }
            ]
        };
    }

    // --- 既存のボタンフロー ---
    if (mode === "rent") {
        if (step === 1) return { text: "ご希望の「エリア（駅名や市区町村）」をお選びいただくか、直接入力してください。", options: [{ text: "📍 赤羽・北区エリア", value: "area_akabane" }, { text: "📍 その他23区", value: "area_23ku" }, { text: "📍 埼玉県", value: "area_saitama" }, { text: "💡 条件から相談する", value: "area_other" }] };
        if (step === 2) return { text: "ご希望の「ご予算（家賃上限）」を教えてください。", options: [{ text: "💴 8万円以内", value: "b_8" }, { text: "💴 10万円以内", value: "b_10" }, { text: "💴 12万円以内", value: "b_12" }, { text: "💴 15万円以上", value: "b_15" }] };
        if (step === 3) return { text: "ご希望の「間取り」をお選びいただくか、入力してください。", options: [{ text: "🛋 ワンルーム・1K", value: "1k" }, { text: "🛋 1DK・1LDK", value: "1ldk" }, { text: "🛋 2K・2DK・2LDK", value: "2ldk" }, { text: "🛋 3LDK以上", value: "3ldk" }] };
        if (step === 4) return { text: "お部屋の「広さや築年数」についてのご要望はいかがでしょうか？", options: [{ text: "✨ 築浅（築10年以内）希望", value: "new" }, { text: "📐 広さ重視（広めが良い）", value: "wide" }, { text: "💰 築年数は気にしない（安さ重視）", value: "cheap" }, { text: "⚖️ バランス重視", value: "normal" }] };
        if (step === 5) return { text: "お引っ越し・ご入居ご希望の「時期」はいつ頃をお考えでしょうか？", options: [{ text: "⚡️ 即入居・今すぐ", value: "now" }, { text: "🗓 1ヶ月以内", value: "1month" }, { text: "🗓 2〜3ヶ月以内", value: "3months" }, { text: "🔍 良い物件があれば検討", value: "someday" }] };
        if (step === 6) return { text: "最後に「譲れないこだわり条件」があれば教えてください！\n\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📅 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }, { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }] };
    }

    if (mode === "owner") {
        if (step === 1) return { text: "ご所有物件の「種別」をお選びいただくか、入力してください。", options: [{ text: "🏢 マンション・アパート", value: "mansion_single" }, { text: "🏢 一棟マンション・ビル", value: "mansion_building" }, { text: "🏠 一戸建て", value: "house" }, { text: "🏬 店舗事務所・その他", value: "apartment" }] };
        if (step === 2) return { text: "物件のおおよその「所在地（エリア）」を教えてください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "📍 その他の地域", value: "other" }] };
        if (step === 3) return { text: "ご所有物件の「間取り」をお聞かせいただけますか？", options: [{ text: "🛋 単身用（1K〜1LDK）", value: "single" }, { text: "🛋 ファミリー用（2LDK〜3LDK）", value: "family" }, { text: "🏠 大型・戸建て（4LDK以上）", value: "large" }, { text: "🏢 一棟まるごと（複数室）", value: "building" }] };
        if (step === 4) return { text: "おおよその「築年数」はどちらになりますでしょうか？", options: [{ text: "✨ 築10年未満（築浅）", value: "under10" }, { text: "🏢 築10年〜20年程度", value: "under20" }, { text: "🏚 築20年以上", value: "over20" }, { text: "❓ 不明・要確認", value: "unknown" }] };
        if (step === 5) return { text: "現在の「お部屋の現況（空室、賃貸中など）」を教えてください。", options: [{ text: "❓ 現在、空室中", value: "vacancy" }, { text: "🚪 近々、退去予定", value: "leaving" }, { text: "🏠 現在、満室稼働中", value: "full" }, { text: "👤 居住中（貸出検討段階）", value: "living" }] };
        if (step === 6) return { text: "ご検討・ご希望の「管理スタイルやプラン」はございますか？", options: [{ text: "🤝 集客〜集金・管理まで全て任せたい", value: "full_manage" }, { text: "📢 集客（入居者募集）のみ依頼したい", value: "recruit_only" }, { text: "🛠️ 管理会社を変更したい", value: "sublease" }, { text: "💡 まずは賃料査定・相談のみ", value: "estimate_only" }] };
        if (step === 7) return { text: "最後に「ご要望や気になっている点」があれば教えてください！\n\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📋 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }, { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }] };
    }

    if (mode === "sell") {
        if (step === 1) return { text: "ご所有物件の「種別」をお選びいただくか、入力してください。", options: [{ text: "🏢 マンション", value: "sell_mansion" }, { text: "🏠 一戸建て", value: "sell_house" }, { text: "🏞 土地", value: "sell_land" }, { text: "🏬 一棟ビル・アパート", value: "sell_building" }] };
        if (step === 2) return { text: "物件の「所在地（エリア）」をお選びいただくか、入力してください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "📍 その他の地域", value: "other" }] };
        if (step === 3) return { text: "物件の「間取りや広さの目安」を教えていただけますか？", options: [{ text: "🛋 コンパクト（〜50㎡ / 1〜2LDK）", value: "small" }, { text: "🏠 標準ファミリー（50〜80㎡ / 3LDK）", value: "medium" }, { text: "🏡 大型（80㎡以上 / 4LDK以上）", value: "large" }, { text: "🏢 一棟物件・土地", value: "land_building" }] };
        if (step === 4) return { text: "物件の「築年数」の目安を教えてください。", options: [{ text: "✨ 築10年未満（築浅）", value: "under10" }, { text: "🏢 築10年〜20年程度", value: "under20" }, { text: "🏚 築20年以上", value: "over20" }, { text: "❓ 不明・要確認", value: "unknown" }] };
        if (step === 5) return { text: "現在の「ご利用状況やご売却時期」を教えてください。", options: [{ text: "👤 自身で居住中（早期売却希望）", value: "living_now" }, { text: "🚪 現在、空家・空室", value: "empty" }, { text: "💰 賃貸中（オーナーチェンジ）", value: "rented" }, { text: "🗓 良い条件があれば時期問わず検討", value: "someday" }] };
        if (step === 6) return { text: "最後に「ご売却に関するその他ご要望」があれば教えてください！\n\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📝 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }, { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }] };
    }

    if (mode === "buy") {
        if (step === 1) return { text: "どのような「種別」をお探しでしょうか？", options: [{ text: "🏢 新築・中古マンション", value: "buy_mansion" }, { text: "🏡 新築・中古一戸建て", value: "buy_house" }, { text: "🏞 土地", value: "buy_land" }, { text: "🏬 投資用・事業用物件", value: "buy_invest" }] };
        if (step === 2) return { text: "ご予算の「イメージ上限」をお聞かせください。", options: [{ text: "💰 3,000万円以内", value: "3000" }, { text: "💰 5,000万円以内", value: "5000" }, { text: "💰 7,000万円以内", value: "7000" }, { text: "💰 7,000万円以上", value: "over7000" }] };
        if (step === 3) return { text: "ご購入をご希望の「エリア（駅名や地域）」を教えてください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "💡 エリアから相談したい", value: "other" }] };
        if (step === 4) return { text: "ご希望の「間取りや広さ」はいかがでしょうか？", options: [{ text: "🛋 1LDK〜2DK", value: "1ldk" }, { text: "🛋 2LDK〜3LDK", value: "3ldk" }, { text: "🏠 4LDK以上", value: "4ldk" }, { text: "🏬 一棟・事業用", value: "business" }] };
        if (step === 5) return { text: "「築年数」のご希望はございますか？", options: [{ text: "✨ 新築・築浅（10年以内）", value: "new" }, { text: "🏢 築20年以内", value: "under20" }, { text: "🛠 リノベーション前提", value: "renovation" }, { text: "⚖️ 特に拘らない", value: "any" }] };
        if (step === 6) return { text: "最後に住宅ローンやご要望など「気になっている点」はございますか？\n\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📱 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }, { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }] };
    }

    return { text: "まずはどのようなご相談をお望みか、下記よりお選びいただけますか？", options: initialOptions };
}

function getStepFieldName(mode, step) {
    const fields = {
        rent: { 1: "希望エリア", 2: "希望予算", 3: "希望間取り", 4: "築年数・広さ希望", 5: "入居時期" },
        owner: { 1: "物件種別", 2: "物件所在地", 3: "物件の間取り", 4: "築年数", 5: "現況", 6: "ご希望の管理形態" },
        sell: { 1: "物件種別", 2: "物件所在地", 3: "間取り・広さ", 4: "築年数", 5: "現況・売却時期" },
        buy: { 1: "購入希望種別", 2: "ご予算上限", 3: "希望エリア", 4: "希望間取り", 5: "希望築年数" },
        loan: { 1: "事前審査状況", 2: "借入・予算希望", 3: "金利タイプ希望" }
    };
    return fields[mode]?.[step] || "ご相談内容";
}

// ==========================================
// 3. AI会話ロジック
// ==========================================
function getAIResponse(userInputText, isFromButton = false) {
    const text = userInputText.trim();

    // NGワードチェック
    if (NG_WORDS.some(word => text.includes(word))) {
        const currentPrompt = getCurrentStepPrompt();
        return {
            text: "⚠️ 不適切な表現が含まれているため処理できませんでした。\nお手数ですが別のお言葉でご入力いただくか、下記よりお選びください。",
            options: currentPrompt.options
        };
    }

    // メインメニューに戻る
    if (text.includes("メインメニューに戻る")) {
        chatState.mode = null;
        chatState.step = 0;
        chatState.data = {};
        return {
            text: "メインメニューに戻りました！\nご希望のご相談内容をお選びいただくか、ご質問を送信してくださいね！",
            options: initialOptions
        };
    }

    // --------------------------------------
    // 自由入力テキスト（新規相談・会話の途中入力）
    // --------------------------------------
    if (!isFromButton && chatState.step === 0) {
        // 「ローン」ワードが含まれる場合、ローンモードへ引き入れる
        if (text.includes("ローン") || text.includes("借入") || text.includes("金利") || text.includes("事前審査")) {
            chatState.mode = "loan";
            chatState.step = 1;
            chatState.data = { "相談テーマ": text };
            
            const prompt = getCurrentStepPrompt();
            return {
                text: prompt.text,
                options: prompt.options
            };
        }

        // その他の自由入力（初期状態）
        chatState.data["自由相談"] = text;
        return {
            text: `「${text}」ですね！承知いたしました。\nより詳しいご提案のため、差し支えなければご相談のカテゴリをお選びいただけますでしょうか？`,
            options: initialOptions
        };
    }

    // 会話途中でテキスト入力があった場合（メモリ保存して質問を再表示）
    if (!isFromButton && chatState.mode) {
        const key = `補足メモ(Step${chatState.step})`;
        chatState.data[key] = text;

        let aizuchi = getRandomAizuchi(text);
        const prompt = getCurrentStepPrompt();

        return {
            text: `${aizuchi}\n\nご要望・メモとして記録いたしました！\n引き続き、下記についてお聞かせいただけますでしょうか？\n\n${prompt.text}`,
            options: prompt.options
        };
    }

    // --------------------------------------
    // ボタンクリック時の進行処理
    // --------------------------------------
    if (chatState.step === 0) {
        if (text.includes("借りたい")) chatState.mode = "rent";
        else if (text.includes("貸したい")) chatState.mode = "owner";
        else if (text.includes("売りたい")) chatState.mode = "sell";
        else if (text.includes("買いたい")) chatState.mode = "buy";

        if (chatState.mode) {
            chatState.step = 1;
            chatState.data = {};
            const prompt = getCurrentStepPrompt();
            return {
                text: prompt.text,
                options: prompt.options
            };
        }
    }

    // ステップを1進める
    if (chatState.mode) {
        const fieldName = getStepFieldName(chatState.mode, chatState.step);
        chatState.data[fieldName] = text;

        const currentStep = chatState.step;
        chatState.step++;

        let aizuchi = getRandomAizuchi(text);
        let comment = getSmartComment(chatState.mode, currentStep, text);
        let prompt = getCurrentStepPrompt();

        let responseText = `${aizuchi}`;
        if (comment) responseText += `\n\n${comment}`;
        responseText += `\n\n${prompt.text}`;

        return {
            text: responseText,
            options: prompt.options
        };
    }

    return {
        text: "まずはどのようなご相談をお望みか、下記よりお選びいただけますか？",
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
            btn.onclick = () => handleOptionClick(opt.text);
            gridDiv.appendChild(btn);
        });
        container.appendChild(gridDiv);
    }

    primaryOptions.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn primary";
        btn.innerText = opt.text;
        btn.onclick = () => handleOptionClick(opt.text);
        container.appendChild(btn);
    });

    scrollToBottom();
}

function handleOptionClick(selectedText) {
    appendUserMessage(selectedText);

    if (selectedText.includes("お問合せへ進む") || selectedText.includes("予約") || selectedText.includes("申込む")) {
        setTimeout(() => {
            appendBotMessage("ありがとうございます！\nこれまでのご質問・ヒアリング内容をお問い合わせフォームへ自動で引き継ぎます。\n\nまもなくお問合せページへ移動しますので、お名前やご連絡先をご入力の上ご送信ください✨");
            
            const optContainer = document.getElementById("chatOptions");
            if (optContainer) optContainer.innerHTML = "";

            setTimeout(() => {
                let summaryText = `【AIチャットからの引き継ぎ内容】\n`;
                
                const modeNames = {
                    rent: "お部屋探し（賃貸希望）",
                    owner: "物件の賃貸管理・貸出（オーナー様）",
                    sell: "物件のご売却（売却希望）",
                    buy: "物件のご購入（購入希望）",
                    loan: "住宅ローンのご相談"
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

    setTimeout(() => {
        const response = getAIResponse(selectedText, true);
        appendBotMessage(response.text);
        renderOptions(response.options);
    }, 300);
}

function sendMessage() {
    const input = document.getElementById("userInput");
    if (!input) return;
    const text = input.value.trim();
    if (text === "") return;

    appendUserMessage(text);
    input.value = "";

    setTimeout(() => {
        const response = getAIResponse(text, false);
        appendBotMessage(response.text);
        renderOptions(response.options);
    }, 300);
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

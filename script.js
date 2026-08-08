// ==========================================
// 1. 設定項目（お問い合わせ先URL / NGワード）
// ==========================================
const IELOVE_FORM_URL = "https://www.noahlivehome.jp/contact/";

const NG_WORDS = [
    "死ね", "殺す", "バカ", "馬鹿", "アホ", "ゴミ", "カス", 
    "ばか", "詐欺", "あほ", "ごみ","かす", "しね"
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

function getRandomAizuchi(word) {
    const patterns = [
        `「${word}」についてのご相談ですね！`,
        `「${word}」ですね！承知いたしました。`,
        `「${word}」に関するご質問ですね！`,
        `「${word}」ですね！お任せください。`
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
}

// ------------------------------------------
// プロの知識一言コメント
// ------------------------------------------
function getSmartComment(mode, step, text) {
    const comments = {
        rent: {
            1: [
                "💡【エリア】人気のエリアですね！主要路線へのアクセスや急行停車の有無など、利便性もあわせて比較検討いたします。",
                "💡【エリア】生活利便施設（スーパー・医療機関等）の充実度や夜間の街灯状況など、住環境の観点からも分析します！",
                "💡【エリア】治安情報や周辺の再開発計画も含め、長く快適に暮らせる住みやすいエリアをご提案いたします！"
            ],
            2: [
                "💡【予算】一般的に適正家賃は「手取り収入の1/3以内」が目安とされます。管理費・共益費も含めた総額で最適化します！",
                "💡【予算】家賃発生日の調整やフリーレント（家賃無料期間）交渉が可能な物件も視野に入れて探してまいります。",
                "💡【予算】初期費用（敷金・礼金・保証料）を抑えられる物件を組み合わせることで、トータルの引越しコストを下げられますよ！"
            ],
            3: [
                "💡【間取り】生活動線はもちろん、手持ちの家具サイズやテレワークスペースの有無を考慮したレイアウト選びがポイントです。",
                "💡【間取り】同じ専有面積でも、廊下面積が少ない間取りやデッドスペースの少ない形状を選ぶとお部屋を広く使えます！"
            ],
            4: [
                "💡【築年数・広さ】1981年6月以降の新耐震基準物件であれば構造面も安心。築古でもフルリノベーション済みはお得感があります！",
                "💡【築年数・広さ】壁構造や床構造（二重床・二重天井）など、防音性・遮音性に関わる構造面も考慮してピックアップします！"
            ],
            5: [
                "💡【時期】退去予定（未公開）物件の先行申込など、タイミングに合わせた最短ルートの物件確保をご案内します！",
                "💡【時期】現在のお住まいの解約予告期間（通常1ヶ月前）との重複家賃（二重家賃）を最小限に抑えるご案内をいたします！"
            ]
        },
        owner: {
            1: ["💡【種別】区分・戸建て・一棟など、アセット種別ごとに最適な賃料設定とターゲット層の絞り込みを行います！"],
            2: ["💡【エリア】周辺の賃貸需給バランスや競合物件の成約事例をデータベースから精緻に分析し、適正賃料を算出します！"],
            3: ["💡【間取り】ターゲット属性に合わせた人気設備（宅配ボックス・無料Wi-Fi等）の導入提案も行います。"],
            4: ["💡【築年数・現況】修繕履歴や設備の耐用年数を踏まえ、費用対効果（ROI）の高い原状回復をご提案します！"],
            5: ["💡【現況】空室期間の長期化は収益性の最大のリスクです。広告料（AD）の設定やフリーレント活用など即効性のある提案をします！"]
        },
        sell: {
            1: ["💡【種別】「高値追求の仲介売却」と「早期現金化・瑕疵担保免責の買取」のメリット・デメリットを比較提示いたします！"],
            2: ["💡【エリア】直近のレインズ成約データや競合売り出し事例に基づき、客観的な適正価格を算出します！"],
            3: ["💡【広さ】専有面積や坪単価の分析を行い、近隣類似物件の中で競争力を発揮できるプライシングを行います！"],
            4: ["💡【築年数】インスペクション（建物状況調査）を活用し、買主様に「安心感」を提供することで値引き交渉を防ぐ手法もございます。"],
            5: ["💡【現況・時期】「3000万円特別控除」や「買い替え特例」など、税制メリットを最大限活かせるタイミングをご案内します！"]
        },
        buy: {
            1: ["💡【種別】新築・中古のメリット比較はもちろん、将来の資産維持率（リセールバリュー）まで見据えた物件選びを伝授します！"],
            2: ["💡【予算】変動・固定金利の選択、住宅ローン控除（減税）の適用条件まで見据えた最適なローン組みをご提案します。"],
            3: ["💡【エリア】ハザードマップ（洪水・土砂災害等）や地盤の強度、用途地域による将来の周辺環境変化リスクもチェックします！"],
            4: ["💡【間取り】将来の家族構成の変化（出産・独立・同居）に対応できる、可動性・柔軟性の高い間取りをプロの目線で評価します。"],
            5: ["💡【築年数】中古物件の場合、管理組合の財務状況（修繕積立金の滞納額や積立不足の有無）までプロの目で調査します。"]
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

function getCurrentStepPrompt() {
    const mode = chatState.mode;
    const step = chatState.step;

    if (mode === "rent") {
        if (step === 1) return { text: "ご希望の「エリア（駅名や市区町村）」をお選びいただくか、直接入力してください。", options: [{ text: "📍 赤羽・北区エリア", value: "area_akabane" }, { text: "📍 その他23区", value: "area_23ku" }, { text: "📍 埼玉県", value: "area_saitama" }, { text: "💡 条件から相談する", value: "area_other" }] };
        if (step === 2) return { text: "ご希望の「ご予算（家賃上限）」を教えてください。", options: [{ text: "💴 8万円以内", value: "b_8" }, { text: "💴 10万円以内", value: "b_10" }, { text: "💴 12万円以内", value: "b_12" }, { text: "💴 15万円以上", value: "b_15" }] };
        if (step === 3) return { text: "ご希望の「間取り」をお選びいただくか、入力してください。", options: [{ text: "🛋 ワンルーム・1K", value: "1k" }, { text: "🛋 1DK・1LDK", value: "1ldk" }, { text: "🛋 2K・2DK・2LDK", value: "2ldk" }, { text: "🛋 3LDK以上", value: "3ldk" }] };
        if (step === 4) return { text: "お部屋の「広さや築年数」についてのご要望はいかがでしょうか？", options: [{ text: "✨ 築浅（築10年以内）希望", value: "new" }, { text: "📐 広さ重視（広めが良い）", value: "wide" }, { text: "💰 築年数は気にしない（安さ重視）", value: "cheap" }, { text: "⚖️ バランス重視", value: "normal" }] };
        if (step === 5) return { text: "お引っ越し・ご入居ご希望の「時期」はいつ頃をお考えでしょうか？", options: [{ text: "⚡️ 即入居・今すぐ", value: "now" }, { text: "🗓 1ヶ月以内", value: "1month" }, { text: "🗓 2〜3ヶ月以内", value: "3months" }, { text: "🔍 良い物件があれば検討", value: "someday" }] };
        if (step === 6) return { text: "最後に「譲れないこだわり条件」があれば教えてください！\n\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📅 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
    }
    if (mode === "owner") {
        if (step === 1) return { text: "ご所有物件の「種別」をお選びいただくか、入力してください。", options: [{ text: "🏢 マンション・アパート", value: "mansion_single" }, { text: "🏢 一棟マンション・ビル", value: "mansion_building" }, { text: "🏠 一戸建て", value: "house" }, { text: "🏬 店舗事務所・その他", value: "apartment" }] };
        if (step === 2) return { text: "物件のおおよその「所在地（エリア）」を教えてください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "📍 その他の地域", value: "other" }] };
        if (step === 3) return { text: "ご所有物件の「間取り」をお聞かせいただけますか？", options: [{ text: "🛋 単身用（1K〜1LDK）", value: "single" }, { text: "🛋 ファミリー用（2LDK〜3LDK）", value: "family" }, { text: "🏠 大型・戸建て（4LDK以上）", value: "large" }, { text: "🏢 一棟まるごと（複数室）", value: "building" }] };
        if (step === 4) return { text: "おおよその「築年数」はどちらになりますでしょうか？", options: [{ text: "✨ 築10年未満（築浅）", value: "under10" }, { text: "🏢 築10年〜20年程度", value: "under20" }, { text: "🏚 築20年以上", value: "over20" }, { text: "❓ 不明・要確認", value: "unknown" }] };
        if (step === 5) return { text: "現在の「お部屋の現況（空室、賃貸中など）」を教えてください。", options: [{ text: "❓ 現在、空室中", value: "vacancy" }, { text: "🚪 近々、退去予定", value: "leaving" }, { text: "🏠 現在、満室稼働中", value: "full" }, { text: "👤 居住中（貸出検討段階）", value: "living" }] };
        if (step === 6) return { text: "ご検討・ご希望の「管理スタイルやプラン」はございますか？", options: [{ text: "🤝 集客〜集金・管理まで全て任せたい", value: "full_manage" }, { text: "📢 集客（入居者募集）のみ依頼したい", value: "recruit_only" }, { text: "🛠️ 管理会社を変更したい", value: "sublease" }, { text: "💡 まずは賃料査定・相談のみ", value: "estimate_only" }] };
        if (step === 7) return { text: "最後に「ご要望や気になっている点」があれば教えてください！\n\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📋 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
    }
    if (mode === "sell") {
        if (step === 1) return { text: "ご所有物件の「種別」をお選びいただくか、入力してください。", options: [{ text: "🏢 マンション", value: "sell_mansion" }, { text: "🏠 一戸建て", value: "sell_house" }, { text: "🏞 土地", value: "sell_land" }, { text: "🏬 一棟ビル・アパート", value: "sell_building" }] };
        if (step === 2) return { text: "物件の「所在地（エリア）」をお選びいただくか、入力してください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "📍 その他の地域", value: "other" }] };
        if (step === 3) return { text: "物件の「間取りや広さの目安」を教えていただけますか？", options: [{ text: "🛋 コンパクト（〜50㎡ / 1〜2LDK）", value: "small" }, { text: "🏠 標準ファミリー（50〜80㎡ / 3LDK）", value: "medium" }, { text: "🏡 大型（80㎡以上 / 4LDK以上）", value: "large" }, { text: "🏢 一棟物件・土地", value: "land_building" }] };
        if (step === 4) return { text: "物件の「築年数」の目安を教えてください。", options: [{ text: "✨ 築10年未満（築浅）", value: "under10" }, { text: "🏢 築10年〜20年程度", value: "under20" }, { text: "🏚 築20年以上", value: "over20" }, { text: "❓ 不明・要確認", value: "unknown" }] };
        if (step === 5) return { text: "現在の「ご利用状況やご売却時期」を教えてください。", options: [{ text: "👤 自身で居住中（早期売却希望）", value: "living_now" }, { text: "🚪 現在、空家・空室", value: "empty" }, { text: "💰 賃貸中（オーナーチェンジ）", value: "rented" }, { text: "🗓 良い条件があれば時期問わず検討", value: "someday" }] };
        if (step === 6) return { text: "最後に「ご売却に関するその他ご要望」があれば教えてください！\n\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📝 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
    }
    if (mode === "buy") {
        if (step === 1) return { text: "どのような「種別」をお探しでしょうか？", options: [{ text: "🏢 新築・中古マンション", value: "buy_mansion" }, { text: "🏡 新築・中古一戸建て", value: "buy_house" }, { text: "🏞 土地", value: "buy_land" }, { text: "🏬 投資用・事業用物件", value: "buy_invest" }] };
        if (step === 2) return { text: "ご予算の「イメージ上限」をお聞かせください。", options: [{ text: "💰 3,000万円以内", value: "3000" }, { text: "💰 5,000万円以内", value: "5000" }, { text: "💰 7,000万円以内", value: "7000" }, { text: "💰 7,000万円以上", value: "over7000" }] };
        if (step === 3) return { text: "ご購入をご希望の「エリア（駅名や地域）」を教えてください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "💡 エリアから相談したい", value: "other" }] };
        if (step === 4) return { text: "ご希望の「間取りや広さ」はいかがでしょうか？", options: [{ text: "🛋 1LDK〜2DK", value: "1ldk" }, { text: "🛋 2LDK〜3LDK", value: "3ldk" }, { text: "🏠 4LDK以上", value: "4ldk" }, { text: "🏬 一棟・事業用", value: "business" }] };
        if (step === 5) return { text: "「築年数」のご希望はございますか？", options: [{ text: "✨ 新築・築浅（10年以内）", value: "new" }, { text: "🏢 築20年以内", value: "under20" }, { text: "🛠 リノベーション前提", value: "renovation" }, { text: "⚖️ 特に拘らない", value: "any" }] };
        if (step === 6) return { text: "最後に住宅ローンやご要望など「気になっている点」はございますか？\n\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📱 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
    }

    return { text: "まずはどのようなご相談をお望みか、下記よりお選びいただけますか？", options: initialOptions };
}

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
// 3. 臨機応変なAI会話ロジック（自由入力対応強化）
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

    // --------------------------------------
    // 【改善点】ボタン非選択の自由入力があった場合の会話対応
    // --------------------------------------
    if (!isFromButton) {
        // メモリ保存
        if (chatState.data["自由相談内容"]) {
            chatState.data["自由相談内容"] += ` / ${text}`;
        } else {
            chatState.data["自由相談内容"] = text;
        }

        let aizuchi = getRandomAizuchi(text);
        let expertAdvice = "";

        // 1. ローンに関する相談
        if (text.includes("ローン") || text.includes("借入") || text.includes("金利") || text.includes("事前審査")) {
            expertAdvice = "💡住宅ローンの事前審査や借入額のご相談ですね！\n提携銀行や金利種別（変動・固定）のご案内から、年収に応じた無理のない返済シミュレーションまで専門スタッフが丁寧にご案内可能です。";
        } 
        // 2. 費用・初期費用・手数料の相談
        else if (text.includes("費用") || text.includes("料金") || text.includes("いくら") || text.includes("初期費用") || text.includes("手数料")) {
            expertAdvice = "💡お費用に関するご質問ですね！\nご相談・事前査定・お部屋探しのご提案は【すべて無料】です。\n契約にかかる初期費用の分割や抑え方についても柔軟にご相談を承っております！";
        } 
        // 3. リフォーム・リノベーションの相談
        else if (text.includes("リフォーム") || text.includes("リノベ") || text.includes("修繕")) {
            expertAdvice = "💡リフォームやリノベーションについてですね！\n購入後のリノベ提案から、売却前の資産価値向上リフォーム、賃貸オーナー様向けの空室対策リフォームまで幅広くサポートいたします！";
        } 
        // 4. 一般的な質問やその他の相談
        else {
            expertAdvice = "💡詳しくご入力いただきありがとうございます！\n当店の不動産プロスタッフがお客様のご要望に合わせてしっかりと対応させていただきます。";
        }

        // 自由入力に対して会話で返し、そのまま問い合わせボタンへ誘引
        return {
            text: `${aizuchi}\n\n${expertAdvice}\n\n詳しい内容やご提案については、下記ボタンよりお問合せフォームへ進んでいただくか、引き続きご質問を入力してください😊`,
            options: [
                { text: "📩 この内容でお問合せへ進む", value: "contact", isPrimary: true },
                { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }
            ]
        };
    }

    // 「メインメニューに戻る」を押した場合の初期化
    if (text.includes("メインメニューに戻る")) {
        chatState.mode = null;
        chatState.step = 0;
        return {
            text: "メインメニューに戻りました！\nご希望のご相談内容をお選びください。",
            options: initialOptions
        };
    }

    // --------------------------------------
    // 通常のステップフロー（ボタン選択時）
    // --------------------------------------
    const maxSteps = { rent: 5, owner: 6, sell: 5, buy: 5 };
    const isFinished = chatState.mode && chatState.step > maxSteps[chatState.mode];

    if (isFinished) {
        return {
            text: `「${text}」ですね！ご要望として記録いたしました！\n\nこれでお伺いした条件の整理が完了いたしました✨\n下記ボタンよりお問合せフォームへお進みください！`,
            options: [
                { text: "📅 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
            ]
        };
    }

    // モード開始判定
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

    // ステップ進行
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
            appendBotMessage("ありがとうございます！\nこれまでのご相談内容をお問い合わせフォームへ自動で引き継ぎます。\n\nまもなくお問合せページへ移動しますので、お名前やご連絡先をご入力の上ご送信ください✨");
            
            const optContainer = document.getElementById("chatOptions");
            if (optContainer) optContainer.innerHTML = "";

            setTimeout(() => {
                let summaryText = `【AIチャットからの引き継ぎ内容】\n`;
                
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

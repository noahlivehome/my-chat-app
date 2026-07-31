// ==========================================
// 1. 設定項目（お問い合わせ先URL & NGワード）
// ==========================================
const IELOVE_FORM_URL = "https://www.noahlivehome.jp/contact/";

// 不適切な言葉（暴言・中傷など）のリスト
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

// 相槌のバリエーションをランダムに返す関数（絵文字最大1つ）
function getRandomAizuchi(word) {
    const patterns = [
        `「${word}」ですね！承知いたしました。`,
        `「${word}」ですね！`,
        `「${word}」ですね！かしこまりました。`,
        `「${word}」ですね！ありがとうございます！`,
        `「${word}」ですね！ご入力ありがとうございます！`
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
}

// ------------------------------------------
// バリエーション豊かな一言コメントを取得する関数（絵文字最大1つ）
// ------------------------------------------
function getSmartComment(mode, step, text) {
    const comments = {
        rent: {
            1: [
                "💡【エリア】人気のエリアですね！利便性や住環境も含めてぴったりのお部屋をご提案いたします！",
                "💡【エリア】住みやすさや交通アクセスなど、ご希望のエリア特性に合わせたおすすめ物件をピックアップします！",
                "💡【エリア】周辺の買い物環境や通勤・通学のしやすさも考慮して、素敵なお部屋をご紹介しますね！"
            ],
            2: [
                "💡【予算】周辺相場に合わせたご予算設定で、条件を満たす魅力的なお部屋を幅広く探します！",
                "💡【予算】家賃と管理費のバランスを見ながら、無理のないお得な好条件物件を厳選いたします。",
                "💡【予算】ご予算内で最大限ご希望に沿えるよう、最新の空室情報から探してまいります！"
            ],
            3: [
                "💡【間取り】生活動線や家具配置を見据え、ライフスタイルにピッタリフィットする間取りをご提案します！",
                "💡【間取り】お一人暮らしからご家族での暮らしまで、使い勝手の良い間取りをお選びいたします。",
                "💡【間取り】収納の多さや居室のレイアウトなど、快適に過ごせるお部屋を見極めます！"
            ],
            4: [
                "💡【築年数・広さ】築年数が経っていてもリノベーション済みでお得な掘り出し物が見つかることもあります。",
                "💡【築年数・広さ】綺麗さ重視か、広さ・コスパ重視かに合わせて最適な選択肢をご提示します！",
                "💡【築年数・広さ】水回りの清潔さや全体のゆとりなど、こだわりポイントに寄り添ってご提案します！"
            ],
            5: [
                "💡【時期】ご希望の入居時期から逆算し、申し込みや契約までのスムーズなスケジュールをご案内します！",
                "💡【時期】お引っ越し時期に合わせた一番良いタイミングで最新の空室状況をお届けします。",
                "💡【時期】急ぎのお引っ越しからじっくり検討まで、最適なステップでサポートいたします！"
            ]
        },
        owner: {
            1: ["💡【種別】物件種別に合わせた適切な賃料設定と効率的な募集体制が高稼働率の鍵となります！", "💡【種別】マンション・戸建てなど、各種別の強みを活かした賃貸運用プランをご提案します！", "💡【種別】ターゲット層に響く設備や条件を設定し、スムーズな入居者獲得を目指します✨"],
            2: ["💡【エリア】周辺エリアの賃貸需要や競合物件を分析し、最適な募集条件・プランをご提示いたします！", "💡【エリア】地域ごとの賃料相場やターゲット属性を見極め、空室リスクを最小限に抑えます👍", "💡【エリア】エリア特性を反映した魅力的なプロモーションで、早期の満室稼働をサポートします！"],
            3: ["💡【間取り】単身・ファミリーなど間取りごとの入居者ターゲットに合わせた設備訴求が効果的です！", "💡【間取り】ニーズの高い間取りのポイントを押さえ、賃料アップや長期入居につながる提案をします✨", "💡【間取り】ライフスタイルに合わせたお部屋の見せ方で、物件の魅力を引き出します！"],
            4: ["💡【築年数・現況】築年数に応じた適切なリフォーム・設備交換提案で、物件価値を維持・向上させます！", "💡【築年数・現況】必要最小限の修繕で最大の賃料効果を生む、コスパの良い原状回復をご提案します。", "💡【築年数・現況】経年変化に合わせたメンテナンス計画で、長期的に安定した賃貸経営を実現します！"],
            5: ["💡【現況】現在の稼働状況に合わせた集客アプローチを行い、空室期間を短縮させます✨", "💡【現況】退去予告時期や現在の空室期間に応じたスピード感のある募集活動を展開します！", "💡【現況】現在の稼働状況を踏まえ、オーナー様に負担の少ない最適な運用方法を一緒に考えます！"]
        },
        sell: {
            1: ["💡【種別】仲介での高値売却や買取での早期現金化など、ご事情に応じた売却戦略をご提示します！", "💡【種別】物件種ごとの市場需要を把握し、一番高く・良い条件で売却できるルートを探ります👍", "💡【種別】マンション・戸建て・土地それぞれの強みを活かしたプロモーションを展開いたします！"],
            2: ["💡【エリア】近隣の最新成約事例や競合状況を分析し、高値かつスムーズに売れる適正価格をご提示します！", "💡【エリア】地域の購入意欲の高い層へピンポイントでアプローチし、好条件での売却を目指します✨", "💡【エリア】市場トレンドとエリアの魅力を掛け合わせた査定価格を算定いたします！"],
            3: ["💡【広さ】お部屋の広さや使い勝手を活かし、最も購入意欲の高いターゲット層へアピールします！", "💡【広さ】ファミリー向けや単身向けなど、広さに合わせた訴求で買主様の心を掴みます👍", "💡【広さ】居住スペースの魅力や空間の広がりを最大限に伝えるPRを行います！"],
            4: ["💡【築年数】築年数に応じた耐震性や設備状況のアピールポイントを整え、適正価値を算出します！", "💡【築年数】リフォーム履歴などの付加価値も査定金額にしっかり反映させます👍", "💡【築年数】経年変化をカバーする魅せ方で、お買主様への訴求力を高めます！"],
            5: ["💡【現況・時期】居住中・空家の状態に応じた魅せ方や、買い替え時期・売却にかかる税金もサポートします！", "💡【現況・時期】売却のタイミングや控除等の税制メリットも踏まえ、一番手残りが多くなるご提案をします✨", "💡【現況・時期】ご希望の売却時期に合わせたスケジュールで、安心して進められるよう伴走いたします！"]
        },
        buy: {
            1: ["💡【種別】新築・中古それぞれの特徴や、将来の資産価値を見据えた失敗しない物件選びをお手伝いします！", "💡【種別】ご希望のライフスタイルに合い、長く安心して住める物件種別をご案内いたします👍", "💡【種別】将来の売却や賃貸出し（資産性）も視野に入れた価値ある物件選びをサポートします！"],
            2: ["💡【予算】住宅ローンの金利タイプや税制優遇、諸費用も含めた無理のない資金計画をご提案いたします👍", "💡【予算】毎月のご返済額と総予算のバランスを整え、安心して購入できる範囲をご案内します✨", "💡【予算】事前審査から資金計画まで、失敗しないお金のシミュレーションをお手伝いします！"],
            3: ["💡【エリア】周辺の住環境や将来の再開発計画など、資産価値が下がりにくい人気エリアから厳選します！", "💡【エリア】通勤・通学の利便性はもちろん、お子様の教育環境や買い出しのしやすさも考慮いたします👍", "💡【エリア】地域ごとの市場トレンドを押さえ、掘り出し物件の情報をいち早くお届けします！"],
            4: ["💡【間取り】将来のライフステージの変化にも柔軟に対応でき、資産性を維持できる間取りをご案内します！", "💡【間取り】ご家族の動線やプライベート空間を意識した、暮らしやすい間取りをご提案します✨", "💡【間取り】家具配置や日当たり・風通しなど、住み心地の良さを第一に考慮いたします！"],
            5: ["💡【築年数】住宅ローン控除の適用条件や耐震基準の適合など、専門的なチェック項目もお伝えします！", "💡【築年数】新耐震基準やリノベーションの可能性も含め、安全で安心な物件を見極めます👍", "💡【築年数】築年数に応じた修繕履歴や管理体制もしっかりチェックしてご案内いたします！"]
        }
    };

    if (comments[mode] && comments[mode][step]) {
        const list = comments[mode][step];
        return list[Math.floor(Math.random() * list.length)];
    }
    return "";
}

// 画面読み込み完了時に初期メッセージを表示
window.addEventListener("load", () => {
    initChat();
});

function initChat() {
    const msgContainer = document.getElementById("chatMessages");
    if (msgContainer) msgContainer.innerHTML = "";
    
    appendBotMessage("いらっしゃいませ！\nノアライブホーム AIアシスタントです。\n\n本日はどのようなご相談でしょうか？\n下の選択肢から選ぶか、ご相談内容を直接入力してくださいね！");
    renderOptions(initialOptions);
}

// ==========================================
// 現在のステップに応じた質問・選択肢を取得
// ==========================================
function getCurrentStepPrompt() {
    const mode = chatState.mode;
    const step = chatState.step;

    if (mode === "rent") {
        if (step === 1) return { text: "ご希望の「エリア（駅名や市区町村）」をお選びいただくか、直接入力してください。", options: [{ text: "📍 赤羽・北区エリア", value: "area_akabane" }, { text: "📍 その他23区", value: "area_23ku" }, { text: "📍 埼玉県", value: "area_saitama" }, { text: "💡 条件から相談する", value: "area_other" }] };
        if (step === 2) return { text: "ご希望の「ご予算（家賃上限）」を教えてください。", options: [{ text: "💴 8万円以内", value: "b_8" }, { text: "💴 10万円以内", value: "b_10" }, { text: "💴 12万円以内", value: "b_12" }, { text: "💴 15万円以上", value: "b_15" }] };
        if (step === 3) return { text: "ご希望の「間取り」をお選びいただくか、入力してください。", options: [{ text: "🛋 ワンルーム・1K", value: "1k" }, { text: "🛋 1DK・1LDK", value: "1ldk" }, { text: "🛋 2K・2DK・2LDK", value: "2ldk" }, { text: "🛋 3LDK以上", value: "3ldk" }] };
        if (step === 4) return { text: "お部屋の「広さや築年数」についてのご要望はいかがでしょうか？", options: [{ text: "✨ 築浅（築10年以内）希望", value: "new" }, { text: "📐 広さ重視（広めが良い）", value: "wide" }, { text: "💰 築年数は気にしない（安さ重視）", value: "cheap" }, { text: "⚖️ バランス重視", value: "normal" }] };
        if (step === 5) return { text: "お引っ越し・ご入居ご希望の「時期」はいつ頃をお考えでしょうか？", options: [{ text: "⚡️ 即入居・今すぐ", value: "now" }, { text: "🗓 1ヶ月以内", value: "1month" }, { text: "🗓 2〜3ヶ月以内", value: "3months" }, { text: "🔍 良い物件があれば検討", value: "someday" }] };
        if (step === 6) return { text: "最後に「譲れないこだわり条件」があれば教えてください！\n\nほかにも気になる点があれば、下のメッセージ入力欄から送信してください。\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📅 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
    }

    if (mode === "owner") {
        if (step === 1) return { text: "ご所有物件の「種別」をお選びいただくか、入力してください。", options: [{ text: "🏢 マンション・アパート", value: "mansion_single" }, { text: "🏢 一棟マンション・ビル", value: "mansion_building" }, { text: "🏠 一戸建て", value: "house" }, { text: "🏬 店舗事務所・その他", value: "apartment" }] };
        if (step === 2) return { text: "物件のおおよその「所在地（エリア）」を教えてください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "📍 その他の地域", value: "other" }] };
        if (step === 3) return { text: "ご所有物件の「間取り」をお聞かせいただけますか？", options: [{ text: "🛋 単身用（1K〜1LDK）", value: "single" }, { text: "🛋 ファミリー用（2LDK〜3LDK）", value: "family" }, { text: "🏠 大型・戸建て（4LDK以上）", value: "large" }, { text: "🏢 一棟まるごと（複数室）", value: "building" }] };
        if (step === 4) return { text: "おおよその「築年数」はどちらになりますでしょうか？", options: [{ text: "✨ 築10年未満（築浅）", value: "under10" }, { text: "🏢 築10年〜20年程度", value: "under20" }, { text: "🏚 築20年以上", value: "over20" }, { text: "❓ 不明・要確認", value: "unknown" }] };
        if (step === 5) return { text: "現在の「お部屋の現況（空室、賃貸中など）」を教えてください。", options: [{ text: "❓ 現在、空室中", value: "vacancy" }, { text: "🚪 近々、退去予定", value: "leaving" }, { text: "🏠 現在、満室稼働中", value: "full" }, { text: "👤 居住中（貸出検討段階）", value: "living" }] };
        if (step === 6) return { text: "ご検討・ご希望の「管理スタイルやプラン」はございますか？", options: [{ text: "🤝 集客〜集金・管理まで全て任せたい", value: "full_manage" }, { text: "📢 集客（入居者募集）のみ依頼したい", value: "recruit_only" }, { text: "🛠️ 管理会社を変更したい", value: "sublease" }, { text: "💡 まずは賃料査定・相談のみ", value: "estimate_only" }] };
        if (step === 7) return { text: "最後に「ご要望や気になっている点」があれば教えてください！\n\nほかにも気になる点がございましたら、下のメッセージ入力欄から送信してください。\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📋 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
    }

    if (mode === "sell") {
        if (step === 1) return { text: "ご所有物件の「種別」をお選びいただくか、入力してください。", options: [{ text: "🏢 マンション", value: "sell_mansion" }, { text: "🏠 一戸建て", value: "sell_house" }, { text: "🏞 土地", value: "sell_land" }, { text: "🏬 一棟ビル・アパート", value: "sell_building" }] };
        if (step === 2) return { text: "物件の「所在地（エリア）」をお選びいただくか、入力してください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "📍 その他の地域", value: "other" }] };
        if (step === 3) return { text: "物件の「間取りや広さの目安」を教えていただけますか？", options: [{ text: "🛋 コンパクト（〜50㎡ / 1〜2LDK）", value: "small" }, { text: "🏠 標準ファミリー（50〜80㎡ / 3LDK）", value: "medium" }, { text: "🏡 大型（80㎡以上 / 4LDK以上）", value: "large" }, { text: "🏢 一棟物件・土地", value: "land_building" }] };
        if (step === 4) return { text: "物件の「築年数」の目安を教えてください。", options: [{ text: "✨ 築10年未満（築浅）", value: "under10" }, { text: "🏢 築10年〜20年程度", value: "under20" }, { text: "🏚 築20年以上", value: "over20" }, { text: "❓ 不明・要確認", value: "unknown" }] };
        if (step === 5) return { text: "現在の「ご利用状況やご売却時期」を教えてください。", options: [{ text: "👤 自身で居住中（早期売却希望）", value: "living_now" }, { text: "🚪 現在、空家・空室", value: "empty" }, { text: "💰 賃貸中（オーナーチェンジ）", value: "rented" }, { text: "🗓 良い条件があれば時期問わず検討", value: "someday" }] };
        if (step === 6) return { text: "最後に「ご売却に関するその他ご要望」があれば教えてください！\n\nほかにも気になる点がございましたら、下のメッセージ入力欄から送信してください。\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📝 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
    }

    if (mode === "buy") {
        if (step === 1) return { text: "どのような「種別」をお探しでしょうか？", options: [{ text: "🏢 新築・中古マンション", value: "buy_mansion" }, { text: "🏡 新築・中古一戸建て", value: "buy_house" }, { text: "🏞 土地", value: "buy_land" }, { text: "🏬 投資用・事業用物件", value: "buy_invest" }] };
        if (step === 2) return { text: "ご予算の「イメージ上限」をお聞かせください。", options: [{ text: "💰 3,000万円以内", value: "3000" }, { text: "💰 5,000万円以内", value: "5000" }, { text: "💰 7,000万円以内", value: "7000" }, { text: "💰 7,000万円以上", value: "over7000" }] };
        if (step === 3) return { text: "ご購入をご希望の「エリア（駅名や地域）」を教えてください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "💡 エリアから相談したい", value: "other" }] };
        if (step === 4) return { text: "ご希望の「間取りや広さ」はいかがでしょうか？", options: [{ text: "🛋 1LDK〜2DK", value: "1ldk" }, { text: "🛋 2LDK〜3LDK", value: "3ldk" }, { text: "🏠 4LDK以上", value: "4ldk" }, { text: "🏬 一棟・事業用", value: "business" }] };
        if (step === 5) return { text: "「築年数」のご希望はございますか？", options: [{ text: "✨ 新築・築浅（10年以内）", value: "new" }, { text: "🏢 築20年以内", value: "under20" }, { text: "🛠 リノベーション前提", value: "renovation" }, { text: "⚖️ 特に拘らない", value: "any" }] };
        if (step === 6) return { text: "最後に住宅ローンやご要望など「気になっている点」はございますか？\n\nほかにも気になる点がございましたら、下のメッセージ入力欄から送信してください。\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📱 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
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
    // ★追加: NGワード（不適切な言葉）の判定
    // --------------------------------------
    const hasNgWord = NG_WORDS.some(word => text.includes(word));
    if (hasNgWord) {
        // 現在のステップの選択肢を崩さずに注意文を返す
        const currentPrompt = getCurrentStepPrompt();
        return {
            text: "恐れ入りますが、適切な言葉遣いでのご入力をお願いいたします。\nご相談やご要望がございましたら、再度入力してくださいね！",
            options: currentPrompt.options
        };
    }

    // --------------------------------------
    // 最終ステップ完了後の共通処理
    // --------------------------------------
    const maxSteps = { rent: 5, owner: 6, sell: 5, buy: 5 };
    const isFinished = chatState.mode && chatState.step > maxSteps[chatState.mode];

    if (isFinished) {
        if (chatState.data["ご要望・メッセージ"]) {
            chatState.data["ご要望・メッセージ"] += ` / ${text}`;
        } else {
            chatState.data["ご要望・メッセージ"] = text;
        }

        let replyPrefix = `「${text}」ですね！ご要望として記録いたしました！`;
        if (text.includes("費用") || text.includes("料金") || text.includes("いくら")) {
            replyPrefix = `「${text}」についてですね！\nご相談・査定やご提案にかかる費用は【すべて無料】ですのでご安心ください。`;
        }

        return {
            text: `${replyPrefix}\n\nこれでお伺いした条件の整理が完了いたしました✨\n下記ボタンよりお問合せフォームへお進みください！`,
            options: [
                { text: "📅 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
            ]
        };
    }

    // --------------------------------------
    // A. 費用などの質問（ステップを進めず同じ質問を再表示）
    // --------------------------------------
    if (text.includes("費用") || text.includes("料金") || text.includes("いくら") || text.includes("相談料") || text.includes("手数料")) {
        let answerText = "ご相談や査定・お部屋探しのご提案は【すべて無料】で行っております！ご安心ください。";
        if (chatState.mode) {
            const currentPrompt = getCurrentStepPrompt();
            return {
                text: `${answerText}\n\n引き続き、こちらの質問についてもお聞かせください！\n\n${currentPrompt.text}`,
                options: currentPrompt.options
            };
        } else {
            return {
                text: `${answerText}\n\nまずは本日のご相談内容をお選びいただけますか？`,
                options: initialOptions
            };
        }
    }

    // --------------------------------------
    // B. モードの新規開始・切り替え判定（Turn 1）
    // --------------------------------------
    if (chatState.step === 0 || text.includes("部屋を借りたい") || text.includes("物件を貸したい") || text.includes("物件を売りたい") || text.includes("物件を買いたい")) {
        if (text.includes("借りたい") || text.includes("賃貸で探す") || text.includes("お部屋探し")) {
            chatState.mode = "rent";
            chatState.step = 1;
            chatState.data = {};
            const prompt = getCurrentStepPrompt();
            return {
                text: `お部屋探し（賃貸）のご相談ですね！\n${prompt.text}`,
                options: prompt.options
            };
        } else if (text.includes("貸したい") || text.includes("オーナー") || text.includes("管理")) {
            chatState.mode = "owner";
            chatState.step = 1;
            chatState.data = {};
            const prompt = getCurrentStepPrompt();
            return {
                text: `物件を貸したい（オーナー様）のご相談ですね！\n${prompt.text}`,
                options: prompt.options
            };
        } else if (text.includes("売りたい") || text.includes("売却") || text.includes("査定")) {
            chatState.mode = "sell";
            chatState.step = 1;
            chatState.data = {};
            const prompt = getCurrentStepPrompt();
            return {
                text: `物件のご売却のご相談ですね！\n${prompt.text}`,
                options: prompt.options
            };
        } else if (text.includes("買いたい") || text.includes("購入")) {
            chatState.mode = "buy";
            chatState.step = 1;
            chatState.data = {};
            const prompt = getCurrentStepPrompt();
            return {
                text: `物件のご購入のご相談ですね！\n${prompt.text}`,
                options: prompt.options
            };
        }
    }

    // --------------------------------------
    // C. ボタン非選択（自由入力テキスト）の場合
    //    ステップを進めずにメモリし、同じ質問を再提示
    // --------------------------------------
    if (!isFromButton && chatState.mode) {
        let aizuchi = getRandomAizuchi(text);
        if (chatState.data["ご要望・補足"]) {
            chatState.data["ご要望・補足"] += ` / ${text}`;
        } else {
            chatState.data["ご要望・補足"] = text;
        }

        const currentPrompt = getCurrentStepPrompt();
        return {
            text: `${aizuchi}\n\nご要望としてしっかりメモいたしました！\n引き続き、下記の質問についてお選びいただけますでしょうか？😊\n\n${currentPrompt.text}`,
            options: currentPrompt.options
        };
    }

    // --------------------------------------
    // D. ボタンクリック時：ステップを進めて次の質問へ
    // --------------------------------------
    if (isFromButton && chatState.mode) {
        const fieldName = getStepFieldName(chatState.mode, chatState.step);
        chatState.data[fieldName] = text;
        
        const currentStep = chatState.step;
        chatState.step++; // 正しいボタン選択の時のみステップを進める

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

// ボタン選択時（isFromButton = true）
function handleOptionClick(selectedText) {
    appendUserMessage(selectedText);

    if (selectedText.includes("予約") || selectedText.includes("申込む") || selectedText.includes("問合せ") || selectedText.includes("進む")) {
        setTimeout(() => {
            appendBotMessage("ありがとうございます！\nこれまでのヒアリング内容をお問い合わせフォームへ自動で引き継ぎます。\n\nまもなくお問合せページへ移動しますので、フォームにてお名前やご連絡先をご入力の上ご送信ください✨");
            
            const optContainer = document.getElementById("chatOptions");
            if (optContainer) optContainer.innerHTML = "";

            setTimeout(() => {
                let summaryText = `【AIチャットからの引き継ぎ条件】\n`;
                
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

// 自由入力テキスト送信時（isFromButton = false）
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

// ==========================================
// 1. 設定項目（お問い合わせ先URL）
// ==========================================
const IELOVE_FORM_URL = "https://www.noahlivehome.jp/contact/";

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

// エリア魅力データ
const areaInfo = {
    "赤羽・北区": "JR各線が乗り入れていて都心や埼玉方面へのアクセスが抜群！商店街や飲食店も豊富で生活利便性が非常に高い人気のエリアです。",
    "その他23区": "東京23区内は交通網が充実しており、通勤・通学やショッピングの利便性がトップクラスです。",
    "埼玉県": "都心へのアクセスが良く、賃料コストパフォーマンスに優れた住みやすいおすすめのエリアです。"
};

// 初期表示選択肢
const initialOptions = [
    { text: "🏠 部屋を借りたい", value: "rent" },
    { text: "🔑 物件を貸したい", value: "owner" },
    { text: "🏢 物件を売りたい", value: "sell" },
    { text: "🏡 物件を買いたい", value: "buy" }
];

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
// 3. 臨機応変なAI会話ロジック
// ==========================================
function getAIResponse(userInputText) {
    const text = userInputText.trim();

    // --------------------------------------
    // A. 途中での質問・疑問に対する臨機応変な回答（FAQ）
    // --------------------------------------
    if (text.includes("費用") || text.includes("料金") || text.includes("いくら")) {
        return {
            text: "ご相談や査定・お部屋探しのご提案は【すべて無料】で行っております！ご安心ください😊\n\n引き続きご希望の条件をお聞かせいただけますか？",
            options: getStepOptions()
        };
    }
    if (text.includes("電話") || text.includes("話したい") || text.includes("直接")) {
        return {
            text: "お電話でのご相談も大歓迎です！\nスタッフがお電話にて詳しく伺いますので、よろしければこのままフォームへお進みいただくか、お電話でお気軽にご連絡ください📞",
            options: [
                { text: "📝 お問合せフォームへ進む", value: "contact", isPrimary: true }
            ]
        };
    }

    // --------------------------------------
    // B. モードの新規開始・切り替え判定
    // --------------------------------------
    if (chatState.step === 0 || text.includes("借りたい") || text.includes("賃貸")) {
        if (text.includes("借りたい") || text.includes("賃貸")) {
            chatState.mode = "rent";
            chatState.step = 1;
            chatState.data = {};
            return {
                text: "お部屋探し（賃貸）のご相談ですね！\nご希望の「エリア（駅名や市区町村）」をお選びいただくか、直接入力してください。",
                options: [
                    { text: "📍 赤羽・北区エリア", value: "area_akabane" },
                    { text: "📍 その他23区", value: "area_23ku" },
                    { text: "📍 埼玉県", value: "area_saitama" },
                    { text: "💡 条件から相談する", value: "area_other" }
                ]
            };
        } else if (text.includes("貸したい") || text.includes("オーナー") || text.includes("管理")) {
            chatState.mode = "owner";
            chatState.step = 1;
            chatState.data = {};
            return {
                text: "物件を貸したい（オーナー様）のご相談ですね！\nご所有物件の「種別」をお選びいただくか、入力してください。",
                options: [
                    { text: "🏢 マンション・アパート", value: "mansion_single" },
                    { text: "🏢 一棟マンション・ビル", value: "mansion_building" },
                    { text: "🏠 一戸建て", value: "house" },
                    { text: "🏬 店舗事務所・その他", value: "apartment" }
                ]
            };
        } else if (text.includes("売りたい") || text.includes("売却") || text.includes("査定")) {
            chatState.mode = "sell";
            chatState.step = 1;
            chatState.data = {};
            return {
                text: "物件のご売却のご相談ですね！\nご所有物件の「種別」をお選びいただくか、入力してください。",
                options: [
                    { text: "🏢 マンション", value: "sell_mansion" },
                    { text: "🏠 一戸建て", value: "sell_house" },
                    { text: "🏞 土地", value: "sell_land" },
                    { text: "🏬 一棟ビル・アパート", value: "sell_building" }
                ]
            };
        } else if (text.includes("買いたい") || text.includes("購入") || text.includes("買いたい")) {
            chatState.mode = "buy";
            chatState.step = 1;
            chatState.data = {};
            return {
                text: "物件のご購入のご相談ですね！\nどのような「種別」をお探しでしょうか？",
                options: [
                    { text: "🏢 新築・中古マンション", value: "buy_mansion" },
                    { text: "🏡 新築・中古一戸建て", value: "buy_house" },
                    { text: "🏞 土地", value: "buy_land" },
                    { text: "🏬 投資用・事業用物件", value: "buy_invest" }
                ]
            };
        }
    }

    // --------------------------------------
    // C. ①【部屋を借りたい（賃貸）】7ターン
    // --------------------------------------
    if (chatState.mode === "rent") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["希望エリア"] = text;
            
            let areaComment = checkAreaComment(text);
            return {
                text: `${areaComment}「${text}」でのお部屋探しですね！メモいたしました。\n\n続いて、ご希望の「ご予算（家賃上限）」を教えてください。`,
                options: [
                    { text: "💴 8万円以内", value: "b_8" },
                    { text: "💴 10万円以内", value: "b_10" },
                    { text: "💴 12万円以内", value: "b_12" },
                    { text: "💴 15万円以上", value: "b_15" }
                ]
            };
        } else if (chatState.step === 2) {
            chatState.step = 3;
            chatState.data["希望予算"] = text;
            return {
                text: `予算「${text}」ですね、承知いたしました！\n次にご希望の「間取り」をお選びいただくか、入力してください。`,
                options: [
                    { text: "🛋 ワンルーム・1K", value: "1k" },
                    { text: "🛋 1DK・1LDK", value: "1ldk" },
                    { text: "🛋 2K・2DK・2LDK", value: "2ldk" },
                    { text: "🛋 3LDK以上", value: "3ldk" }
                ]
            };
        } else if (chatState.step === 3) {
            chatState.step = 4;
            chatState.data["希望間取り"] = text;
            return {
                text: `間取り「${text}」ですね！\nお部屋の「広さや築年数」についてのご要望はいかがでしょうか？`,
                options: [
                    { text: "✨ 築浅（築10年以内）希望", value: "new" },
                    { text: "📐 広さ重視（広めが良い）", value: "wide" },
                    { text: "💰 築年数は気にしない（安さ重視）", value: "cheap" },
                    { text: "⚖️ バランス重視", value: "normal" }
                ]
            };
        } else if (chatState.step === 4) {
            chatState.step = 5;
            chatState.data["築年数・広さ希望"] = text;
            return {
                text: `ご要望「${text}」を承りました！\nお引っ越し・ご入居ご希望の「時期」はいつ頃をお考えでしょうか？`,
                options: [
                    { text: "⚡️ 即入居・今すぐ", value: "now" },
                    { text: "🗓 1ヶ月以内", value: "1month" },
                    { text: "🗓 2〜3ヶ月以内", value: "3months" },
                    { text: "🔍 良い物件があれば検討", value: "someday" }
                ]
            };
        } else if (chatState.step === 5) {
            chatState.step = 6;
            chatState.data["入居時期"] = text;
            return {
                text: `時期は「${text}」ですね！\n最後に「譲れないこだわり条件（バス・トイレ別、ペット可、徒歩分数など）」があれば教えてください！`,
                options: [
                    { text: "🛀 バストイレ別", value: "bt" },
                    { text: "🐶 ペット飼育可", value: "pet" },
                    { text: "🔒 オートロック付き", value: "lock" },
                    { text: "🚃 駅から徒歩5分以内", value: "station" }
                ]
            };
} else {
        chatState.data["こだわり条件・ご自由な要望"] = text;
        return {
            text: `「${text}」ですね！しっかりと記録いたしました。\nこれでお伺いした条件の整理が完了いたしました！\n\n💡【ご相談・ご要望の入力】\nほかにも気になる点やご要望（例：連絡はメール希望、初期費用を抑えたい等）がございましたら、下のメッセージ入力欄から送信してください。\n\n特になければ、下記ボタンよりお問合せフォームへお進みください！`,
            options: [
                { text: "📅 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
            ]
        };
    }

    // --------------------------------------
    // D. ②【物件を貸したい（オーナー）】7ターン
    // --------------------------------------
    if (chatState.mode === "owner") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["物件種別"] = text;
            return {
                text: `「${text}」ですね！ありがとうございます。\n物件のおおよその「所在地（エリア）」を教えてください。`,
                options: [
                    { text: "📍 赤羽・北区エリア周辺", value: "akabane" },
                    { text: "📍 その他東京23区内", value: "tokyo23" },
                    { text: "📍 埼玉県内", value: "saitama" },
                    { text: "📍 その他の地域", value: "other" }
                ]
            };
        } else if (chatState.step === 2) {
            chatState.step = 3;
            chatState.data["物件所在地"] = text;
            return {
                text: `所在地「${text}」ですね！\nご所有物件の「間取り」をお聞かせいただけますか？`,
                options: [
                    { text: "🛋 単身用（1K〜1LDK）", value: "single" },
                    { text: "🛋 ファミリー用（2LDK〜3LDK）", value: "family" },
                    { text: "🏠 大型・戸建て（4LDK以上）", value: "large" },
                    { text: "🏢 一棟まるごと（複数室）", value: "building" }
                ]
            };
        } else if (chatState.step === 3) {
            chatState.step = 4;
            chatState.data["物件の間取り"] = text;
            return {
                text: `「${text}」ですね。おおよその「築年数」はどちらになりますでしょうか？`,
                options: [
                    { text: "✨ 築10年未満（築浅）", value: "under10" },
                    { text: "🏢 築10年〜20年程度", value: "under20" },
                    { text: "🏚 築20年以上", value: "over20" },
                    { text: "❓ 不明・要確認", value: "unknown" }
                ]
            };
        } else if (chatState.step === 4) {
            chatState.step = 5;
            chatState.data["築年数"] = text;
            return {
                text: `築年数「${text}」ですね！\n現在の「お部屋の現況（空室、賃貸中など）」を教えてください。`,
                options: [
                    { text: "❓ 現在、空室中", value: "vacancy" },
                    { text: "🚪 近々、退去予定", value: "leaving" },
                    { text: "🏠 現在、満室稼働中", value: "full" },
                    { text: "👤 居住中（貸出検討段階）", value: "living" }
                ]
            };
        } else if (chatState.step === 5) {
            chatState.step = 6;
            chatState.data["現況"] = text;
            return {
                text: `現況「${text}」ですね。\nご検討されている「管理形態やご希望」はございますか？`,
                options: [
                    { text: "🏢 入居者募集", value: "manage" },
                    { text: "🤝 管理を任せたい", value: "sublease" },
                    { text: "💰 査定賃料だけ知りたい", value: "estimate" },
                    { text: "💡 初めてなので相談して決めたい", value: "consult" }
                ]
            };
　　　　} else {
        chatState.data["ご要望・管理形態"] = text;
        return {
            text: `「${text}」ですね。詳細をお知らせいただきありがとうございます！\n\n💡【ご相談・ご要望の入力】\nほかにも気になる点やご相談内容（例：連絡はメール希望、まずは概算のみ知りたい等）がございましたら、下のメッセージ入力欄から送信してください😊\n\n特になければ、下記ボタンよりお問合せ・無料査定へお進みください！`,
            options: [
                { text: "📋 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
            ]
        };
    }

    // --------------------------------------
    // E. ③【物件を売りたい（売却）】7ターン
    // --------------------------------------
    if (chatState.mode === "sell") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["物件種別"] = text;
            return {
                text: `「${text}」のご売却ですね。\n物件の「所在地（エリア）」をお選びいただくか、入力してください。`,
                options: [
                    { text: "📍 赤羽・北区エリア周辺", value: "akabane" },
                    { text: "📍 その他東京23区内", value: "tokyo23" },
                    { text: "📍 埼玉県内", value: "saitama" },
                    { text: "📍 その他の地域", value: "other" }
                ]
            };
        } else if (chatState.step === 2) {
            chatState.step = 3;
            chatState.data["物件所在地"] = text;
            return {
                text: `「${text}」ですね！\n物件の「間取りや広さの目安」を教えていただけますか？`,
                options: [
                    { text: "🛋 コンパクト（〜50㎡ / 1〜2LDK）", value: "small" },
                    { text: "🏠 標準ファミリー（50〜80㎡ / 3LDK）", value: "medium" },
                    { text: "🏡 大型（80㎡以上 / 4LDK以上）", value: "large" },
                    { text: "🏢 一棟物件・土地", value: "land_building" }
                ]
            };
        } else if (chatState.step === 3) {
            chatState.step = 4;
            chatState.data["間取り・広さ"] = text;
            return {
                text: `「${text}」ですね。\nおおよその「築年数」はどれくらいでしょうか？`,
                options: [
                    { text: "✨ 築10年以内", value: "under10" },
                    { text: "🏢 築10年〜20年程度", value: "under20" },
                    { text: "🏚 築20年以上", value: "over20" },
                    { text: "🏞 土地のため築年数なし", value: "none" }
                ]
            };
        } else if (chatState.step === 4) {
            chatState.step = 5;
            chatState.data["築年数"] = text;
            return {
                text: `築年数「${text}」ですね！\n現在の「物件のご利用状況（居住中、空家など）」を教えてください。`,
                options: [
                    { text: "👤 自身で居住中", value: "living" },
                    { text: "🚪 現在、空家・空室", value: "empty" },
                    { text: "💰 賃貸中（オーナーチェンジ）", value: "rented" },
                    { text: "👨‍👩‍👧 相続・代理所有", value: "inherited" }
                ]
            };
        } else if (chatState.step === 5) {
            chatState.step = 6;
            chatState.data["物件の現況"] = text;
            return {
                text: `現況「${text}」ですね。\nご売却をご検討の「時期や目的」をお聞かせください。`,
                options: [
                    { text: "⚡️ なるべく早く売却したい", value: "quick" },
                    { text: "📊 まずは簡易査定で価格を知りたい", value: "market" },
                    { text: "🏡 住み替え（買換え）に合わせて", value: "change" },
                    { text: "🗓 半年〜1年以内に売却検討", value: "future" }
                ]
            };
} else {
        chatState.data["売却希望時期・ご要望"] = text;
        return {
            text: `「${text}」ですね！ご入力いただきありがとうございます。\n\n💡【ご相談・ご要望の入力】\nほかにも気になる点やご相談（例：秘密厳守で進めたい、近隣相場も知りたい等）がございましたら、下のメッセージ入力欄から送信してください😊\n\n特になければ、下記ボタンよりお問合せ・無料査定へお進みください！`,
            options: [
                { text: "📝 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
            ]
        };
    }

    // --------------------------------------
    // F. ④【物件を買いたい（購入）】7ターン
    // --------------------------------------
    if (chatState.mode === "buy") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["購入希望種別"] = text;
            return {
                text: `「${text}」のご購入ですね！\nご希望の「エリア（地域）」はお決まりでしょうか？`,
                options: [
                    { text: "📍 赤羽・北区エリア限定", value: "akabane" },
                    { text: "📍 その他東京23区内", value: "tokyo23" },
                    { text: "📍 埼玉県内", value: "saitama" },
                    { text: "💡 広域で探している", value: "wide" }
                ]
            };
        } else if (chatState.step === 2) {
            chatState.step = 3;
            chatState.data["希望エリア"] = text;
            return {
                text: `エリア「${text}」ですね！\nご予算の「イメージ上限」をお聞かせください。`,
                options: [
                    { text: "💰 3,000万円以内", value: "3000" },
                    { text: "💰 5,000万円以内", value: "5000" },
                    { text: "💰 7,000万円以内", value: "7000" },
                    { text: "💰 7,000万円以上", value: "over7000" }
                ]
            };
        } else if (chatState.step === 3) {
            chatState.step = 4;
            chatState.data["ご予算上限"] = text;
            return {
                text: `ご予算「${text}」ですね！\nご希望の「間取りや広さ」はいかがでしょうか？`,
                options: [
                    { text: "🛋 1LDK〜2DK", value: "1ldk" },
                    { text: "🛋 2LDK〜3LDK", value: "3ldk" },
                    { text: "🏠 4LDK以上", value: "4ldk" },
                    { text: "🏬 一棟・事業用", value: "business" }
                ]
            };
        } else if (chatState.step === 4) {
            chatState.step = 5;
            chatState.data["希望間取り"] = text;
            return {
                text: `間取り「${text}」ですね！\n「築年数」のご希望はございますか？`,
                options: [
                    { text: "✨ 新築・築浅（10年以内）", value: "new" },
                    { text: "🏢 築20年以内", value: "under20" },
                    { text: "🛠 リノベーション前提", value: "renovation" },
                    { text: "⚖️ 特に拘らない", value: "any" }
                ]
            };
        } else if (chatState.step === 5) {
            chatState.step = 6;
            chatState.data["希望築年数"] = text;
            return {
                text: `「${text}」ですね！\n「住宅ローンのご相談」やご検討状況はいかがでしょうか？`,
                options: [
                    { text: "🏦 住宅ローンの事も相談したい", value: "loan_consult" },
                    { text: "👍 事前審査通過済み", value: "loan_ok" },
                    { text: "🏡 現在の自宅を売却して買換え", value: "trade_in" },
                    { text: "💡 まずは物件探しから", value: "first_search" }
                ]
            };
} else {
        chatState.data["住宅ローン・ご状況"] = text;
        return {
            text: `「${text}」ですね！ご希望をお聞かせいただきありがとうございます。\n\n💡【ご相談・ご要望の入力】\nほかにも気になる点やご要望（例：土日祝に連絡してほしい、学区指定がある等）がございましたら、下のメッセージ入力欄から送信してください😊\n\n特になければ、下記ボタンよりお問合せへお進みください！`,
            options: [
                { text: "📱 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
            ]
        };
    }
    }

    // デフォルト・会話の振り戻し
    return {
        text: `「${text}」ですね！ありがとうございます。\nまずはどのようなご相談をお望みか、下記よりお選びいただけますか？`,
        options: initialOptions
    };
}

// エリアの魅力判定ヘルパー
function checkAreaComment(text) {
    for (const key in areaInfo) {
        if (text.includes(key) || (key === "赤羽・北区" && (text.includes("赤羽") || text.includes("北区")))) {
            return `${areaInfo[key]}\n\n`;
        }
    }
    return "";
}

// 途中ステップ用オプション取得ヘルパー
function getStepOptions() {
    return initialOptions;
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

// ボタン選択時 & 自動引き継ぎ遷移
function handleOptionClick(selectedText) {
    appendUserMessage(selectedText);

    if (selectedText.includes("予約") || selectedText.includes("申込む") || selectedText.includes("問合せ") || selectedText.includes("進む")) {
        setTimeout(() => {
            appendBotMessage("ありがとうございます！\n入力いただいたお打合せ条件をまとめて、お問合せフォームへ遷移します...");
            
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

            }, 1200);

        }, 300);
        return;
    }

    setTimeout(() => {
        const response = getAIResponse(selectedText);
        appendBotMessage(response.text);
        renderOptions(response.options);
    }, 300);
}

// 自由入力テキスト送信処理
function sendMessage() {
    const input = document.getElementById("userInput");
    if (!input) return;
    const text = input.value.trim();
    if (text === "") return;

    appendUserMessage(text);
    input.value = "";

    setTimeout(() => {
        const response = getAIResponse(text);
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

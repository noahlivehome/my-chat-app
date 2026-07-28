// チャット状態と履歴データの管理
const chatState = {
    mode: null,       // 'rent', 'owner', 'sell', 'buy'
    step: 0,          // 各フロー内の進捗ステップ
    area: "",         // 選択されたエリア
    data: {},         // ヒアリングした各種条件データ
    history: []       // 会話ログ全体（メッセージ・タイムスタンプ）
};

// エリア魅力データ
const areaInfo = {
    "赤羽": "JR各線が乗り入れていて都心や埼玉方面へのアクセスが抜群！商店街や飲食店も豊富で生活利便性が非常に高い人気の街です。",
    "板橋": "板橋駅の最大の魅力は、抜群の交通アクセス、充実した買い物環境、そして落ち着いた下町の雰囲気です。JR埼京線で池袋まで約3分、新宿まで約10分と都心に近く、徒歩圏内で都営三田線（新板橋駅）や東武東上線（下板橋駅）も利用できます。",
    "池袋": "山手線をはじめアクセスが良好で、ショッピングやエンタメ施設が充実した非常に便利なエリアです。",
    "横浜": "おしゃれな街並みと優れたアクセス性を兼ね備え、住みやすさで常に上位にランクインする大人気エリアです。"
};

// 初期表示選択肢（横2列）
const initialOptions = [
    { text: "🏠 部屋を借りたい", value: "rent" },
    { text: "🔑 物件を貸したい", value: "owner" },
    { text: "🏢 物件を売りたい", value: "sell" },
    { text: "🏡 物件を買いたい", value: "buy" }
];

document.addEventListener("DOMContentLoaded", () => {
    initChat();
});

function initChat() {
    appendBotMessage("いらっしゃいませ！\n不動産ご案内AIアシスタントです。\n\n本日はどのようなご相談でしょうか？\n下の選択肢よりお選びください。");
    renderOptions(initialOptions);
}

// AI応答メインロジック
function getAIResponse(userInputText) {
    // 1. モード切り替え・途中変更の検知
    if (userInputText.includes("借りたい") || userInputText.includes("賃貸を探す")) {
        chatState.mode = "rent";
        chatState.step = 1;
        return {
            text: "お部屋探し（賃貸）のご相談ですね！\nご希望の「エリア（駅名）」をお知らせいただくか、下からお選びください。",
            options: [
                { text: "📍 北区", value: "area_akabane" },
                { text: "📍 その他東京都内", value: "area_shinjuku" },
                { text: "📍 埼玉県", value: "area_ikebukuro" },
                { text: "💡 エリアから相談する", value: "area_other" }
            ]
        };
    } else if (userInputText.includes("貸したい") || userInputText.includes("オーナー")) {
        chatState.mode = "owner";
        chatState.step = 1;
        return {
            text: "物件を貸したい（オーナー様）のご相談ですね！\nご所有物件の「種別」はどちらでしょうか？",
            options: [
                { text: "🏢 マンション（1室/一棟）", value: "mansion" },
                { text: "🏠 一戸建て", value: "house" },
                { text: "🏬 事業用物件", value: "apartment" },
                { text: "📋 相談して決める", value: "other" }
            ]
        };
    } else if (userInputText.includes("売りたい") || userInputText.includes("売却")) {
        chatState.mode = "sell";
        chatState.step = 1;
        return {
            text: "物件のご売却のご相談ですね！\nご所有物件の「種別」とおおよその「所在地（エリア）」を教えていただけますか？",
            options: [
                { text: "🏢 マンション（赤羽周辺など）", value: "sell_mansion" },
                { text: "🏠 戸建て・土地", value: "sell_house" },
                { text: "📍 エリアを入力して相談", value: "sell_input" }
            ]
        };
    } else if (userInputText.includes("買いたい") || userInputText.includes("購入")) {
        chatState.mode = "buy";
        chatState.step = 1;
        return {
            text: "物件のご購入のご相談ですね！\nどのような種別をお探しでしょうか？",
            options: [
                { text: "🏢 新築・中古マンション", value: "buy_mansion" },
                { text: "🏡 新築・中古一戸建て", value: "buy_house" },
                { text: "🏞 土地を探している", value: "buy_land" }
            ]
        };
    }

    // エリア名の魅力判定
    let areaComment = "";
    for (const key in areaInfo) {
        if (userInputText.includes(key)) {
            areaComment = `「${key}」ですね！\n${areaInfo[key]}\n\n`;
            chatState.area = key;
            break;
        }
    }

    // ①【賃貸（借りる）】フロー
    if (chatState.mode === "rent") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data.area = userInputText;
            return {
                text: `${areaComment}続いて、ご希望の「ご予算（家賃上限）」を教えてください！`,
                options: [
                    { text: "💴 8万円以内", value: "b_8" },
                    { text: "💴 10万円以内", value: "b_10" },
                    { text: "💴 12万円以内", value: "b_12" },
                    { text: "💴 15万円以上", value: "b_15" }
                ]
            };
        } else if (chatState.step === 2) {
            chatState.step = 3;
            chatState.data.budget = userInputText;
            return {
                text: "ご予算について承知いたしました！\n次に、ご希望の「間取り・広さ」をお選びください。",
                options: [
                    { text: "🛋 ワンルーム・1K", value: "1k" },
                    { text: "🛋 1LDK・2DK", value: "1ldk" },
                    { text: "🛋 2LDK以上（ファミリー）", value: "2ldk" }
                ]
            };
        } else if (chatState.step === 3) {
            chatState.step = 4;
            chatState.data.layout = userInputText;
            return {
                text: "ありがとうございます！\n最後に「譲れないこだわり条件」があれば教えてください。",
                options: [
                    { text: "🛀 バストイレ別", value: "bt" },
                    { text: "🐶 ペット飼育可", value: "pet" },
                    { text: "🔒 オートロック付き", value: "lock" },
                    { text: "🏃‍♂️ 駅から徒歩5分以内", value: "walk5" }
                ]
            };
        } else {
            chatState.data.condition = userInputText;
            return {
                text: "ご希望条件をお知らせいただきありがとうございます！\n条件に合うお部屋の検索・詳細データのご用意が整いました。\n\n「内見予約」または「店舗でのご相談」を承ります。下記よりお進みください！",
                options: [
                    { text: "📅 無料で内見予約・相談をする", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // ②【貸したい（オーナー）】フロー
    if (chatState.mode === "owner") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data.type = userInputText;
            return {
                text: "ありがとうございます。\n物件のあるおおよその「所在地（市区町村・駅名など）」を教えていただけますか？",
                options: [
                    { text: "📍 赤羽エリア周辺", value: "akabane" },
                    { text: "📍 東京都内", value: "tokyo" },
                    { text: "✍️ メッセージで直接入力", value: "input" }
                ]
            };
        } else if (chatState.step === 2) {
            chatState.step = 3;
            chatState.data.location = userInputText;
            return {
                text: `${areaComment}現在の「お悩み・ご状況」に最も近いものをお選びください。`,
                options: [
                    { text: "❓ 現在、空室で困っている", value: "vacancy" },
                    { text: "🚪 近々、退去予定がある", value: "leaving" },
                    { text: "🏠 現在、自分が居住中", value: "living" },
                    { text: "🔰 初めての賃貸経営", value: "first" }
                ]
            };
        } else {
            chatState.data.status = userInputText;
            return {
                text: "ご状況をお知らせいただきありがとうございます！\n適正な想定賃料の試算や最適な管理プランのご案内が可能です。\n\n担当よりご連絡いたしますので、下記より無料相談をお申し込みください！",
                options: [
                    { text: "📋 賃料試算・無料相談を予約する", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // ③【売りたい（売却）】フロー
    if (chatState.mode === "sell") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data.type = userInputText;
            return {
                text: `${areaComment}ご売却の「時期」や「ご理由」はお決まりでしょうか？`,
                options: [
                    { text: "⚡️ なるべく早く売りたい", value: "quick" },
                    { text: "📊 まずは相場を知りたい", value: "market" },
                    { text: "🏡 住み替え・買い替えのため", value: "change" }
                ]
            };
        } else if (chatState.step === 2) {
            chatState.step = 3;
            chatState.data.timing = userInputText;
            return {
                text: "承知いたしました！ご希望の「査定方法」をお選びください。\n\n・机上査定：データに基づく簡単な相場把握\n・訪問査定：現地を確認する正確な価格査定",
                options: [
                    { text: "💻 簡単な相場を知る（机上査定）", value: "desk" },
                    { text: "🏠 正確な価格を知る（訪問査定）", value: "visit" }
                ]
            };
        } else {
            chatState.data.assessType = userInputText;
            return {
                text: "ありがとうございます！\n無料査定の受付けを開始いたします。下記フォームよりお気軽にお申し込みください！",
                options: [
                    { text: "📝 無料査定・相談を申し込む", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // ④【買いたい（購入）】フロー
    if (chatState.mode === "buy") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data.type = userInputText;
            return {
                text: "ありがとうございます！\nご希望の「エリア（駅名）」と総額の「ご予算イメージ」を教えていただけますか？",
                options: [
                    { text: "📍 赤羽エリア（3,000万〜5,000万円）", value: "buy_akabane" },
                    { text: "📍 都心エリア（5,000万〜8,000万円）", value: "buy_tokyo" },
                    { text: "💬 予算・エリアを直接入力する", value: "buy_input" }
                ]
            };
        } else if (chatState.step === 2) {
            chatState.step = 3;
            chatState.data.budgetArea = userInputText;
            return {
                text: `${areaComment}購入時期や、住宅ローンの事前審査状況についてはいかがでしょうか？`,
                options: [
                    { text: "🗓 いい物件があればすぐにでも", value: "soon" },
                    { text: "💡 住宅ローンの相談もしたい", value: "loan_help" },
                    { text: "🔍 まずは情報収集段階", value: "info" }
                ]
            };
        } else {
            chatState.data.status = userInputText;
            return {
                text: "ありがとうございます！\nWebには掲載されていない「非公開物件」の情報含め、専門スタッフよりご提案させていただきます。\n\n下記よりご来店またはオンライン相談をご予約ください！",
                options: [
                    { text: "📱 非公開物件のご案内・ご来店予約", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // デフォルト
    return {
        text: `「${userInputText}」ですね！承知いたしました。\nどのようなご相談（借りる・貸す・買う・売る）をお望みでしょうか？`,
        options: initialOptions
    };
}

// メッセージ描画（Bot）
function appendBotMessage(text) {
    const container = document.getElementById("chatMessages");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "message bot";
    div.innerText = text;
    container.appendChild(div);
    
    // 会話ログの記録
    chatState.history.push({ sender: "bot", text: text, time: new Date().toISOString() });
    scrollToBottom();
}

// メッセージ描画（User）
function appendUserMessage(text) {
    const container = document.getElementById("chatMessages");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "message user";
    div.innerText = text;
    container.appendChild(div);

    // 会話ログの記録
    chatState.history.push({ sender: "user", text: text, time: new Date().toISOString() });
    scrollToBottom();
}

// ボタン選択肢描画
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

// 選択肢タップ時＆問い合わせフォーム連携処理
function handleOptionClick(selectedText) {
    appendUserMessage(selectedText);

    // 問い合わせ・予約完了ボタンが押された場合
    if (selectedText.includes("予約") || selectedText.includes("申込む") || selectedText.includes("問合せ")) {
        setTimeout(() => {
            appendBotMessage("ご希望いただきありがとうございます！\n入力いただいた条件を保持して、お問い合わせフォームへ案内いたします...");
            document.getElementById("chatOptions").innerHTML = "";

            // --- 💡 データの保存・引き継ぎ処理 ---
            
            // ① ブラウザ（localStorage）に全会話データ・整理データを一時保存
            localStorage.setItem("realEstateChatData", JSON.stringify({
                mode: chatState.mode,
                area: chatState.area,
                details: chatState.data,
                history: chatState.history,
                completedAt: new Date().toLocaleString()
            }));

            // ② 1.5秒後に問い合わせフォームへ自動移動（URLパラメータでデータを渡す）
            setTimeout(() => {
                const params = new URLSearchParams({
                    mode: chatState.mode || "",
                    area: chatState.area || "",
                    details: JSON.stringify(chatState.data)
                });

                // 実際の問い合わせページのパスに書き換えてください（例: "contact.html" や "https://example.com/contact"）
                window.location.href = `contact.html?${params.toString()}`;
            }, 1500);

        }, 300);
        return;
    }

    setTimeout(() => {
        const response = getAIResponse(selectedText);
        appendBotMessage(response.text);
        renderOptions(response.options);
    }, 300);
}

// テキスト入力送信
function sendMessage() {
    const input = document.getElementById("userInput");
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

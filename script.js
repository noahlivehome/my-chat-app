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
        `「${word}」のご希望ですね！`,
        `「${word}」でお探しですね！かしこまりました。`,
        `「${word}」についてですね！`,
        `「${word}」ですね！ご入力ありがとうございます。`
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
}

// ------------------------------------------
// 的確な一言コメントを取得する万能関数
// ------------------------------------------
function getSmartComment(mode, step, text) {
    // A. エリアに関する一言（全モード共通）
    if (text.includes("王子")) {
        return "💡【エリア情報】王子・王子神谷エリアは南北線やJRが使えて都心アクセス良好！飛鳥山公園など緑も豊かで生活利便性の高い人気の街です✨";
    }
    if (text.includes("赤羽")) {
        return "💡【エリア情報】赤羽エリアはJR各線が乗り入れていて都心や埼玉方面へのアクセスが抜群！商店街や飲食店も豊富で活気溢れる大人気エリアです！";
    }
    if (text.includes("北区")) {
        return "💡【エリア情報】東京北区は交通の利便性が高く、下町情緒と住みやすさが両立した非常におすすめのエリアです！";
    }
    if (text.includes("埼玉") || text.includes("川口") || text.includes("大宮") || text.includes("浦和")) {
        return "💡【エリア情報】埼玉県エリアは都心へのアクセスが良く、コストパフォーマンスに優れていて住みやすい人気のエリアです！";
    }
    if (text.includes("23区") || text.includes("東京")) {
        return "💡【エリア情報】東京23区内は交通網が充実しており、通勤・通学や休日のお買い物にも利便性が抜群です！";
    }

    // B. 各モード・ステップごとの的確な一言
    // --- 賃貸（rent） ---
    if (mode === "rent") {
        if (step === 2) return "💡【アドバイス】ご希望の予算帯で条件に合うおすすめ物件を幅広くピックアップいたしますね！";
        if (step === 3) return "💡【アドバイス】ご家族構成やライフスタイルにピッタリの使いやすい間取りをご提案いたします！";
        if (step === 4) return "💡【ワンポイント】リノベーション物件や築浅など、条件次第でお得で掘り出し物の物件が見つかることもあります！";
        if (step === 5) return "💡【ワンポイント】時期に合わせたスムーズな契約・ご入居スケジュールをご案内いたしますね！";
    }

    // --- 貸したい（owner） ---
    if (mode === "owner") {
        if (step === 1) return "💡【管理のアドバイス】物件種別に合わせた適切な賃料設定と、ターゲット層に合わせた募集戦略が重要になります！";
        if (step === 2) return "💡【管理のワンポイント】賃貸管理は「高い稼働率の維持」と「安心の集客・滞納保証」がカギです！収益最大化を全力でサポートいたします😊";
        if (step === 3) return "💡【ワンポイント】単身用・ファミリー用など、間取りに応じた需要と最適な賃料相場をお調べいたします！";
        if (step === 4) return "💡【ワンポイント】築年数に応じた原状回復や設備交換のアドバイスもお任せください！";
        if (step === 5) return "💡【ワンポイント】空室対策やオーナーチェンジなど、現在の状況に合わせた最適なプランをご提示します！";
    }

    // --- 売りたい（sell） ---
    if (mode === "sell") {
        if (step === 1) return "💡【売却のアドバイス】物件種別ごとの市場相場や、直近の成約事例をもとに正確な査定を行います！";
        if (step === 2) return "💡【売却のワンポイント】ご売却は査定額だけでなく、販売スピードや秘密厳守、税金対策も重要です✨";
        if (step === 3) return "💡【ワンポイント】お部屋の広さや使い勝手は購入検討者様への大きなアピールポイントになります！";
        if (step === 4) return "💡【ワンポイント】築年数に応じたリフォーム提案や、現状のままでの売却など最適な方法をご提案します！";
        if (step === 5) return "💡【ワンポイント】居住中の内覧対応や空家の管理など、負担の少ない売却活動をサポートいたします！";
    }

    // --- 買いたい（buy） ---
    if (mode === "buy") {
        if (step === 1) return "💡【購入のアドバイス】新築・中古それぞれのメリットや資産価値を見据えた物件選びをお手伝いします！";
        if (step === 2) return "💡【ローン・資金計画】住宅ローンは金利タイプや控除の活用で総支払額が大きく変わります！資金計画もご安心ください👍";
        if (step === 3) return "💡【ワンポイント】ご予算内で妥協しないお部屋探しができるよう、市場に出ている全物件からサーチします！";
        if (step === 4) return "💡【ワンポイント】将来のライフスタイルの変化にも柔軟に対応できる使いやすい間取りをご案内します！";
        if (step === 5) return "💡【ワンポイント】住宅ローン控除の適用条件や耐震基準など、専門的なチェックもお任せください！";
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
    
    appendBotMessage("いらっしゃいませ！\nノアリブホームAIアシスタントです。\n\n本日はどのようなご相談でしょうか？\n下の選択肢から選ぶか、ご相談内容を直接入力してください。");
    renderOptions(initialOptions);
}

// ==========================================
// 3. 臨機応変なAI会話ロジック
// ==========================================
function getAIResponse(userInputText) {
    const text = userInputText.trim();

    // --------------------------------------
    // 最終ステップ（ターン6以上）の場合の共通処理
    // --------------------------------------
    if (chatState.step >= 6) {
        if (chatState.data["ご要望・メッセージ"]) {
            chatState.data["ご要望・メッセージ"] += ` / ${text}`;
        } else {
            chatState.data["ご要望・メッセージ"] = text;
        }

        let replyPrefix = `「${text}」ですね！ご要望・メッセージとしてしっかり記録いたしました！`;
        if (text.includes("費用") || text.includes("料金") || text.includes("いくら")) {
            replyPrefix = `「${text}」についてですね！\nちなみに、ご相談・査定やご提案にかかる費用は【すべて無料】ですのでご安心ください。\nしっかりと記録いたしました！`;
        }

        return {
            text: `${replyPrefix}\n\nこれでお伺いした条件の整理が完了いたしました✨\n下記ボタンよりお問合せフォームへお進みください！`,
            options: [
                { text: "📅 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
            ]
        };
    }

    // --------------------------------------
    // A. 途中での質問・疑問に対する臨機応変な回答（FAQ）※ステップ0〜5のみ適用
    // --------------------------------------
    if (text.includes("費用") || text.includes("料金") || text.includes("いくら")) {
        return {
            text: "ご相談や査定・お部屋探しのご提案は【すべて無料】で行っております！ご安心ください。\n\n引き続きご希望の条件をお聞かせいただけますか？",
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
        } else if (text.includes("買いたい") || text.includes("購入")) {
            chatState.mode = "buy";
            chatState.step = 1;
            chatState.data = {};
            return {
                text: "物件のごご購入のご相談ですね！\nどのような「種別」をお探しでしょうか？",
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
    // C. ①【部屋を借りたい（賃貸）】ステップ分岐
    // --------------------------------------
    if (chatState.mode === "rent") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["希望エリア"] = text;
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("rent", 1, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\n続いて、ご希望の「ご予算（家賃上限）」を教えてください。`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("rent", 2, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\n次にご希望の「間取り」をお選びいただくか、入力してください。`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("rent", 3, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\nお部屋の「広さや築年数」についてのご要望はいかがでしょうか？`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("rent", 4, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\nお引っ越し・ご入居ご希望の「時期」はいつ頃をお考えでしょうか？`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("rent", 5, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\n最後に「譲れないこだわり条件」があれば教えてください！\n\n💡【ご相談・ご要望の入力】\nほかにも気になる点やメッセージ（例：連絡はメール希望、初期費用が知りたい等）がございましたら、下のメッセージ入力欄から送信してください。\n\n特になければ、下記ボタンよりお問合せへお進みください！`,
                options: [
                    { text: "📅 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // --------------------------------------
    // D. ②【物件を貸したい（オーナー）】ステップ分岐
    // --------------------------------------
    if (chatState.mode === "owner") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["物件種別"] = text;
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("owner", 1, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\n物件のおおよその「所在地（エリア）」を教えてください。`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("owner", 2, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\nご所有物件の「間取り」をお聞かせいただけますか？`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("owner", 3, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\nおおよその「築年数」はどちらになりますでしょうか？`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("owner", 4, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\n現在の「お部屋の現況（空室、賃貸中など）」を教えてください。`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("owner", 5, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\nご検討されている「管理形態やご希望」があれば教えてください！\n\n💡【ご相談・ご要望の入力】\nほかにも気になる点やご相談内容がございましたら、下のメッセージ入力欄から送信してください。\n\n特になければ、下記ボタンよりお問合せ・無料査定へお進みください！`,
                options: [
                    { text: "📋 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // --------------------------------------
    // E. ③【物件を売りたい（売却）】ステップ分岐
    // --------------------------------------
    if (chatState.mode === "sell") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["物件種別"] = text;
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("sell", 1, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\n物件の「所在地（エリア）」をお選びいただくか、入力してください。`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("sell", 2, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\n物件の「間取りや広さの目安」を教えていただけますか？`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("sell", 3, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\nおおよその「築年数」はどれくらいでしょうか？`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("sell", 4, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\n現在の「物件のご利用状況（居住中、空家など）」を教えてください。`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("sell", 5, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\nご売却をご検討の「時期や目的」を教えてください！\n\n💡【ご相談・ご要望の入力】\nほかにも気になる点（例：秘密厳守で進めたい等）がございましたら、下のメッセージ入力欄から送信してください。\n\n特になければ、下記ボタンよりお問合せ・無料査定へお進みください！`,
                options: [
                    { text: "📝 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // --------------------------------------
    // F. ④【物件を買いたい（購入）】ステップ分岐
    // --------------------------------------
    if (chatState.mode === "buy") {
        if (chatState.step === 1) {
            chatState.step = 2;
            chatState.data["購入希望種別"] = text;
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("buy", 1, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\nご希望の「エリア（地域）」はお決まりでしょうか？`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("buy", 2, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\nご予算の「イメージ上限」をお聞かせください。`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("buy", 3, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\nご希望の「間取りや広さ」はいかがでしょうか？`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("buy", 4, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\n「築年数」のご希望はございますか？`,
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
            let aizuchi = getRandomAizuchi(text);
            let comment = getSmartComment("buy", 5, text);
            let extra = comment ? `\n\n${comment}` : "";
            return {
                text: `${aizuchi}${extra}\n\n「住宅ローンのご相談」やご検討状況はいかがでしょうか？\n\n💡【ご相談・ご要望の入力】\nほかにも気になる点やご要望がございましたら、下のメッセージ入力欄から送信してください。\n\n特になければ、下記ボタンよりお問合せへお進みください！`,
                options: [
                    { text: "📱 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }
                ]
            };
        }
    }

    // デフォルト・会話の振り戻し
    let aizuchi = getRandomAizuchi(text);
    return {
        text: `${aizuchi}\nまずはどのようなご相談をお望みか、下記よりお選びいただけますか？`,
        options: initialOptions
    };
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
            appendBotMessage("ありがとうございます！\nこれまでのヒアリング内容（ご希望条件や現況など）をお問い合わせフォームへすべて自動で引き継ぎます。\n\nまもなくお問合せページへ移動しますので、フォームにてお名前やご連絡先をご入力の上ご送信ください✨");
            
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

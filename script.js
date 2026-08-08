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
// プロの知識一言コメント（バリエーション拡充版）
// ------------------------------------------
function getSmartComment(mode, step, text) {
    const comments = {
        rent: {
            1: [
                "💡【エリア】主要路線へのアクセスや急行停車の有無など、利便性もあわせて比較検討いたします！",
                "💡【エリア】周辺の夜道の明るさやスーパーの有無など、生活動線も重視してご案内します！"
            ],
            2: [
                "💡【予算】適正家賃は「手取りの1/3以内」が目安です。管理費や共益費を含めた総額で最適化します！",
                "💡【予算】フリーレント（一定期間家賃無料）交渉が可能な物件も併せてお調べいたします！"
            ],
            3: [
                "💡【間取り】生活動線や手持ちの家具サイズ、テレワークスペースの有無を考慮するのがポイントです！",
                "💡【間取り】収納量（クローゼットの深さや高さ）をチェックすると暮らしやすさが一段と上がります！"
            ],
            4: [
                "💡【築年数】1981年6月以降の新耐震基準物件であれば安心。築古でもリノベ済みはお得感があります！",
                "💡【築年数】築年数が経過していても、管理状態が良い物件は快適性が高くお勧めです！"
            ],
            5: [
                "💡【時期】解約予告期間（通常1ヶ月前）との重複家賃を最小限に抑えるスケジュールをご提案します！",
                "💡【時期】繁忙期を外すと、条件交渉やゆっくりじっくり内見できるメリットがあります！"
            ]
        },
        owner: {
            1: [
                "💡【種別】区分・戸建て・一棟など、種別ごとに最適な賃料設定とターゲット層の絞り込みを行います！",
                "💡【種別】物件種別ごとのターゲット属性（単身・ファミリー）を見極めたプロモーションを展開します！"
            ],
            2: [
                "💡【エリア】競合物件の成約事例をデータベースから分析し、空室リスクを抑えた適正賃料を算出します！",
                "💡【エリア】近隣の再開発計画や人口推移データも鑑みた将来的な賃料変動リスクも提示します！"
            ],
            3: [
                "💡【設備】宅配ボックスや無料Wi-Fiなど、ニーズの高い人気設備の導入提案も行っております！",
                "💡【設備】設備のグレードアップは賃料向上だけでなく、退去率低下（長期入居）にも貢献します！"
            ],
            4: [
                "💡【維持】費用対効果（ROI）の高い原状回復や予防保全的なメンテナンス計画をご案内します！",
                "💡【維持】定期的な建物点検が長期的な資産価値保持と大規模修繕コストの削減に繋がります！"
            ],
            5: [
                "💡【運用】退去予定の段階から先行募集を打つことで、空室期間を最小化させます！",
                "💡【運用】フリーレントの活用や初期費用調整で、競合物件との差別化を図り早期成約を目指します！"
            ]
        },
        sell: {
            1: [
                "💡【種別】「高値追求の仲介売却」と「早期現金化の買取」のメリット・デメリットを比較提示いたします！",
                "💡【種別】物件のポテンシャルを最大化する売却手法（現状引き渡し／リフォーム後売却等）をご案内します！"
            ],
            2: [
                "💡【エリア】直近のレインズ成約データに基づき、客観的で適正な販売査定価格を算出します！",
                "💡【エリア】周辺の売り出し中競合物件との相場比較を行い、売れ残りリスクを避けるアプローチをします！"
            ],
            3: [
                "💡【プライシング】専有面積や坪単価を分析し、周辺類似物件の中で競争力を発揮できる価格を設定します！",
                "💡【プライシング】ターゲット層が購入検討しやすい価格帯の心理的境界（大台）を意識して設定します！"
            ],
            4: [
                "💡【築年数】建物状況調査（インスペクション）の活用で、買主様に安心感を提供し値引きを防ぎます！",
                "💡【築年数】築年数が古い場合でも「既存住宅売買瑕疵保険」を付保することで売りやすくなります！"
            ],
            5: [
                "💡【税制】「3000万円特別控除」など、控除や特例を最大限活かせるタイミングをアドバイスします！",
                "💡【税制】所有期間（5年超・10年超）による譲渡所得税率の違いを踏まえた引き渡し時期をご提案します！"
            ]
        },
        buy: {
            1: [
                "💡【種別】新築・中古の比較から、将来の資産維持率（リセールバリュー）まで見据えてご提案します！",
                "💡【種別】管理費・修繕積立金の変動リスクも考慮した総合的な取得計画をアドバイスします！"
            ],
            2: [
                "💡【資金】物件価格だけでなく、登記費用やローン手数料などの諸費用を含めた総額で計画を立てます！",
                "💡【資金】将来のライフイベント（教育費・老後資金）を見据えた適正な返済比率をご提示します！"
            ],
            3: [
                "💡【環境】ハザードマップや地盤強度、将来の周辺環境変化リスクもチェックいたします！",
                "💡【環境】朝昼夜の時間帯別の騒音や人通り、近隣店舗の状況など現地ならではの視点でお答えします！"
            ],
            4: [
                "💡【構造】将来の家族構成変化に対応できる可動性や、リフォーム可能な構造かどうかも見極めます！",
                "💡【構造】耐震性能（新耐震・制震・免震）や断熱性能など、目に見えない躯体性能を解説します！"
            ],
            5: [
                "💡【管理】中古物件は管理組合の財務状況や修繕積立金の蓄積状況までプロの目で調査します！",
                "💡【管理】「管理は買う」と言われるほど重要です。長期修繕計画書の有無を必ずチェックします！"
            ]
        },
        loan: {
            1: [
                "💡【事前審査】事前審査を早めに行うことで、購入・契約時の手続きがスムーズになります！",
                "💡【事前審査】複数金融機関への同時打診により、最も条件が良いローンを引き出す比較が可能です！"
            ],
            2: [
                "💡【借入額】年収に応じた無理のない返済負担率（DTI）で資金計画を立てることが重要です！",
                "💡【借入額】車のローンやリボ払い等の残債状況に応じた適切な審査対策をご案内します！"
            ],
            3: [
                "💡【金利選択】変動金利と固定金利の特徴を理解し、ライフプランに合わせたご提案をいたします！",
                "💡【金利選択】がん保障付き団信（団体信用生命保険）の金利上乗せ条件も含めて比較検討します！"
            ]
        },
        reform: {
            1: [
                "💡【リノベ提案】表装（クロス・床）張替えから間取り変更まで、予算とご要望に合わせた施工プランをご案内します！",
                "💡【リノベ提案】既存の構造（ラーメン構造・壁式構造）によって壊せる壁・壊せない壁を見極めます！"
            ],
            2: [
                "💡【資産価値】売却前のリノベーションや賃貸の空室対策リフォームは、投資回収率を意識することがポイントです！",
                "💡【資産価値】補助金制度（断熱・バリアフリー・子育て支援エコホーム）を賢く活用するプランをご提示します！"
            ]
        },
        cost: {
            1: [
                "💡【初期費用】敷金・礼金の交渉やフリーレント適用など、初期費用を抑えるプランもご案内可能です！",
                "💡【初期費用】クレジットカード決済に対応した物件選びで、ポイ活や分割支払いの選択肢も広がります！"
            ]
        },
        // --- 追加カテゴリ ---
        school: {
            1: [
                "💡【学区】特定の小中学校の通学区域指定物件や、評判の良い教育環境エリアをご案内可能です！",
                "💡【子育て】公園の多さ・保育園の空き状況・小児科の近さなど、総合的な子育て環境を調査します！"
            ]
        },
        pet: {
            1: [
                "💡【ペット】「ペット相談可」でも犬種・サイズ・頭数制限があるため、事前に規約を精査いたします！",
                "💡【ペット】足洗い場付きマンションや近隣の動物病院・ドッグラン情報も併せてお知らせします！"
            ]
        },
        tax: {
            1: [
                "💡【相続・税金】不動産相続における小規模宅地等の特例や、生前贈与の活用方法を専門知識を交えてアドバイスします！",
                "💡【相続・税金】提携の税理士・司法書士とも連携し、最適な節税・権利調整プランをご提示いたします！"
            ]
        },
        security: {
            1: [
                "💡【防犯】オートロックや防犯カメラ、24時間セキュリティシステムなど女性や一人暮らしでも安心の物件を厳選します！",
                "💡【環境防犯】1階店舗の業態や夜間の街頭の明るさ、交番までの距離など周辺環境も含めて評価します！"
            ]
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

    // --- ローン相談フロー ---
    if (mode === "loan") {
        if (step === 1) return {
            text: "住宅ローンのご相談ですね！プロの視点から丁寧にご案内いたします。\n\nまずは、現在「住宅ローンの事前審査」はお済みでしょうか？",
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

    // --- リフォーム相談フロー ---
    if (mode === "reform") {
        if (step === 1) return {
            text: "リフォーム・リノベーションのご相談ですね！\nどのような目的・場所のリフォームをご検討中でしょうか？",
            options: [
                { text: "🏠 居住中マイホームの改修", value: "reform_home" },
                { text: "🔨 中古購入と同時にリノベ", value: "reform_buy" },
                { text: "🏢 賃貸・オーナー様の空室対策", value: "reform_owner" },
                { text: "🏷 売却前の価値向上リフォーム", value: "reform_sell" }
            ]
        };
        if (step === 2) return {
            text: "承知いたしました！ご予算やお見積りのご案内も可能です。\nリフォームの「具体的な箇所やご予算感」はお決まりですか？",
            options: [
                { text: "🚿 水まわり（キッチン・お風呂等）", value: "water" },
                { text: "🎨 内装（壁紙・床張替え）", value: "interior" },
                { text: "🛋 フルリノベーション", value: "full_renov" },
                { text: "💡 プロに相談して決めたい", value: "consult" }
            ]
        };
        if (step === 3) return {
            text: "ありがとうございます！\nリフォームに関するご相談内容を受け付けました。\n\n下記ボタンよりお問い合わせへお進みください😊",
            options: [
                { text: "📩 この内容でお問合せへ進む", value: "contact", isPrimary: true },
                { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }
            ]
        };
    }

    // --- 費用相談フロー ---
    if (mode === "cost") {
        if (step === 1) return {
            text: "お費用や初期費用に関するご質問ですね！\n具体的にどちらの費用について気になられていますか？",
            options: [
                { text: "💴 賃貸の契約初期費用・安くしたい", value: "rent_cost" },
                { text: "🏛 売買の諸費用（仲介手数料・税金等）", value: "buy_cost" },
                { text: "💰 相談料・査定料について（無料か）", value: "free_check" }
            ]
        };
        if (step === 2) return {
            text: "当店での事前査定やお部屋探しのご相談は【完全無料】ですのでご安心ください！\n\n初期費用の分割支払いや抑え方についても柔軟に対応いたします。\nご要望があれば下記よりお進みください！",
            options: [
                { text: "📩 この内容でお問合せへ進む", value: "contact", isPrimary: true },
                { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }
            ]
        };
    }

    // --- 【新設】学区・子育て相談フロー ---
    if (mode === "school") {
        if (step === 1) return {
            text: "学区や子育て環境重視のお問い合わせですね！\nご希望のエリアや特定の小中学校指定などはございますか？",
            options: [
                { text: "🏫 特定の指定校エリアで探したい", value: "school_target" },
                { text: "👶 保育園・公園が近い環境重視", value: "child_env" },
                { text: "💡 おすすめの学区を提案してほしい", value: "school_recommend" }
            ]
        };
        if (step === 2) return {
            text: "承知いたしました！ご家族形態に合わせたベストな住環境をご提案いたします。\n\n下記よりお問い合わせへお進みいただけます！",
            options: [
                { text: "📩 この内容でお問合せへ進む", value: "contact", isPrimary: true },
                { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }
            ]
        };
    }

    // --- 【新設】ペット飼育相談フロー ---
    if (mode === "pet") {
        if (step === 1) return {
            text: "ペットと暮らせるお住まいの探したいですね！\n飼育される（または予定している）ペットの種類を教えていただけますか？",
            options: [
                { text: "🐶 小型犬（1頭）", value: "small_dog" },
                { text: "🐕 中型〜大型犬", value: "large_dog" },
                { text: "🐱 猫（1〜2頭）", value: "cat" },
                { text: "🐾 多頭飼い・その他", value: "multi_pet" }
            ]
        };
        if (step === 2) return {
            text: "ありがとうございます！ペット可物件は規約や条件が細かいため、確認の上最適な物件をお調べします。\n\n下記ボタンよりお問い合わせへ進むことができます！",
            options: [
                { text: "📩 この内容でお問合せへ進む", value: "contact", isPrimary: true },
                { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }
            ]
        };
    }

    // --- 【新設】相続・税金相談フロー ---
    if (mode === "tax") {
        if (step === 1) return {
            text: "不動産相続や税金に関するご相談ですね！\nどのような内容についてご検討でしょうか？",
            options: [
                { text: "📜 相続した不動産の売却・有効活用", value: "inherit_sell" },
                { text: "💰 贈与税・生前対策について", value: "tax_gift" },
                { text: "⚖️ 権利関係の整理・名義変更", value: "rights_manage" }
            ]
        };
        if (step === 2) return {
            text: "承知いたしました。士業（税理士・司法書士）との連携のもと、ワンストップでスムーズに対応いたします。\n\n下記ボタンよりお問い合わせへお進みください！",
            options: [
                { text: "📩 この内容でお問合せへ進む", value: "contact", isPrimary: true },
                { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }
            ]
        };
    }

    // --- 【新設】セキュリティ・防犯相談フロー ---
    if (mode === "security") {
        if (step === 1) return {
            text: "セキュリティや防犯面を重視したお住まい探しですね！\n特に重視される防犯設備をお教えいただけますか？",
            options: [
                { text: "🔒 オートロック・モニター付きインターホン", value: "autolock" },
                { text: "🏢 2階以上・防犯カメラ設置", value: "second_floor" },
                { text: "防犯重視（一人暮らし女性等）", value: "woman_safe" }
            ]
        };
        if (step === 2) return {
            text: "ありがとうございます！安心・安全な生活をサポートする最適な物件をお探しいたします。\n\n下記ボタンよりお問い合わせへお進みください！",
            options: [
                { text: "📩 この内容でお問合せへ進む", value: "contact", isPrimary: true },
                { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }
            ]
        };
    }

    // --- 標準フロー（賃貸 / オーナー / 売却 / 購入） ---
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
        loan: { 1: "事前審査状況", 2: "借入・予算希望", 3: "金利タイプ希望" },
        reform: { 1: "リフォーム目的", 2: "改修箇所・予算" },
        cost: { 1: "費用に関する相談内容" },
        school: { 1: "学区・子育て希望" },
        pet: { 1: "ペットの種類" },
        tax: { 1: "相続・税金相談内容" },
        security: { 1: "防犯・設備希望" }
    };
    return fields[mode]?.[step] || "ご相談内容";
}

// ==========================================
// 3. AI会話ロジック（割り込み入力検知エンジン拡張版）
// ==========================================
function detectInterruptIntent(text) {
    // ローン
    if (text.includes("ローン") || text.includes("借入") || text.includes("金利") || text.includes("事前審査")) return "loan";
    // リフォーム
    if (text.includes("リフォーム") || text.includes("リノベ") || text.includes("修繕") || text.includes("工事")) return "reform";
    // 費用
    if (text.includes("費用") || text.includes("料金") || text.includes("いくら") || text.includes("初期費用") || text.includes("手数料") || text.includes("敷金") || text.includes("礼金")) return "cost";
    // 学区・子育て
    if (text.includes("学区") || text.includes("学校") || text.includes("小学校") || text.includes("中学校") || text.includes("子育て") || text.includes("保育園")) return "school";
    // ペット
    if (text.includes("ペット") || text.includes("犬") || text.includes("猫") || text.includes("いぬ") || text.includes("ねこ") || text.includes("飼いたい")) return "pet";
    // 相続・税金
    if (text.includes("相続") || text.includes("税金") || text.includes("控除") || text.includes("贈与") || text.includes("名義")) return "tax";
    // セキュリティ・防犯
    if (text.includes("セキュリティ") || text.includes("防犯") || text.includes("オートロック") || text.includes("2階以上") || text.includes("女性")) return "security";
    // 売りたい
    if (text.includes("売りたい") || text.includes("売却") || text.includes("査定")) return "sell";
    // 買いたい
    if (text.includes("買いたい") || text.includes("購入")) return "buy";
    // 貸したい
    if (text.includes("貸したい") || text.includes("オーナー") || text.includes("管理")) return "owner";
    // 借りたい
    if (text.includes("借りたい") || text.includes("賃貸") || text.includes("部屋探し") || text.includes("引越し") || text.includes("時期")) return "rent";

    return null;
}

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
    // 【割り込み判定】ボタン以外からの入力時、キーワードに応じてモードを即時切替
    // --------------------------------------
    if (!isFromButton) {
        const detectedMode = detectInterruptIntent(text);

        if (detectedMode && detectedMode !== chatState.mode) {
            chatState.mode = detectedMode;
            chatState.step = 1;
            chatState.data["相談テーマ"] = text;

            const prompt = getCurrentStepPrompt();
            return {
                text: prompt.text,
                options: prompt.options
            };
        }
    }

    // 初期状態からの通常自由入力（どのキーワードにも一致しない場合）
    if (!isFromButton && chatState.step === 0) {
        chatState.data["自由相談"] = text;
        return {
            text: `「${text}」ですね！承知いたしました。\nより詳しいご提案のため、差し支えなければご相談のカテゴリをお選びいただけますでしょうか？`,
            options: initialOptions
        };
    }

    // 通常の会話途中の補足テキスト（同モード内での入力）
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
                    loan: "住宅ローンのご相談",
                    reform: "リフォーム・リノベーションのご相談",
                    cost: "初期費用・諸費用のお問合せ",
                    school: "学区・子育て重視のお問合せ",
                    pet: "ペット飼育可物件のご相談",
                    tax: "不動産相続・税金のご相談",
                    security: "セキュリティ・防犯重視のご相談"
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

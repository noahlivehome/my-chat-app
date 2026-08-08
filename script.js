// ==========================================
// 1. 設定項目（お問い合わせ先URL / NGワード）
// ==========================================
const IELOVE_FORM_URL = "https://www.noahlivehome.jp/contact/";

// NGワードリスト（必要に応じて追加・変更してください）
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
        `「${word}」ですね！ありがとうございます。`,
        `「${word}」ですね！かしこまりました！`,
        `「${word}」ですね！`,
        `「${word}」ですね！ご入力ありがとうございます！`
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
}

// ------------------------------------------
// バリエーション豊かな一言コメントを取得する関数（不動産のプロ視点・知識拡充版）
// ------------------------------------------
function getSmartComment(mode, step, text) {
    const comments = {
        rent: {
            1: [
                "💡【エリア】人気のエリアですね！主要路線へのアクセスや急行停車の有無など、利便性もあわせて比較検討いたします。",
                "💡【エリア】生活利便施設（スーパー・医療機関等）の充実度や夜間の街灯状況など、住環境の観点からも分析します！",
                "💡【エリア】治安情報や周辺の再開発計画も含め、長く快適に暮らせる住みやすいエリアをご提案いたします！",
                "💡【エリア】隣接駅や少し離れた穴場駅も視野に入れると、同予算で格段に条件の良い物件が見つかるケースも多いですよ！"
            ],
            2: [
                "💡【予算】一般的に適正家賃は「手取り収入の1/3以内」が目安とされます。管理費・共益費も含めた総額で最適化します！",
                "💡【予算】家賃発生日の調整やフリーレント（家賃無料期間）交渉が可能な物件も視野に入れて探してまいります。",
                "💡【予算】初期費用（敷金・礼金・保証料）を抑えられる物件を組み合わることで、トータルの引越しコストを下げられますよ！",
                "💡【予算】周辺の家賃相場と照らし合わせ、コストパフォーマンスが最も高くなる条件設定で最新空室を抽出します！"
            ],
            3: [
                "💡【間取り】生活動線はもちろん、手持ちの家具サイズやテレワークスペースの有無を考慮したレイアウト選びがポイントです。",
                "💡【間取り】同じ専有面積でも、廊下面積が少ない間取りやデッドスペースの少ない形状を選ぶとお部屋を広く使えます！",
                "💡【間取り】単身・二人暮らし・ファミリーなど、将来のライフスタイルの変化まで見据えた使いやすい間取りをご提案します。",
                "💡【間取り】収納スペース（クローゼットやシューズインクローゼット）の奥行きや配置もチェックして選定いたします！"
            ],
            4: [
                "💡【築年数・広さ】1981年6月以降の新耐震基準物件であれば構造面も安心。築古でもフルリノベーション済みはお得感があります！",
                "💡【築年数・広さ】築年数だけでなく「大規模修繕の履歴」や「共用部の管理状態」を見るのが失敗しない物件選びのコツです。",
                "💡【築年数・広さ】壁構造や床構造（二重床・二重天井）など、防音性・遮音性に関わる構造面も考慮してピックアップします！",
                "💡【築年数・広さ】広さ（㎡数）だけでなく、天井高や窓の配置によって体感的な開放感は大きく変わってきます。"
            ],
            5: [
                "💡【時期】退去予定（未公開）物件の先行申込など、タイミングに合わせた最短ルートの物件確保をご案内します！",
                "💡【時期】賃貸市場は時期により変動します。閑散期は条件交渉がしやすく、繁忙期は供給数が圧倒的に多いのが特徴です。",
                "💡【時期】申込みから契約・賃料発生（起算日）までは通常2週間程度。ご希望日から逆算したスケジュールを組みましょう！",
                "💡【時期】現在のお住まいの解約予告期間（通常1ヶ月前）との重複家賃（二重家賃）を最小限に抑えるご案内をいたします！"
            ]
        },
        owner: {
            1: [
                "💡【種別】区分・戸建て・一棟など、アセット種別ごとに最適な賃料設定とターゲット層の絞り込みを行います！",
                "💡【種別】物件のポテンシャルを最大限活かすため、競合物件との差別化ポイント（設備・条件設定）をご提示します。",
                "💡【種別】長期入居を狙えるファミリー仕様か、高稼働率を維持できる単身仕様かを見極めた運用プランをご提案します。",
                "💡【種別】将来的な売却（出口戦略）まで考慮し、資産価値を損なわない賃貸運用の手法をご案内いたします。"
            ],
            2: [
                "💡【エリア】周辺の賃貸需給バランスや競合物件の成約事例をデータベースから精緻に分析し、適正賃料を算出します！",
                "💡【エリア】地域の人口動向や最寄駅の乗降客数、競合の供給過多状況などを考慮し、空室リスクを回避します。",
                "💡【エリア】ターゲット属性（単身・ファミリー・法人等）に響くプロモーションを展開し、早期成約に繋げます！",
                "💡【エリア】地域ごとの賃料相場推移を踏まえ、長期的な収益を最大化させる賃貸プランを設定いたします。"
            ],
            3: [
                "💡【間取り】ターゲット属性に合わせた人気設備（宅配ボックス・無料Wi-Fi・モニター付きインターホン等）の導入提案も行います。",
                "💡【間取り】ニーズの高い間取り構成を維持・改修することで、退去後のリピート入居や賃料アップを実現させます！",
                "💡【間取り】単身向けなら「水回りの清潔感」、ファミリー向けなら「家事動線と収納量」のアピールが決め手になります。",
                "💡【間取り】ライフスタイルのトレンドに合わせた間取りのリモデル（例：3DK→2LDK化）による価値向上もアドバイスします！"
            ],
            4: [
                "💡【築年数・現況】修繕履歴や設備の耐用年数を踏まえ、費用対効果（ROI）の高い原状回復・リノベーションをご提案します！",
                "💡【築年数・現況】築年数が経過していても、水回りの新調やアクセントクロス・照明変更で格段に成約率は向上します。",
                "💡【築年数・現況】予防保全的なメンテナンス計画を立てることで、将来的な突然の突発修繕費用をコントロールできます！",
                "💡【築年数・現況】税務上の減価償却費の計算や節税メリットも考慮した修繕アプローチのアドバイスをいたします。"
            ],
            5: [
                "💡【現況】空室期間の長期化は収益性の最大のリスクです。広告料（AD）の設定やフリーレント活用など即効性のある提案をします！",
                "💡【現況】退去予定の段階から先行募集を打つことで、前入居者の退去から次入居者の入居までのフリー期間（空室期間）を最小化します。",
                "💡【現況】オーナーチェンジ（現在賃貸中）の場合も、現行賃料の妥当性評価や将来の退去リスクを見立てた管理方針をご提示します。",
                "💡【現況】現状の稼働状態に合わせて、集客重視か・利回り重視かオーナー様のご意向に合わせた最適解を提示します！"
            ]
        },
        sell: {
            1: [
                "💡【種別】「高値追求の仲介売却」と「早期現金化・瑕疵担保免責の買取」のメリット・デメリットを比較提示いたします！",
                "💡【種別】マンション・戸建て・土地それぞれの市場トレンドや買主層のインサイトに応じた最適な販売戦略を構築します。",
                "💡【種別】種別ごとの税制（譲渡所得税・特別控除等）や売却にかかる各種手数料・諸費用の資金計画も策定します！",
                "💡【種別】一棟ビルやアパートの場合は、表面利回り・実質利回り（NOI）に基づく収益還元法査定を実施します。"
            ],
            2: [
                "💡【エリア】直近のレインズ（指定流通機構）成約データや競合売り出し事例に基づき、客観的な適正価格を算出します！",
                "💡【エリア】エリアの将来性（再開発・新駅・人口流入等）を加味し、買い手に刺さる強みを前面に出したPRを行います。",
                "💡【エリア】地域密着の購買意欲が高い顧客データベースへ優先的にアプローチし、好条件での早期売却を狙います！",
                "💡【エリア】近隣の売り出し物件と差別化するため、ターゲット層に合わせた価格設定と広告媒体の選定を行います。"
            ],
            3: [
                "💡【広さ】専有面積や坪単価の分析を行い、近隣類似物件の中で競争力を発揮できるプライシングを行います！",
                "💡【広さ】広さを活かした収納力や部屋数の多さをPRするほか、リフォームプランを併せて提示する販売手法も有効です。",
                "💡【広さ】ファミリー層ターゲットの場合は周辺の教育環境・公園・買い物環境とあわせて空間のゆとりをアピールします！",
                "💡【広さ】土地や一棟物の場合は、解体更地渡し・建売用地としての売却・現況渡しなど、最も残債が多くなるルートを検証します。"
            ],
            4: [
                "💡【築年数】築年数に応じた耐震基準（旧耐震・新耐震）や既存住宅売買瑕疵保険の利用可否を査定に反映させます！",
                "💡【築年数】リフォーム履歴や大規模修繕の実施状況は査定における大きな加点要素です。しっかりアピールしましょう。",
                "💡【築年数】インスペクション（建物状況調査）を活用し、買主様に「安心感」を提供することで値引き交渉を防ぐ手法もございます。",
                "💡【築年数】築年数が経っている場合でも「リノベーション素材物件」として買い手を集めるマーケティングが可能です！"
            ],
            5: [
                "💡【現況・時期】「3000万円特別控除」や「買い替え特例」など、税制メリットを最大限活かせるタイミングをご案内します！",
                "💡【現況・時期】居住中の売却では内覧時の好印象づくり（ホームステージング等）が重要です。ノウハウをご案内します！",
                "💡【現況・時期】空家の場合は鍵をお預かりしてのスピーディな内覧対応や、ハウスクリーニング等の付加価値提案も可能です。",
                "💡【現況・時期】「買い替え（買い先行・売り先行）」のスケジュール調整やローン残債の処理についても徹底サポートします！"
            ]
        },
        buy: {
            1: [
                "💡【種別】新築・中古のメリット比較はもちろん、将来の資産維持率（リセールバリュー）まで見据えた物件選びを伝授します！",
                "💡【種別】管理形態（委託・自主）や修繕積立金の積立状況など、目に見えない資産のコンディションも見極めます。",
                "💡【種別】戸建ての「地盤・境界・再建築可否」やマンションの「大規模修繕計画」など専門的リスクチェックもお任せください！",
                "💡【種別】投資用・事業用であれば、返済比率やイールドギャップを考慮した収益性の検証を実施いたします。"
            ],
            2: [
                "💡【予算】物件価格だけでなく、各種諸費用（登記費用・ローン手数料・仲介手数料等）を含めた総額での資金計画を立てます！",
                "💡【予算】変動・固定金利の選択、住宅ローン控除（減税）の適用条件まで見据えた最適なローン組みをご提案します。",
                "💡【予算】事前審査（仮審査）を通しておくことで、良い物件が出た際に一番手で申込を入れる「購買力」を確保できます！",
                "💡【予算】年収倍率やDTI（返済負担率）から、無理なく返済を続けられる安全圏のご予算設定をアドバイスいたします。"
            ],
            3: [
                "💡【エリア】ハザードマップ（洪水・土砂災害等）や地盤の強度、用途地域による将来の周辺環境変化リスクもチェックします！",
                "💡【エリア】再開発予定や路線の利便性向上など、将来的に資産価値が維持・上昇しやすいポテンシャルエリアをご提示します。",
                "💡【エリア】平日・土日の街の雰囲気や、夜間の治安・街灯の多さなど現地に行かないと分からない情報もお伝えします！",
                "💡【エリア】学区制限や子育て支援制度など、自治体ごとの行政サービスの違いも考慮したエリア比較が可能です。"
            ],
            4: [
                "💡【間取り】将来の家族構成の変化（出産・独立・同居）に対応できる、可動性・柔軟性の高い間取りをプロの目線で評価します。",
                "💡【間取り】採光（日当たり）・通風・眺望はもちろん、隣接建物とのプライバシー距離まで確認してアドバイスします！",
                "💡【間取り】リノベーションや間取り変更（壁の撤去等）が可能な構造（ラーメン構造・壁式構造）かどうかも見極めます。",
                "💡【間取り】コンセントの配置や家事効率を高める生活動線（回遊動線等）など、実際の住み心地を徹底チェックします！"
            ],
            5: [
                "💡【築年数】「新耐震基準（1981年6月以降）」や「住宅ローン控除適合物件」かどうかなど、税制・金利面の影響を解説します！",
                "💡【築年数】中古物件の場合、管理組合の財務状況（修繕積立金の滞納額や積立不足の有無）までプロの目で調査します。",
                "💡【築年数】築年数に応じたリフォーム費用の概算見積もりをあらかじめ考慮し、総額予算内で収まるよう調整します！",
                "💡【築年数】長寿命化工事がされているか、過去の修繕履歴（屋根防水・外壁塗装・給排水管交換等）を細かく精査いたします。"
            ]
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
    
    appendBotMessage("いらっしゃいませ！\nノアリブホームAI住まいアシスタントです。\n\n本日はどのようなご相談でしょうか？\n下の選択肢から選ぶか、ご相談内容を直接入力してくださいね！");
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
        if (step === 6) return { text: "最後に「譲れないこだわり条件」があれば教えてください！\n\nほかにも気になる点があれば、下のメッセージ入力欄から送信してください😊\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📅 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
    }

    if (mode === "owner") {
        if (step === 1) return { text: "ご所有物件の「種別」をお選びいただくか、入力してください。", options: [{ text: "🏢 マンション・アパート", value: "mansion_single" }, { text: "🏢 一棟マンション・ビル", value: "mansion_building" }, { text: "🏠 一戸建て", value: "house" }, { text: "🏬 店舗事務所・その他", value: "apartment" }] };
        if (step === 2) return { text: "物件のおおよその「所在地（エリア）」を教えてください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "📍 その他の地域", value: "other" }] };
        if (step === 3) return { text: "ご所有物件の「間取り」をお聞かせいただけますか？", options: [{ text: "🛋 単身用（1K〜1LDK）", value: "single" }, { text: "🛋 ファミリー用（2LDK〜3LDK）", value: "family" }, { text: "🏠 大型・戸建て（4LDK以上）", value: "large" }, { text: "🏢 一棟まるごと（複数室）", value: "building" }] };
        if (step === 4) return { text: "おおよその「築年数」はどちらになりますでしょうか？", options: [{ text: "✨ 築10年未満（築浅）", value: "under10" }, { text: "🏢 築10年〜20年程度", value: "under20" }, { text: "🏚 築20年以上", value: "over20" }, { text: "❓ 不明・要確認", value: "unknown" }] };
        if (step === 5) return { text: "現在の「お部屋の現況（空室、賃貸中など）」を教えてください。", options: [{ text: "❓ 現在、空室中", value: "vacancy" }, { text: "🚪 近々、退去予定", value: "leaving" }, { text: "🏠 現在、満室稼働中", value: "full" }, { text: "👤 居住中（貸出検討段階）", value: "living" }] };
        if (step === 6) return { text: "ご検討・ご希望の「管理スタイルやプラン」はございますか？", options: [{ text: "🤝 集客〜集金・管理まで全て任せたい", value: "full_manage" }, { text: "📢 集客（入居者募集）のみ依頼したい", value: "recruit_only" }, { text: "🛠️ 管理会社を変更したい", value: "sublease" }, { text: "💡 まずは賃料査定・相談のみ", value: "estimate_only" }] };
        if (step === 7) return { text: "最後に「ご要望や気になっている点」があれば教えてください！\n\nほかにも気になる点がございましたら、下のメッセージ入力欄から送信してください😊\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📋 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
    }

    if (mode === "sell") {
        if (step === 1) return { text: "ご所有物件の「種別」をお選びいただくか、入力してください。", options: [{ text: "🏢 マンション", value: "sell_mansion" }, { text: "🏠 一戸建て", value: "sell_house" }, { text: "🏞 土地", value: "sell_land" }, { text: "🏬 一棟ビル・アパート", value: "sell_building" }] };
        if (step === 2) return { text: "物件の「所在地（エリア）」をお選びいただくか、入力してください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "📍 その他の地域", value: "other" }] };
        if (step === 3) return { text: "物件の「間取りや広さの目安」を教えていただけますか？", options: [{ text: "🛋 コンパクト（〜50㎡ / 1〜2LDK）", value: "small" }, { text: "🏠 標準ファミリー（50〜80㎡ / 3LDK）", value: "medium" }, { text: "🏡 大型（80㎡以上 / 4LDK以上）", value: "large" }, { text: "🏢 一棟物件・土地", value: "land_building" }] };
        if (step === 4) return { text: "物件の「築年数」の目安を教えてください。", options: [{ text: "✨ 築10年未満（築浅）", value: "under10" }, { text: "🏢 築10年〜20年程度", value: "under20" }, { text: "🏚 築20年以上", value: "over20" }, { text: "❓ 不明・要確認", value: "unknown" }] };
        if (step === 5) return { text: "現在の「ご利用状況やご売却時期」を教えてください。", options: [{ text: "👤 自身で居住中（早期売却希望）", value: "living_now" }, { text: "🚪 現在、空家・空室", value: "empty" }, { text: "💰 賃貸中（オーナーチェンジ）", value: "rented" }, { text: "🗓 良い条件があれば時期問わず検討", value: "someday" }] };
        if (step === 6) return { text: "最後に「ご売却に関するその他ご要望」があれば教えてください！\n\nほかにも気になる点がございましたら、下のメッセージ入力欄から送信してください😊\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📝 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
    }

    if (mode === "buy") {
        if (step === 1) return { text: "どのような「種別」をお探しでしょうか？", options: [{ text: "🏢 新築・中古マンション", value: "buy_mansion" }, { text: "🏡 新築・中古一戸建て", value: "buy_house" }, { text: "🏞 土地", value: "buy_land" }, { text: "🏬 投資用・事業用物件", value: "buy_invest" }] };
        if (step === 2) return { text: "ご予算の「イメージ上限」をお聞かせください。", options: [{ text: "💰 3,000万円以内", value: "3000" }, { text: "💰 5,000万円以内", value: "5000" }, { text: "💰 7,000万円以内", value: "7000" }, { text: "💰 7,000万円以上", value: "over7000" }] };
        if (step === 3) return { text: "ご購入をご希望の「エリア（駅名や地域）」を教えてください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "💡 エリアから相談したい", value: "other" }] };
        if (step === 4) return { text: "ご希望の「間取りや広さ」はいかがでしょうか？", options: [{ text: "🛋 1LDK〜2DK", value: "1ldk" }, { text: "🛋 2LDK〜3LDK", value: "3ldk" }, { text: "🏠 4LDK以上", value: "4ldk" }, { text: "🏬 一棟・事業用", value: "business" }] };
        if (step === 5) return { text: "「築年数」のご希望はございますか？", options: [{ text: "✨ 新築・築浅（10年以内）", value: "new" }, { text: "🏢 築20年以内", value: "under20" }, { text: "🛠 リノベーション前提", value: "renovation" }, { text: "⚖️ 特に拘らない", value: "any" }] };
        if (step === 6) return { text: "最後に住宅ローンやご要望など「気になっている点」はございますか？\n\nほかにも気になる点がございましたら、下のメッセージ入力欄から送信してください😊\n特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📱 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }] };
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
    // NGワードチェック処理
    // --------------------------------------
    const hasNgWord = NG_WORDS.some(word => text.includes(word));
    if (hasNgWord) {
        const currentPrompt = getCurrentStepPrompt();
        return {
            text: "⚠️ 不適切な表現が含まれているため処理できませんでした。\nお手数ですが、別のお言葉でご入力いただくか、下記選択肢よりお選びください。",
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
            replyPrefix = `「${text}」についてですね！\nご相談・査定やご提案にかかる費用は【すべて無料】ですのでご安心ください😊`;
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
        let answerText = "ご相談や査定・お部屋探しのご提案は【すべて無料】で行っております！ご安心ください😊";
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
            text: `${aizuchi}\n\nご要望としてしっかりメモいたしました！\n引き続き、下記の質問についてお選びいただけますでしょうか？\n\n${currentPrompt.text}`,
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

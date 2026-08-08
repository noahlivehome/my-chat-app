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
// プロの知識一言コメント（選択肢ごとの5パターン完全対応版）
// ------------------------------------------
function getSmartComment(mode, step, text) {
    const commentMap = {
        // --- 1. ペット相談 ---
        pet: {
            1: {
                "🐶 小型犬（1頭）": [
                    "💡【小型犬】小型犬可の物件は比較的豊富ですが、敷金が1ヶ月分積み増しになるケースが多めです。",
                    "💡【小型犬】足腰への負担を減らすため、フローリングではなく滑りにくい床材か確認すると安心です。",
                    "💡【小型犬】近隣に散歩しやすい公園や緑道があるエリアかどうかもあわせて調査いたします。",
                    "💡【小型犬】お留守番の長さや鳴き声への配慮など、事前に管理規約のペット細則をチェックします。",
                    "💡【小型犬】ペット専用の足洗い場や共用設備があるマンションは特に人気が高い傾向があります。"
                ],
                "🐕 中型〜大型犬": [
                    "💡【大型犬】大型犬可の物件は市場全体の数％と非常に希少なため、早期の条件絞り込みが不可欠です。",
                    "💡【大型犬】室内での大型犬の動きやすさや、室内の傷・汚れ防止対策をあらかじめ想定しておきましょう。",
                    "💡【大型犬】大型犬の受け入れ可否は管理組合の承認が必要な場合が多く、個別交渉を代行します。",
                    "💡【大型犬】近隣の動物病院の評判や、大型犬が入れる広めのドッグラン情報をリサーチいたします。",
                    "💡【大型犬】お部屋の階数（足音や振動に配慮し1階や角部屋を選ぶ）についてもご提案できます。"
                ],
                "🐱 猫（1〜2頭）": [
                    "💡【猫】「猫可」は希少ですが、完全室内飼いや頭数制限（原則2頭まで等）のルールがあります。",
                    "💡【猫】壁のクロスや柱の爪とぎ対策として、腰壁ガードや保護フィルムが使える物件がおすすめです。",
                    "💡【猫】多頭飼い（3頭以上）をご希望の場合、特例で交渉可能な物件を優先的にピックアップします。",
                    "💡【猫】日当たりが良く、日向ぼっこが好きな猫ちゃんが快適に過ごせる窓配置をチェックします。",
                    "💡【猫】脱走防止柵の設置がしやすい玄関や廊下の間取り構造かどうかもプロの目で確認します。"
                ],
                "🐾 多頭飼い・その他": [
                    "💡【多頭・その他】多頭飼いや小動物・爬虫類などは管理規約で細かく制限されるため事前確認が必須です。",
                    "💡【多頭・その他】オーナー様への直接交渉により、特例で許可が降りるケースの開拓もお任せください。",
                    "💡【多頭・その他】ペット共生型マンションなど、ペットを飼う方向けの設備が充実した物件をご案内します。",
                    "💡【多頭・その他】ペット専用の臭い対策（換気システムや24時間換気）がある物件は快適です。",
                    "💡【多頭・その他】退去時の原状回復トラブルを防ぐため、事前の特約内容をしっかり精査いたします。"
                ]
            },
            2: {
                "💡 お部屋の設備・こだわり条件を指定": [
                    "💡【こだわり】追い焚き機能や浴室乾燥機があると、ペットのシャンプー後も快適に乾かせます。",
                    "💡【こだわり】システムキッチンの収納力や、ペットフードのストック置き場が確保できる広さが人気です。",
                    "💡【こだわり】オートロックや宅配ボックスなど、日々の生活利便性も妥協せずにお探しします。",
                    "💡【こだわり】敷地内にゴミ置き場がある物件は、ペットシーツ等のゴミ出しがスムーズで便利です。",
                    "💡【こだわり】インターネット無料や高速Wi-Fi完備物件なら、見守りカメラの設置も安心です。"
                ],
                "📍 エリア・周辺環境を重視": [
                    "💡【環境】ペット同伴可能なカフェやペットショップが徒歩圏内にあると休日の楽しみが広がります。",
                    "💡【環境】大通りから一本入った閑静な住宅街は、車の騒音が少なくペットも落ち着いて過ごせます。",
                    "💡【環境】夜間の人通りや街灯の明るさなど、お散歩時の安全性もしっかりチェックいたします。",
                    "💡【環境】急な体調不良に備えて、夜間救急対応の動物病院へのアクセスも考慮して選定します。",
                    "💡【環境】四季折々の自然を感じられる川沿いや公園の近くは、毎日の散歩コースに最適です。"
                ]
            }
        },

        // --- 2. 相続・税金相談 ---
        tax: {
            1: {
                "📜 相続した不動産の売却・有効活用": [
                    "💡【相続売却】「3,000万円の特別控除（空き家の譲渡所得）」の適用要件に合致するか判定します。",
                    "💡【相続売却】相続登記（名義変更）が未了の状態でも、売却に向けた並行手続きをサポート可能です。",
                    "💡【相続売却】そのまま売却するべきか、リフォームして賃貸運用するべきかの収支を比較します。",
                    "💡【相続売却】複数の相続人様がいらっしゃる場合の権利調整や意思疎通もスムーズに仲介します。",
                    "💡【相続売却】売却時にかかる譲渡所得税や住民税の概算をあらかじめシミュレーションいたします。"
                ],
                "💰 贈与税・生前対策について": [
                    "💡【贈与対策】「暦年贈与」や「相続時精算課税制度」のメリット・デメリットを分かりやすく解説します。",
                    "💡【贈与対策】不動産の生前贈与と遺言書による相続、どちらが税制上有利か専門的視点で比較します。",
                    "💡【贈与対策】配偶者控除（おしどり贈与）を利用した居住用不動産の移転手続きもサポートします。",
                    "💡【贈与対策】将来の相続税の納税資金を確保するための、所有不動産の組み替えをご提案します。",
                    "💡【贈与対策】提携の税理士と連携し、税務リスクを最小限に抑えた対策プランを構築します。"
                ],
                "⚖️ 権利関係の整理・名義変更": [
                    "💡【権利整理】共有名義の不動産で意見が割れている場合の解決策や分割方法をアドバイスします。",
                    "💡【権利整理】司法書士と連携し、複雑な相続登記や抵当権の抹消手続きをワンストップで代行します。",
                    "💡【権利整理】古い担保権や地役権が残っている物件のクリアな権利化をサポートします。",
                    "💡【権利整理】借地権や底地など、特殊な権利関係が絡む不動産の売買・整理もお任せください。",
                    "💡【権利整理】将来のトラブルを防ぐための家族信託の活用についてのご相談も承っております。"
                ]
            },
            2: {
                "📅 いつ頃の実行・解決をご希望ですか？": [
                    "💡【時期】相続税の申告期限（10ヶ月以内）から逆算した、余裕を持ったスケジュールをご提案します。",
                    "💡【時期】不動産は売却完了までに数ヶ月かかるため、早めの査定・販売開始が節税面でも有利です。",
                    "💡【時期】お盆や年末年始など、ご親族が集まるタイミングに合わせたご相談の同席も可能です。",
                    "💡【時期】急ぎの現金化が必要な場合は、自社買取によるスピーディーな対応もご選択いただけます。",
                    "💡【時期】焦って売却して損をしないよう、市況が安定しているタイミングを狙った売却戦略を立てます。"
                ]
            }
        },

        // --- 3. 学区・子育て相談 ---
        school: {
            1: {
                "🏫 特定の指定校エリアで探したい": [
                    "💡【指定校】学区の境界線は番地単位で細かく分かれているため、正確な通学区域を個別確認します。",
                    "💡【指定校】「学校選択制度」が利用可能な自治体の場合、隣接校への選択肢も考慮して探せます。",
                    "💡【指定校】途中で学区が変わらないよう、長期的な居住を見据えた不動産選びをサポートします。",
                    "💡【指定校】人気の公立中学校や、高校受験に強いエリアの情報なども蓄積しております。",
                    "💡【指定校】通学路の安全性（歩道の広さや交通量）についても現地調査の際に入念にチェックします。"
                ],
                "👶 保育園・公園が近い環境重視": [
                    "💡【子育て環境】待機児童の状況や、徒歩圏内に複数の認可保育園・こども園があるか調べます。",
                    "💡【子育て環境】大型遊具のある公園や、緑豊かな環境が近くにあると子育ての負担が大きく軽減されます。",
                    "💡【子育て環境】ベビーカー移動がしやすいフラットなアプローチや、エレベーター付き物件を優先します。",
                    "💡【子育て環境】小児科・皮膚科などの病院が近くにある住環境は、万が一の時にも安心です。",
                    "💡【子育て環境】地域の見守り活動や子育て世帯のコミュニティが活発なエリアをご案内します。"
                ],
                "💡 おすすめの学区を提案してほしい": [
                    "💡【提案】治安が良く教育熱心なご家庭に人気の、北区・周辺エリアの隠れた名学区をご紹介します。",
                    "💡【提案】子育て世帯の人口が増えている活気あるニュータウンや再開発エリアもおすすめです。",
                    "💡【提案】通勤の利便性と、のびのび子育てできる自然環境が両立するバランスの良い街をご提案します。",
                    "💡【提案】市立図書館や児童館などの公共の子育て支援施設が充実した周辺環境をピックアップします。",
                    "💡【提案】ご予算と子育て環境の希望をすり合わせ、最もコストパフォーマンスの高い地域を厳選します。"
                ]
            },
            2: {
                "🏡 ご希望のお住まい形態": [
                    "💡【住まい形態】子育て中は、階下への足音を気にせず暮らせる1階のお部屋や戸建てが人気です。",
                    "💡【住まい形態】リビングが見渡せる対面式キッチンは、小さなお子様を見守りながら家事ができます。",
                    "💡【住まい形態】収納力が高いシューズインクロークがあると、ベビーカーや外遊びグッズもすっきり片付きます。",
                    "💡【住まい形態】将来の子供部屋の確保を考慮した、可動間仕切り付きの2LDK・3LDKがおすすめです。",
                    "💡【住まい形態】安全性に配慮したバリアフリー設計や、指挟み防止の建具がある物件もご提案可能です。"
                ]
            }
        },

        // --- 4. セキュリティ・防犯相談 ---
        security: {
            1: {
                "🔒 オートロック・モニター付きインターホン": [
                    "💡【オートロック】来訪者を映像で確認できるTVモニター付きインターホンは必須の防犯設備です。",
                    "💡【オートロック】セールスや不審者の館内への侵入を防ぐオートロック付き物件を厳選します。",
                    "💡【オートロック】近年普及している「スマホ連動型インターホン」対応のスマート物件もご紹介可能です。",
                    "💡【オートロック】エントランスだけでなく、エレベーター内や共用廊下の防犯カメラ有無も確認します。",
                    "💡【オートロック】ピッキングに強いディンプルキーや、ダブルロック仕様の玄関扉かチェックします。"
                ],
                "🏢 2階以上・防犯カメラ設置": [
                    "💡【2階以上】道路からの視線や、低層階特有の侵入リスクを防ぐため2階以上のお部屋は安心感があります。",
                    "💡【2階以上】バルコニーの足場になりやすい電柱や物置が近くにないか、プロの目で立地を確認します。",
                    "💡【2階以上】24時間稼働の防犯カメラが敷地内に複数設置されているマンションは抑止力に優れています。",
                    "💡【2階以上】内廊下設計のマンションなら、外部からのプライバシーが守られセキュリティが万全です。",
                    "💡【2階以上】管理人が日勤または巡回管理している物件は、共用部の美化と防犯性が常に保たれています。"
                ],
                "防犯重視（一人暮らし女性等）": [
                    "💡【女性安心】夜間でも明るい大通り沿いのアクセス経路や、駅からの安全な帰り道をご提案します。",
                    "💡【女性安心】宅配ボックスがあれば、対面せずに荷物を受け取れるため一人暮らしでも安心です。",
                    "💡【女性安心】ホームセキュリティ（セコム・アルソック等）が各戸に導入されたハイグレード物件です。",
                    "💡【女性安心】周辺に交番やコンビニ、24時間営業のスーパーがあり、人通りが途絶えないエリアを選びます。",
                    "💡【女性安心】窓ガラスの防犯フィルムや、シャッター雨戸付きなど物理的な対策物件もお探しします。"
                ]
            },
            2: {
                "📍 重視したい周辺環境": [
                    "💡【周辺環境】夜遅くなっても安心して歩けるように、街灯が多く整備された明るい道を選定します。",
                    "💡【周辺環境】繁華街から適度に離れた、落ち着いた住環境の住宅街エリアをご提案いたします。",
                    "💡【周辺環境】周辺の治安情報や、過去の犯罪発生率なども考慮した安全性の高い地域をピックアップ。",
                    "💡【周辺環境】駅からの道のりにスーパーやドラッグストアがあり、帰宅ついでのお買い物も安全です。",
                    "💡【周辺環境】近隣住民の雰囲気が落ち着いており、長く安心して住み続けられるコミュニティ環境です。"
                ]
            }
        },

        // --- 標準・既存フロー ---
        rent: {
            1: {
                "📍 赤羽・北区エリア": [
                    "💡【赤羽エリア】京浜東北線・埼京線・湘南新宿ラインが使え、都心へのアクセスと抜群の利便性を誇ります！",
                    "💡【赤羽エリア】駅周辺の活気ある商店街や商業施設に加え、少し離れると閑静な住宅街が広がる人気エリアです。",
                    "💡【赤羽エリア】複数路線の乗り入れにより、万が一の人身事故時も他の路線へ迂回しやすいメリットがあります。",
                    "💡【赤羽エリア】下町情緒と現代的な利便性が共存しており、一人暮らしからファミリーまで非常に住みやすい街です。",
                    "💡【赤羽エリア】荒川河川敷などの自然環境も近く、休日のリフレッシュやジョギングに最適な環境です。"
                ],
                "📍 その他23区": [
                    "💡【23区】通勤・通学の時間を最小限に抑えられる、都心部や主要オフィス街へのアクセスを考慮します。",
                    "💡【23区】洗練された街並みや、おしゃれなカフェ・ショップが点在する人気のライフスタイルエリアです。",
                    "💡【23区】自治体独自の子育て支援や福祉サービスの手厚さも踏まえて、最適な区をご提案できます。",
                    "💡【23区】資産価値が落ちにくいため、将来的なリセールや住み替えを見据えても安心なエリアです。",
                    "💡【23区】下町の温かみが残るエリアから、最先端の再開発エリアまで幅広い表情を持つ東京の魅力をご紹介します。"
                ],
                "📍 埼玉県": [
                    "💡【埼玉県】都内へアクセスの良さを保ちながら、同じご予算でより広くお部屋を借りられる高コスパエリアです！",
                    "💡【埼玉県】大型ショッピングモールや大型公園が充実しており、ゆったりとしたファミリーライフを送れます。",
                    "💡【埼玉県】子育て世帯への手厚い行政サポートや、緑豊かな住環境が整っているため非常に人気急上昇中です。",
                    "💡【埼玉県】浦和や大宮など、新幹線も利用できるターミナル駅周辺はビジネス・プライベートともに快適です。",
                    "💡【埼玉県】駅チカでありながら静かな住環境が手に入る、穴場の優良物件を多数取り扱っております。"
                ],
                "💡 条件から相談する": [
                    "💡【条件相談】「家賃は抑えめだけど綺麗なお部屋が良い」など、こだわり条件の優先順位を一緒に整理します。",
                    "💡【条件相談】プロならではの視点で、お客様のライフスタイルにぴったりの隠れた好条件物件をご提案します。",
                    "💡【条件相談】絶対に譲れない条件と、妥協できるポイントを分けて効率的にお部屋探しを進めましょう。",
                    "💡【条件相談】初期費用やフリーレント交渉など、金銭面でのご要望も最大限考慮してお探しします。",
                    "💡【条件相談】今の住まいの不満点を解消するための、具体的な設備や間取りの条件を逆算してご提案します。"
                ]
            }
        }
    };

    if (commentMap[mode] && commentMap[mode][step]) {
        const stepMap = commentMap[mode][step];
        if (stepMap[text]) {
            const list = stepMap[text];
            return list[Math.floor(Math.random() * list.length)];
        }
        // フォールバック（一致する選択肢テキストがない場合のランダム）
        const values = Object.values(stepMap);
        if (values.length > 0) {
            const flatList = values.flat();
            return flatList[Math.floor(Math.random() * flatList.length)];
        }
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
// 現在のステップに応じた質問・選択肢を取得（会話を多段階に拡張）
// ==========================================
function getCurrentStepPrompt() {
    const mode = chatState.mode;
    const step = chatState.step;

    // --- ペット相談フロー (3ステップ) ---
    if (mode === "pet") {
        if (step === 1) return {
            text: "ペットと暮らせるお住まいをお探しですね！\n飼育される（または予定している）ペットの種類を教えていただけますか？",
            options: [
                { text: "🐶 小型犬（1頭）", value: "small_dog" },
                { text: "🐕 中型〜大型犬", value: "large_dog" },
                { text: "🐱 猫（1〜2頭）", value: "cat" },
                { text: "🐾 多頭飼い・その他", value: "multi_pet" }
            ]
        };
        if (step === 2) return {
            text: "ありがとうございます！次に、物件探しの際により重視したいポイントはどちらですか？",
            options: [
                { text: "💡 お部屋の設備・こだわり条件を指定", value: "pet_cond" },
                { text: "📍 エリア・周辺環境を重視", value: "pet_env" }
            ]
        };
        if (step === 3) return {
            text: "ヒアリング内容がまとまりました！\nペット可物件のプロの知識を踏まえ、最適な物件資料をご用意いたします。\n\n下記ボタンよりお問い合わせへお進みください😊",
            options: [
                { text: "📩 この内容でお問合せへ進む", value: "contact", isPrimary: true },
                { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }
            ]
        };
    }

    // --- 相続・税金相談フロー (3ステップ) ---
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
            text: "承知いたしました。スケジュールや実行時期についてのお考えも教えていただけますか？",
            options: [
                { text: "📅 いつ頃の実行・解決をご希望ですか？", value: "timing" },
                { text: "💡 まずは専門家に個別相談したい", value: "consult_only" }
            ]
        };
        if (step === 3) return {
            text: "ありがとうございます！士業との連携も含めたトータルサポートの準備が整いました。\n\n下記ボタンよりお問い合わせへお進みください😊",
            options: [
                { text: "📩 この内容でお問合せへ進む", value: "contact", isPrimary: true },
                { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }
            ]
        };
    }

    // --- 学区・子育て相談フロー (3ステップ) ---
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
            text: "ありがとうございます！次に、お探しのお住まい形態について教えてください。",
            options: [
                { text: "🏡 ご希望のお住まい形態", value: "home_type" },
                { text: "💡 プロにトータルでお任せ", value: "all_trust" }
            ]
        };
        if (step === 3) return {
            text: "子育て世帯に最適な住環境のご提案準備が整いました！\n\n下記ボタンよりお問い合わせへお進みください😊",
            options: [
                { text: "📩 この内容でお問合せへ進む", value: "contact", isPrimary: true },
                { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }
            ]
        };
    }

    // --- セキュリティ・防犯相談フロー (3ステップ) ---
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
            text: "承知いたしました！防犯面とあわせて重視したい「周辺環境」についてお聞かせください。",
            options: [
                { text: "📍 重視したい周辺環境", value: "env_choice" },
                { text: "💡 特になし・おまかせ", value: "no_pref" }
            ]
        };
        if (step === 3) return {
            text: "安心・安全な生活をサポートする最適な物件資料の準備ができました！\n\n下記ボタンよりお問い合わせへお進みください😊",
            options: [
                { text: "📩 この内容でお問合せへ進む", value: "contact", isPrimary: true },
                { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }
            ]
        };
    }

    // --- ローン相談フロー (4ステップ) ---
    if (mode === "loan") {
        if (step === 1) return {
            text: "住宅ローンのご相談ですね！プロの視点から丁寧にご案内いたします。\nまずは、現在「住宅ローンの事前審査」はお済みでしょうか？",
            options: [
                { text: "📝 これから検討・審査したい", value: "before_review" },
                { text: "✅ すでに審査通過済み", value: "after_review" },
                { text: "❓ 審査に通るか不安がある", value: "worry_review" }
            ]
        };
        if (step === 2) return {
            text: "承知いたしました！ご検討中の「借入ご希望額」または「物件のご予算」はお決まりでしょうか？",
            options: [
                { text: "💰 3,000万円前後", value: "loan_3000" },
                { text: "💰 5,000万円前後", value: "loan_5000" },
                { text: "💰 7,000万円以上", value: "loan_7000" },
                { text: "💡 年収から借入上限を知りたい", value: "loan_income" }
            ]
        };
        if (step === 3) return {
            text: "ありがとうございます！金利タイプのご希望や、月々の返済額シミュレーションのご希望はございますか？",
            options: [
                { text: "📉 低金利な「変動金利」重視", value: "variable" },
                { text: "🔒 安定の「固定金利」重視", value: "fixed" },
                { text: "📊 プロに提案してほしい", value: "proposal" }
            ]
        };
        if (step === 4) return {
            text: "ローンのヒアリング内容がまとまりました！\nほかにも気になる点があれば入力いただくか、下記ボタンよりお問合せへお進みください😊",
            options: [
                { text: "📩 この内容でお問合せへ進む", value: "contact", isPrimary: true },
                { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }
            ]
        };
    }

    // --- リフォーム相談フロー (3ステップ) ---
    if (mode === "reform") {
        if (step === 1) return {
            text: "リフォーム・リノベーションのご相談ですね！どのような目的・場所のリフォームをご検討中でしょうか？",
            options: [
                { text: "🏠 居住中マイホームの改修", value: "reform_home" },
                { text: "🔨 中古購入と同時にリノベ", value: "reform_buy" },
                { text: "🏢 賃貸・オーナー様の空室対策", value: "reform_owner" },
                { text: "🏷 売却前の価値向上リフォーム", value: "reform_sell" }
            ]
        };
        if (step === 2) return {
            text: "承知いたしました！リフォームの「具体的な箇所やご予算感」はお決まりですか？",
            options: [
                { text: "🚿 水まわり（キッチン・お風呂等）", value: "water" },
                { text: "🎨 内装（壁紙・床張替え）", value: "interior" },
                { text: "🛋 フルリノベーション", value: "full_renov" },
                { text: "💡 プロに相談して決めたい", value: "consult" }
            ]
        };
        if (step === 3) return {
            text: "リフォームに関するご相談内容を受け付けました！下記ボタンよりお問い合わせへお進みください😊",
            options: [
                { text: "📩 この内容でお問合せへ進む", value: "contact", isPrimary: true },
                { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }
            ]
        };
    }

    // --- 費用相談フロー (3ステップ) ---
    if (mode === "cost") {
        if (step === 1) return {
            text: "お費用や初期費用に関するご質問ですね！具体的にどちらの費用について気になられていますか？",
            options: [
                { text: "💴 賃貸の契約初期費用・安くしたい", value: "rent_cost" },
                { text: "🏛 売買の諸費用（仲介手数料・税金等）", value: "buy_cost" },
                { text: "💰 相談料・査定料について（無料か）", value: "free_check" }
            ]
        };
        if (step === 2) return {
            text: "当店での事前査定やお部屋探しのご相談は【完全無料】ですのでご安心ください！初期費用の分割や抑え方についてのご要望も承ります。",
            options: [
                { text: "💡 初期費用分割や交渉について相談する", value: "negotiate" },
                { text: "📩 このままお問合せへ進む", value: "contact", isPrimary: true }
            ]
        };
        if (step === 3) return {
            text: "費用に関するヒアリング内容がまとまりました！下記ボタンよりお進みください😊",
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
        if (step === 6) return { text: "最後に「譲れないこだわり条件」があれば教えてください！特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📅 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }, { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }] };
    }

    if (mode === "owner") {
        if (step === 1) return { text: "ご所有物件の「種別」をお選びいただくか、入力してください。", options: [{ text: "🏢 マンション・アパート", value: "mansion_single" }, { text: "🏢 一棟マンション・ビル", value: "mansion_building" }, { text: "🏠 一戸建て", value: "house" }, { text: "🏬 店舗事務所・その他", value: "apartment" }] };
        if (step === 2) return { text: "物件のおおよその「所在地（エリア）」を教えてください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "📍 その他の地域", value: "other" }] };
        if (step === 3) return { text: "ご所有物件の「間取り」をお聞かせいただけますか？", options: [{ text: "🛋 単身用（1K〜1LDK）", value: "single" }, { text: "🛋 ファミリー用（2LDK〜3LDK）", value: "family" }, { text: "🏠 大型・戸建て（4LDK以上）", value: "large" }, { text: "🏢 一棟まるごと（複数室）", value: "building" }] };
        if (step === 4) return { text: "おおよその「築年数」はどちらになりますでしょうか？", options: [{ text: "✨ 築10年未満（築浅）", value: "under10" }, { text: "🏢 築10年〜20年程度", value: "under20" }, { text: "🏚 築20年以上", value: "over20" }, { text: "❓ 不明・要確認", value: "unknown" }] };
        if (step === 5) return { text: "現在の「お部屋の現況（空室、賃貸中など）」を教えてください。", options: [{ text: "❓ 現在、空室中", value: "vacancy" }, { text: "🚪 近々、退去予定", value: "leaving" }, { text: "🏠 現在、満室稼働中", value: "full" }, { text: "👤 居住中（貸出検討段階）", value: "living" }] };
        if (step === 6) return { text: "ご検討・ご希望の「管理スタイルやプラン」はございますか？", options: [{ text: "🤝 集客〜集金・管理まで全て任せたい", value: "full_manage" }, { text: "📢 集客（入居者募集）のみ依頼したい", value: "recruit_only" }, { text: "🛠️ 管理会社を変更したい", value: "sublease" }, { text: "💡 まずは賃料査定・相談のみ", value: "estimate_only" }] };
        if (step === 7) return { text: "最後に「ご要望や気になっている点」があれば教えてください！特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📋 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }, { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }] };
    }

    if (mode === "sell") {
        if (step === 1) return { text: "ご所有物件の「種別」をお選びいただくか、入力してください。", options: [{ text: "🏢 マンション", value: "sell_mansion" }, { text: "🏠 一戸建て", value: "sell_house" }, { text: "🏞 土地", value: "sell_land" }, { text: "🏬 一棟ビル・アパート", value: "sell_building" }] };
        if (step === 2) return { text: "物件の「所在地（エリア）」をお選びいただくか、入力してください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "📍 その他の地域", value: "other" }] };
        if (step === 3) return { text: "物件の「間取りや広さの目安」を教えていただけますか？", options: [{ text: "🛋 コンパクト（〜50㎡ / 1〜2LDK）", value: "small" }, { text: "🏠 標準ファミリー（50〜80㎡ / 3LDK）", value: "medium" }, { text: "🏡 大型（80㎡以上 / 4LDK以上）", value: "large" }, { text: "🏢 一棟物件・土地", value: "land_building" }] };
        if (step === 4) return { text: "物件の「築年数」の目安を教えてください。", options: [{ text: "✨ 築10年未満（築浅）", value: "under10" }, { text: "🏢 築10年〜20年程度", value: "under20" }, { text: "🏚 築20年以上", value: "over20" }, { text: "❓ 不明・要確認", value: "unknown" }] };
        if (step === 5) return { text: "現在の「ご利用状況やご売却時期」を教えてください。", options: [{ text: "👤 自身で居住中（早期売却希望）", value: "living_now" }, { text: "🚪 現在、空家・空室", value: "empty" }, { text: "💰 賃貸中（オーナーチェンジ）", value: "rented" }, { text: "🗓 良い条件があれば時期問わず検討", value: "someday" }] };
        if (step === 6) return { text: "最後に「ご売却に関するその他ご要望」があれば教えてください！特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📝 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }, { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }] };
    }

    if (mode === "buy") {
        if (step === 1) return { text: "どのような「種別」をお探しでしょうか？", options: [{ text: "🏢 新築・中古マンション", value: "buy_mansion" }, { text: "🏡 新築・中古一戸建て", value: "buy_house" }, { text: "🏞 土地", value: "buy_land" }, { text: "🏬 投資用・事業用物件", value: "buy_invest" }] };
        if (step === 2) return { text: "ご予算の「イメージ上限」をお聞かせください。", options: [{ text: "💰 3,000万円以内", value: "3000" }, { text: "💰 5,000万円以内", value: "5000" }, { text: "💰 7,000万円以内", value: "7000" }, { text: "💰 7,000万円以上", value: "over7000" }] };
        if (step === 3) return { text: "ご購入をご希望の「エリア（駅名や地域）」を教えてください。", options: [{ text: "📍 赤羽・北区エリア周辺", value: "akabane" }, { text: "📍 その他東京23区内", value: "tokyo23" }, { text: "📍 埼玉県内", value: "saitama" }, { text: "💡 エリアから相談したい", value: "other" }] };
        if (step === 4) return { text: "ご希望の「間取りや広さ」はいかがでしょうか？", options: [{ text: "🛋 1LDK〜2DK", value: "1ldk" }, { text: "🛋 2LDK〜3LDK", value: "3ldk" }, { text: "🏠 4LDK以上", value: "4ldk" }, { text: "🏬 一棟・事業用", value: "business" }] };
        if (step === 5) return { text: "「築年数」のご希望はございますか？", options: [{ text: "✨ 新築・築浅（10年以内）", value: "new" }, { text: "🏢 築20年以内", value: "under20" }, { text: "🛠 リノベーション前提", value: "renovation" }, { text: "⚖️ 特に拘らない", value: "any" }] };
        if (step === 6) return { text: "最後に住宅ローンやご要望など「気になっている点」はございますか？特になければ、下記ボタンよりお問合せへお進みください！", options: [{ text: "📱 条件を引き継いでお問合せへ進む", value: "contact", isPrimary: true }, { text: "🏠 メインメニューに戻る", value: "reset", isPrimary: false }] };
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
        cost: { 1: "費用相談種別", 2: "費用詳細要望" },
        school: { 1: "学区・子育て希望", 2: "お住まい形態" },
        pet: { 1: "ペットの種類", 2: "ペット重視ポイント" },
        tax: { 1: "相続・税金内容", 2: "希望実行時期" },
        security: { 1: "防犯設備希望", 2: "周辺環境重視点" }
    };
    return fields[mode]?.[step] || "ご相談内容";
}

// ==========================================
// 3. AI会話ロジック（割り込み検知エンジン）
// ==========================================
function detectInterruptIntent(text) {
    if (text.includes("ローン") || text.includes("借入") || text.includes("金利") || text.includes("事前審査")) return "loan";
    if (text.includes("リフォーム") || text.includes("リノベ") || text.includes("修繕") || text.includes("工事")) return "reform";
    if (text.includes("費用") || text.includes("料金") || text.includes("いくら") || text.includes("初期費用") || text.includes("手数料") || text.includes("敷金") || text.includes("礼金")) return "cost";
    if (text.includes("学区") || text.includes("学校") || text.includes("小学校") || text.includes("中学校") || text.includes("子育て") || text.includes("保育園")) return "school";
    if (text.includes("ペット") || text.includes("犬") || text.includes("猫") || text.includes("いぬ") || text.includes("ねこ") || text.includes("飼いたい")) return "pet";
    if (text.includes("相続") || text.includes("税金") || text.includes("控除") || text.includes("贈与") || text.includes("名義")) return "tax";
    if (text.includes("セキュリティ") || text.includes("防犯") || text.includes("オートロック") || text.includes("2階以上") || text.includes("女性")) return "security";
    if (text.includes("売りたい") || text.includes("売却") || text.includes("査定")) return "sell";
    if (text.includes("買いたい") || text.includes("購入")) return "buy";
    if (text.includes("貸したい") || text.includes("オーナー") || text.includes("管理")) return "owner";
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

    // 初期状態からの通常自由入力
    if (!isFromButton && chatState.step === 0) {
        chatState.data["自由相談"] = text;
        return {
            text: `「${text}」ですね！承知いたしました。\nより詳しいご提案のため、差し支えなければご相談のカテゴリをお選びいただけますでしょうか？`,
            options: initialOptions
        };
    }

    // 通常の会話途中の補足テキスト
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

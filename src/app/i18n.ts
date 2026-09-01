export type Lang = "en" | "ja" | "fr" | "zh";

export const LANG_LABELS: Record<Lang, string> = {
  en: "EN",
  ja: "日本語",
  fr: "FR",
  zh: "中文",
};

// Rotating hero slogans, one list per language.
export const SLOGANS: Record<Lang, string[]> = {
  ja: [
    "ひと口で、食卓がビストロに変わる。",
    "このひと匙で、今日のごちそうが完結する。",
    "ワインを開けずにはいられない、大人の贅沢。",
    "弾ける粒感、あふれる旨味。もう一口が止まらない。",
    "オリーブとアンチョビが奏でる、地中海の濃厚な誘惑。",
    "いつものお肉が、記憶に残る一皿へ。",
    "爽やかな刺激が、肉の甘みを覚醒させる。",
    "パンに塗るだけ。極上のアペリティフが3秒で完成。",
    "本場の風味が駆け抜ける、芳醇な一滴。",
    "今夜のメインディッシュ、主役はこのソースです。",
    "今日のご飯、迷ったらこれ。かけるだけで白米が止まらない最強の相棒。",
  ],
  en: [
    "A single bite turns your table into a bistro.",
    "One spoonful, and today's feast is complete.",
    "A grown-up luxury that demands a glass of wine.",
    "Bursting texture, overflowing flavor. You won't stop at one bite.",
    "The rich Mediterranean temptation of olives and anchovies.",
    "Turn your usual cut of meat into an unforgettable plate.",
    "A refreshing zest that awakens the sweetness of meat.",
    "Just spread it on bread. An exquisite aperitif in three seconds.",
    "One mellow drop where authentic flavor surges through.",
    "Tonight's main dish — the star of the show is this sauce.",
    "Undecided on dinner? Spoon it over rice and you won't stop.",
  ],
  fr: [
    "Une seule bouchée transforme votre table en bistrot.",
    "Une cuillerée, et le festin du jour est complet.",
    "Un luxe d'adulte qui exige un verre de vin.",
    "Des grains qui éclatent, une saveur débordante. Impossible de s'arrêter.",
    "La tentation méditerranéenne des olives et des anchois.",
    "Votre viande habituelle devient une assiette mémorable.",
    "Un zeste vif qui réveille la douceur de la viande.",
    "Étalez-la sur du pain. Un apéritif exquis en trois secondes.",
    "Une goutte ample où passe la saveur authentique.",
    "Le plat principal de ce soir : la vedette, c'est cette sauce.",
    "Hésitant pour le dîner ? Sur du riz, on ne s'arrête plus.",
  ],
  zh: [
    "一口之间，餐桌变成小酒馆。",
    "只需一勺，今日的盛宴就完整了。",
    "让人忍不住开瓶红酒的成熟奢侈。",
    "颗粒在口中爆开，鲜味满溢，一口接一口。",
    "橄榄与银鱼合奏出的地中海浓郁诱惑。",
    "寻常的一块肉，变成记忆里的一道菜。",
    "清爽的刺激，唤醒肉的甘甜。",
    "只需涂在面包上，三秒完成极致开胃小点。",
    "道地风味奔涌而过的醇厚一滴。",
    "今晚的主菜，主角就是这瓶酱。",
    "今天吃什么？浇上一勺，白饭停不下来。",
  ],
};

// Cycling tasting-note phrases shown in the hero panel (Japanese in every locale, per the design).
export const PHRASES: { mustard: string[]; tapenade: string[] } = {
  mustard: [
    "ピリッとした辛味",
    "爽やかな酸味",
    "鼻に抜ける爽快な香り",
    "肉の旨味を引き立てる",
    "コクとキレをプラス",
    "素材の味を邪魔しない名脇役",
    "粒マスタードのプチプチ食感",
    "フランス産（ディジョン）マスタード使用",
    "自家製ハニーマスタード",
    "隠し味の蜂蜜が織りなす甘辛さ",
    "ローストビーフに絶妙に合う",
    "ソーセージの美味しさを最大限に引き出す",
    "フライの油っこさをさっぱりリセット",
  ],
  tapenade: [
    "南仏プロヴァンスの伝統の味",
    "地中海の風を感じる",
    "本場仕込みの豊かな香り",
    "黒オリーブの凝縮された旨味",
    "アンチョビとケッパーの奥深い塩気",
    "贅沢にオリーブオイルをまとった",
    "ワインが進む大人な味わい",
    "濃厚で芳醇なコク",
    "奥深いハーモニー",
    "バゲットに塗るだけで極上の前菜",
    "白身魚や鶏肉のグリルに添えて",
    "パスタの隠し味やアクセントに",
  ],
};

export interface Translations {
  nav: {
    ingredients: string;
    process: string;
    recipes: string;
    faq: string;
    theme: string;
    order: string;
  };
  hero: {
    eyebrow: string;
    headline: [string, string];
    body: string;
    from: string;
    price: string;
    priceNote: string;
    cta: string;
    learnMore: string;
  };
  ingredients: {
    sectionLabel: string;
    heading: [string, string];
    photoCaption: string;
    items: Array<{ n: string; name: string; kanji: string; detail: string; desc: string }>;
  };
  process: {
    sectionLabel: string;
    heading: [string, string];
    badge: string;
    caption: string;
    steps: Array<{ n: string; title: string; desc: string }>;
  };
  recipes: {
    sectionLabel: string;
    heading: [string, string];
    footerNote: string;
    cards: Array<{ tag: string; title: string; tile?: string; time: string; diff: string; desc: string }>;
  };
  faq: {
    sectionLabel: string;
    heading: [string, string];
    items: Array<{ q: string; a: string }>;
  };
  lineup: {
    sectionLabel: string;
    heading: [string, string];
    footerNote: string;
    cta: string;
    items: Array<{ jp: string; name: string; tag: string; size: string; price: string; desc: string; slotHint: string }>;
  };
  // The two-sauce framing used by the lineup section as rendered.
  twoJar: { h1: string; h2: string; note: string; shipping: string };
  buyStrip: {
    label: string;
    heading: [string, string];
    price: string;
    priceNote: string;
    cta: string;
  };
  footer: {
    tagline: string;
    japaneseText: string;
    navigate: string;
    contact: string;
    email: string;
    address: [string, string, string];
    copyright: string;
    links: [string, string, string];
  };
}

const en: Translations = {
  nav: { ingredients: "Ingredients", process: "Process", recipes: "Recipes", faq: "FAQ", theme: "Theme", order: "Order Now" },
  hero: {
    eyebrow: "マスタードソース ・ タブナードソース",
    headline: ["A jar of", "slow sunshine."],
    body: "Handcrafted in the foothills of Ehime, Japan. Just lemons, sea salt, and six months of patience — bottled for your table.",
    from: "FROM",
    price: "¥2,400",
    priceNote: "~$16 USD · shipping included",
    cta: "Add to Cart",
    learnMore: "Learn more ↓",
  },
  ingredients: {
    sectionLabel: "What's Inside",
    heading: ["Three ingredients.", "One transformation."],
    photoCaption: "EHIME PREFECTURE · 愛媛県",
    items: [
      { n: "01", name: "Eureka Lemons", kanji: "エウレカレモン", detail: "Ehime Pref.", desc: "Grown in Ehime Prefecture — Japan's lemon heartland. Thick-skinned, intensely aromatic, harvested at peak ripeness each autumn." },
      { n: "02", name: "Sea Salt", kanji: "天然塩", detail: "Seto Inland Sea", desc: "Coarse unrefined salt harvested from the Seto Inland Sea. Rich in trace minerals, it draws out moisture and begins the long cure." },
      { n: "03", name: "Time", kanji: "時間", detail: "6 months", desc: "Six months of slow fermentation at cool room temperature. Nothing added, nothing rushed. The lemon transforms itself." },
      { n: "04", name: "Nothing Else", kanji: "それだけ", detail: "3 ingredients", desc: "No preservatives, no added acids, no shortcuts. The process is ancient. The result is extraordinary." },
    ],
  },
  process: {
    sectionLabel: "How It's Made",
    heading: ["Made the way", "it has always been."],
    badge: "小さな工房 · OPEN-AIR ATELIER",
    caption: "KIMIE · EHIME, JAPAN",
    steps: [
      { n: "Ⅰ", title: "Harvest", desc: "Lemons are hand-picked in late autumn when the skins are thick and the essential oils are most fragrant." },
      { n: "Ⅱ", title: "Score", desc: "Each lemon is scored lengthways and packed generously with sea salt, drawing out moisture and starting the cure." },
      { n: "Ⅲ", title: "Pack", desc: "Salted lemons are packed tightly into sterilised glass jars and gently pressed under their own brine." },
      { n: "Ⅳ", title: "Wait", desc: "The jars rest for six months in a cool, dark space. Over time the lemons soften, mellow, and deepen." },
      { n: "Ⅴ", title: "Ship", desc: "Once ready, each jar is hand-labelled and carefully packed for its journey to your kitchen." },
    ],
  },
  recipes: {
    sectionLabel: "Ways to Use It",
    heading: ["One jar,", "a hundred meals."],
    footerNote: "Also excellent in: grain bowls · hummus · roasted fish · bloody marys · vinaigrettes · compound butter · marinades",
    cards: [
      { tag: "Vegan", title: "Colourful Vegetable Salad, Whole-Grain Mustard", tile: "Vegetable Salad", time: "about 15 min", diff: "Easy", desc: "Crisp seasonal vegetables meet the gentle acidity and aroma of whole-grain mustard in a bright, colourful salad. Light and refreshing — good as a starter or on any weeknight table." },
      { tag: "Bread", title: "Tapenade Toast", time: "10 min", diff: "Very Easy", desc: "Spoon the tapenade onto warm sourdough with good olive oil. Add tomato or soft cheese if you like." },
      { tag: "Everyday", title: "Mustard Vinaigrette", time: "5 min", diff: "Very Easy", desc: "Whisk one spoon of mustard sauce with olive oil and a touch of honey — a dressing for any salad or roasted vegetable." },
    ],
  },
  faq: {
    sectionLabel: "Questions",
    heading: ["Things you", "might wonder."],
    items: [
      { q: "How long does it keep once opened?", a: "Kept in the refrigerator and submerged in brine, preserved lemons last up to 12 months after opening. The salt is a natural preservative — they are very forgiving." },
      { q: "Do I use the rind, the flesh, or both?", a: "Most recipes use the rind only — rinse it, scrape away the inner pith, and use the soft, intensely flavoured outer skin. The flesh can be added to stews, but the rind is where the magic lives." },
      { q: "Is this suitable for vegans?", a: "Yes. The only ingredients are organic lemons, sea salt, and time. Nothing else — no additives, no preservatives." },
      { q: "How does international shipping work?", a: "We ship from Ehime, Japan via EMS (Japan Post Express). Delivery to the US, EU, UK, and Australia typically takes 5–10 business days. Shipping is included in the jar price." },
      { q: "Can I return or exchange?", a: "Because this is a food product, we cannot accept returns. If your jar arrives damaged, photograph it and contact us within 48 hours — we will send a replacement immediately." },
      { q: "What size is the jar?", a: "Each jar is 350g (approximately 2–3 whole lemons, halved or quartered). This is enough for 8–12 generous recipe portions." },
    ],
  },
  lineup: {
    sectionLabel: "The Jars",
    heading: ["Three jars,", "one small atelier."],
    footerNote: "Each sauce is built on the same preserved lemon — bought together, they ship in one box.",
    cta: "Add to Cart",
    items: [
      { jp: "保存レモン", name: "Preserved Lemon", tag: "Signature", size: "350g", price: "¥2,400", desc: "Eureka lemons, sea salt, six months of patience. The original jar.", slotHint: "Drop the preserved lemon jar photo" },
      { jp: "つぶつぶマスタードソース", name: "Whole-Grain Mustard Sauce", tag: "New", size: "200g", price: "¥1,900", desc: "Cracked mustard seeds, cider vinegar and sea salt. For grilled fish, root vegetables, cold roast pork.", slotHint: "Drop the mustard sauce jar photo" },
      { jp: "タブナードソース", name: "Tapenade Sauce", tag: "New", size: "200g", price: "¥2,100", desc: "Black olives, capers and olive oil, pounded coarsely by hand. Spoon onto bread, lamb, or steamed greens.", slotHint: "Drop the tapenade sauce jar photo" },
    ],
  },
  twoJar: { h1: "Two jars,", h2: "one small atelier.", note: "Both sauces start from the same six-month preserved lemon — ordered together, they ship in one box.", shipping: "shipping included" },
  buyStrip: { label: "READY WHEN YOU ARE", heading: ["Six months of patience,", "delivered to your door."], price: "¥2,400", priceNote: "~$16 USD · incl. shipping", cta: "Order Now" },
  footer: {
    tagline: "Handcrafted preserved lemons from Ehime Prefecture, Japan. Made in small batches, shipped with care.",
    japaneseText: "愛媛県産・手作り保存レモン",
    navigate: "NAVIGATE",
    contact: "CONTACT",
    email: "hello@yuzumono.jp",
    address: ["〒792-0000", "愛媛県新居浜市山根町", "Niihama-shi, Ehime, Japan"],
    copyright: "© 2025 YuzuMono. All rights reserved.",
    links: ["Privacy Policy", "Shipping Info", "Instagram"],
  },
};

const ja: Translations = {
  nav: { ingredients: "原材料", process: "製造工程", recipes: "レシピ", faq: "よくある質問", theme: "テーマ", order: "今すぐ注文" },
  hero: {
    eyebrow: "マスタードソース ・ タブナードソース",
    headline: ["太陽の光を", "瓶に詰めました。"],
    body: "愛媛の山麓で手作りされた保存レモン。レモン、海塩、そして6ヶ月の時間だけ。あなたの食卓へ。",
    from: "価格",
    price: "¥2,400",
    priceNote: "送料込み",
    cta: "カートに入れる",
    learnMore: "詳しく見る ↓",
  },
  ingredients: {
    sectionLabel: "原材料",
    heading: ["たった3つの素材。", "ひとつの変容。"],
    photoCaption: "愛媛県産",
    items: [
      { n: "01", name: "ユーレカレモン", kanji: "エウレカレモン", detail: "愛媛県産", desc: "日本のレモン産地の中心、愛媛県で育てられた国産レモン。厚い皮と豊かな香りが特徴で、毎年秋に最も熟したタイミングで手摘みされます。" },
      { n: "02", name: "天然塩", kanji: "天然塩", detail: "瀬戸内海産", desc: "瀬戸内海で採取された粗めの未精製塩。豊富なミネラルを含み、水分を引き出して長期保存を始めます。" },
      { n: "03", name: "時間", kanji: "時間", detail: "6ヶ月", desc: "室温の涼しい場所で6ヶ月間、ゆっくりと発酵させます。何も加えず、急かさず。レモン自らが変容します。" },
      { n: "04", name: "それだけ", kanji: "それだけ", detail: "3つの素材", desc: "防腐剤なし、添加酸なし、近道なし。製法は古来からのもの。結果は格別です。" },
    ],
  },
  process: {
    sectionLabel: "製造工程",
    heading: ["昔ながらの", "作り方で。"],
    badge: "小さな工房 · 野外アトリエ",
    caption: "キミエ · 愛媛県，日本",
    steps: [
      { n: "Ⅰ", title: "収穫", desc: "秋遅く、皮が厚くなり精油が最も香り高い時期にレモンを手摘みします。" },
      { n: "Ⅱ", title: "切れ込み", desc: "各レモンに縦に切れ込みを入れ、たっぷりの塩で包みます。水分が引き出され、保存が始まります。" },
      { n: "Ⅲ", title: "詰める", desc: "塩漬けにしたレモンを滅菌ガラス瓶に隙間なく詰め、自分の塩水の重みで押さえます。" },
      { n: "Ⅳ", title: "待つ", desc: "瓶を涼しく暗い場所で6ヶ月間熟成させます。時間をかけてレモンは柔らかくなり、深い風味が生まれます。" },
      { n: "Ⅴ", title: "発送", desc: "熟成が完了したら、一本一本手書きのラベルを貼り、丁寧に梱包してお届けします。" },
    ],
  },
  recipes: {
    sectionLabel: "使い方",
    heading: ["一瓶で", "百通りの料理。"],
    footerNote: "他にも：穀物ボウル・フムス・焼き魚・ドレッシング・マリネ・複合バター",
    cards: [
      { tag: "ヴィーガン", title: "彩り野菜のサラダ ～粒マスタードソース～", tile: "野菜サラダ", time: "約15分", diff: "簡単", desc: "シャキシャキの野菜に、粒マスタードのほどよい酸味と香りを合わせた、彩り豊かなサラダです。さっぱりとした味わいで、前菜にも普段の食卓にもおすすめです。" },
      { tag: "パスタ", title: "きのこと粒マスタードソースのパスタ", tile: "パスタ", time: "約20分", diff: "簡単", desc: "粒マスタードのほどよい酸味とプチプチとした食感に、きのこの旨みを合わせた香り豊かなパスタです。シンプルな材料で手軽に作れます。" },
      { tag: "料理", title: "じゃがいもの粒マスタード和え", tile: "じゃがいも", time: "約20分", diff: "簡単", desc: "ほくほくのじゃがいもに、粒マスタードの爽やかな酸味とプチプチした食感を合わせたシンプルな一品です。温かいままでも、冷ましてサラダ感覚でもおいしくいただけます。" },
    ],
  },
  faq: {
    sectionLabel: "よくある質問",
    heading: ["気になること、", "お答えします。"],
    items: [
      { q: "開封後、どのくらい保存できますか？", a: "冷蔵庫でブラインに浸けた状態で保存すると、開封後12ヶ月まで保存できます。塩は天然の防腐剤として機能します。" },
      { q: "皮を使いますか？果肉も使いますか？", a: "多くのレシピでは皮のみを使用します。洗って内側の白い部分を取り除き、柔らかく風味豊かな外皮を使います。果肉はシチューなどに加えることもできます。" },
      { q: "ヴィーガン対応ですか？", a: "はい。原材料はオーガニックレモン、海塩、時間のみです。添加物・防腐剤は一切使用していません。" },
      { q: "国際配送はどのように行われますか？", a: "愛媛県からEMS（国際スピード郵便）で発送します。米国・EU・英国・オーストラリアへは通常5〜10営業日でお届けします。送料は商品価格に含まれます。" },
      { q: "返品・交換はできますか？", a: "食品のため返品はお受けできませんが、破損した状態で届いた場合は48時間以内にご連絡ください。すぐに代替品をお送りします。" },
      { q: "瓶のサイズは？", a: "1瓶350g（レモン約2〜3個分）です。8〜12回分のレシピに十分な量です。" },
    ],
  },
  lineup: {
    sectionLabel: "商品一覧",
    heading: ["三つの瓶、", "ひとつの小さな工房。"],
    footerNote: "どのソースも同じ保存レモンから。まとめてご注文いただくと一箱で発送します。",
    cta: "カートに入れる",
    items: [
      { jp: "保存レモン", name: "保存レモン", tag: "定番", size: "350g", price: "¥2,400", desc: "ユーレカレモン、海塩、六ヶ月の時間。すべての原点となる一瓶です。", slotHint: "保存レモンの瓶の写真をドロップ" },
      { jp: "つぶつぶマスタードソース", name: "つぶつぶマスタードソース", tag: "新商品", size: "200g", price: "¥1,900", desc: "粒マスタードを林檎酢と海塩でじっくり漬け込みました。焼き魚、根菜、冷やした豚肉に。", slotHint: "マスタードソースの瓶の写真をドロップ" },
      { jp: "タブナードソース", name: "タブナードソース", tag: "新商品", size: "200g", price: "¥2,100", desc: "黒オリーブ、ケイパー、オリーブオイルを手で粗く叩いて。パン、羊肉、温野菜に。", slotHint: "タブナードソースの瓶の写真をドロップ" },
    ],
  },
  twoJar: { h1: "二つの瓶、", h2: "ひとつの小さな工房。", note: "どちらのソースも六ヶ月の保存レモンから。まとめてご注文いただくと一箱で発送します。", shipping: "送料込み" },
  buyStrip: { label: "ご準備ができましたら", heading: ["6ヶ月の忍耐を、", "あなたの食卓へ。"], price: "¥2,400", priceNote: "送料込み", cta: "今すぐ注文" },
  footer: {
    tagline: "愛媛県産の手作り保存レモン。少量生産で、心を込めてお届けします。",
    japaneseText: "愛媛県産・手作り保存レモン",
    navigate: "メニュー",
    contact: "お問い合わせ",
    email: "hello@yuzumono.jp",
    address: ["〒792-0000", "愛媛県新居浜市山根町", "Niihama-shi, Ehime, Japan"],
    copyright: "© 2025 YuzuMono. All rights reserved.",
    links: ["プライバシーポリシー", "配送情報", "Instagram"],
  },
};

const fr: Translations = {
  nav: { ingredients: "Ingrédients", process: "Fabrication", recipes: "Recettes", faq: "FAQ", theme: "Thème", order: "Commander" },
  hero: {
    eyebrow: "マスタードソース ・ タブナードソース",
    headline: ["Un bocal de", "soleil lent."],
    body: "Fabriqué à la main dans les contreforts d'Ehime, au Japon. Juste des citrons, du sel de mer et six mois de patience — mis en bocal pour votre table.",
    from: "À PARTIR DE",
    price: "¥2,400",
    priceNote: "~16 € · livraison incluse",
    cta: "Ajouter au panier",
    learnMore: "En savoir plus ↓",
  },
  ingredients: {
    sectionLabel: "Ce qu'il y a dedans",
    heading: ["Trois ingrédients.", "Une transformation."],
    photoCaption: "PRÉFECTURE D'EHIME · 愛媛県",
    items: [
      { n: "01", name: "Citrons Eureka", kanji: "エウレカレモン", detail: "Préf. d'Ehime", desc: "Cultivés dans la préfecture d'Ehime — le cœur de la production de citrons au Japon. À peau épaisse, intensément aromatiques, récoltés à maturité parfaite chaque automne." },
      { n: "02", name: "Sel de mer", kanji: "天然塩", detail: "Mer de Seto", desc: "Sel de mer brut récolté dans la mer intérieure de Seto. Riche en oligo-éléments, il extrait l'humidité et commence la longue salaison." },
      { n: "03", name: "Le temps", kanji: "時間", detail: "6 mois", desc: "Six mois de fermentation lente à température fraîche. Rien n'est ajouté, rien n'est précipité. Le citron se transforme lui-même." },
      { n: "04", name: "Rien d'autre", kanji: "それだけ", detail: "3 ingrédients", desc: "Pas de conservateurs, pas d'acidifiants ajoutés, pas de raccourcis. Le procédé est ancestral. Le résultat est extraordinaire." },
    ],
  },
  process: {
    sectionLabel: "Comment c'est fait",
    heading: ["Fait comme", "il l'a toujours été."],
    badge: "小さな工房 · PETIT ATELIER",
    caption: "KIMIE · EHIME, JAPON",
    steps: [
      { n: "Ⅰ", title: "Récolte", desc: "Les citrons sont cueillis à la main en fin d'automne, quand les peaux sont épaisses et les huiles essentielles les plus parfumées." },
      { n: "Ⅱ", title: "Incision", desc: "Chaque citron est incisé dans la longueur et généreusement enrobé de sel de mer, qui extrait l'humidité et déclenche la salaison." },
      { n: "Ⅲ", title: "Mise en bocal", desc: "Les citrons salés sont tassés dans des bocaux stérilisés et doucement pressés sous leur propre saumure." },
      { n: "Ⅳ", title: "Attente", desc: "Les bocaux reposent six mois dans un endroit frais et sombre. Au fil du temps les citrons s'attendrissent, s'adoucissent et s'approfondissent." },
      { n: "Ⅴ", title: "Expédition", desc: "Une fois prêts, chaque bocal est étiqueté à la main et soigneusement emballé pour son voyage jusqu'à votre cuisine." },
    ],
  },
  recipes: {
    sectionLabel: "Comment les utiliser",
    heading: ["Un bocal,", "cent repas."],
    footerNote: "Excellent aussi dans : bowls · houmous · poisson rôti · cocktails · vinaigrettes · beurre composé · marinades",
    cards: [
      { tag: "Végan", title: "Salade de Légumes Colorés, Moutarde à l'Ancienne", tile: "Salade de Légumes", time: "environ 15 min", diff: "Facile", desc: "Des légumes de saison bien croquants rencontrent l'acidité douce et le parfum de la moutarde à l'ancienne. Une salade colorée et légère, parfaite en entrée comme au quotidien." },
      { tag: "Pain", title: "Tartine de Tapenade", time: "10 min", diff: "Très facile", desc: "Déposez la tapenade sur un pain au levain tiède avec une bonne huile d'olive. Tomate ou fromage frais si vous voulez." },
      { tag: "Quotidien", title: "Vinaigrette à la Moutarde", time: "5 min", diff: "Très facile", desc: "Fouettez une cuillère de sauce moutarde avec de l'huile d'olive et un peu de miel — pour toute salade ou légume rôti." },
    ],
  },
  faq: {
    sectionLabel: "Questions",
    heading: ["Ce que vous", "vous demandez peut-être."],
    items: [
      { q: "Combien de temps se conservent-ils une fois ouverts ?", a: "Conservés au réfrigérateur et immergés dans la saumure, les citrons confits se gardent jusqu'à 12 mois après ouverture. Le sel est un conservateur naturel — ils sont très résistants." },
      { q: "Utilise-t-on la peau, la chair ou les deux ?", a: "La plupart des recettes n'utilisent que la peau — rincez-la, grattez la partie blanche intérieure et utilisez l'écorce externe douce et parfumée. La chair peut être ajoutée aux ragoûts." },
      { q: "Est-ce adapté aux végétaliens ?", a: "Oui. Les seuls ingrédients sont des citrons biologiques, du sel de mer et le temps. Rien d'autre — ni additifs, ni conservateurs." },
      { q: "Comment fonctionne la livraison internationale ?", a: "Nous expédions depuis Ehime, Japon par EMS (Japan Post Express). La livraison vers les États-Unis, l'UE, le Royaume-Uni et l'Australie prend généralement 5 à 10 jours ouvrables. La livraison est incluse." },
      { q: "Puis-je retourner ou échanger ?", a: "Étant un produit alimentaire, nous n'acceptons pas les retours. Si votre bocal arrive endommagé, photographiez-le et contactez-nous dans les 48 heures — nous enverrons immédiatement un remplacement." },
      { q: "Quelle est la taille du bocal ?", a: "Chaque bocal contient 350 g (environ 2 à 3 citrons entiers coupés). C'est suffisant pour 8 à 12 portions généreuses." },
    ],
  },
  lineup: {
    sectionLabel: "Les Bocaux",
    heading: ["Trois bocaux,", "un petit atelier."],
    footerNote: "Chaque sauce part du même citron confit — commandés ensemble, ils voyagent dans un seul colis.",
    cta: "Ajouter au panier",
    items: [
      { jp: "保存レモン", name: "Citron Confit", tag: "Signature", size: "350g", price: "¥2,400", desc: "Citrons Eureka, sel de mer, six mois de patience. Le bocal d'origine.", slotHint: "Déposez la photo du bocal de citron confit" },
      { jp: "つぶつぶマスタードソース", name: "Sauce Moutarde à l'Ancienne", tag: "Nouveau", size: "200g", price: "¥1,900", desc: "Graines de moutarde concassées macérées dans la saumure de citron confit. Pour le poisson grillé et les légumes racines.", slotHint: "Déposez la photo du bocal de sauce moutarde" },
      { jp: "タブナードソース", name: "Sauce Tapenade", tag: "Nouveau", size: "200g", price: "¥2,100", desc: "Olives noires, câpres et zeste de citron confit, pilés grossièrement à la main. Sur du pain, de l'agneau, des légumes vapeur.", slotHint: "Déposez la photo du bocal de tapenade" },
    ],
  },
  twoJar: { h1: "Deux bocaux,", h2: "un petit atelier.", note: "Les deux sauces partent du même citron confit de six mois — commandées ensemble, elles voyagent dans un seul colis.", shipping: "livraison incluse" },
  buyStrip: { label: "PRÊT QUAND VOUS L'ÊTES", heading: ["Six mois de patience,", "livré à votre porte."], price: "¥2,400", priceNote: "~16 € · livraison incluse", cta: "Commander" },
  footer: {
    tagline: "Citrons confits artisanaux de la préfecture d'Ehime, Japon. Fabriqués en petites quantités, expédiés avec soin.",
    japaneseText: "愛媛県産・手作り保存レモン",
    navigate: "NAVIGATION",
    contact: "CONTACT",
    email: "hello@yuzumono.jp",
    address: ["〒792-0000", "愛媛県新居浜市山根町", "Niihama-shi, Ehime, Japon"],
    copyright: "© 2025 YuzuMono. Tous droits réservés.",
    links: ["Confidentialité", "Livraison", "Instagram"],
  },
};

const zh: Translations = {
  nav: { ingredients: "原料", process: "制作工艺", recipes: "食谱", faq: "常见问题", theme: "主题", order: "立即订购" },
  hero: {
    eyebrow: "マスタードソース ・ タブナードソース",
    headline: ["一罐", "慢慢沉淀的阳光。"],
    body: "在日本爱媛的山麓手工制作。仅用柠檬、海盐和六个月的耐心——为您的餐桌而瓶装。",
    from: "起售价",
    price: "¥2,400",
    priceNote: "约¥115人民币 · 含运费",
    cta: "加入购物车",
    learnMore: "了解更多 ↓",
  },
  ingredients: {
    sectionLabel: "内含成分",
    heading: ["三种原料。", "一次蜕变。"],
    photoCaption: "爱媛县产 · 愛媛県",
    items: [
      { n: "01", name: "尤里卡柠檬", kanji: "エウレカレモン", detail: "爱媛县产", desc: "产自日本柠檬之乡爱媛县。皮厚、香气浓郁，每年秋天在最佳成熟期手工采摘。" },
      { n: "02", name: "海盐", kanji: "天然塩", detail: "濑户内海", desc: "采自濑户内海的粗粒未精制海盐，富含矿物质，能有效析出水分，开始漫长的腌制过程。" },
      { n: "03", name: "时间", kanji: "時間", detail: "6个月", desc: "在凉爽的室温下慢慢发酵六个月。不添加任何东西，不催促。柠檬自我蜕变。" },
      { n: "04", name: "仅此而已", kanji: "それだけ", detail: "3种原料", desc: "无防腐剂，无添加酸，无捷径。工艺源远流长，成果非凡。" },
    ],
  },
  process: {
    sectionLabel: "制作工艺",
    heading: ["一如既往的", "传统制法。"],
    badge: "小さな工房 · 露天工坊",
    caption: "木江 · 爱媛县，日本",
    steps: [
      { n: "Ⅰ", title: "采摘", desc: "深秋时节，皮厚且精油最为芬芳时，手工采摘柠檬。" },
      { n: "Ⅱ", title: "切割", desc: "每颗柠檬纵向切开，慷慨地抹上海盐，析出水分，开始腌制。" },
      { n: "Ⅲ", title: "装瓶", desc: "将腌制好的柠檬紧密装入已消毒的玻璃瓶，在自身盐水重量下轻压。" },
      { n: "Ⅳ", title: "等待", desc: "玻璃瓶在阴凉处静置六个月。随着时间推移，柠檬逐渐软化、醇化、风味加深。" },
      { n: "Ⅴ", title: "发货", desc: "准备就绪后，每瓶手贴标签，精心包装，踏上前往您厨房的旅程。" },
    ],
  },
  recipes: {
    sectionLabel: "使用方法",
    heading: ["一瓶，", "百种料理。"],
    footerNote: "同样适合：谷物碗 · 鹰嘴豆泥 · 烤鱼 · 鸡尾酒 · 沙拉酱 · 复合黄油 · 腌料",
    cards: [
      { tag: "純素", title: "繽紛蔬菜沙拉 ～顆粒芥末醬～", tile: "蔬菜沙拉", time: "約15分鐘", diff: "簡單", desc: "爽脆的當季蔬菜，配上顆粒芥末恰到好處的酸度與香氣，是一道色彩豐富的沙拉。口味清爽，當前菜或日常餐桌都合適。" },
      { tag: "麵包", title: "橄欖醬烤麵包", time: "10分鐘", diff: "非常簡單", desc: "把塔布納德醬抹在溫熱的酸種麵包上，淋上好的橄欖油。也可加番茄或軟質乳酪。" },
      { tag: "日常", title: "芥末油醋醬", time: "5分鐘", diff: "非常簡單", desc: "一匙芥末醬加橄欖油與少許蜂蜜攪勻，任何沙拉或烤蔬菜都變得出色。" },
    ],
  },
  faq: {
    sectionLabel: "常见问题",
    heading: ["您可能想", "了解的事。"],
    items: [
      { q: "开封后可以保存多久？", a: "冷藏并浸泡在盐水中，保存柠檬开封后可保存长达12个月。盐是天然防腐剂——非常耐储。" },
      { q: "使用柠檬皮、果肉还是两者都用？", a: "大多数食谱只使用柠檬皮——冲洗后刮去内层白色部分，使用柔软、风味浓郁的外皮。果肉可加入炖菜中，但精华在于柠檬皮。" },
      { q: "适合素食者吗？", a: "是的。唯一的原料是有机柠檬、海盐和时间。没有其他任何东西——无添加剂，无防腐剂。" },
      { q: "国际配送如何运作？", a: "我们从日本爱媛县通过EMS（日本邮政快递）发货。发往美国、欧盟、英国和澳大利亚通常需要5-10个工作日。运费已包含在商品价格中。" },
      { q: "可以退货或换货吗？", a: "由于这是食品，我们无法接受退货。如果您的瓶子破损到货，请在48小时内拍照联系我们——我们将立即寄送替换品。" },
      { q: "瓶子有多大？", a: "每瓶350克（约2-3个整柠檬，对半切或切成四份）。足够8-12份丰盛的食谱用量。" },
    ],
  },
  lineup: {
    sectionLabel: "产品系列",
    heading: ["三个瓶子，", "一间小工坊。"],
    footerNote: "每一款酱都以同样的保存柠檬为基底——一起下单，我们会装在同一箱寄出。",
    cta: "加入购物车",
    items: [
      { jp: "保存レモン", name: "保存柠檬", tag: "经典", size: "350g", price: "¥2,400", desc: "尤里卡柠檬、海盐、六个月的时间。一切的起点。", slotHint: "拖入保存柠檬的瓶身照片" },
      { jp: "つぶつぶマスタードソース", name: "颗粒芥末酱", tag: "新品", size: "200g", price: "¥1,900", desc: "碾开的芥末籽在保存柠檬的盐水中慢慢浸渍。适合烤鱼、根菜与冷食猪肉。", slotHint: "拖入芥末酱的瓶身照片" },
      { jp: "タブナードソース", name: "橄榄酱（塔布纳德）", tag: "新品", size: "200g", price: "¥2,100", desc: "黑橄榄、刺山柑与保存柠檬皮，手工粗捣而成。抹面包、配羊肉或蒸时蔬。", slotHint: "拖入橄榄酱的瓶身照片" },
    ],
  },
  twoJar: { h1: "两个瓶子，", h2: "一间小工坊。", note: "两款酱都以同一款六个月保存柠檬为基底——一起下单，我们会装在同一箱寄出。", shipping: "含运费" },
  buyStrip: { label: "随时为您准备", heading: ["六个月的耐心，", "送达您的家门。"], price: "¥2,400", priceNote: "约¥115人民币 · 含运费", cta: "立即订购" },
  footer: {
    tagline: "来自日本爱媛县的手工保存柠檬。小批量生产，用心配送。",
    japaneseText: "愛媛県産・手作り保存レモン",
    navigate: "导航",
    contact: "联系方式",
    email: "hello@yuzumono.jp",
    address: ["〒792-0000", "愛媛県新居浜市山根町", "Niihama-shi, Ehime, Japan"],
    copyright: "© 2025 YuzuMono. 保留所有权利。",
    links: ["隐私政策", "配送信息", "Instagram"],
  },
};

export const translations: Record<Lang, Translations> = { en, ja, fr, zh };

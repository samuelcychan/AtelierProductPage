export type Lang = "en" | "ja" | "fr" | "zh" | "zh-TW";

export const LANG_LABELS: Record<Lang, string> = {
  en: "EN",
  ja: "日本語",
  fr: "FR",
  zh: "简中",
  "zh-TW": "繁中",
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
  "zh-TW": [
    "一口之間，餐桌變成小酒館。",
    "只需一匙，今日的盛宴就完整了。",
    "讓人忍不住開瓶紅酒的成熟奢侈。",
    "顆粒在口中爆開，鮮味滿溢，一口接一口。",
    "橄欖與鯷魚合奏出的地中海濃郁誘惑。",
    "尋常的一塊肉，變成記憶裡的一道菜。",
    "清爽的刺激，喚醒肉的甘甜。",
    "只需塗在麵包上，三秒完成極致開胃小點。",
    "道地風味奔湧而過的醇厚一滴。",
    "今晚的主菜，主角就是這瓶醬。",
    "今天吃什麼？澆上一匙，白飯停不下來。",
  ],
};

// Cycling tasting-note phrases shown in the hero panel.
type TastingPhrases = { mustardLabel: string; tapenadeLabel: string; mustard: string[]; tapenade: string[] };

export const PHRASES: Record<Lang, TastingPhrases> = {
  ja: {
    mustardLabel: "マスタードソース",
    tapenadeLabel: "タブナードソース",
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
  },
  en: {
    mustardLabel: "MUSTARD SAUCE",
    tapenadeLabel: "TAPENADE SAUCE",
    mustard: ["A bright peppery heat", "A fresh, clean acidity", "A crisp aroma that rises through the nose", "Brings out the savoriness of meat", "Adds depth and a clean finish", "A supporting flavor that lets ingredients shine", "A lively pop from whole mustard seeds", "Made with French Dijon mustard", "House-made honey mustard", "A sweet-spicy balance from a touch of honey", "A perfect match for roast beef", "Makes every sausage taste even better", "Cuts through the richness of fried food"],
    tapenade: ["A traditional flavor from Provence", "A breath of the Mediterranean", "A rich aroma inspired by the South of France", "The concentrated savoriness of black olives", "Deep salinity from anchovies and capers", "Generously coated in olive oil", "A grown-up flavor made for wine", "Rich, rounded depth", "A layered harmony of flavors", "An exceptional appetizer simply spread on a baguette", "Lovely with grilled white fish or chicken", "A hidden flavor boost for pasta"],
  },
  fr: {
    mustardLabel: "SAUCE MOUTARDE",
    tapenadeLabel: "SAUCE TAPENADE",
    mustard: ["Un piquant vif et franc", "Une acidité fraîche", "Un parfum vivifiant qui remonte au nez", "Révèle la richesse de la viande", "Apporte du caractère et de la fraîcheur", "Un second rôle qui laisse les ingrédients s'exprimer", "Le croquant joyeux des graines de moutarde", "À base de moutarde de Dijon française", "Moutarde au miel faite maison", "Une douceur relevée grâce à une touche de miel", "Parfaite avec le rosbif", "Sublime les saucisses", "Allège la richesse des fritures"],
    tapenade: ["Une saveur traditionnelle de Provence", "Un souffle de Méditerranée", "Un parfum généreux inspiré du Sud de la France", "L'umami concentré des olives noires", "La profondeur saline des anchois et des câpres", "Enrobée généreusement d'huile d'olive", "Une saveur adulte qui appelle le vin", "Une richesse profonde et parfumée", "Une harmonie aux multiples nuances", "Sur une baguette, un hors-d'oeuvre d'exception", "Délicieuse avec du poisson blanc ou du poulet grillé", "La touche secrète des pâtes"],
  },
  zh: {
    mustardLabel: "颗粒芥末酱",
    tapenadeLabel: "橄榄酱",
    mustard: ["清爽辛香", "清新的酸味", "直达鼻腔的清新香气", "衬托肉类的鲜美", "增添醇厚与利落口感", "不抢味的最佳配角", "颗粒芥末的弹脆口感", "选用法国第戎芥末", "自制蜂蜜芥末", "一抹蜂蜜交织出的甜辣平衡", "与烤牛肉堪称绝配", "让香肠更显美味", "化解油炸食物的厚重感"],
    tapenade: ["法国普罗旺斯的传统风味", "感受地中海的微风", "地道手法带来的浓郁香气", "黑橄榄凝缩的鲜味", "凤尾鱼与刺山柑的深邃咸香", "裹满奢华橄榄油", "令人想配酒细品的成熟风味", "浓郁醇厚", "层次丰富的和谐", "抹在法棍上就是极致前菜", "搭配烤白身鱼或鸡肉", "为意面增添秘密风味"],
  },
  "zh-TW": {
    mustardLabel: "顆粒芥末醬",
    tapenadeLabel: "橄欖醬",
    mustard: ["清爽辛香", "清新的酸味", "直達鼻腔的清新香氣", "襯托肉類的鮮美", "增添醇厚與俐落口感", "不搶味的最佳配角", "顆粒芥末的彈脆口感", "選用法國第戎芥末", "自製蜂蜜芥末", "一抹蜂蜜交織出的甜辣平衡", "與烤牛肉堪稱絕配", "讓香腸更顯美味", "化解油炸食物的厚重感"],
    tapenade: ["法國普羅旺斯的傳統風味", "感受地中海的微風", "道地手法帶來的濃郁香氣", "黑橄欖凝縮的鮮味", "鯷魚與酸豆的深邃鹹香", "裹滿奢華橄欖油", "令人想配酒細品的成熟風味", "濃郁醇厚", "層次豐富的和諧", "抹在法棍上就是極致前菜", "搭配烤白肉魚或雞肉", "為義大利麵增添祕密風味"],
  },
};

export interface Translations {
  brand: [string, string];
  pageTitle: string;
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
  brand: ["The plant-based cuisine specialist,", "Kimie's jarred sauces"],
  pageTitle: "Kimie's Jarred Sauces | Plant-Based Cuisine",
  nav: { ingredients: "Ingredients", process: "Process", recipes: "Recipes", faq: "FAQ", theme: "Theme", order: "Order Now" },
  hero: {
    eyebrow: "マスタードソース ・ タブナードソース",
    headline: ["A jar of", "slow sunshine."],
    body: "Handcrafted in the foothills of Ehime, Japan. Just lemons, sea salt, and six months of patience — bottled for your table.",
    from: "FROM",
    price: "¥2,400",
    priceNote: "Shipping included",
    cta: "Add to Cart",
    learnMore: "Learn more ↓",
  },
  ingredients: {
    sectionLabel: "What's Inside",
    heading: ["Natural ingredients,", "just as they are."],
    photoCaption: "MADE IN JAPAN",
    items: [
      { n: "01", name: "Mustard Sauce", kanji: "", detail: "Made in Japan", desc: "Mustard seeds, vinegar, olive oil, honey, soy sauce, salt, black pepper, and sugar." },
      { n: "02", name: "Tapenade Sauce", kanji: "", detail: "Made in Japan", desc: "Black olives, capers, garlic, anchovies, olive oil, lemon juice, black pepper, and herbs." },
    ],
  },
  process: {
    sectionLabel: "How It's Made",
    heading: ["The goodness of natural ingredients,", "in every jar."],
    badge: "KIMIE · PLANT-BASED CUISINE SPECIALIST",
    caption: "JAPAN",
    steps: [
      { n: "Ⅰ", title: "Choose the ingredients", desc: "We carefully select the mustard seeds, olives, herbs, and other ingredients used in each sauce. We respect their natural aroma and flavor, checking the condition of every ingredient as we prepare it." },
      { n: "Ⅱ", title: "Prepare the sauces", desc: "We soak the mustard seeds slowly until tender, and carefully chop the olives and aromatic ingredients for the tapenade. Each ingredient is prepared in the way that best brings out its flavor and texture." },
      { n: "Ⅲ", title: "Balance the flavors", desc: "We combine vinegar, olive oil, salt, and aromatic ingredients to preserve the character of every ingredient. Each jar is finished by carefully balancing acidity, saltiness, and aroma." },
      { n: "Ⅳ", title: "Jar the sauces", desc: "The finished sauces are carefully packed into sterilized, thoroughly dried glass jars. They are sealed with close attention to hygiene and stored at the proper temperature." },
      { n: "Ⅴ", title: "Finish each jar", desc: "We check every jar before applying each label by hand. The pop of whole-grain mustard and the rich aroma of tapenade are preserved with care for delivery." },
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
      { jp: "保存レモン", name: "Preserved Lemon", tag: "Signature", size: "350g", price: "$16", desc: "Eureka lemons, sea salt, six months of patience. The original jar.", slotHint: "Drop the preserved lemon jar photo" },
      { jp: "Whole-Grain Mustard Sauce", name: "Whole-Grain Mustard Sauce", tag: "New", size: "200g", price: "$13", desc: "Cracked mustard seeds, cider vinegar and sea salt. For grilled fish, root vegetables, cold roast pork.", slotHint: "Drop the mustard sauce jar photo" },
      { jp: "Tapenade Sauce", name: "Tapenade Sauce", tag: "New", size: "200g", price: "$14", desc: "Black olives, capers and olive oil, pounded coarsely by hand. Spoon onto bread, lamb, or steamed greens.", slotHint: "Drop the tapenade sauce jar photo" },
    ],
  },
  twoJar: { h1: "Two jars,", h2: "one small atelier.", note: "Both sauces start from the same six-month preserved lemon — ordered together, they ship in one box.", shipping: "shipping included" },
  buyStrip: { label: "READY WHEN YOU ARE", heading: ["Made with care,", "for your table."], priceNote: "Shipping included", cta: "Order Now" },
  footer: {
    tagline: "Handmade jarred preserves. Made in small batches and delivered with care.",
    japaneseText: "手作りの瓶詰めで保存。少量生産で、心を込めてお届けします。",
    navigate: "NAVIGATE",
    contact: "CONTACT",
    email: "Email",
    address: ["〒000-0000", "Japan", "Japan"],
    copyright: "© 2025 All rights reserved.",
    links: ["Privacy Policy", "Shipping Info", "Instagram"],
  },
};

const ja: Translations = {
  brand: ["植物料理家", "きみえの瓶詰め"],
  pageTitle: "植物料理家きみえの瓶詰め",
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
    heading: ["自然の素材を、", "そのままに。"],
    photoCaption: "日本国産",
    items: [
      { n: "01", name: "マスタードソース", kanji: "", detail: "日本国産", desc: "マスタードシード、酢、オリーブオイル、はちみつ、しょうゆ、塩、黒こしょう、砂糖" },
      { n: "02", name: "タプナードソース", kanji: "", detail: "日本国産", desc: "ブラックオリーブ、ケッパー、にんにく、アンチョビ、オリーブオイル、レモン汁、黒こしょう、ハーブ" },
    ],
  },
  process: {
    sectionLabel: "作り方",
    heading: ["素材本来のおいしさを","ひと瓶に"],
    badge: "植物料理家きみえ",
    caption: "日本",
    steps: [
      { n: "Ⅰ", title: "素材を選ぶ", desc: "マスタードシードやオリーブ、ハーブなど、それぞれのソースに使う素材を丁寧に選びます。素材本来の香りと味わいを大切に、一つひとつ状態を確かめながら下ごしらえします。" },
      { n: "Ⅱ", title: "仕込む", desc: "マスタードは種をじっくりと浸してやわらかくし、タプナードはオリーブや香味素材を丁寧に刻みます。それぞれの素材に合った方法で、風味と食感を引き出します。" },
      { n: "Ⅲ", title: "味を調える", desc: "酢やオリーブオイル、塩、香味素材などを合わせ、素材の個性を生かしながら味を整えます。酸味、塩味、香りのバランスを確かめ、一瓶ずつの味わいを仕上げます。" },
      { n: "Ⅳ", title: "瓶に詰める", desc: "できあがったソースを、洗浄・殺菌して十分に乾燥させたガラス瓶へ丁寧に詰めます。衛生管理に気を配りながら密封し、適切な温度で保存します。" },
      { n: "Ⅴ", title: "仕上げる", desc: "瓶詰めしたソースの状態を確認し、一本一本ラベルを貼って仕上げます。マスタードの粒の食感も、タプナードの豊かな香りも、そのおいしさを大切にしてお届けします。" },
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
  buyStrip: { label: "ご準備ができましたら", heading: ["心を込めて、", "あなたの食卓へ。"], priceNote: "送料込み", cta: "今すぐ注文" },
  footer: {
    tagline: "手作りの瓶詰めで保存。少量生産で、心を込めてお届けします。",
    japaneseText: "",
    navigate: "メニュー",
    contact: "お問い合わせ",
    email: "メール",
    address: ["〒000-0000", "日本", "Japan"],
    copyright: "© 2025 All rights reserved.",
    links: ["プライバシーポリシー", "配送情報", "Instagram"],
  },
};

const fr: Translations = {
  brand: ["La spécialiste de la cuisine végétale,", "les sauces en pot de Kimie"],
  pageTitle: "Les sauces en pot de Kimie | Cuisine végétale",
  nav: { ingredients: "Ingrédients", process: "Fabrication", recipes: "Recettes", faq: "FAQ", theme: "Thème", order: "Commander" },
  hero: {
    eyebrow: "マスタードソース ・ タブナードソース",
    headline: ["Un bocal de", "soleil lent."],
    body: "Fabriqué à la main dans les contreforts d'Ehime, au Japon. Juste des citrons, du sel de mer et six mois de patience — mis en bocal pour votre table.",
    from: "À PARTIR DE",
    price: "¥2,400",
    priceNote: "Livraison incluse",
    cta: "Ajouter au panier",
    learnMore: "En savoir plus ↓",
  },
  ingredients: {
    sectionLabel: "Ce qu'il y a dedans",
    heading: ["Des ingrédients naturels,", "tout simplement."],
    photoCaption: "FABRIQUÉ AU JAPON",
    items: [
      { n: "01", name: "Sauce Moutarde", kanji: "", detail: "Fabriqué au Japon", desc: "Graines de moutarde, vinaigre, huile d'olive, miel, sauce soja, sel, poivre noir et sucre." },
      { n: "02", name: "Sauce Tapenade", kanji: "", detail: "Fabriqué au Japon", desc: "Olives noires, câpres, ail, anchois, huile d'olive, jus de citron, poivre noir et herbes." },
    ],
  },
  process: {
    sectionLabel: "Fabrication",
    heading: ["Le goût naturel des ingrédients,", "dans chaque bocal."],
    badge: "KIMIE · CUISINIÈRE VÉGÉTALE",
    caption: "JAPON",
    steps: [
      { n: "Ⅰ", title: "Choisir les ingrédients", desc: "Nous sélectionnons avec soin les graines de moutarde, les olives, les herbes et les autres ingrédients de chaque sauce. Nous respectons leurs arômes et leurs saveurs naturelles en vérifiant chaque ingrédient lors de sa préparation." },
      { n: "Ⅱ", title: "Préparer les sauces", desc: "Les graines de moutarde sont trempées lentement jusqu'à devenir tendres, tandis que les olives et les aromates de la tapenade sont hachés avec soin. Chaque ingrédient est préparé pour révéler au mieux sa saveur et sa texture." },
      { n: "Ⅲ", title: "Équilibrer les saveurs", desc: "Nous associons vinaigre, huile d'olive, sel et aromates pour préserver le caractère de chaque ingrédient. L'acidité, le sel et le parfum sont ajustés avec soin pour chaque bocal." },
      { n: "Ⅳ", title: "Mettre en bocal", desc: "Les sauces terminées sont soigneusement conditionnées dans des bocaux en verre stérilisés et parfaitement séchés. Elles sont scellées dans le respect de l'hygiène et conservées à la bonne température." },
      { n: "Ⅴ", title: "Finaliser chaque bocal", desc: "Nous vérifions chaque bocal avant de poser chaque étiquette à la main. Le croquant de la moutarde à l'ancienne et l'arôme profond de la tapenade sont préservés avec soin." },
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
      { jp: "保存レモン", name: "Citron Confit", tag: "Signature", size: "350g", price: "15 €", desc: "Citrons Eureka, sel de mer, six mois de patience. Le bocal d'origine.", slotHint: "Déposez la photo du bocal de citron confit" },
      { jp: "Sauce Moutarde à l'Ancienne", name: "Sauce Moutarde à l'Ancienne", tag: "Nouveau", size: "200g", price: "12 €", desc: "Graines de moutarde concassées macérées dans la saumure de citron confit. Pour le poisson grillé et les légumes racines.", slotHint: "Déposez la photo du bocal de sauce moutarde" },
      { jp: "Sauce Tapenade", name: "Sauce Tapenade", tag: "Nouveau", size: "200g", price: "13 €", desc: "Olives noires, câpres et zeste de citron confit, pilés grossièrement à la main. Sur du pain, de l'agneau, des légumes vapeur.", slotHint: "Déposez la photo du bocal de tapenade" },
    ],
  },
  twoJar: { h1: "Deux bocaux,", h2: "un petit atelier.", note: "Les deux sauces partent du même citron confit de six mois — commandées ensemble, elles voyagent dans un seul colis.", shipping: "livraison incluse" },
  buyStrip: { label: "PRÊT QUAND VOUS L'ÊTES", heading: ["Fait avec soin,", "pour votre table."], priceNote: "Livraison incluse", cta: "Commander" },
  footer: {
    tagline: "Des conserves en bocal faites à la main. Produites en petites quantités et livrées avec soin.",
    japaneseText: "手作りの瓶詰めで保存。少量生産で、心を込めてお届けします。",
    navigate: "NAVIGATION",
    contact: "CONTACT",
    email: "E-mail",
    address: ["〒000-0000", "Japon", "Japon"],
    copyright: "© 2025 Tous droits réservés.",
    links: ["Confidentialité", "Livraison", "Instagram"],
  },
};

const zh: Translations = {
  brand: ["植物料理家", "Kimie的瓶装酱料"],
  pageTitle: "植物料理家Kimie的瓶装酱料",
  nav: { ingredients: "原料", process: "制作工艺", recipes: "食谱", faq: "常见问题", theme: "主题", order: "立即订购" },
  hero: {
    eyebrow: "マスタードソース ・ タブナードソース",
    headline: ["一罐", "慢慢沉淀的阳光。"],
    body: "在日本爱媛的山麓手工制作。仅用柠檬、海盐和六个月的耐心——为您的餐桌而瓶装。",
    from: "起售价",
    price: "¥2,400",
    priceNote: "含运费",
    cta: "加入购物车",
    learnMore: "了解更多 ↓",
  },
  ingredients: {
    sectionLabel: "原料",
    heading: ["天然原料，", "原本的风味。"],
    photoCaption: "日本制造",
    items: [
      { n: "01", name: "芥末酱", kanji: "", detail: "日本制造", desc: "芥末籽、醋、橄榄油、蜂蜜、酱油、盐、黑胡椒和糖。" },
      { n: "02", name: "橄榄酱", kanji: "", detail: "日本制造", desc: "黑橄榄、刺山柑、大蒜、凤尾鱼、橄榄油、柠檬汁、黑胡椒和香草。" },
    ],
  },
  process: {
    sectionLabel: "制作工艺",
    heading: ["保留食材的天然美味，", "装进每一瓶。"],
    badge: "Kimie · 植物料理家",
    caption: "日本",
    steps: [
      { n: "Ⅰ", title: "筛选原料", desc: "我们会细心挑选每款酱料所需的芥末籽、橄榄、香草等原料，尊重食材本身的香气与风味，并逐一确认它们的状态。" },
      { n: "Ⅱ", title: "制作酱料", desc: "芥末籽会慢慢浸泡至柔软，橄榄酱的橄榄和香味食材则会被细心切碎。我们采用最适合的方式，带出每种食材的风味与口感。" },
      { n: "Ⅲ", title: "调和风味", desc: "我们将醋、橄榄油、盐和香味食材结合，保留食材的个性。仔细调整酸度、咸度和香气的平衡，完成每一瓶酱料。" },
      { n: "Ⅳ", title: "装瓶入罐", desc: "成品酱会被细心装入经过清洗、消毒并完全干燥的玻璃瓶中。我们严谨把控卫生条件，密封后在适宜温度下保存。" },
      { n: "Ⅴ", title: "完成与贴签", desc: "确认每一瓶酱料的状态后，我们会逐瓶手工贴签。颗粒芥末的口感与橄榄酱的浓郁香气，都会被细心保留并送达。" },
    ],
  },
  recipes: {
    sectionLabel: "使用方法",
    heading: ["一瓶，", "百种料理。"],
    footerNote: "同样适合：谷物碗 · 鹰嘴豆泥 · 烤鱼 · 鸡尾酒 · 沙拉酱 · 复合黄油 · 腌料",
    cards: [
      { tag: "纯素", title: "缤纷蔬菜沙拉 ～颗粒芥末酱～", tile: "蔬菜沙拉", time: "约15分钟", diff: "简单", desc: "爽脆的当季蔬菜，配上颗粒芥末恰到好处的酸度与香气，是一道色彩丰富的沙拉。口味清爽，当前菜或日常餐桌都合适。" },
      { tag: "面包", title: "橄榄酱烤面包", time: "10分钟", diff: "非常简单", desc: "把塔布纳德酱抹在温热的酸种面包上，淋上优质橄榄油。也可加番茄或软质奶酪。" },
      { tag: "日常", title: "芥末油醋酱", time: "5分钟", diff: "非常简单", desc: "一勺芥末酱加橄榄油与少许蜂蜜搅匀，任何沙拉或烤蔬菜都变得出色。" },
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
      { jp: "保存レモン", name: "保存柠檬", tag: "经典", size: "350g", price: "¥115", desc: "尤里卡柠檬、海盐、六个月的时间。一切的起点。", slotHint: "拖入保存柠檬的瓶身照片" },
      { jp: "颗粒芥末酱", name: "颗粒芥末酱", tag: "新品", size: "200g", price: "¥91", desc: "碾开的芥末籽在保存柠檬的盐水中慢慢浸渍。适合烤鱼、根菜与冷食猪肉。", slotHint: "拖入芥末酱的瓶身照片" },
      { jp: "橄榄酱（塔布纳德）", name: "橄榄酱（塔布纳德）", tag: "新品", size: "200g", price: "¥101", desc: "黑橄榄、刺山柑与保存柠檬皮，手工粗捣而成。抹面包、配羊肉或蒸时蔬。", slotHint: "拖入橄榄酱的瓶身照片" },
    ],
  },
  twoJar: { h1: "两个瓶子，", h2: "一间小工坊。", note: "两款酱都以同一款六个月保存柠檬为基底——一起下单，我们会装在同一箱寄出。", shipping: "含运费" },
  buyStrip: { label: "随时为您准备", heading: ["用心制作，", "送到您的餐桌。"], priceNote: "含运费", cta: "立即订购" },
  footer: {
    tagline: "手工制作的瓶装酱料。小批量生产，用心配送。",
    japaneseText: "手作りの瓶詰めで保存。少量生産で、心を込めてお届けします。",
    navigate: "导航",
    contact: "联系方式",
    email: "电子邮件",
    address: ["〒000-0000", "日本", "Japan"],
    copyright: "© 2025 保留所有权利。",
    links: ["隐私政策", "配送信息", "Instagram"],
  },
};

const zhTw: Translations = {
  ...zh,
  brand: ["植物料理家", "Kimie 的瓶裝醬料"],
  pageTitle: "植物料理家 Kimie 的瓶裝醬料",
  nav: { ingredients: "原料", process: "製作工藝", recipes: "食譜", faq: "常見問題", theme: "主題", order: "立即訂購" },
  hero: {
    eyebrow: "マスタードソース ・ タブナードソース",
    headline: ["一罐", "慢慢沉澱的陽光。"],
    body: "在日本愛媛的山麓手工製作。僅用檸檬、海鹽和六個月的耐心，為您的餐桌而瓶裝。",
    from: "起售價", price: "¥2,400", priceNote: "含運費", cta: "加入購物車", learnMore: "了解更多 ↓",
  },
  ingredients: {
    sectionLabel: "原料", heading: ["天然原料，", "原本的風味。"], photoCaption: "日本製造",
    items: [
      { n: "01", name: "芥末醬", kanji: "", detail: "日本製造", desc: "芥末籽、醋、橄欖油、蜂蜜、醬油、鹽、黑胡椒與糖。" },
      { n: "02", name: "橄欖醬", kanji: "", detail: "日本製造", desc: "黑橄欖、酸豆、大蒜、鯷魚、橄欖油、檸檬汁、黑胡椒與香草。" },
    ],
  },
  process: {
    sectionLabel: "製作工藝", heading: ["保留食材的天然美味，", "裝進每一瓶。"], badge: "Kimie · 植物料理家", caption: "日本",
    steps: [
      { n: "Ⅰ", title: "篩選原料", desc: "我們會細心挑選每款醬料所需的芥末籽、橄欖、香草等原料，尊重食材本身的香氣與風味，並逐一確認它們的狀態。" },
      { n: "Ⅱ", title: "製作醬料", desc: "芥末籽會慢慢浸泡至柔軟，橄欖醬的橄欖和香味食材則會被細心切碎。我們採用最適合的方式，帶出每種食材的風味與口感。" },
      { n: "Ⅲ", title: "調和風味", desc: "我們將醋、橄欖油、鹽和香味食材結合，保留食材的個性。仔細調整酸度、鹹度和香氣的平衡，完成每一瓶醬料。" },
      { n: "Ⅳ", title: "裝瓶入罐", desc: "成品醬會被細心裝入經過清洗、消毒並完全乾燥的玻璃瓶中。我們嚴謹把控衛生條件，密封後在適宜溫度下保存。" },
      { n: "Ⅴ", title: "完成與貼標", desc: "確認每一瓶醬料的狀態後，我們會逐瓶手工貼標。顆粒芥末的口感與橄欖醬的濃郁香氣，都會被細心保留並送達。" },
    ],
  },
  recipes: {
    sectionLabel: "使用方法", heading: ["一瓶，", "百種料理。"], footerNote: "同樣適合：穀物碗 · 鷹嘴豆泥 · 烤魚 · 雞尾酒 · 沙拉醬 · 複合奶油 · 醃料",
    cards: [
      { tag: "純素", title: "繽紛蔬菜沙拉 ～顆粒芥末醬～", tile: "蔬菜沙拉", time: "約 15 分鐘", diff: "簡單", desc: "爽脆的當季蔬菜，配上顆粒芥末恰到好處的酸度與香氣，是一道色彩豐富的沙拉。" },
      { tag: "麵包", title: "橄欖醬烤麵包", time: "10 分鐘", diff: "非常簡單", desc: "把塔布納德醬抹在溫熱的酸種麵包上，淋上優質橄欖油。也可加番茄或軟質乳酪。" },
      { tag: "日常", title: "芥末油醋醬", time: "5 分鐘", diff: "非常簡單", desc: "一匙芥末醬加橄欖油與少許蜂蜜攪勻，任何沙拉或烤蔬菜都變得出色。" },
    ],
  },
  faq: {
    sectionLabel: "常見問題", heading: ["您可能想", "了解的事。"],
    items: [
      { q: "開封後可以保存多久？", a: "冷藏並浸泡在鹽水中，保存檸檬開封後可保存長達 12 個月。鹽是天然防腐劑。" },
      { q: "使用檸檬皮、果肉還是兩者都用？", a: "多數食譜只使用檸檬皮，沖洗後刮去內層白色部分，使用柔軟、風味濃郁的外皮。" },
      { q: "適合純素食者嗎？", a: "是的。唯一的原料是有機檸檬、海鹽和時間，沒有任何添加劑或防腐劑。" },
      { q: "國際配送如何運作？", a: "我們從日本愛媛縣透過 EMS 發貨。發往美國、歐盟、英國和澳洲通常需要 5 至 10 個工作日。" },
      { q: "可以退貨或換貨嗎？", a: "由於這是食品，我們無法接受退貨。若商品破損到貨，請在 48 小時內拍照聯絡我們。" },
      { q: "瓶子有多大？", a: "每瓶 350 克，約 2 至 3 個完整檸檬，足夠製作 8 至 12 份料理。" },
    ],
  },
  lineup: {
    sectionLabel: "產品系列", heading: ["三個瓶子，", "一間小工坊。"], footerNote: "每一款醬都以同樣的保存檸檬為基底，一起下單，我們會裝在同一箱寄出。", cta: "加入購物車",
    items: [
      { jp: "保存レモン", name: "保存檸檬", tag: "經典", size: "350g", price: "NT$500", desc: "尤里卡檸檬、海鹽、六個月的時間。一切的起點。", slotHint: "拖入保存檸檬的瓶身照片" },
      { jp: "顆粒芥末醬", name: "顆粒芥末醬", tag: "新品", size: "200g", price: "NT$400", desc: "碾開的芥末籽在保存檸檬的鹽水中慢慢浸漬。適合烤魚、根菜與冷食豬肉。", slotHint: "拖入芥末醬的瓶身照片" },
      { jp: "橄欖醬（塔布納德）", name: "橄欖醬（塔布納德）", tag: "新品", size: "200g", price: "NT$440", desc: "黑橄欖、酸豆與保存檸檬皮，手工粗搗而成。抹麵包、配羊肉或蒸時蔬。", slotHint: "拖入橄欖醬的瓶身照片" },
    ],
  },
  twoJar: { h1: "兩個瓶子，", h2: "一間小工坊。", note: "兩款醬都以同一款六個月保存檸檬為基底，一起下單，我們會裝在同一箱寄出。", shipping: "含運費" },
  buyStrip: { label: "隨時為您準備", heading: ["用心製作，", "送到您的餐桌。"], priceNote: "含運費", cta: "立即訂購" },
  footer: {
    tagline: "來自日本愛媛縣的手工保存檸檬。小批量生產，用心配送。", japaneseText: "手作りの瓶詰めで保存。少量生産で、心を込めてお届けします。", navigate: "導覽", contact: "聯絡方式", email: "hello@yuzumono.jp",
    address: ["〒792-0000", "愛媛県新居浜市山根町", "Niihama-shi, Ehime, Japan"], copyright: "© 2025 YuzuMono. 保留所有權利。", links: ["隱私權政策", "配送資訊", "Instagram"],
  },
};

export const translations: Record<Lang, Translations> = { en, ja, fr, zh, "zh-TW": zhTw };

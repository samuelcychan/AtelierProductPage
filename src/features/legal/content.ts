import type { Lang } from "@/app/i18n";

/*
 * Structured content for the /legal/* pages.
 *
 * DO NOT invent business facts here. Anything the owner, a lawyer or a tax adviser must decide is a
 * visible placeholder built with the helpers below. The draft notice on each page is shown for as long
 * as any placeholder remains in the text being displayed (see `hasPlaceholders`).
 */

// ─── Placeholders ─────────────────────────────────────────────────────────────
const todoJa = (what: string) => `【要記入：${what}】`;
const todoEn = (what: string) => `[Owner to provide: ${what}]`;
const todoFr = (what: string) => `[À compléter par le vendeur : ${what}]`;
const todoZh = (what: string) => `【待店主填写：${what}】`;
const todoTw = (what: string) => `【待店主填寫：${what}】`;
const reviewJa = (what: string) => `【要確認（専門家）：${what}】`;
const reviewEn = (what: string) => `[Pending adviser review: ${what}]`;

const PLACEHOLDER_SOURCE =
  "【(?:要記入|要確認（専門家）|待店主填写|待店主填寫)：[^】]*】" +
  "|\\[(?:Owner to provide|Pending adviser review|À compléter par le vendeur) ?:[^\\]]*\\]";

/** Splits text so that placeholders land on odd indices. */
export const PLACEHOLDER_SPLIT = new RegExp(`(${PLACEHOLDER_SOURCE})`);

/** True while any owner or adviser placeholder remains in the given content. */
export function hasPlaceholders(content: unknown): boolean {
  return new RegExp(PLACEHOLDER_SOURCE).test(JSON.stringify(content));
}

// ─── Types ────────────────────────────────────────────────────────────────────
export const LEGAL_SLUGS = ["tokushoho", "privacy", "shipping", "returns"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export function isLegalSlug(value: string): value is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(value);
}

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "fields"; rows: Array<{ label: string; value: string; link?: LegalSlug }> }
  | { kind: "link"; text: string; slug: LegalSlug };

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  title: string;
  intro?: string;
  updated: string;
  sections: LegalSection[];
}

export interface LegalPageContent {
  /** Languages the page is published in, in display order. */
  languages: Lang[];
  /** Show every language on one page, one after another, instead of one at a time. */
  stacked?: boolean;
  docs: Partial<Record<Lang, LegalDoc>>;
}

/** Page chrome (navigation, notices) in all five site languages. */
export interface LegalChrome {
  brand: string;
  home: string;
  language: string;
  draftTitle: string;
  draftBody: string;
  updated: string;
  otherPages: string;
  notFoundTitle: string;
  notFoundBody: string;
  translation: string;
  titles: Record<LegalSlug, string>;
}

export const LEGAL_CHROME: Record<Lang, LegalChrome> = {
  en: {
    brand: "Kimie's jars",
    home: "Back to home",
    language: "Language",
    draftTitle: "Draft",
    draftBody: "Details on this page are still to be completed by the business owner. Highlighted items are placeholders.",
    updated: "Last updated",
    otherPages: "Policies",
    notFoundTitle: "Page not found",
    notFoundBody: "There is no policy page at this address.",
    translation: "English translation",
    titles: {
      tokushoho: "Legal notice (Act on Specified Commercial Transactions)",
      privacy: "Privacy policy",
      shipping: "Shipping",
      returns: "Returns and refunds",
    },
  },
  ja: {
    brand: "きみえの瓶詰め",
    home: "トップページへ戻る",
    language: "言語",
    draftTitle: "下書き",
    draftBody: "このページの内容は、事業者による記入がまだ完了していません。強調表示された箇所は未記入の項目です。",
    updated: "最終更新日",
    otherPages: "ポリシー一覧",
    notFoundTitle: "ページが見つかりません",
    notFoundBody: "このアドレスにポリシーページはありません。",
    translation: "英語訳",
    titles: {
      tokushoho: "特定商取引法に基づく表記",
      privacy: "プライバシーポリシー",
      shipping: "配送について",
      returns: "返品・返金について",
    },
  },
  fr: {
    brand: "Kimie's jars",
    home: "Retour à l'accueil",
    language: "Langue",
    draftTitle: "Brouillon",
    draftBody: "Les informations de cette page doivent encore être complétées par le vendeur. Les éléments surlignés sont provisoires.",
    updated: "Dernière mise à jour",
    otherPages: "Informations",
    notFoundTitle: "Page introuvable",
    notFoundBody: "Aucune page d'information n'existe à cette adresse.",
    translation: "Traduction anglaise",
    titles: {
      tokushoho: "Mentions légales (loi sur les transactions commerciales spécifiées)",
      privacy: "Politique de confidentialité",
      shipping: "Livraison",
      returns: "Retours et remboursements",
    },
  },
  zh: {
    brand: "きみえの瓶詰め",
    home: "返回首页",
    language: "语言",
    draftTitle: "草稿",
    draftBody: "本页内容尚待店主补充，突出显示的部分为待填写项目。",
    updated: "最后更新",
    otherPages: "政策与说明",
    notFoundTitle: "找不到页面",
    notFoundBody: "此地址没有对应的说明页面。",
    translation: "英文译文",
    titles: {
      tokushoho: "《特定商业交易法》标示",
      privacy: "隐私政策",
      shipping: "配送说明",
      returns: "退货与退款",
    },
  },
  "zh-TW": {
    brand: "きみえの瓶詰め",
    home: "返回首頁",
    language: "語言",
    draftTitle: "草稿",
    draftBody: "本頁內容尚待店主補充，醒目標示的部分為待填寫項目。",
    updated: "最後更新",
    otherPages: "政策與說明",
    notFoundTitle: "找不到頁面",
    notFoundBody: "此網址沒有對應的說明頁面。",
    translation: "英文譯文",
    titles: {
      tokushoho: "《特定商業交易法》標示",
      privacy: "隱私權政策",
      shipping: "配送說明",
      returns: "退貨與退款",
    },
  },
};

// ─── 特定商取引法に基づく表記 (Japanese, English translation below) ──────────
const tokushoho: LegalPageContent = {
  languages: ["ja", "en"],
  stacked: true,
  docs: {
    ja: {
      title: "特定商取引法に基づく表記",
      updated: todoJa("最終更新日"),
      sections: [
        {
          heading: "販売事業者",
          blocks: [
            {
              kind: "fields",
              rows: [
                { label: "販売業者", value: todoJa("販売業者の正式名称（法人名または個人事業主の氏名）") },
                { label: "運営統括責任者", value: todoJa("運営統括責任者の氏名") },
                { label: "所在地", value: todoJa("所在地（番地・建物名まで）") },
                { label: "電話番号", value: todoJa("電話番号") },
                { label: "電話受付時間", value: todoJa("電話受付時間") },
                { label: "メールアドレス", value: todoJa("お問い合わせ用メールアドレス") },
                { label: "ショップ名", value: "きみえの瓶詰め" },
              ],
            },
          ],
        },
        {
          heading: "販売条件",
          blocks: [
            {
              kind: "fields",
              rows: [
                { label: "販売価格", value: "各商品ページおよびカートに表示された価格（税込）" },
                {
                  label: "商品代金以外の必要料金",
                  value: `送料：無料（日本国内）。${todoJa("送料以外にお客様にご負担いただく費用の有無と金額")}`,
                },
                { label: "お支払い方法", value: "クレジットカード、Apple Pay、Google Pay（決済は Stripe が処理します）" },
                { label: "お支払い時期", value: todoJa("代金をお支払いいただく時期") },
                { label: "商品の引渡時期", value: todoJa("ご注文から発送・お届けまでの目安"), link: "shipping" },
                { label: "発送元", value: "日本・神奈川県" },
                { label: "配送地域", value: "日本国内" },
                {
                  label: "返品・交換",
                  value: todoJa("返品・交換の条件（お客様都合の場合／破損・不良品の場合）"),
                  link: "returns",
                },
              ],
            },
          ],
        },
      ],
    },
    en: {
      title: "Legal notice under the Act on Specified Commercial Transactions",
      updated: todoEn("last updated date"),
      sections: [
        {
          heading: "Seller",
          blocks: [
            {
              kind: "fields",
              rows: [
                { label: "Seller (legal name)", value: todoEn("legal business name (company name or sole proprietor's name)") },
                { label: "Person responsible for operations", value: todoEn("name of the person responsible for operations") },
                { label: "Address", value: todoEn("full business address") },
                { label: "Phone", value: todoEn("phone number") },
                { label: "Phone hours", value: todoEn("hours when the phone is answered") },
                { label: "E-mail", value: todoEn("contact e-mail address") },
                { label: "Shop name", value: "きみえの瓶詰め (Kimie's jars)" },
              ],
            },
          ],
        },
        {
          heading: "Terms of sale",
          blocks: [
            {
              kind: "fields",
              rows: [
                { label: "Price", value: "As shown on each product page and in the cart (tax included)." },
                {
                  label: "Charges other than the price",
                  value: `Shipping: free within Japan. ${todoEn("any other charges the buyer pays, and their amounts")}`,
                },
                { label: "Payment methods", value: "Credit card, Apple Pay and Google Pay (payments processed by Stripe)." },
                { label: "Payment timing", value: todoEn("when payment is charged") },
                { label: "Delivery timing", value: todoEn("time from order to dispatch and delivery"), link: "shipping" },
                { label: "Ships from", value: "Kanagawa, Japan" },
                { label: "Shipping area", value: "Japan" },
                {
                  label: "Returns and exchanges",
                  value: todoEn("conditions for returns and exchanges (change of mind; damaged or defective items)"),
                  link: "returns",
                },
              ],
            },
          ],
        },
      ],
    },
  },
};

// ─── Privacy policy (Japanese and English) ────────────────────────────────────
const privacy: LegalPageContent = {
  languages: ["ja", "en"],
  docs: {
    ja: {
      title: "プライバシーポリシー",
      intro:
        "きみえの瓶詰め（以下「当店」）は、オンラインでのご注文に関するお客様の個人情報の取扱いについて、以下のとおりご案内します。",
      updated: todoJa("制定日・最終改定日"),
      sections: [
        {
          heading: "事業者情報",
          blocks: [
            {
              kind: "fields",
              rows: [
                { label: "事業者名", value: todoJa("事業者の正式名称") },
                { label: "代表者", value: todoJa("代表者の氏名") },
                { label: "所在地", value: todoJa("所在地") },
                { label: "お問い合わせ先", value: todoJa("個人情報に関するお問い合わせ用メールアドレス") },
              ],
            },
          ],
        },
        {
          heading: "取得する情報",
          blocks: [
            {
              kind: "list",
              items: [
                "ご注文時に Stripe の決済ページでご入力いただく氏名、メールアドレス、配送先住所、電話番号",
                "ご注文内容（商品、数量、金額、注文番号、注文日時）",
                "クレジットカード番号などのカード情報は Stripe の決済ページで入力され、当店のサーバーに送信・保存されることはありません。",
                todoJa("上記以外に取得する個人情報（お問い合わせメールの内容など）"),
              ],
            },
          ],
        },
        {
          heading: "利用目的",
          blocks: [
            {
              kind: "list",
              items: [
                "決済、ご注文の処理および商品の発送のため",
                "ご注文・配送に関するご連絡のため",
                "返品・返金への対応のため",
                todoJa("その他の利用目的（該当する場合）"),
              ],
            },
          ],
        },
        {
          heading: "利用する外部サービス",
          blocks: [
            { kind: "p", text: "当店は、本ウェブサイトの運営とご注文の処理に以下の外部サービスを利用しています。" },
            {
              kind: "list",
              items: [
                "Stripe：決済処理、注文情報・購入者情報の管理、決済完了時の領収書メールの送信",
                "Shippo（配送ラベルの作成に利用する場合のみ）：配送ラベルの作成と配送状況の追跡のため、氏名、配送先住所、電話番号、ご注文商品の情報を取り扱います",
                "Vercel：本ウェブサイトの配信と、ご注文を処理するプログラムの実行",
                "Sanity：商品情報と在庫の管理。お客様の個人情報は保存しません（出荷記録には注文番号、日時、商品、数量のみを記録します）",
              ],
            },
            { kind: "p", text: reviewJa("各サービスへの提供が個人情報保護法上の「委託」と「第三者提供」のいずれに当たるか") },
          ],
        },
        {
          heading: "外国にある第三者への提供",
          blocks: [
            {
              kind: "p",
              text: reviewJa(
                "外国にある第三者への個人データの提供について、提供先の所在国、当該国の個人情報保護制度、提供先が講ずる措置などの記載内容。本項目は専門家の確認待ちです",
              ),
            },
            { kind: "p", text: "上記の外部サービスには、日本国外の事業者が運営するものが含まれます。" },
          ],
        },
        {
          heading: "ブラウザへの情報の保存",
          blocks: [
            {
              kind: "p",
              text: "本ウェブサイトは、お使いのブラウザのローカルストレージに以下の情報を保存します。個人情報は含まれません。",
            },
            {
              kind: "list",
              items: [
                "ym-cart-v1：カートに入れた商品の識別子と数量のみ",
                "ym-story-products-v1：/story ページを速く表示するための商品情報のキャッシュ",
              ],
            },
            {
              kind: "p",
              text: "Stripe の決済ページ（checkout.stripe.com）でご入力いただいた情報は、Stripe のプライバシーポリシーに従って取り扱われます。",
            },
          ],
        },
        {
          heading: "安全管理措置",
          blocks: [{ kind: "p", text: todoJa("個人データの安全管理のために講じている措置") }],
        },
        {
          heading: "開示等のご請求",
          blocks: [
            { kind: "p", text: todoJa("保有個人データの開示・訂正・削除・利用停止等のご請求の手続きと手数料の有無") },
          ],
        },
        {
          heading: "お問い合わせ窓口",
          blocks: [
            {
              kind: "fields",
              rows: [{ label: "メールアドレス", value: todoJa("個人情報に関するお問い合わせ用メールアドレス") }],
            },
          ],
        },
      ],
    },
    en: {
      title: "Privacy policy",
      intro:
        "This policy explains how Kimie's jars (\"we\") handles personal information in connection with online orders.",
      updated: todoEn("effective date and last updated date"),
      sections: [
        {
          heading: "Who we are",
          blocks: [
            {
              kind: "fields",
              rows: [
                { label: "Business name", value: todoEn("legal business name") },
                { label: "Representative", value: todoEn("name of the representative") },
                { label: "Address", value: todoEn("business address") },
                { label: "Contact", value: todoEn("e-mail address for privacy enquiries") },
              ],
            },
          ],
        },
        {
          heading: "Information we collect",
          blocks: [
            {
              kind: "list",
              items: [
                "Your name, e-mail address, shipping address and phone number, entered on Stripe's checkout page when you place an order.",
                "Order details: products, quantities, amounts, order number and order time.",
                "Card details are entered on Stripe's checkout page and are never sent to or stored on our servers.",
                todoEn("any other personal information collected, such as the content of enquiry e-mails"),
              ],
            },
          ],
        },
        {
          heading: "How we use it",
          blocks: [
            {
              kind: "list",
              items: [
                "To take payment, process your order and ship your jars.",
                "To contact you about your order or its delivery.",
                "To handle returns and refunds.",
                todoEn("any other purposes of use, if applicable"),
              ],
            },
          ],
        },
        {
          heading: "Services we use",
          blocks: [
            { kind: "p", text: "We use the following services to run this website and to process orders:" },
            {
              kind: "list",
              items: [
                "Stripe: payment processing, storage of order and buyer details, and the payment receipt e-mail.",
                "Shippo (only if we use it to create shipping labels): your name, shipping address, phone number and the items ordered, to create labels and track parcels.",
                "Vercel: hosting of this website and running the programs that process orders.",
                "Sanity: product information and stock levels. It does not store your personal information; our shipping records there contain only the order number, time, products and quantities.",
              ],
            },
            {
              kind: "p",
              text: reviewEn(
                "whether sharing data with each service is entrustment or provision to a third party under Japan's Act on the Protection of Personal Information",
              ),
            },
          ],
        },
        {
          heading: "Transfers outside Japan",
          blocks: [
            {
              kind: "p",
              text: reviewEn(
                "provision of personal data to third parties in foreign countries: the countries concerned, their personal-information protection systems and the measures the recipients take. This section is pending review by an adviser",
              ),
            },
            { kind: "p", text: "Some of the services listed above are operated by companies outside Japan." },
          ],
        },
        {
          heading: "Browser storage",
          blocks: [
            {
              kind: "p",
              text: "This website saves the following items in your browser's local storage. They contain no personal information.",
            },
            {
              kind: "list",
              items: [
                "ym-cart-v1: the products in your cart (product identifiers and quantities only).",
                "ym-story-products-v1: a cached copy of product information so the /story page loads faster.",
              ],
            },
            {
              kind: "p",
              text: "Information you enter on Stripe's checkout page (checkout.stripe.com) is handled under Stripe's privacy policy.",
            },
          ],
        },
        {
          heading: "Security",
          blocks: [{ kind: "p", text: todoEn("security measures taken to protect personal data") }],
        },
        {
          heading: "Your requests",
          blocks: [
            {
              kind: "p",
              text: todoEn("how to request disclosure, correction, deletion or suspension of use of your personal data, and any fees"),
            },
          ],
        },
        {
          heading: "Contact",
          blocks: [{ kind: "fields", rows: [{ label: "E-mail", value: todoEn("e-mail address for privacy enquiries") }] }],
        },
      ],
    },
  },
};

// ─── Shipping (all five languages) ────────────────────────────────────────────
const shipping: LegalPageContent = {
  languages: ["ja", "en", "fr", "zh", "zh-TW"],
  docs: {
    ja: {
      title: "配送について",
      updated: todoJa("最終更新日"),
      sections: [
        { heading: "送料", blocks: [{ kind: "p", text: "日本国内へのお届けは、すべてのご注文で送料無料です。" }] },
        {
          heading: "配送地域",
          blocks: [
            { kind: "p", text: "現在、日本国内のご住所へのみお届けしています。" },
            { kind: "p", text: "商品は日本・神奈川県から発送します。" },
          ],
        },
        {
          heading: "発送までの日数",
          blocks: [
            { kind: "p", text: todoJa("お支払い完了から発送までの日数") },
            { kind: "p", text: todoJa("発送を行わない日（定休日・祝日・長期休業など）") },
          ],
        },
        {
          heading: "お届けについて",
          blocks: [
            { kind: "p", text: todoJa("配送業者・配送方法") },
            { kind: "p", text: todoJa("発送からお届けまでの目安") },
            { kind: "p", text: todoJa("お届け日時の指定の可否") },
          ],
        },
        {
          heading: "ご注文・発送のお知らせ",
          blocks: [
            {
              kind: "p",
              text: "お支払いが完了すると、決済時にご入力いただいたメールアドレスへ Stripe から領収書が送信されます。",
            },
            { kind: "p", text: todoJa("発送のお知らせと追跡番号をお送りする方法と時期") },
          ],
        },
        {
          heading: "お届けに問題があった場合",
          blocks: [
            { kind: "p", text: todoJa("お届けできなかった場合・荷物が返送された場合の対応") },
            { kind: "link", text: "商品が破損して届いた場合は、こちらをご覧ください：", slug: "returns" },
          ],
        },
      ],
    },
    en: {
      title: "Shipping",
      updated: todoEn("last updated date"),
      sections: [
        { heading: "Shipping fee", blocks: [{ kind: "p", text: "Shipping is free on every order delivered within Japan." }] },
        {
          heading: "Where we ship",
          blocks: [
            { kind: "p", text: "We currently ship to addresses in Japan only." },
            { kind: "p", text: "Orders are shipped from Kanagawa, Japan." },
          ],
        },
        {
          heading: "Processing time",
          blocks: [
            { kind: "p", text: todoEn("time from payment to dispatch") },
            { kind: "p", text: todoEn("days on which orders are not dispatched (weekly closing days, holidays, seasonal breaks)") },
          ],
        },
        {
          heading: "Delivery",
          blocks: [
            { kind: "p", text: todoEn("carrier and shipping method") },
            { kind: "p", text: todoEn("expected delivery time after dispatch") },
            { kind: "p", text: todoEn("whether a delivery date or time slot can be requested") },
          ],
        },
        {
          heading: "Order and shipping e-mails",
          blocks: [
            {
              kind: "p",
              text: "Once your payment is complete, Stripe e-mails a receipt to the address you entered at checkout.",
            },
            { kind: "p", text: todoEn("how and when the shipping notice and tracking number are sent") },
          ],
        },
        {
          heading: "If something goes wrong",
          blocks: [
            { kind: "p", text: todoEn("what happens if a parcel cannot be delivered or is returned to us") },
            { kind: "link", text: "If your jars arrive damaged, see:", slug: "returns" },
          ],
        },
      ],
    },
    fr: {
      title: "Livraison",
      updated: todoFr("date de dernière mise à jour"),
      sections: [
        { heading: "Frais de livraison", blocks: [{ kind: "p", text: "La livraison est gratuite pour toute commande livrée au Japon." }] },
        {
          heading: "Zones de livraison",
          blocks: [
            { kind: "p", text: "Nous livrons actuellement uniquement à des adresses situées au Japon." },
            { kind: "p", text: "Les commandes sont expédiées depuis Kanagawa, au Japon." },
          ],
        },
        {
          heading: "Délai de préparation",
          blocks: [
            { kind: "p", text: todoFr("délai entre le paiement et l'expédition") },
            { kind: "p", text: todoFr("jours sans expédition (jours de fermeture, jours fériés, congés)") },
          ],
        },
        {
          heading: "Acheminement",
          blocks: [
            { kind: "p", text: todoFr("transporteur et mode d'envoi") },
            { kind: "p", text: todoFr("délai de livraison indicatif après expédition") },
            { kind: "p", text: todoFr("possibilité de choisir une date ou un créneau de livraison") },
          ],
        },
        {
          heading: "E-mails de commande et d'expédition",
          blocks: [
            {
              kind: "p",
              text: "Une fois le paiement effectué, Stripe envoie un reçu à l'adresse e-mail saisie lors du paiement.",
            },
            { kind: "p", text: todoFr("comment et quand l'avis d'expédition et le numéro de suivi sont envoyés") },
          ],
        },
        {
          heading: "En cas de problème",
          blocks: [
            { kind: "p", text: todoFr("procédure si un colis ne peut pas être livré ou nous est retourné") },
            { kind: "link", text: "Si vos bocaux arrivent endommagés, consultez :", slug: "returns" },
          ],
        },
      ],
    },
    zh: {
      title: "配送说明",
      updated: todoZh("最后更新日期"),
      sections: [
        { heading: "运费", blocks: [{ kind: "p", text: "寄送至日本国内的所有订单均免运费。" }] },
        {
          heading: "配送范围",
          blocks: [
            { kind: "p", text: "目前仅配送至日本国内地址。" },
            { kind: "p", text: "商品从日本神奈川县发货。" },
          ],
        },
        {
          heading: "发货时间",
          blocks: [
            { kind: "p", text: todoZh("付款完成后至发货的天数") },
            { kind: "p", text: todoZh("不发货的日期（休息日、节假日、长期休业等）") },
          ],
        },
        {
          heading: "配送",
          blocks: [
            { kind: "p", text: todoZh("承运商与配送方式") },
            { kind: "p", text: todoZh("发货后的预计送达时间") },
            { kind: "p", text: todoZh("是否可以指定送达日期或时段") },
          ],
        },
        {
          heading: "订单与发货通知邮件",
          blocks: [
            { kind: "p", text: "付款完成后，Stripe 会向您在结账时填写的电子邮箱发送收据。" },
            { kind: "p", text: todoZh("发货通知与追踪号码的发送方式和时间") },
          ],
        },
        {
          heading: "配送出现问题时",
          blocks: [
            { kind: "p", text: todoZh("包裹无法送达或被退回时的处理方式") },
            { kind: "link", text: "如商品在运输途中破损，请参阅：", slug: "returns" },
          ],
        },
      ],
    },
    "zh-TW": {
      title: "配送說明",
      updated: todoTw("最後更新日期"),
      sections: [
        { heading: "運費", blocks: [{ kind: "p", text: "寄送至日本國內的所有訂單皆免運費。" }] },
        {
          heading: "配送範圍",
          blocks: [
            { kind: "p", text: "目前僅配送至日本國內地址。" },
            { kind: "p", text: "商品自日本神奈川縣出貨。" },
          ],
        },
        {
          heading: "出貨時間",
          blocks: [
            { kind: "p", text: todoTw("付款完成後至出貨的天數") },
            { kind: "p", text: todoTw("不出貨的日期（公休日、國定假日、長期休業等）") },
          ],
        },
        {
          heading: "配送",
          blocks: [
            { kind: "p", text: todoTw("物流業者與配送方式") },
            { kind: "p", text: todoTw("出貨後的預計送達時間") },
            { kind: "p", text: todoTw("是否可以指定送達日期或時段") },
          ],
        },
        {
          heading: "訂單與出貨通知信",
          blocks: [
            { kind: "p", text: "付款完成後，Stripe 會寄送收據至您於結帳時填寫的電子郵件地址。" },
            { kind: "p", text: todoTw("出貨通知與追蹤號碼的寄送方式與時間") },
          ],
        },
        {
          heading: "配送發生問題時",
          blocks: [
            { kind: "p", text: todoTw("包裹無法送達或遭退回時的處理方式") },
            { kind: "link", text: "若商品於運送途中破損，請參閱：", slug: "returns" },
          ],
        },
      ],
    },
  },
};

// ─── Returns and refunds (Japanese and English) ───────────────────────────────
const returns: LegalPageContent = {
  languages: ["ja", "en"],
  docs: {
    ja: {
      title: "返品・返金について",
      intro: "当店の商品は食品です。返品・交換・返金の取扱いについて、以下のとおりご案内します。",
      updated: todoJa("最終更新日"),
      sections: [
        {
          heading: "お客様都合による返品・交換",
          blocks: [{ kind: "p", text: todoJa("お客様都合による返品・交換の可否と条件（開封前・開封後）") }],
        },
        {
          heading: "破損・不良品・誤配送の場合",
          blocks: [
            { kind: "p", text: todoJa("対応内容（返金・交換など）と条件") },
            { kind: "p", text: todoJa("商品到着後のご連絡期限") },
          ],
        },
        {
          heading: "ご連絡方法",
          blocks: [
            { kind: "p", text: todoJa("連絡先メールアドレスと、ご連絡時にお知らせいただく内容（注文番号・写真など）") },
          ],
        },
        {
          heading: "返品時の送料",
          blocks: [{ kind: "p", text: todoJa("返品送料の負担（どの場合に誰が負担するか）") }],
        },
        {
          heading: "返金について",
          blocks: [
            { kind: "p", text: "返金は、ご注文時のお支払い方法に対して Stripe を通じて行います。" },
            { kind: "p", text: todoJa("返金の時期（カード会社の処理により反映まで時間がかかる場合の案内を含む）") },
          ],
        },
        {
          heading: "ご注文のキャンセル",
          blocks: [{ kind: "p", text: todoJa("お支払い後のキャンセルの可否と期限") }],
        },
      ],
    },
    en: {
      title: "Returns and refunds",
      intro: "Our products are food. This page explains how returns, exchanges and refunds are handled.",
      updated: todoEn("last updated date"),
      sections: [
        {
          heading: "Returns for a change of mind",
          blocks: [
            {
              kind: "p",
              text: todoEn("whether returns or exchanges for a change of mind are accepted, before and after opening, and on what conditions"),
            },
          ],
        },
        {
          heading: "Damaged, defective or wrong items",
          blocks: [
            { kind: "p", text: todoEn("what we offer (refund, replacement) and on what conditions") },
            { kind: "p", text: todoEn("deadline for contacting us after delivery") },
          ],
        },
        {
          heading: "How to contact us",
          blocks: [
            { kind: "p", text: todoEn("contact e-mail address and what to include in the message (for example, order number and photos)") },
          ],
        },
        {
          heading: "Return shipping costs",
          blocks: [{ kind: "p", text: todoEn("who pays for return shipping, and in which cases") }],
        },
        {
          heading: "Refunds",
          blocks: [
            { kind: "p", text: "Refunds are made to the payment method used for the order, through Stripe." },
            { kind: "p", text: todoEn("when refunds are issued, including a note that card issuers may take time to show them") },
          ],
        },
        {
          heading: "Cancelling an order",
          blocks: [{ kind: "p", text: todoEn("whether, and until when, an order can be cancelled after payment") }],
        },
      ],
    },
  },
};

export const LEGAL_PAGES: Record<LegalSlug, LegalPageContent> = { tokushoho, privacy, shipping, returns };

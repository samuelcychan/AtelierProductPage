import { useEffect, useState, type CSSProperties } from "react";
import { LANG_LABELS, type Lang } from "@/app/i18n";
import {
  LEGAL_CHROME,
  LEGAL_PAGES,
  LEGAL_SLUGS,
  PLACEHOLDER_SPLIT,
  hasPlaceholders,
  isLegalSlug,
  type LegalBlock,
  type LegalDoc,
  type LegalSlug,
} from "./content";

const display: CSSProperties = { fontFamily: "Fraunces, Georgia, serif" };
const body: CSSProperties = { fontFamily: "Mulish, system-ui, sans-serif" };
const ALL_LANGS = Object.keys(LANG_LABELS) as Lang[];

/** "/legal/privacy/" → "privacy"; "/legal" → "". */
function slugFromPath(pathname: string): string {
  return pathname.replace(/\/+$/, "").replace(/^\/legal\/?/, "");
}

function queryLang(): Lang | null {
  const value = new URLSearchParams(window.location.search).get("lang");
  return value && (ALL_LANGS as string[]).includes(value) ? (value as Lang) : null;
}

function browserLangs(): Lang[] {
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
  const out: Lang[] = [];
  for (const tag of tags) {
    const t = (tag ?? "").toLowerCase();
    const lang: Lang | null = t.startsWith("ja")
      ? "ja"
      : t.startsWith("fr")
        ? "fr"
        : t.startsWith("en")
          ? "en"
          : /^zh-(tw|hk|mo|hant)/.test(t)
            ? "zh-TW"
            : t.startsWith("zh")
              ? "zh"
              : null;
    if (lang && !out.includes(lang)) out.push(lang);
  }
  return out;
}

/**
 * The site does not persist a language preference (App.tsx and StoryPage start in English), so the
 * page uses `?lang=` first, then the browser's languages, then English, then the page's first language.
 */
function resolveLang(available: readonly Lang[]): Lang {
  const candidates: Array<Lang | null> = [queryLang(), ...browserLangs(), "en"];
  return candidates.find((l): l is Lang => l !== null && available.includes(l)) ?? available[0];
}

function legalHref(slug: LegalSlug, lang: Lang): string {
  return LEGAL_PAGES[slug].languages.includes(lang) ? `/legal/${slug}?lang=${encodeURIComponent(lang)}` : `/legal/${slug}`;
}

const placeholderStyle: CSSProperties = {
  background: "var(--ym-gold-50)",
  color: "var(--ym-fg-dark)",
  padding: "0 0.25em",
  borderRadius: 2,
  boxDecorationBreak: "clone",
  WebkitBoxDecorationBreak: "clone",
};

/** Renders text with owner/adviser placeholders highlighted. */
function Text({ text }: { text: string }) {
  const parts = text.split(PLACEHOLDER_SPLIT);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} style={placeholderStyle}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

const linkStyle: CSSProperties = {
  color: "var(--ym-primary)",
  textDecoration: "underline",
  textUnderlineOffset: "0.2em",
};

function Block({ block, lang }: { block: LegalBlock; lang: Lang }) {
  const paragraph: CSSProperties = { ...body, fontSize: "0.95rem", lineHeight: 1.85, color: "var(--ym-fg)", margin: "0.6rem 0 0" };
  switch (block.kind) {
    case "p":
      return (
        <p style={paragraph}>
          <Text text={block.text} />
        </p>
      );
    case "list":
      return (
        <ul className="list-disc" style={{ ...paragraph, paddingLeft: "1.25rem" }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ marginTop: i ? "0.4rem" : 0 }}>
              <Text text={item} />
            </li>
          ))}
        </ul>
      );
    case "link":
      return (
        <p style={paragraph}>
          <Text text={block.text} />{" "}
          <a href={legalHref(block.slug, lang)} style={linkStyle}>
            {LEGAL_CHROME[lang].titles[block.slug]}
          </a>
        </p>
      );
    case "fields":
      return (
        <dl style={{ margin: "0.75rem 0 0" }}>
          {block.rows.map((row, i) => (
            <div
              key={i}
              className="grid gap-1 sm:gap-6 sm:grid-cols-[13rem_1fr]"
              style={{ padding: "0.9rem 0", borderTop: "1px solid var(--ym-rule)" }}
            >
              <dt style={{ ...body, fontSize: "0.82rem", fontWeight: 600, color: "var(--ym-muted)", lineHeight: 1.7 }}>
                {row.label}
              </dt>
              <dd style={{ ...body, fontSize: "0.95rem", lineHeight: 1.75, color: "var(--ym-fg)", margin: 0, overflowWrap: "anywhere" }}>
                <Text text={row.value} />
                {row.link && (
                  <>
                    {" "}
                    <a href={legalHref(row.link, lang)} style={linkStyle}>
                      {LEGAL_CHROME[lang].titles[row.link]}
                    </a>
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      );
  }
}

function Doc({ doc, lang, primary, eyebrow }: { doc: LegalDoc; lang: Lang; primary: boolean; eyebrow?: string }) {
  const TitleTag = primary ? "h1" : "h2";
  const SectionTag = primary ? "h2" : "h3";
  return (
    <article lang={lang} style={primary ? undefined : { marginTop: "4.5rem", paddingTop: "3rem", borderTop: "1px solid var(--ym-rule-15)" }}>
      {eyebrow && (
        <div style={{ ...body, fontSize: "0.68rem", letterSpacing: "0.2em", color: "var(--ym-gold)" }} className="uppercase mb-3">
          {eyebrow}
        </div>
      )}
      <TitleTag
        style={{
          ...display,
          fontSize: primary ? "clamp(1.9rem, 5vw, 2.9rem)" : "clamp(1.5rem, 4vw, 2.2rem)",
          fontWeight: 600,
          lineHeight: 1.15,
          color: "var(--ym-fg)",
          margin: 0,
        }}
      >
        {doc.title}
      </TitleTag>
      <p style={{ ...body, fontSize: "0.78rem", color: "var(--ym-muted)", margin: "0.9rem 0 0" }}>
        {LEGAL_CHROME[lang].updated}: <Text text={doc.updated} />
      </p>
      {doc.intro && (
        <p style={{ ...body, fontSize: "1rem", lineHeight: 1.85, color: "var(--ym-fg)", margin: "1.5rem 0 0" }}>
          <Text text={doc.intro} />
        </p>
      )}
      {doc.sections.map((section, i) => (
        <section key={i} style={{ marginTop: "2.5rem" }}>
          <SectionTag style={{ ...display, fontSize: "1.3rem", fontWeight: 600, color: "var(--ym-fg)", margin: 0 }}>
            {section.heading}
          </SectionTag>
          {section.blocks.map((block, j) => (
            <Block key={j} block={block} lang={lang} />
          ))}
        </section>
      ))}
    </article>
  );
}

export default function LegalPage() {
  const slug = slugFromPath(window.location.pathname);
  const page = isLegalSlug(slug) ? LEGAL_PAGES[slug] : null;
  const available = page ? page.languages : ALL_LANGS;
  const [lang, setLang] = useState<Lang>(() => resolveLang(available));
  const chrome = LEGAL_CHROME[lang];

  const shown: Array<[Lang, LegalDoc]> = [];
  if (page) {
    for (const l of page.stacked ? page.languages : [lang]) {
      const doc = page.docs[l];
      if (doc) shown.push([l, doc]);
    }
  }
  const draft = hasPlaceholders(shown.map(([, doc]) => doc));
  const title = page ? chrome.titles[slug as LegalSlug] : chrome.notFoundTitle;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${title} | ${chrome.brand}`;
  }, [lang, title, chrome.brand]);

  const changeLang = (next: Lang) => {
    setLang(next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="min-h-screen" style={{ ...body, background: "var(--ym-bg)", color: "var(--ym-fg)" }}>
      <header style={{ borderBottom: "1px solid var(--ym-rule)" }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="ym-hover-gold" style={{ ...body, fontSize: "0.85rem", color: "var(--ym-muted)" }}>
            <span aria-hidden="true">← </span>
            {chrome.home}
          </a>
          {available.length > 1 && (
            <label className="flex items-center gap-2" style={{ ...body, fontSize: "0.8rem", color: "var(--ym-muted)" }}>
              <span>{chrome.language}</span>
              <select
                value={lang}
                onChange={(e) => changeLang(e.target.value as Lang)}
                style={{
                  ...body,
                  fontSize: "0.85rem",
                  color: "var(--ym-fg)",
                  background: "var(--ym-bg)",
                  border: "1px solid var(--ym-rule-15)",
                  borderRadius: "var(--ym-radius)",
                  padding: "0.35rem 0.9rem",
                }}
              >
                {available.map((l) => (
                  <option key={l} value={l}>
                    {LANG_LABELS[l]}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-6 pt-10 pb-20">
        <div style={{ ...body, fontSize: "0.7rem", letterSpacing: "0.2em", color: "var(--ym-gold)" }} className="mb-4">
          {chrome.brand}
        </div>

        {draft && (
          <div
            role="note"
            className="mb-10"
            style={{
              background: "var(--ym-bg-alt)",
              borderLeft: "3px solid var(--ym-gold)",
              padding: "0.9rem 1.1rem",
              ...body,
              fontSize: "0.88rem",
              lineHeight: 1.7,
              color: "var(--ym-fg)",
            }}
          >
            <strong style={{ fontWeight: 700 }}>{chrome.draftTitle}</strong> — {chrome.draftBody}
          </div>
        )}

        {page ? (
          shown.map(([l, doc], i) => (
            <Doc key={l} doc={doc} lang={l} primary={i === 0} eyebrow={i > 0 && page.stacked ? chrome.translation : undefined} />
          ))
        ) : (
          <div>
            <h1 style={{ ...display, fontSize: "clamp(1.9rem, 5vw, 2.9rem)", fontWeight: 600, color: "var(--ym-fg)", margin: 0 }}>
              {chrome.notFoundTitle}
            </h1>
            <p style={{ ...body, fontSize: "1rem", lineHeight: 1.8, color: "var(--ym-muted)", margin: "1rem 0 0" }}>
              {chrome.notFoundBody}
            </p>
          </div>
        )}

        <nav aria-label={chrome.otherPages} style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid var(--ym-rule-15)" }}>
          <div style={{ ...body, fontSize: "0.68rem", letterSpacing: "0.2em", color: "var(--ym-muted)" }} className="uppercase mb-4">
            {chrome.otherPages}
          </div>
          <ul className="flex flex-col gap-2">
            {LEGAL_SLUGS.map((s) => (
              <li key={s} style={{ ...body, fontSize: "0.9rem" }}>
                {s === slug ? (
                  <span aria-current="page" style={{ color: "var(--ym-fg)", fontWeight: 600 }}>
                    {chrome.titles[s]}
                  </span>
                ) : (
                  <a href={legalHref(s, lang)} className="ym-hover-gold" style={{ color: "var(--ym-primary)" }}>
                    {chrome.titles[s]}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </div>
  );
}

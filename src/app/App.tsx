import { useState, useEffect, useRef, ReactNode, createContext, useContext } from "react";
import { ShoppingBag, Plus, Globe, Contrast, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import ghibliVideo from "@/imports/kimie-cooking-ghibli.mp4";
import heroImage from "@/assets/hero_kimie_mustard.png";
import jarsRawPhoto from "@/assets/jars_raw.jpg";
import jarMustardPhoto from "@/assets/jar_mustard_studio.jpg";
import jarTapenadePhoto from "@/assets/jar_tapenade.png";
import saladPhoto from "@/assets/salad_mustard.jpg";
import pastaPhoto from "@/assets/pasta_mustard.png";
import jagaimoPhoto from "@/assets/jagaimo_mustard.png";
import { Lang, LANG_LABELS, Translations, translations, SLOGANS, PHRASES } from "@/app/i18n";

// ─── Themes ───────────────────────────────────────────────────────────────────
type ThemeKey = "grove" | "wabi";

const THEMES: Record<ThemeKey, {
  label: string;
  bg: string; bgAlt: string; fg: string; fgDark: string;
  primary: string; gold: string; muted: string; mutedLt: string; lightTxt: string;
  gold60: string; gold50: string;
  rule: string; rule15: string; rule10: string; rule08: string;
  scrim90: string; scrim50: string; scrim08: string;
  shadow: string; radius: string;
}> = {
  grove: {
    label: "Yuzu Grove",
    bg: "#F4FBF0", bgAlt: "#E8F5E2", fg: "#1E3A1C", fgDark: "#122810",
    primary: "#2D6B35", gold: "#D4A820", muted: "#5A7A54", mutedLt: "#C2DFC0", lightTxt: "#A8D4A5",
    gold60: "#D4A82099", gold50: "#D4A82080",
    rule: "rgba(30,58,28,0.12)", rule15: "rgba(30,58,28,0.15)", rule10: "rgba(30,58,28,0.1)", rule08: "rgba(30,58,28,0.08)",
    scrim90: "rgba(18,40,16,0.90)", scrim50: "rgba(18,40,16,0.50)", scrim08: "rgba(18,40,16,0.08)",
    shadow: "rgba(18,40,16,0.25)", radius: "9999px",
  },
  wabi: {
    label: "Wabi-Sabi",
    bg: "#EFEAE1", bgAlt: "#E2DACB", fg: "#33302B", fgDark: "#1F1D19",
    primary: "#6E6353", gold: "#A8763E", muted: "#7C7466", mutedLt: "#CBC1B1", lightTxt: "#DCD3C4",
    gold60: "#A8763E99", gold50: "#A8763E80",
    rule: "rgba(51,48,43,0.16)", rule15: "rgba(51,48,43,0.18)", rule10: "rgba(51,48,43,0.13)", rule08: "rgba(51,48,43,0.10)",
    scrim90: "rgba(31,29,25,0.88)", scrim50: "rgba(31,29,25,0.48)", scrim08: "rgba(31,29,25,0.08)",
    shadow: "rgba(31,29,25,0.22)", radius: "2px",
  },
};

const THEME_VARS: Record<string, keyof (typeof THEMES)["grove"]> = {
  "--ym-bg": "bg", "--ym-bg-alt": "bgAlt", "--ym-fg": "fg", "--ym-fg-dark": "fgDark",
  "--ym-primary": "primary", "--ym-gold": "gold", "--ym-gold-60": "gold60", "--ym-gold-50": "gold50",
  "--ym-muted": "muted", "--ym-muted-lt": "mutedLt", "--ym-light-txt": "lightTxt",
  "--ym-rule": "rule", "--ym-rule-15": "rule15", "--ym-rule-10": "rule10", "--ym-rule-08": "rule08",
  "--ym-scrim-90": "scrim90", "--ym-scrim-50": "scrim50", "--ym-scrim-08": "scrim08",
  "--ym-shadow": "shadow", "--ym-radius": "radius",
};

// ─── Language + theme context ─────────────────────────────────────────────────
const UICtx = createContext<{
  lang: Lang; setLang: (l: Lang) => void; T: Translations;
  theme: ThemeKey; setTheme: (t: ThemeKey) => void; th: (typeof THEMES)["grove"];
}>({
  lang: "en", setLang: () => {}, T: translations.en,
  theme: "grove", setTheme: () => {}, th: THEMES.grove,
});
const useUI = () => useContext(UICtx);

// ─── Scroll reveal ────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`}
    >
      {children}
    </div>
  );
}

const display = { fontFamily: "Fraunces, Georgia, serif" };
const body    = { fontFamily: "Mulish, system-ui, sans-serif" };

const pad = (n: number) => (n < 10 ? "0" + n : String(n));

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-4 mb-10">
      <span style={{ ...body, fontSize: "0.65rem", letterSpacing: "0.22em", color: "var(--ym-gold)" }}>{n}</span>
      <div className="h-px w-10" style={{ background: "var(--ym-rule-15)" }} />
      <span style={{ ...body, fontSize: "0.65rem", letterSpacing: "0.22em", color: "var(--ym-muted)" }} className="uppercase">{label}</span>
    </div>
  );
}

// ─── Ghibli video (plays only while on screen) ───────────────────────────────
function GhibliVideo({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { v.muted = true; v.play().catch(() => {}); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: 0.25 });
    obs.observe(v);
    return () => obs.disconnect();
  }, []);
  return (
    <video ref={ref} autoPlay muted loop playsInline preload="auto" className={className} style={style}>
      <source src={ghibliVideo as string} type="video/mp4" />
    </video>
  );
}

// ─── Theme switcher ───────────────────────────────────────────────────────────
function ThemeSwitcher({ onDark = false }: { onDark?: boolean }) {
  const { theme, setTheme, th, T } = useUI();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const textColor = onDark ? "rgba(255,255,255,0.75)" : "var(--ym-muted)";
  const activeBg  = onDark ? "rgba(255,255,255,0.12)" : "var(--ym-bg-alt)";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors"
        style={{ ...body, fontSize: "0.9rem", color: textColor, background: open ? activeBg : "transparent" }}
        aria-label="Select theme"
      >
        <Contrast size={14} />
        <span className="whitespace-nowrap">{T.nav.theme}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 py-1 rounded-lg z-50 min-w-[150px] overflow-hidden flex flex-col"
          style={{ background: "var(--ym-bg)", border: "1px solid var(--ym-rule)", boxShadow: "0 20px 25px -5px var(--ym-shadow)" }}
        >
          {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
            <button
              key={k}
              onClick={() => { setTheme(k); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 ym-hover-bg-alt"
              style={{
                ...body,
                fontSize: "0.82rem",
                color: k === theme ? THEMES[k].primary : THEMES[k].fg,
                fontWeight: k === theme ? 600 : 400,
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: THEMES[k].gold }} />
              {THEMES[k].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Language switcher ────────────────────────────────────────────────────────
const ALL_LANGS = (Object.keys(LANG_LABELS) as Lang[]);

function LangSwitcher({ onDark = false }: { onDark?: boolean }) {
  const { lang, setLang } = useUI();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const textColor = onDark ? "rgba(255,255,255,0.75)" : "var(--ym-muted)";
  const activeBg  = onDark ? "rgba(255,255,255,0.12)" : "var(--ym-bg-alt)";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors"
        style={{ ...body, fontSize: "0.9rem", color: textColor, background: open ? activeBg : "transparent" }}
        aria-label="Select language"
      >
        <Globe size={14} />
        <span>{LANG_LABELS[lang]}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 py-1 rounded-lg z-50 min-w-[120px] overflow-hidden flex flex-col"
          style={{ background: "var(--ym-bg)", border: "1px solid var(--ym-rule)", boxShadow: "0 20px 25px -5px var(--ym-shadow)" }}
        >
          {ALL_LANGS.map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 ym-hover-bg-alt"
              style={{
                ...body,
                fontSize: "0.82rem",
                color: l === lang ? "var(--ym-primary)" : "var(--ym-fg)",
                fontWeight: l === lang ? 600 : 400,
              }}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Brand mark ───────────────────────────────────────────────────────────────
function Brand({ light = false }: { light?: boolean }) {
  return (
    <>
      <span style={{ color: light ? "#fff" : "var(--ym-fg)" }}>植物料理家きみえの</span>
      <span style={{ color: "var(--ym-gold)" }}>瓶詰め</span>
    </>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function useNavLinks() {
  const { T } = useUI();
  return [
    { href: "#lineup",      label: T.lineup.sectionLabel },
    { href: "#recipes",     label: T.nav.recipes         },
    { href: "#process",     label: T.nav.process         },
    { href: "#ingredients", label: T.nav.ingredients     },
    { href: "#faq",         label: T.nav.faq             },
  ];
}

function Nav() {
  const { T, th } = useUI();
  const [scrolled, setScrolled] = useState(false);
  const links = useNavLinks();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 56);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? `${th.bg}F5`
          : `linear-gradient(to bottom, ${th.scrim90} 0%, ${th.scrim50} 55%, transparent 100%)`,
        boxShadow: scrolled ? `0 1px 2px 0 ${th.rule08}` : "none",
        backdropFilter: scrolled ? "blur(8px)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-y-3 gap-x-5">
        <a href="#" style={{ ...display, fontSize: "1.3rem", letterSpacing: "0.02em" }} className="whitespace-nowrap">
          <Brand light={!scrolled} />
        </a>

        <nav className="flex flex-wrap items-center gap-y-2 gap-x-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="ym-hover-gold whitespace-nowrap"
              style={{ ...body, fontSize: "0.95rem", letterSpacing: "0.04em", color: scrolled ? "var(--ym-muted)" : "rgba(255,255,255,0.82)" }}
            >
              {l.label}
            </a>
          ))}
          <ThemeSwitcher onDark={!scrolled} />
          <LangSwitcher onDark={!scrolled} />
          <a
            href="#buy"
            style={{ ...body, fontSize: "0.92rem", background: "var(--ym-primary)", color: "var(--ym-bg)", borderRadius: "var(--ym-radius)" }}
            className="px-[1.1rem] py-2 whitespace-nowrap hover:opacity-90 transition-opacity"
          >
            {T.nav.order}
          </a>
        </nav>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function ArrowButton({ dir, onClick, size = 30, label }: { dir: "prev" | "next"; onClick: () => void; size?: number; label: string }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex items-center justify-center transition-all duration-200 hover:border-[var(--ym-gold)]"
      style={{ width: size, height: size, color: "rgba(255,255,255,0.92)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: "var(--ym-radius)" }}
    >
      <Icon size={size >= 30 ? 14 : 12} />
    </button>
  );
}

function PhraseRow({ label, list, idx, onChange }: { label: string; list: string[]; idx: number; onChange: (i: number) => void }) {
  return (
    <div className="grid items-center" style={{ gridTemplateColumns: "1fr auto", gap: "0.2rem 1rem" }}>
      <span style={{ ...body, fontSize: "0.6rem", letterSpacing: "0.16em", color: "var(--ym-gold)" }} className="whitespace-nowrap">{label}</span>
      <div className="flex items-center gap-2" style={{ gridRow: "span 2" }}>
        <span style={{ ...body, fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.8)" }} className="whitespace-nowrap">
          {list.length ? `${pad(idx + 1)} / ${pad(list.length)}` : ""}
        </span>
        <ArrowButton dir="prev" size={24} label="Previous" onClick={() => onChange((idx - 1 + list.length) % list.length)} />
        <ArrowButton dir="next" size={24} label="Next" onClick={() => onChange((idx + 1) % list.length)} />
      </div>
      <div style={{ ...body, fontSize: "0.9rem", lineHeight: 1.45, color: "#fff", minHeight: "1.45em", textWrap: "pretty" as any }}>{list[idx] || ""}</div>
    </div>
  );
}

function Hero() {
  const { T, lang } = useUI();
  const [loaded, setLoaded] = useState(false);
  const [slogan, setSlogan] = useState(0);
  const [phMustard, setPhMustard] = useState(0);
  const [phTapenade, setPhTapenade] = useState(0);

  const slogans = SLOGANS[lang] ?? SLOGANS.ja;
  const si = slogans.length ? slogan % slogans.length : 0;

  useEffect(() => {
    const t = setInterval(() => setSlogan((s) => s + 1), 5200);
    return () => clearInterval(t);
  }, []);

  const mi = PHRASES.mustard.length ? phMustard % PHRASES.mustard.length : 0;
  const ti = PHRASES.tapenade.length ? phTapenade % PHRASES.tapenade.length : 0;

  return (
    <section id="buy" className="relative min-h-screen flex items-end overflow-hidden">
      <div className="absolute inset-0" style={{ background: "#d4b87a" }}>
        <ImageWithFallback
          src={heroImage}
          alt="Kimie in her sunlit kitchen spooning whole-grain mustard, with bowls of vegetables, rice, pasta and potatoes — Ghibli illustration style"
          className="w-full h-full object-cover object-center"
          style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.8s ease" }}
          onLoad={() => setLoaded(true)}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, var(--ym-scrim-90) 0%, var(--ym-scrim-50) 30%, var(--ym-scrim-08) 60%, transparent 100%)" }}
        />
      </div>

      {/* Vertical ornament */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-3 opacity-35">
        <div className="h-20 w-px" style={{ background: "var(--ym-gold)" }} />
        <span style={{ ...body, fontSize: "0.55rem", letterSpacing: "0.35em", color: "var(--ym-gold)" }} className="rotate-90 whitespace-nowrap">
          マスタード · タブナード · EST. 2019
        </span>
        <div className="h-20 w-px" style={{ background: "var(--ym-gold)" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full box-border" style={{ padding: "5.5rem 1.5rem 2.5rem" }}>
        <div
          className="max-w-xl transition-all duration-1000"
          style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(1.5rem)" }}
        >
          <div
            style={{
              borderLeft: "2px solid var(--ym-gold)",
              padding: "1rem 1.35rem 1.15rem",
              maxWidth: "34rem",
              background: "linear-gradient(to right, var(--ym-scrim-90), var(--ym-scrim-50))",
              backdropFilter: "blur(3px)",
            }}
          >
            <div className="flex items-center gap-4" style={{ marginBottom: "0.9rem" }}>
              <div className="h-px w-8" style={{ background: "var(--ym-gold-60)" }} />
              <span style={{ ...body, fontSize: "0.65rem", letterSpacing: "0.28em", color: "var(--ym-gold)" }}>{T.hero.eyebrow}</span>
            </div>

            <h1
              style={{ ...display, fontSize: "clamp(1.9rem, 4.2vw, 3rem)", fontWeight: 700, lineHeight: 1.05, color: "#fff", margin: "0 0 0.85rem", minHeight: "2.1em", textWrap: "pretty" as any }}
            >
              {slogans[si] || ""}
            </h1>

            <div className="flex items-center gap-3">
              <ArrowButton dir="prev" label="Previous slogan" onClick={() => setSlogan((si - 1 + slogans.length) % slogans.length)} />
              <ArrowButton dir="next" label="Next slogan" onClick={() => setSlogan((si + 1) % slogans.length)} />
              <div className="flex items-center gap-1.5 ml-2">
                {slogans.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlogan(i)}
                    aria-label={`Slogan ${i + 1}`}
                    className="transition-all duration-250"
                    style={{ height: 3, width: i === si ? "1.5rem" : "0.5rem", background: i === si ? "var(--ym-gold)" : "rgba(255,255,255,0.55)" }}
                  />
                ))}
              </div>
              <span className="ml-auto" style={{ ...body, fontSize: "0.68rem", letterSpacing: "0.16em", color: "rgba(255,255,255,0.82)" }}>
                {slogans.length ? `${pad(si + 1)} / ${pad(slogans.length)}` : ""}
              </span>
            </div>

            <div className="grid" style={{ gap: "0.7rem", marginTop: "1rem", paddingTop: "0.9rem", borderTop: "1px solid rgba(255,255,255,0.16)" }}>
              <PhraseRow label="マスタードソース" list={PHRASES.mustard} idx={mi} onChange={setPhMustard} />
              <PhraseRow label="タブナードソース" list={PHRASES.tapenade} idx={ti} onChange={setPhTapenade} />
            </div>

            <div className="flex flex-wrap items-center" style={{ gap: "1.25rem 1.75rem", marginTop: "1rem", paddingTop: "0.9rem", borderTop: "1px solid rgba(255,255,255,0.16)" }}>
              <a
                href="#"
                className="flex items-center gap-3 font-semibold hover:scale-105 active:scale-95 transition-all duration-200"
                style={{ ...body, padding: "0.85rem 1.75rem", borderRadius: "var(--ym-radius)", background: "var(--ym-gold)", color: "var(--ym-fg-dark)" }}
              >
                <ShoppingBag size={17} />
                {T.hero.cta}
              </a>
              <a href="#lineup" className="ym-hover-gold" style={{ ...body, fontSize: "0.8rem", color: "rgba(255,255,255,0.85)" }}>
                {T.hero.learnMore}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Lineup (the two sauces) ─────────────────────────────────────────────────
type JarKey = "mustard" | "tapenade";

const JAR_PHOTOS: Record<JarKey, Array<{ src: string | null; style: string }>> = {
  mustard:  [{ src: jarMustardPhoto as string, style: "STUDIO" }, { src: null, style: "TABLE" }, { src: null, style: "DETAIL" }],
  tapenade: [{ src: jarTapenadePhoto as string, style: "STUDIO" }, { src: null, style: "TABLE" }, { src: null, style: "DETAIL" }],
};

function JarPhotoFrame({ jarKey, tag, slotHint, idx, onChange }: {
  jarKey: JarKey; tag: string; slotHint: string; idx: number; onChange: (i: number) => void;
}) {
  const photos = JAR_PHOTOS[jarKey];
  const i = idx % photos.length;
  const cur = photos[i];

  return (
    <div className="relative" style={{ aspectRatio: "4/5", background: "var(--ym-bg)", border: "1px solid var(--ym-rule-10)", padding: 12 }}>
      {cur.src ? (
        <img src={cur.src} alt={`${tag} — ${cur.style}`} className="w-full h-full object-cover block" />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-6"
          style={{ background: "var(--ym-bg-alt)", border: "1px dashed var(--ym-rule-15)" }}
        >
          <span style={{ ...body, fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--ym-gold)" }}>{cur.style}</span>
          <span style={{ ...body, fontSize: "0.72rem", color: "var(--ym-muted)" }}>{slotHint}</span>
        </div>
      )}
      <div className="absolute -top-3 -left-3 px-3 py-1" style={{ background: "var(--ym-gold)", ...body, fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--ym-fg-dark)" }}>
        {tag}
      </div>
      <div className="absolute z-[3] top-5 right-5 px-[0.55rem] py-[0.2rem]" style={{ background: "rgba(255,255,255,0.88)", ...body, fontSize: "0.6rem", letterSpacing: "0.16em", color: "var(--ym-fg-dark)" }}>
        {cur.style} · {pad(i + 1)}/{pad(photos.length)}
      </div>
      <button
        onClick={() => onChange((i - 1 + photos.length) % photos.length)}
        aria-label="Previous photo"
        className="absolute z-[3] left-5 top-1/2 -translate-y-1/2 flex items-center justify-center hover:bg-white transition-colors"
        style={{ width: 34, height: 34, background: "rgba(255,255,255,0.88)", color: "var(--ym-fg-dark)", borderRadius: "var(--ym-radius)" }}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => onChange((i + 1) % photos.length)}
        aria-label="Next photo"
        className="absolute z-[3] right-5 top-1/2 -translate-y-1/2 flex items-center justify-center hover:bg-white transition-colors"
        style={{ width: 34, height: 34, background: "rgba(255,255,255,0.88)", color: "var(--ym-fg-dark)", borderRadius: "var(--ym-radius)" }}
      >
        <ChevronRight size={16} />
      </button>
      <div className="absolute z-[3] left-0 right-0 flex items-center justify-center gap-1.5" style={{ bottom: "1.4rem" }}>
        {photos.map((_, pi) => (
          <button
            key={pi}
            onClick={() => onChange(pi)}
            aria-label={`${jarKey} photo ${pi + 1}`}
            className="transition-all duration-250"
            style={{ height: 3, width: pi === i ? "1.5rem" : "0.5rem", background: pi === i ? "var(--ym-gold)" : "rgba(0,0,0,0.22)" }}
          />
        ))}
      </div>
    </div>
  );
}

function JarInfo({ item, cta, padTop = false }: { item: Translations["lineup"]["items"][number]; cta: string; padTop?: boolean }) {
  return (
    <div className={`flex flex-col ${padTop ? "flex-1" : ""}`} style={padTop ? { paddingTop: "1.75rem" } : undefined}>
      <div style={{ ...body, fontSize: "0.7rem", letterSpacing: "0.12em", color: "var(--ym-gold)" }}>{item.jp}</div>
      <h3 style={{ ...display, fontSize: "clamp(1.6rem, 2.6vw, 2.4rem)", fontWeight: 600, lineHeight: 1.1, color: "var(--ym-fg)", margin: "0.4rem 0 0" }}>{item.name}</h3>
      <p style={{ ...body, fontSize: "0.95rem", color: "var(--ym-muted)", lineHeight: 1.75, margin: "1.25rem 0 0", maxWidth: "30rem" }}>{item.desc}</p>
      <div className="flex items-end justify-between gap-6" style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--ym-rule)" }}>
        <div>
          <div style={{ ...display, fontSize: "1.9rem", fontWeight: 600, color: "var(--ym-fg)" }}>{item.price}</div>
          <div style={{ ...body, fontSize: "0.68rem", letterSpacing: "0.14em", color: "var(--ym-muted)" }}>{item.size}</div>
        </div>
        <a
          href="#buy"
          className="flex items-center whitespace-nowrap font-semibold hover:scale-[1.04] active:scale-[0.96] transition-transform duration-200"
          style={{ ...body, gap: "0.6rem", fontSize: "0.82rem", padding: "0.85rem 1.6rem", borderRadius: "var(--ym-radius)", background: "var(--ym-gold)", color: "var(--ym-fg-dark)" }}
        >
          <ShoppingBag size={16} />
          {cta}
        </a>
      </div>
    </div>
  );
}

function Lineup() {
  const { T, th } = useUI();
  const [layout, setLayout] = useState<"carousel" | "split">("carousel");
  const [slide, setSlide] = useState(0);
  const [photoIdx, setPhotoIdx] = useState<Record<JarKey, number>>({ mustard: 0, tapenade: 0 });

  const mustard = T.lineup.items[1];
  const tapenade = T.lineup.items[2];
  const isCarousel = layout === "carousel";
  const curKey: JarKey = slide % 2 === 0 ? "mustard" : "tapenade";
  const curItem = slide % 2 === 0 ? mustard : tapenade;

  const setIdx = (key: JarKey) => (i: number) => setPhotoIdx((p) => ({ ...p, [key]: i }));

  return (
    <section id="lineup" className="py-28" style={{ background: "var(--ym-bg-alt)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionLabel n="01" label={T.lineup.sectionLabel} />
          <div className="flex flex-wrap items-end justify-between gap-8 mb-16">
            <h2 style={{ ...display, fontSize: "clamp(2rem, 5vw, 3.8rem)", fontWeight: 600, lineHeight: 1.05, color: "var(--ym-fg)", margin: 0 }}>
              {T.twoJar.h1}<br /><em>{T.twoJar.h2}</em>
            </h2>
            <div className="flex items-center gap-1 p-1" style={{ border: "1px solid var(--ym-rule)", background: "var(--ym-bg)" }}>
              <button
                onClick={() => setLayout("carousel")}
                className="uppercase transition-all duration-200"
                style={{ ...body, fontSize: "0.72rem", letterSpacing: "0.12em", padding: "0.55rem 1rem", background: isCarousel ? th.fg : "transparent", color: isCarousel ? th.bg : th.muted }}
              >
                Carousel
              </button>
              <button
                onClick={() => setLayout("split")}
                className="uppercase transition-all duration-200"
                style={{ ...body, fontSize: "0.72rem", letterSpacing: "0.12em", padding: "0.55rem 1rem", background: isCarousel ? "transparent" : th.fg, color: isCarousel ? th.muted : th.bg }}
              >
                Side by side
              </button>
            </div>
          </div>
        </Reveal>

        {isCarousel ? (
          <div className="grid items-center" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "4rem" }}>
            <JarPhotoFrame jarKey={curKey} tag={curItem.tag} slotHint={curItem.slotHint} idx={photoIdx[curKey]} onChange={setIdx(curKey)} />
            <div className="flex flex-col">
              <JarInfo item={curItem} cta={T.lineup.cta} />
              <div className="flex items-center" style={{ marginTop: "2.5rem", gap: "1.5rem" }}>
                <button
                  onClick={() => setSlide((slide + 1) % 2)}
                  aria-label="Previous jar"
                  className="flex items-center justify-center transition-all duration-200 hover:bg-[var(--ym-bg)]"
                  style={{ width: 44, height: 44, border: "1px solid var(--ym-rule-15)", color: "var(--ym-fg)", borderRadius: "var(--ym-radius)" }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setSlide((slide + 1) % 2)}
                  aria-label="Next jar"
                  className="flex items-center justify-center transition-all duration-200 hover:bg-[var(--ym-bg)]"
                  style={{ width: 44, height: 44, border: "1px solid var(--ym-rule-15)", color: "var(--ym-fg)", borderRadius: "var(--ym-radius)" }}
                >
                  <ChevronRight size={18} />
                </button>
                <div className="flex items-center ml-2" style={{ gap: "0.6rem" }}>
                  {[0, 1].map((i) => (
                    <button
                      key={i}
                      onClick={() => setSlide(i)}
                      aria-label={`Jar ${i + 1}`}
                      className="transition-all duration-250"
                      style={{ height: 2, width: slide % 2 === i ? "2.25rem" : "1rem", background: slide % 2 === i ? "var(--ym-gold)" : "var(--ym-rule-15)" }}
                    />
                  ))}
                </div>
                <span className="ml-auto" style={{ ...body, fontSize: "0.7rem", letterSpacing: "0.18em", color: "var(--ym-muted)" }}>
                  0{(slide % 2) + 1} / 02
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3.5rem" }}>
            <div className="flex flex-col">
              <JarPhotoFrame jarKey="mustard" tag={mustard.tag} slotHint={mustard.slotHint} idx={photoIdx.mustard} onChange={setIdx("mustard")} />
              <JarInfo item={mustard} cta={T.lineup.cta} padTop />
            </div>
            <div className="flex flex-col">
              <JarPhotoFrame jarKey="tapenade" tag={tapenade.tag} slotHint={tapenade.slotHint} idx={photoIdx.tapenade} onChange={setIdx("tapenade")} />
              <JarInfo item={tapenade} cta={T.lineup.cta} padTop />
            </div>
          </div>
        )}

        <Reveal>
          <p className="text-center" style={{ ...body, margin: "3.5rem 0 0", fontSize: "0.82rem", color: "var(--ym-muted)" }}>{T.twoJar.note}</p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Recipes ──────────────────────────────────────────────────────────────────
const RECIPE_NUMERALS = ["Ⅰ", "Ⅱ", "Ⅲ"];
const RECIPE_PHOTOS: Array<string | null> = [saladPhoto as string, pastaPhoto as string, jagaimoPhoto as string];

function Recipes() {
  const { T } = useUI();
  const R = T.recipes;

  return (
    <section id="recipes" className="py-28" style={{ background: "var(--ym-bg)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionLabel n="02" label={R.sectionLabel} />
          <h2 className="mb-16" style={{ ...display, fontSize: "clamp(2rem, 5vw, 3.8rem)", fontWeight: 600, lineHeight: 1.05, color: "var(--ym-fg)" }}>
            {R.heading[0]}<br /><em>{R.heading[1]}</em>
          </h2>
        </Reveal>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "2rem" }}>
          {R.cards.map((c, i) => {
            const sauceLabel = c.tile || (i === 1 ? T.lineup.items[2].jp : T.lineup.items[1].jp);
            return (
              <Reveal key={i} delay={i * 110}>
                <article>
                  <div className="relative overflow-hidden mb-5" style={{ background: "var(--ym-bg-alt)" }}>
                    <div
                      className="box-border w-full relative flex flex-col justify-between"
                      style={{ aspectRatio: "3/4", padding: "4.25rem 1.75rem 1.75rem", background: "linear-gradient(160deg, var(--ym-bg) 0%, var(--ym-bg-alt) 100%)" }}
                    >
                      <div style={{ ...display, fontSize: "4.5rem", lineHeight: 1, color: "var(--ym-gold)", opacity: 0.55 }}>{RECIPE_NUMERALS[i]}</div>
                      {RECIPE_PHOTOS[i] && (
                        <img src={RECIPE_PHOTOS[i]!} alt={c.title} className="block max-w-full h-auto object-cover" style={{ width: "100%", aspectRatio: "720 / 536" }} />
                      )}
                      <div className="self-end text-right">
                        <div style={{ ...display, fontSize: "1.35rem", lineHeight: 1.25, color: "var(--ym-fg)" }}>{sauceLabel}</div>
                        <div className="ml-auto" style={{ marginTop: "0.75rem", height: 1, width: "3rem", background: "var(--ym-gold)" }} />
                      </div>
                    </div>
                    <div className="absolute top-4 left-4 px-3 py-1" style={{ background: "var(--ym-bg)", ...body, fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--ym-muted)" }}>
                      {c.tag.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3" style={{ ...body, fontSize: "0.72rem", color: "var(--ym-muted)" }}>
                    <span>{c.time}</span>
                    <span className="w-1 h-1 inline-block" style={{ borderRadius: "var(--ym-radius)", background: "var(--ym-gold-50)" }} />
                    <span>{c.diff}</span>
                  </div>
                  <h3 style={{ ...display, fontSize: "1.2rem", fontWeight: 600, color: "var(--ym-fg)" }} className="mb-3">{c.title}</h3>
                  <p style={{ ...body, fontSize: "0.88rem", color: "var(--ym-muted)", lineHeight: 1.7 }}>{c.desc}</p>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={350}>
          <p className="mt-14 text-center" style={{ ...body, fontSize: "0.82rem", color: "var(--ym-muted)" }}>{R.footerNote}</p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Process ──────────────────────────────────────────────────────────────────
function Process() {
  const { T } = useUI();
  const P = T.process;

  return (
    <section id="process" className="py-28" style={{ background: "var(--ym-bg-alt)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionLabel n="03" label={P.sectionLabel} />
          <h2 className="mb-16" style={{ ...display, fontSize: "clamp(2rem, 5vw, 3.8rem)", fontWeight: 600, lineHeight: 1.05, color: "var(--ym-fg)" }}>
            {P.heading[0]}<br /><em>{P.heading[1]}</em>
          </h2>
        </Reveal>

        <div className="grid items-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "4rem" }}>
          <Reveal>
            <div className="relative lg:sticky lg:top-28">
              <div className="overflow-hidden" style={{ boxShadow: "0 25px 50px -12px var(--ym-shadow)", background: "var(--ym-bg)", padding: "12px", border: "1px solid var(--ym-rule-10)" }}>
                <GhibliVideo className="w-full block" style={{ aspectRatio: "4/5", objectFit: "cover", objectPosition: "center top" }} />
              </div>
              <div
                className="absolute -top-3 -left-3 px-3 py-1"
                style={{ background: "var(--ym-gold)", ...body, fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--ym-fg-dark)" }}
              >
                {P.badge}
              </div>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-px w-8" style={{ background: "var(--ym-rule-15)" }} />
                <span style={{ ...body, fontSize: "0.6rem", letterSpacing: "0.22em", color: "var(--ym-muted)" }}>{P.caption}</span>
              </div>
            </div>
          </Reveal>

          <div>
            {P.steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className="py-7 flex gap-7 group" style={{ borderTop: "1px solid var(--ym-rule)" }}>
                  <span style={{ ...display, fontSize: "1.1rem", color: "var(--ym-gold)", opacity: 0.4, paddingTop: "2px", minWidth: "24px" }}>{s.n}</span>
                  <div>
                    <h3 style={{ ...display, fontSize: "1.2rem", fontWeight: 600, color: "var(--ym-fg)" }} className="mb-2 group-hover:text-[var(--ym-gold)] transition-colors duration-200">
                      {s.title}
                    </h3>
                    <p style={{ ...body, fontSize: "0.88rem", color: "var(--ym-muted)", lineHeight: 1.7 }}>{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
            <div style={{ borderTop: "1px solid var(--ym-rule)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Ingredients ──────────────────────────────────────────────────────────────
function Ingredients() {
  const { T } = useUI();
  const I = T.ingredients;

  return (
    <section id="ingredients" className="py-28" style={{ background: "var(--ym-bg)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <SectionLabel n="04" label={I.sectionLabel} />
          <h2 className="mb-16" style={{ ...display, fontSize: "clamp(2rem, 5vw, 3.8rem)", fontWeight: 600, lineHeight: 1.05, color: "var(--ym-fg)" }}>
            {I.heading[0]}<br /><em>{I.heading[1]}</em>
          </h2>
        </Reveal>

        <div className="grid items-start" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "4rem" }}>
          <div>
            {I.items.map((item, i) => (
              <Reveal key={item.n} delay={i * 90}>
                <div className="py-8 flex gap-6" style={{ borderTop: "1px solid var(--ym-rule)" }}>
                  <span style={{ ...body, fontSize: "0.65rem", color: "var(--ym-gold)", opacity: 0.5, paddingTop: "4px" }}>{item.n}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-4 mb-1">
                      <h3 style={{ ...display, fontSize: "1.2rem", fontWeight: 600, color: "var(--ym-fg)" }}>{item.name}</h3>
                      <span className="whitespace-nowrap" style={{ ...body, fontSize: "0.65rem", letterSpacing: "0.15em", color: "var(--ym-gold)" }}>{item.detail}</span>
                    </div>
                    <div style={{ ...body, fontSize: "0.7rem", color: "var(--ym-muted)", marginBottom: "6px" }}>{item.kanji}</div>
                    <p style={{ ...body, fontSize: "0.88rem", color: "var(--ym-muted)", lineHeight: 1.7 }}>{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
            <div style={{ borderTop: "1px solid var(--ym-rule)" }} />
          </div>

          <Reveal delay={180}>
            <div className="relative hidden lg:block">
              <div className="overflow-hidden" style={{ border: "1px solid var(--ym-rule-08)", background: "var(--ym-bg-alt)" }}>
                <img src={jarsRawPhoto as string} alt="Whole-grain mustard seeds and olives in the atelier" className="w-full aspect-[3/4] object-cover block" loading="lazy" />
              </div>
              <div className="absolute -bottom-5 -right-5 w-full h-full -z-10" style={{ border: "1px solid var(--ym-gold)", opacity: 0.25 }} />
              <div className="mt-5 flex items-center gap-3">
                <div className="h-px w-8" style={{ background: "var(--ym-rule-15)" }} />
                <span style={{ ...body, fontSize: "0.6rem", letterSpacing: "0.22em", color: "var(--ym-muted)" }}>{I.photoCaption}</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const { T } = useUI();
  const F = T.faq;
  const [open, setOpen] = useState<number | null>(null);

  // Reset open item when language changes so stale indexes don't mismatch
  useEffect(() => { setOpen(null); }, [F]);

  return (
    <section id="faq" className="py-28" style={{ background: "var(--ym-bg-alt)" }}>
      <div className="max-w-4xl mx-auto px-6">
        <Reveal>
          <SectionLabel n="05" label={F.sectionLabel} />
          <h2 className="mb-16" style={{ ...display, fontSize: "clamp(2rem, 5vw, 3.8rem)", fontWeight: 600, lineHeight: 1.05, color: "var(--ym-fg)" }}>
            {F.heading[0]}<br /><em>{F.heading[1]}</em>
          </h2>
        </Reveal>

        <div>
          {F.items.map((item, i) => (
            <Reveal key={i} delay={i * 55}>
              <div style={{ borderTop: "1px solid var(--ym-rule)" }}>
                <button
                  className="w-full py-7 flex items-start justify-between gap-6 text-left group"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                >
                  <div className="flex gap-6 items-start">
                    <span style={{ ...body, fontSize: "0.65rem", color: "var(--ym-gold)", opacity: 0.45, paddingTop: "4px" }}>0{i + 1}</span>
                    <span
                      style={{ ...display, fontSize: "1.05rem", fontWeight: 500, color: "var(--ym-fg)" }}
                      className="group-hover:text-[var(--ym-gold)] transition-colors duration-200"
                    >
                      {item.q}
                    </span>
                  </div>
                  <div className={`shrink-0 mt-1 transition-transform duration-300 ${open === i ? "rotate-45" : ""}`} style={{ color: "var(--ym-gold)" }}>
                    <Plus size={17} />
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-500 ease-out ${open === i ? "max-h-60 pb-7" : "max-h-0"}`}>
                  <p style={{ ...body, fontSize: "0.9rem", color: "var(--ym-muted)", lineHeight: 1.75, paddingLeft: "2.75rem" }}>{item.a}</p>
                </div>
              </div>
            </Reveal>
          ))}
          <div style={{ borderTop: "1px solid var(--ym-rule)" }} />
        </div>
      </div>
    </section>
  );
}

// ─── Buy strip ────────────────────────────────────────────────────────────────
function BuyStrip() {
  const { T } = useUI();
  const B = T.buyStrip;

  return (
    <section className="py-24" style={{ background: "var(--ym-primary)" }}>
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        <Reveal>
          <div>
            <div style={{ ...body, fontSize: "0.65rem", letterSpacing: "0.22em", color: "var(--ym-gold)" }} className="mb-3">{B.label}</div>
            <h2 style={{ ...display, fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 600, color: "#fff", lineHeight: 1.1 }}>
              {B.heading[0]}<br /><em>{B.heading[1]}</em>
            </h2>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center sm:text-right">
              <div style={{ ...display, fontSize: "2.5rem", color: "#fff", fontWeight: 600 }}>{B.price}</div>
              <div style={{ ...body, fontSize: "0.72rem", color: "var(--ym-muted-lt)" }}>{B.priceNote}</div>
            </div>
            <a
              href="#"
              className="flex items-center gap-3 font-semibold hover:scale-105 active:scale-95 transition-all duration-200 whitespace-nowrap"
              style={{ ...body, padding: "1rem 2.25rem", borderRadius: "var(--ym-radius)", background: "var(--ym-gold)", color: "var(--ym-fg-dark)" }}
            >
              <ShoppingBag size={18} />
              {B.cta}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const { T } = useUI();
  const F = T.footer;
  const links = useNavLinks();

  return (
    <footer style={{ background: "var(--ym-fg-dark)", color: "var(--ym-muted-lt)" }} className="pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid gap-12 pb-14" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <div style={{ ...display, fontSize: "1.25rem" }} className="mb-5">
              <Brand light />
            </div>
            <p style={{ ...body, fontSize: "0.85rem", color: "var(--ym-muted)", lineHeight: 1.7 }} className="mb-5">{F.tagline}</p>
            <p style={{ ...body, fontSize: "0.7rem", color: "var(--ym-muted)" }}>{F.japaneseText}</p>
          </div>

          <div>
            <div style={{ ...body, fontSize: "0.6rem", letterSpacing: "0.22em", color: "var(--ym-muted)" }} className="mb-6">{F.navigate}</div>
            <div className="space-y-3">
              {links.map((l) => (
                <div key={l.href}>
                  <a href={l.href} className="ym-hover-gold" style={{ ...body, fontSize: "0.85rem", color: "var(--ym-muted-lt)" }}>{l.label}</a>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ ...body, fontSize: "0.6rem", letterSpacing: "0.22em", color: "var(--ym-muted)" }} className="mb-6">{F.contact}</div>
            <div className="ym-hover-gold cursor-pointer" style={{ ...body, fontSize: "0.85rem", color: "var(--ym-muted-lt)" }}>{F.email}</div>
            <div style={{ ...body, fontSize: "0.75rem", color: "var(--ym-muted)", lineHeight: 1.8 }} className="mt-5">
              {F.address[0]}<br />{F.address[1]}<br />{F.address[2]}
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span style={{ ...body, fontSize: "0.72rem", color: "var(--ym-muted)" }}>{F.copyright}</span>
          <div className="flex gap-6">
            {F.links.map((l) => (
              <a key={l} href="#" className="ym-hover-gold" style={{ ...body, fontSize: "0.72rem", color: "var(--ym-muted)" }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<ThemeKey>("grove");
  const T = translations[lang];
  const th = THEMES[theme];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.style.scrollBehavior = "smooth";
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    (Object.keys(THEME_VARS) as Array<keyof typeof THEME_VARS>).forEach((v) => {
      root.style.setProperty(v as string, th[THEME_VARS[v]] as string);
    });
  }, [th]);

  return (
    <UICtx.Provider value={{ lang, setLang, T, theme, setTheme, th }}>
      <div className="min-h-screen overflow-x-hidden" style={{ ...body, background: "var(--ym-bg)", color: "var(--ym-fg)", transition: "background-color 400ms ease" }}>
        <Nav />
        <Hero />
        <Lineup />
        <Recipes />
        <Process />
        <Ingredients />
        <FAQ />
        <BuyStrip />
        <Footer />
      </div>
    </UICtx.Provider>
  );
}

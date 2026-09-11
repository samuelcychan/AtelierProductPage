import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowRight, Plus, Check, Menu, X } from "lucide-react";
import { LANG_LABELS, translations, type Lang } from "../i18n";
import { storyCopy } from "./copy";
import FlavorScene from "./FlavorScene";
import hero from "@/assets/story_kitchen.webp";
import mustard from "@/assets/jar_mustard_studio.jpg";
import tapenade from "@/assets/story_tapenade.webp";
import salad from "@/assets/salad_mustard.jpg";
import pasta from "@/assets/story_pasta.webp";
import potatoes from "@/assets/story_potatoes.webp";
import movie from "@/imports/kimie-cooking-ghibli.mp4";
import stamp from "@/assets/kimie-stamp.png";
import "./story.css";

export default function StoryPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [flavor, setFlavor] = useState<"mustard" | "tapenade">("mustard");
  const [meal, setMeal] = useState(0);
  const [sceneAvailable, setSceneAvailable] = useState(true);
  const [menu, setMenu] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const encounter = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const c = storyCopy[lang],
    t = translations[lang];
  const animate = false;
  useEffect(() => {
    document.title = `きみえの瓶詰め | ${c.kitchen}`;
    document.documentElement.lang = lang;
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    const old = meta?.content;
    if (meta) meta.content = c.intro;
    return () => {
      if (meta && old !== undefined) meta.content = old;
    };
  }, [lang, c]);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let frame = 0;
    const paint = () => {
      frame = 0;
      const y = Math.min(scrollY, innerHeight);
      el.style.setProperty("--ks-hero-y", `${animate ? y * 0.1 : 0}px`);
      el.style.setProperty("--ks-jar-y", `${animate ? -y * 0.055 : 0}px`);
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", scroll, { passive: true });
    const nodes = el.querySelectorAll(".ks-reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    nodes.forEach((node) => io.observe(node));
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      io.disconnect();
    };
  }, [animate]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) v.pause();
    });
    io.observe(v);
    const hide = () => {
      if (document.hidden) v.pause();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);

  return (
    <div
      ref={root}
      className={`ks-page ${animate ? "ks-motion" : "ks-still"}`}
      lang={lang}
    >
      <a href="#story-main" className="ks-skip">
        {c.explore}
      </a>
      <header className="ks-header" id="top">
        <a className="ks-brand" href="/story" aria-label="きみえの瓶詰め">
          <span>きみえ</span>
          <small>きみえの瓶詰め</small>
          <img
            className="ks-brand-stamp"
            src={stamp}
            alt=""
            aria-hidden="true"
          />
        </a>
        <nav className="ks-desktop-nav" aria-label={c.menu}>
          <a href="#flavors">{c.flavors}</a>
          <a href="#jars">{c.jars}</a>
          <a href="#table">{c.table}</a>
          <a href="#kitchen">{c.kitchen}</a>
        </nav>
        <div className="ks-header-tools">
          <label className="ks-language">
            <span className="ks-sr">{c.language}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
            >
              {Object.entries(LANG_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <a className="ks-button ks-header-cta" href="#jars">
            {c.explore}
            <ArrowUpRight size={16} />
          </a>
          <button
            className="ks-menu-button"
            aria-label={c.menu}
            aria-expanded={menu}
            aria-controls="story-menu"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
        {menu && (
          <nav id="story-menu" className="ks-mobile-nav" aria-label={c.menu}>
            {[
              ["#flavors", c.flavors],
              ["#jars", c.jars],
              ["#table", c.table],
              ["#kitchen", c.kitchen],
            ].map(([href, label]) => (
              <a href={href} key={href} onClick={() => setMenu(false)}>
                {label}
                <ArrowUpRight size={18} />
              </a>
            ))}
          </nav>
        )}
      </header>
      <main id="story-main">
        <section className="ks-hero ks-wrap" data-sc-act="flow">
          <div className="ks-hero-copy">
            <p className="ks-eyebrow">{c.eyebrow}</p>
            <h1>
              {c.hero[0]}
              <br />
              <em>{c.hero[1]}</em>
            </h1>
            <p className="ks-intro">{c.intro}</p>
            <a className="ks-button ks-button-gold" href="#flavors">
              {c.explore}
              <ArrowUpRight size={19} />
            </a>
            <span className="ks-hero-note">{c.caption}</span>
          </div>
          <div className="ks-hero-composition">
            <figure className="ks-kitchen-frame">
              <img src={hero} alt={c.kitchenCaption} loading="eager" />
              <figcaption>{c.kitchenCaption}</figcaption>
            </figure>
            <figure className="ks-floating-jar">
              <img src={mustard} alt={c.mustard} />
              <figcaption>
                <span>きみえ</span>
                <span>{c.mustard}</span>
              </figcaption>
            </figure>
          </div>
        </section>
        <section className="ks-quiet ks-wrap ks-reveal" data-sc-act="flow">
          <span className="ks-short-rule" />
          <p>
            {c.quiet[0]}
            <br />
            <em>{c.quiet[1]}</em>
          </p>
        </section>
        <section
          ref={encounter}
          className={`ks-flavor-encounter ${sceneAvailable ? "" : "ks-no-webgl"}`}
          id="flavors"
          data-sc-act="flow"
        >
          <div className="ks-flavor-stage">
            <div className="ks-flavor-copy">
              <h2>
                {c.flavorHeading[0]}
                <br />
                <em>{c.flavorHeading[1]}</em>
              </h2>
              <div
                className="ks-flavor-switch"
                role="group"
                aria-label={c.flavors}
              >
                <button
                  aria-pressed={flavor === "mustard"}
                  onClick={() => setFlavor("mustard")}
                >
                  {c.mustard}
                </button>
                <button
                  aria-pressed={flavor === "tapenade"}
                  onClick={() => setFlavor("tapenade")}
                >
                  {c.tapenade}
                </button>
              </div>
              <div className="ks-tasting-note" aria-live="polite">
                <h3>{flavor === "mustard" ? c.mustardNote : c.tapenadeNote}</h3>
                <p>{flavor === "mustard" ? c.mustardDesc : c.tapenadeDesc}</p>
              </div>
              <a className="ks-text-link" href={`#jar-${flavor}`}>
                {c.nextJar}
                <ArrowRight size={18} />
              </a>
            </div>
            <div className="ks-flavor-art">
              <FlavorScene
                flavor={flavor}
                motion={animate}
                section={encounter}
                onAvailability={setSceneAvailable}
              />
              <span className="ks-flavor-caption">{c.sceneNote}</span>
            </div>
          </div>
        </section>
        <section className="ks-products ks-wrap" id="jars" data-sc-act="flow">
          <div className="ks-section-heading ks-reveal">
            <h2>
              {c.two[0]}
              <br />
              <em>{c.two[1]}</em>
            </h2>
            <p>{c.twoDesc}</p>
          </div>
          <div className="ks-product-grid">
            {(["mustard", "tapenade"] as const).map((key, i) => {
              const item = t.lineup.items[i + 1];
              return (
                <article
                  id={`jar-${key}`}
                  key={key}
                  className={`ks-product ks-reveal ${flavor === key ? "is-selected" : ""}`}
                >
                  <div className="ks-product-photo">
                    <img
                      src={i === 0 ? mustard : tapenade}
                      alt={item.name}
                      loading="lazy"
                    />
                    <span className="ks-product-kanji">
                      {i === 0 ? "粒マスタード" : "タプナード"}
                    </span>
                  </div>
                  <div className="ks-product-title">
                    <h3>{i === 0 ? c.mustard : c.tapenade}</h3>
                    <span>{item.size}</span>
                  </div>
                  <p>{i === 0 ? c.mustardDesc : c.tapenadeDesc}</p>
                  <button
                    className="ks-product-choice"
                    aria-pressed={flavor === key}
                    onClick={() => setFlavor(key)}
                  >
                    <span>{flavor === key ? c.selected : c.choose}</span>
                    {flavor === key ? <Check size={18} /> : <Plus size={18} />}
                  </button>
                  <details>
                    <summary>
                      {c.ingredients}
                      <Plus size={17} />
                    </summary>
                    <p>{t.ingredients.items[i].desc}</p>
                  </details>
                </article>
              );
            })}
          </div>
        </section>
        <section id="table" className="ks-meals" data-sc-act="flow">
          <div className="ks-wrap ks-meal-layout">
            <div className="ks-meal-copy">
              <h2>
                {c.mealTitle[0]}
                <br />
                <em>{c.mealTitle[1]}</em>
              </h2>
              <p>{c.mealIntro}</p>
              <div
                className="ks-meal-choices"
                role="group"
                aria-label={c.serving}
              >
                {c.meals.map((name, i) => (
                  <button
                    key={i}
                    aria-pressed={meal === i}
                    onClick={() => setMeal(i)}
                  >
                    <span>{name}</span>
                    <ArrowUpRight size={20} />
                  </button>
                ))}
              </div>
              <a
                href="#jar-mustard"
                className="ks-text-link"
                onClick={() => setFlavor("mustard")}
              >
                {c.pairing}
                <ArrowRight size={17} />
              </a>
            </div>
            <figure className="ks-meal-image">
              <img
                key={meal}
                src={[salad, pasta, potatoes][meal]}
                alt={c.mealNames[meal]}
                loading="lazy"
              />
              <figcaption aria-live="polite">
                <h3>{c.mealNames[meal]}</h3>
                <p>{c.mealDescs[meal]}</p>
              </figcaption>
            </figure>
          </div>
        </section>
        <section
          id="kitchen"
          className="ks-maker ks-wrap ks-reveal"
          data-sc-act="flow"
        >
          <figure>
            <video
              ref={video}
              controls
              playsInline
              preload="none"
              poster={hero}
              aria-label={c.kitchenCaption}
            >
              <source src={movie} type="video/mp4" />
            </video>
            <figcaption>{c.kitchenCaption}</figcaption>
          </figure>
          <div>
            <h2>
              {c.makerTitle[0]}
              <br />
              <em>{c.makerTitle[1]}</em>
            </h2>
            <p>{c.makerIntro}</p>
            <div className="ks-process">
              {[0, 2, 4].map((i) => (
                <details key={i}>
                  <summary>
                    {t.process.steps[i].title}
                    <Plus size={18} />
                  </summary>
                  <p>{t.process.steps[i].desc}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="ks-close" data-sc-act="flow">
          <div className="ks-wrap">
            <p>{c.closeText}</p>
            <h2>
              {c.close[0]}
              <br />
              <em>{c.close[1]}</em>
            </h2>
            <a className="ks-button ks-button-gold" href={`#jar-${flavor}`}>
              {c.explore}
              <ArrowUpRight size={20} />
            </a>
            <span className="ks-close-japanese">
              ひとさじで、いつもの食卓を特別に。
            </span>
          </div>
        </section>
      </main>
      <footer className="ks-footer ks-wrap">
        <a className="ks-brand" href="#top" aria-label="きみえの瓶詰め">
          <span>きみえ</span>
          <small>きみえの瓶詰め</small>
          <img
            className="ks-brand-stamp"
            src={stamp}
            alt=""
            aria-hidden="true"
          />
        </a>
        <a href="/">{c.original}</a>
        <a href="#top">
          {c.back}
          <ArrowUpRight size={16} />
        </a>
      </footer>
    </div>
  );
}

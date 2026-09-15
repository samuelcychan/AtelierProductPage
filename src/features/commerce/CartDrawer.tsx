import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { translations, type Lang } from "@/app/i18n";
import { useCommerce } from "./CommerceProvider";
import { MAX_QUANTITY } from "./cart";
import { formatYen } from "./money";

export interface DrawerProduct {
  name: string;
  size?: string;
  photo?: string;
}

type Skin = "grove" | "story";

const display = { fontFamily: "Fraunces, Georgia, serif" };
const body = { fontFamily: "Mulish, system-ui, sans-serif" };
const DURATION_MS = 300;

function useReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduce, setReduce] = useState(() => typeof window !== "undefined" && window.matchMedia?.(query).matches);
  useEffect(() => {
    const mql = window.matchMedia?.(query);
    if (!mql) return;
    const onChange = () => setReduce(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return reduce;
}

// Grove skin: inline styles on the page's --ym-* variables (both main-page themes).
const G = {
  backdrop: { background: "var(--ym-scrim-50)" } as CSSProperties,
  panel: { ...body, background: "var(--ym-bg)", color: "var(--ym-fg)", boxShadow: "-20px 0 40px -12px var(--ym-shadow)" } as CSSProperties,
  rule: "1px solid var(--ym-rule)",
  title: { ...display, fontSize: "1.6rem", fontWeight: 600, lineHeight: 1.1, color: "var(--ym-fg)", margin: 0 } as CSSProperties,
  iconButton: { width: 40, height: 40, color: "var(--ym-fg)", border: "1px solid var(--ym-rule-15)", borderRadius: "var(--ym-radius)" } as CSSProperties,
  small: { ...body, fontSize: "0.72rem", letterSpacing: "0.08em", color: "var(--ym-muted)" } as CSSProperties,
  name: { ...display, fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.25, color: "var(--ym-fg)" } as CSSProperties,
  thumb: { width: 64, height: 80, objectFit: "cover", background: "var(--ym-bg-alt)", border: "1px solid var(--ym-rule-10)" } as CSSProperties,
  stepper: { border: "1px solid var(--ym-rule-15)", borderRadius: "var(--ym-radius)" } as CSSProperties,
  step: { width: 34, height: 34, color: "var(--ym-fg)" } as CSSProperties,
  checkout: { ...body, padding: "0.95rem 1.6rem", borderRadius: "var(--ym-radius)", background: "var(--ym-gold)", color: "var(--ym-fg-dark)" } as CSSProperties,
  message: { ...body, fontSize: "0.85rem", lineHeight: 1.6, color: "var(--ym-fg)", background: "var(--ym-bg-alt)", borderLeft: "2px solid var(--ym-gold)" } as CSSProperties,
};

/**
 * The cart drawer shared by "/" (skin "grove") and "/story" (skin "story",
 * styled by the .ks-cart* rules in story.css). Render it inside the page's
 * root element so it inherits that page's variables.
 */
export function CartDrawer({ skin, lang, products, browseHref }: {
  skin: Skin;
  lang: Lang;
  products: Record<string, DrawerProduct>;
  browseHref: string;
}) {
  const { status, priceFor, lines, subtotalLabel, canCheckout, busy, message, drawerOpen, closeDrawer, setQuantity, checkout } = useCommerce();
  const C = translations[lang].cart;
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const grove = skin === "grove";
  const titleId = `ym-cart-title-${skin}`;

  // Focus, Escape, focus trap and scroll lock while open; focus returns to the opener on close.
  useEffect(() => {
    if (!drawerOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Synchronous: the panel is already visible in the committed DOM, and
    // requestAnimationFrame can be throttled in background tabs.
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeDrawer();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panelRef.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);

    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = previousOverflow;
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [drawerOpen, closeDrawer]);

  const rootStyle: CSSProperties | undefined = grove
    ? {
        visibility: drawerOpen ? "visible" : "hidden",
        transition: reduce ? "none" : `visibility 0s linear ${drawerOpen ? 0 : DURATION_MS}ms`,
      }
    : undefined;

  return (
    <div
      className={grove ? "fixed inset-0 z-[100]" : `ks-cart${drawerOpen ? " is-open" : ""}`}
      style={rootStyle}
      aria-hidden={!drawerOpen}
    >
      <div
        className={grove ? "absolute inset-0" : "ks-cart-backdrop"}
        style={grove ? { ...G.backdrop, opacity: drawerOpen ? 1 : 0, transition: reduce ? "none" : `opacity ${DURATION_MS}ms ease` } : undefined}
        onClick={closeDrawer}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={grove ? "absolute right-0 top-0 h-full w-full min-[480px]:w-[420px] flex flex-col" : "ks-cart-panel"}
        style={grove ? { ...G.panel, transform: drawerOpen ? "translateX(0)" : "translateX(100%)", transition: reduce ? "none" : `transform ${DURATION_MS}ms ease` } : undefined}
      >
        <div className={grove ? "flex items-center justify-between gap-4 px-6 py-5" : "ks-cart-header"} style={grove ? { borderBottom: G.rule } : undefined}>
          <h2 id={titleId} className={grove ? "" : "ks-cart-title"} style={grove ? G.title : undefined}>{C.title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeDrawer}
            aria-label={C.close}
            className={grove ? "flex items-center justify-center shrink-0 ym-hover-bg-alt" : "ks-cart-icon-button"}
            style={grove ? G.iconButton : undefined}
          >
            <X size={18} />
          </button>
        </div>

        <div className={grove ? "flex-1 overflow-y-auto px-6" : "ks-cart-body"}>
          {lines.length === 0 ? (
            <div className={grove ? "py-12 text-center flex flex-col items-center gap-4" : "ks-cart-empty"}>
              <ShoppingBag size={28} aria-hidden="true" style={grove ? { color: "var(--ym-gold)" } : undefined} />
              <p style={grove ? { ...body, fontSize: "0.95rem", color: "var(--ym-muted)", margin: 0 } : undefined}>{C.empty}</p>
              <a
                href={browseHref}
                onClick={closeDrawer}
                className={grove ? "ym-hover-gold underline underline-offset-4" : "ks-text-link"}
                style={grove ? { ...body, fontSize: "0.9rem", color: "var(--ym-fg)" } : undefined}
              >
                {C.browse}
              </a>
            </div>
          ) : (
            <ul className={grove ? "list-none m-0 p-0" : "ks-cart-lines"}>
              {lines.map((line) => {
                const product = products[line.slug];
                const name = product?.name ?? line.slug;
                const price = priceFor(line.slug);
                const soldOut = status === "ready" && !price?.available;
                return (
                  <li key={line.slug} className={grove ? "flex gap-4 py-5" : "ks-cart-line"} style={grove ? { borderBottom: G.rule } : undefined}>
                    {product?.photo ? (
                      <img src={product.photo} alt="" className={grove ? "block shrink-0" : "ks-cart-thumb"} style={grove ? G.thumb : undefined} />
                    ) : (
                      <span className={grove ? "block shrink-0" : "ks-cart-thumb"} style={grove ? G.thumb : undefined} aria-hidden="true" />
                    )}
                    <div className={grove ? "flex-1 min-w-0 flex flex-col gap-2" : "ks-cart-line-main"}>
                      <div className={grove ? "flex items-start justify-between gap-3" : "ks-cart-line-top"}>
                        <div>
                          <div className={grove ? "" : "ks-cart-name"} style={grove ? G.name : undefined}>{name}</div>
                          {product?.size && <div className={grove ? "" : "ks-cart-size"} style={grove ? G.small : undefined}>{product.size}</div>}
                        </div>
                        <div className={grove ? "whitespace-nowrap text-right" : "ks-cart-line-total"} style={grove ? { ...display, fontSize: "1.05rem", fontWeight: 600 } : undefined}>
                          {soldOut ? (
                            <span className={grove ? "" : "ks-cart-soldout"} style={grove ? { ...G.small, color: "var(--ym-gold)", letterSpacing: "0.04em" } : undefined}>{C.soldOut}</span>
                          ) : price ? (
                            formatYen(price.unitAmount * line.quantity)
                          ) : null}
                        </div>
                      </div>
                      <div className={grove ? "flex items-center justify-between gap-3" : "ks-cart-line-controls"}>
                        <div className={grove ? "flex items-center" : "ks-cart-stepper"} style={grove ? G.stepper : undefined} role="group" aria-label={`${C.quantity}: ${name}`}>
                          <button
                            type="button"
                            onClick={() => setQuantity(line.slug, line.quantity - 1)}
                            disabled={busy}
                            aria-label={`${C.decrease}: ${name}`}
                            className={grove ? "flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" : ""}
                            style={grove ? G.step : undefined}
                          >
                            <Minus size={14} />
                          </button>
                          <output
                            aria-live="polite"
                            aria-label={`${C.quantity}: ${line.quantity}`}
                            className={grove ? "text-center" : "ks-cart-qty"}
                            style={grove ? { ...body, minWidth: "2rem", fontSize: "0.9rem", fontWeight: 600 } : undefined}
                          >
                            {line.quantity}
                          </output>
                          <button
                            type="button"
                            onClick={() => setQuantity(line.slug, line.quantity + 1)}
                            disabled={busy || line.quantity >= MAX_QUANTITY || soldOut}
                            aria-label={`${C.increase}: ${name}`}
                            className={grove ? "flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" : ""}
                            style={grove ? G.step : undefined}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.slug, 0)}
                          disabled={busy}
                          aria-label={`${C.remove}: ${name}`}
                          className={grove ? "flex items-center gap-1.5 ym-hover-gold disabled:opacity-50 disabled:cursor-not-allowed" : "ks-cart-remove"}
                          style={grove ? { ...G.small, letterSpacing: "0.04em" } : undefined}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          <span>{C.remove}</span>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={grove ? "px-6 pt-4 pb-6 flex flex-col gap-3" : "ks-cart-footer"} style={grove ? { borderTop: G.rule } : undefined}>
          <div aria-live="polite" className={grove ? "" : "ks-cart-message-region"}>
            {message && (
              <p className={grove ? "px-3 py-2" : "ks-cart-message"} style={grove ? { ...G.message, margin: 0 } : undefined}>{message}</p>
            )}
          </div>
          {lines.length > 0 && (
            <div className={grove ? "flex items-baseline justify-between gap-4" : "ks-cart-subtotal"}>
              <span style={grove ? { ...G.small, letterSpacing: "0.14em", textTransform: "uppercase" } : undefined}>{C.subtotal}</span>
              <span style={grove ? { ...display, fontSize: "1.5rem", fontWeight: 600 } : undefined}>{subtotalLabel}</span>
            </div>
          )}
          <p className={grove ? "" : "ks-cart-note"} style={grove ? { ...G.small, letterSpacing: "0.02em", margin: 0 } : undefined}>{C.shippingNote}</p>
          <button
            type="button"
            onClick={() => void checkout()}
            disabled={!canCheckout}
            aria-busy={busy}
            className={
              grove
                ? "w-full flex items-center justify-center gap-3 font-semibold transition-opacity enabled:hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                : "ks-button ks-button-gold ks-cart-checkout"
            }
            style={grove ? G.checkout : undefined}
          >
            <ShoppingBag size={17} aria-hidden="true" />
            {busy ? C.redirecting : C.checkout}
          </button>
        </div>
      </div>
    </div>
  );
}

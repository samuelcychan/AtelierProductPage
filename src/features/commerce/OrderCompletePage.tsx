import { useEffect, useState } from "react";
import { ArrowLeft, Check, Clock } from "lucide-react";
import { translations } from "@/app/i18n";
import { fetchOrder, type OrderSummary } from "./api";
import { preferredLang, writeCart } from "./cart";
import { formatMoney } from "./money";

// Stripe's success_url: /order/complete?session_id={CHECKOUT_SESSION_ID}.
// Styled with the Fresh Garden defaults of the --ym-* variables in theme.css.

const display = { fontFamily: "Fraunces, Georgia, serif" };
const body = { fontFamily: "Mulish, system-ui, sans-serif" };

const LEGAL_LINKS = [
  ["/legal/tokushoho", "tokushoho"],
  ["/legal/privacy", "privacy"],
  ["/legal/shipping", "shipping"],
  ["/legal/returns", "returns"],
] as const;

type View =
  | { kind: "loading" }
  | { kind: "paid"; order: OrderSummary }
  | { kind: "pending"; order: OrderSummary }
  | { kind: "notFound" }
  | { kind: "error" };

const SESSION_ID = /^cs_[A-Za-z0-9_]{1,250}$/;

export default function OrderCompletePage() {
  const [lang] = useState(preferredLang);
  const T = translations[lang];
  const [view, setView] = useState<View>({ kind: "loading" });

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${T.order.thanks} | ${T.pageTitle}`;
  }, [lang, T]);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id") ?? "";
    if (!SESSION_ID.test(sessionId)) {
      setView({ kind: "notFound" });
      return;
    }
    let active = true;
    void fetchOrder(sessionId).then((result) => {
      if (!active) return;
      if (result.kind === "not_found") return setView({ kind: "notFound" });
      if (result.kind === "error") return setView({ kind: "error" });
      const { order } = result;
      if (order.status === "complete" && order.paymentStatus !== "unpaid") {
        writeCart([]); // paid: the jars are ordered, so the cart is done
        setView({ kind: "paid", order });
      } else if (order.status === "complete") {
        setView({ kind: "pending", order });
      } else {
        setView({ kind: "notFound" }); // open or expired
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const order = view.kind === "paid" || view.kind === "pending" ? view.order : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ ...body, background: "var(--ym-bg)", color: "var(--ym-fg)" }}>
      <header className="px-6 py-5" style={{ borderBottom: "1px solid var(--ym-rule)" }}>
        <a href="/" className="whitespace-nowrap" style={{ ...display, fontSize: "1.2rem", letterSpacing: "0.02em" }}>
          <span style={{ color: "var(--ym-fg)" }}>{T.brand[0]}</span>{" "}
          <span style={{ color: "var(--ym-gold)" }}>{T.brand[1]}</span>
        </a>
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-6 py-16 box-border">
        {view.kind === "loading" ? (
          <p role="status" style={{ ...body, color: "var(--ym-muted)" }}>{T.order.loading}</p>
        ) : (
          <div role="status">
            {view.kind === "paid" || view.kind === "pending" ? (
              <div
                className="flex items-center justify-center mb-6"
                aria-hidden="true"
                style={{ width: 52, height: 52, borderRadius: "var(--ym-radius)", background: view.kind === "paid" ? "var(--ym-primary)" : "var(--ym-bg-alt)", color: view.kind === "paid" ? "var(--ym-bg)" : "var(--ym-fg)" }}
              >
                {view.kind === "paid" ? <Check size={24} /> : <Clock size={24} />}
              </div>
            ) : null}
            <h1 style={{ ...display, fontSize: "clamp(1.9rem, 5vw, 2.8rem)", fontWeight: 600, lineHeight: 1.1, margin: 0, color: "var(--ym-fg)" }}>
              {view.kind === "paid" ? T.order.thanks : view.kind === "pending" ? T.order.pending : view.kind === "notFound" ? T.order.notFound : T.cart.error}
            </h1>
          </div>
        )}

        {order && (
          <section className="mt-10">
            {order.orderNumber && (
              <p style={{ ...body, fontSize: "0.8rem", letterSpacing: "0.14em", color: "var(--ym-muted)", margin: "0 0 1rem" }}>
                {T.order.number}: <strong style={{ color: "var(--ym-fg)", letterSpacing: "0.06em" }}>{order.orderNumber}</strong>
              </p>
            )}
            {order.lines.length > 0 && (
              <ul className="list-none m-0 p-0" style={{ borderTop: "1px solid var(--ym-rule)" }}>
                {order.lines.map((line, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-4 py-4" style={{ borderBottom: "1px solid var(--ym-rule)" }}>
                    <span style={{ ...body, fontSize: "0.95rem" }}>
                      {line.name}
                      {line.quantity !== null && <span style={{ color: "var(--ym-muted)" }}> × {line.quantity}</span>}
                    </span>
                    <span className="whitespace-nowrap" style={{ ...display, fontWeight: 600 }}>{formatMoney(line.amount, order.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
            {order.total !== null && (
              <div className="flex items-baseline justify-between gap-4 pt-5">
                <span style={{ ...body, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ym-muted)" }}>{T.order.total}</span>
                <span style={{ ...display, fontSize: "1.6rem", fontWeight: 600 }}>{formatMoney(order.total, order.currency)}</span>
              </div>
            )}
            {view.kind === "paid" && (
              <p style={{ ...body, fontSize: "0.95rem", lineHeight: 1.7, color: "var(--ym-muted)", margin: "2rem 0 0" }}>{T.order.receipt}</p>
            )}
          </section>
        )}

        {view.kind !== "loading" && (
          <a
            href="/"
            className="inline-flex items-center gap-3 font-semibold mt-10 hover:opacity-90 transition-opacity"
            style={{ ...body, padding: "0.85rem 1.6rem", borderRadius: "var(--ym-radius)", background: "var(--ym-gold)", color: "var(--ym-fg-dark)" }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {T.order.back}
          </a>
        )}
      </main>

      <footer className="px-6 py-8" style={{ background: "var(--ym-fg-dark)" }}>
        <nav className="max-w-xl mx-auto flex flex-wrap gap-x-6 gap-y-2">
          {LEGAL_LINKS.map(([href, key]) => (
            <a key={key} href={href} className="ym-hover-gold" style={{ ...body, fontSize: "0.75rem", color: "var(--ym-muted-lt)" }}>
              {T.legal[key]}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}

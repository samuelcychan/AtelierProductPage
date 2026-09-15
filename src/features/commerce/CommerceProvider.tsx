import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { translations, type Lang } from "@/app/i18n";
import { fetchCatalog, startCheckout, type CatalogProduct, type ReturnPath } from "./api";
import { CART_KEY, MAX_QUANTITY, readCart, rememberCheckoutLang, writeCart, type CartLine } from "./cart";
import { formatYen } from "./money";

export type CommerceStatus = "off" | "loading" | "ready" | "unavailable";

export interface PriceInfo {
  label: string;
  unitAmount: number;
  available: boolean;
}

export interface CommerceValue {
  status: CommerceStatus;
  priceFor(slug: string): PriceInfo | undefined;
  lines: CartLine[];
  count: number;
  subtotalLabel: string;
  /** Ready, not busy, non-empty, and every line is priced and available. */
  canCheckout: boolean;
  busy: boolean; // checkout request in flight
  message?: string; // localised cart.* message
  drawerOpen: boolean;
  openDrawer(): void;
  closeDrawer(): void;
  add(slug: string): void; // opens the drawer
  setQuantity(slug: string, quantity: number): void; // 0 removes; max 10
  checkout(): Promise<void>; // POST, then window.location.assign(url)
}

type MessageKey = "priceChanged" | "stockLimited" | "error" | "unavailable";

const CATALOG_MAX_AGE_MS = 60_000;

const CommerceCtx = createContext<CommerceValue | null>(null);

export function useCommerce(): CommerceValue {
  const value = useContext(CommerceCtx);
  if (!value) throw new Error("useCommerce must be used inside <CommerceProvider>");
  return value;
}

function sameLines(a: CartLine[], b: CartLine[]) {
  return a.length === b.length && a.every((line, i) => line.slug === b[i].slug && line.quantity === b[i].quantity);
}

/**
 * Prices, cart and drawer state for one page ("/" or "/story").
 *
 * - `/api/catalog` enabled: false → "off": no prices, no buy buttons.
 * - Loading → buttons disabled, no price.
 * - Request failed or 503 → "unavailable": prices hidden, buttons disabled (D11).
 * - `?cart=open` (Stripe cancel) → drawer opens and the parameter is removed.
 *
 * Cart edits are local and never wait on the network; the cart is shared with
 * the other page (and other tabs) through localStorage `ym-cart-v1`.
 */
export function CommerceProvider({ lang, returnPath, children }: { lang: Lang; returnPath: ReturnPath; children: ReactNode }) {
  const [status, setStatus] = useState<CommerceStatus>("loading");
  const [products, setProducts] = useState<Map<string, CatalogProduct>>(() => new Map());
  const [lines, setLines] = useState<CartLine[]>(readCart);
  const [busy, setBusy] = useState(false);
  const [messageKey, setMessageKey] = useState<MessageKey | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const busyRef = useRef(false);
  const fetchedAt = useRef(0);
  const mounted = useRef(true);

  const loadCatalog = useCallback(async () => {
    fetchedAt.current = Date.now();
    const result = await fetchCatalog();
    if (!mounted.current) return;
    if (result.kind === "ready") {
      setProducts(new Map(result.products.map((p) => [p.slug, p] as const)));
      setStatus("ready");
    } else {
      setStatus(result.kind);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void loadCatalog();
    return () => {
      mounted.current = false;
    };
  }, [loadCatalog]);

  // Persist, and follow edits made on the other page or in another tab.
  useEffect(() => {
    writeCart(lines);
  }, [lines]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CART_KEY && event.key !== null) return;
      const next = readCart();
      setLines((prev) => (sameLines(prev, next) ? prev : next));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Cancel from Stripe returns to `<returnPath>?cart=open`.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("cart") !== "open") return;
    url.searchParams.delete("cart");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    setDrawerOpen(true);
  }, []);

  // Back button from Stripe restores this page from the bfcache with busy still set.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      busyRef.current = false;
      setBusy(false);
      setMessageKey(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const priceFor = useCallback(
    (slug: string): PriceInfo | undefined => {
      if (status !== "ready") return undefined;
      const product = products.get(slug);
      if (!product || !product.forSale || product.unitAmount === null) return undefined;
      return { label: formatYen(product.unitAmount), unitAmount: product.unitAmount, available: product.available };
    },
    [status, products],
  );

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    // Prices shown in the drawer should be recent; refresh quietly if stale.
    if (Date.now() - fetchedAt.current > CATALOG_MAX_AGE_MS) void loadCatalog();
  }, [loadCatalog]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    const q = Math.max(0, Math.min(MAX_QUANTITY, Math.floor(quantity)));
    setMessageKey(null);
    setLines((prev) =>
      q === 0 ? prev.filter((l) => l.slug !== slug) : prev.map((l) => (l.slug === slug ? { ...l, quantity: q } : l)),
    );
  }, []);

  const add = useCallback(
    (slug: string) => {
      if (!priceFor(slug)?.available) return;
      setMessageKey(null);
      setLines((prev) => {
        const existing = prev.find((l) => l.slug === slug);
        if (!existing) return [...prev, { slug, quantity: 1 }];
        return prev.map((l) => (l.slug === slug ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + 1) } : l));
      });
      setDrawerOpen(true);
    },
    [priceFor],
  );

  const priced = lines.map((line) => ({ ...line, price: priceFor(line.slug) }));
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const allAvailable = priced.every((l) => l.price?.available);
  const canCheckout = status === "ready" && !busy && lines.length > 0 && allAvailable;
  const subtotal = priced.reduce((sum, l) => sum + (l.price ? l.price.unitAmount * l.quantity : 0), 0);
  const subtotalLabel = status === "ready" && lines.length > 0 ? formatYen(subtotal) : "";

  const checkout = useCallback(async () => {
    if (busyRef.current || !canCheckout) return; // double-click safety
    const request = priced.map((l) => ({ slug: l.slug, quantity: l.quantity, unitAmount: l.price!.unitAmount }));
    busyRef.current = true;
    setBusy(true);
    setMessageKey(null);

    const result = await startCheckout(request, lang, returnPath);

    switch (result.kind) {
      case "redirect":
        rememberCheckoutLang(lang);
        window.location.assign(result.url);
        return; // stay busy while the browser leaves
      case "price_changed":
        setProducts((prev) => {
          const next = new Map(prev);
          const product = next.get(result.slug);
          if (product) next.set(result.slug, { ...product, unitAmount: result.unitAmount });
          return next;
        });
        setMessageKey("priceChanged");
        setDrawerOpen(true);
        break;
      case "insufficient_stock":
        setLines((prev) =>
          prev
            .map((l) => (l.slug === result.slug ? { ...l, quantity: Math.min(l.quantity, result.available) } : l))
            .filter((l) => l.quantity > 0),
        );
        if (result.available <= 0) {
          setProducts((prev) => {
            const next = new Map(prev);
            const product = next.get(result.slug);
            if (product) next.set(result.slug, { ...product, available: false });
            return next;
          });
        }
        setMessageKey("stockLimited");
        setDrawerOpen(true);
        break;
      case "not_for_sale":
        setProducts((prev) => {
          const next = new Map(prev);
          const product = next.get(result.slug);
          if (product) next.set(result.slug, { ...product, forSale: false });
          return next;
        });
        setMessageKey("error");
        break;
      case "unavailable":
        setMessageKey("unavailable");
        break;
      default:
        setMessageKey("error");
    }
    busyRef.current = false;
    setBusy(false);
  }, [canCheckout, priced, lang, returnPath]);

  const cartCopy = translations[lang].cart;
  const message = messageKey
    ? cartCopy[messageKey]
    : busy
      ? cartCopy.redirecting
      : status === "unavailable"
        ? cartCopy.unavailable
        : undefined;

  const value = useMemo<CommerceValue>(
    () => ({
      status, priceFor, lines, count, subtotalLabel, canCheckout, busy, message,
      drawerOpen, openDrawer, closeDrawer, add, setQuantity, checkout,
    }),
    [status, priceFor, lines, count, subtotalLabel, canCheckout, busy, message, drawerOpen, openDrawer, closeDrawer, add, setQuantity, checkout],
  );

  return <CommerceCtx.Provider value={value}>{children}</CommerceCtx.Provider>;
}

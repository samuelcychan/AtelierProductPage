// Development-only stand-in for /api/catalog, /api/checkout and /api/order.
// Imported only from the `import.meta.env.DEV` branch in api.ts, so it never
// reaches a production bundle.
//
//   ?commerce=mock                      sample catalog, checkout succeeds (paid)
//   ?commerce=mock&mock=<scenario>      one of SCENARIOS below
//   ?commerce=live                      back to the real /api endpoints
//
// The choice is kept in sessionStorage, so it survives navigating between
// "/", "/story" and "/order/complete" in the same tab.

const SCENARIOS = [
  "ok",                   // both jars available; checkout → /order/complete paid
  "pending",              // checkout → /order/complete, complete but unpaid
  "slow",                 // catalog takes 3 s (see the loading state)
  "off",                  // catalog { enabled: false }
  "unavailable",          // catalog 503
  "soldout",              // tapenade shows "Sold out"
  "price_changed",        // first checkout: mustard now ¥2,000; second succeeds
  "insufficient_stock",   // checkout finds mustard stock 1, tapenade stock 0
  "not_for_sale",         // checkout: first line no longer for sale
  "checkout_unavailable", // checkout 503
  "network",              // checkout request fails
] as const;

export type MockScenario = (typeof SCENARIOS)[number];

const SCENARIO_KEY = "ym-commerce-mock";
const STATE_KEY = "ym-commerce-mock-state";

const BASE_PRICES: Record<string, number> = { mustard: 1900, tapenade: 2100 };
const NAMES: Record<string, string> = {
  mustard: "Whole-Grain Mustard Sauce 200g",
  tapenade: "Tapenade Sauce 200g",
};

interface MockState {
  priceBumped: boolean;
  lastLines: Array<{ slug: string; quantity: number }>;
}

const asScenario = (value: string | null): MockScenario | null =>
  SCENARIOS.find((s) => s === value) ?? null;

export function mockScenario(): MockScenario | null {
  const params = new URLSearchParams(window.location.search);
  const commerce = params.get("commerce");
  try {
    if (commerce === "live") {
      window.sessionStorage.removeItem(SCENARIO_KEY);
      window.sessionStorage.removeItem(STATE_KEY);
      return null;
    }
    if (commerce === "mock") {
      const scenario = asScenario(params.get("mock")) ?? "ok";
      if (window.sessionStorage.getItem(SCENARIO_KEY) !== scenario) {
        window.sessionStorage.setItem(SCENARIO_KEY, scenario);
        window.sessionStorage.removeItem(STATE_KEY);
      }
      return scenario;
    }
    return asScenario(window.sessionStorage.getItem(SCENARIO_KEY));
  } catch {
    return commerce === "mock" ? asScenario(params.get("mock")) ?? "ok" : null;
  }
}

function readState(): MockState {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(STATE_KEY) ?? "null") as Partial<MockState> | null;
    return { priceBumped: parsed?.priceBumped === true, lastLines: parsed?.lastLines ?? [] };
  } catch {
    return { priceBumped: false, lastLines: [] };
  }
}

function writeState(state: MockState) {
  try {
    window.sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function priceOf(slug: string, state: MockState): number | null {
  const base = BASE_PRICES[slug];
  if (base === undefined) return null;
  return slug === "mustard" && state.priceBumped ? base + 100 : base;
}

export async function mockSend(path: string, init: RequestInit): Promise<{ status: number; body: unknown }> {
  const scenario = mockScenario() ?? "ok";
  const state = readState();
  const url = new URL(path, window.location.origin);
  await delay(scenario === "slow" && url.pathname === "/api/catalog" ? 3000 : 350);
  console.info(`[commerce mock] ${init.method ?? "GET"} ${url.pathname} (scenario: ${scenario})`);

  if (url.pathname === "/api/catalog") {
    if (scenario === "off") return { status: 200, body: { enabled: false } };
    if (scenario === "unavailable") return { status: 503, body: { enabled: true, unavailable: true } };
    return {
      status: 200,
      body: {
        enabled: true,
        products: [
          { slug: "mustard", forSale: true, available: true, unitAmount: priceOf("mustard", state), currency: "JPY" },
          { slug: "tapenade", forSale: true, available: scenario !== "soldout", unitAmount: priceOf("tapenade", state), currency: "JPY" },
          { slug: "preserved-lemon", forSale: false, available: false, unitAmount: null, currency: "JPY" },
        ],
      },
    };
  }

  if (url.pathname === "/api/checkout" && init.method === "POST") {
    const request = JSON.parse(String(init.body)) as {
      lines: Array<{ slug: string; quantity: number; unitAmount: number }>;
    };
    const lines = request.lines ?? [];
    if (scenario === "network") throw new TypeError("Failed to fetch (mock)");
    if (scenario === "checkout_unavailable" || scenario === "unavailable") {
      return { status: 503, body: { error: "unavailable" } };
    }
    if (!lines.length) return { status: 400, body: { error: "invalid_cart" } };
    if (scenario === "not_for_sale") return { status: 409, body: { error: "not_for_sale", slug: lines[0].slug } };

    if (scenario === "price_changed" && !state.priceBumped) {
      state.priceBumped = true;
      writeState(state);
    }
    for (const line of lines) {
      const price = priceOf(line.slug, state);
      if (price === null) return { status: 409, body: { error: "not_for_sale", slug: line.slug } };
      if (price !== line.unitAmount) {
        return { status: 409, body: { error: "price_changed", slug: line.slug, unitAmount: price } };
      }
      const stock =
        scenario === "insufficient_stock" ? (line.slug === "mustard" ? 1 : 0) :
        scenario === "soldout" && line.slug === "tapenade" ? 0 : 99;
      if (line.quantity > stock) {
        return { status: 409, body: { error: "insufficient_stock", slug: line.slug, available: stock } };
      }
    }

    writeState({ ...state, lastLines: lines.map(({ slug, quantity }) => ({ slug, quantity })) });
    const sessionId = scenario === "pending" ? "cs_mock_pending" : "cs_mock_paid";
    return { status: 200, body: { url: `${window.location.origin}/order/complete?session_id=${sessionId}` } };
  }

  if (url.pathname === "/api/order") {
    const id = url.searchParams.get("session_id") ?? "";
    const lastLines = state.lastLines.length ? state.lastLines : [{ slug: "mustard", quantity: 2 }, { slug: "tapenade", quantity: 1 }];
    const lines = lastLines.map((l) => ({
      name: NAMES[l.slug] ?? l.slug,
      quantity: l.quantity,
      amount: (priceOf(l.slug, state) ?? 0) * l.quantity,
    }));
    const total = lines.reduce((sum, l) => sum + l.amount, 0);
    const order = (status: string, paymentStatus: string) => ({
      status: 200,
      body: { status, paymentStatus, orderNumber: "KJ-MOCK-0001", total, currency: "jpy", lines },
    });
    if (id === "cs_mock_paid") return order("complete", "paid");
    if (id === "cs_mock_pending") return order("complete", "unpaid");
    if (id === "cs_mock_open") return order("open", "unpaid");
    if (id === "cs_mock_expired") return order("expired", "unpaid");
    return { status: 404, body: { error: "not_found" } };
  }

  return { status: 404, body: null };
}

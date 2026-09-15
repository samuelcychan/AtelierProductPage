export function json(body: unknown, status = 200, cache = "no-store"): Response {
  return Response.json(body, { status, headers: { "Cache-Control": cache } });
}

/** Parses a JSON body of at most `maxBytes`; returns undefined when missing, too large or malformed. */
export async function readJson(request: Request, maxBytes = 4_000): Promise<unknown> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return undefined;
  const text = await request.text();
  if (!text || Buffer.byteLength(text, "utf8") > maxBytes) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * State-changing requests must come from this site. A missing Origin, or the
 * literal "null" origin (sandboxed frames, some redirects), is refused without throwing.
 */
export function sameOrigin(request: Request, siteUrl: string): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  if (siteUrl && origin === siteUrl) return true;
  if (process.env.VERCEL_ENV !== "preview") return false;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;
    // Only this deployment's own preview hosts, not any *.vercel.app site.
    const hosts = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(Boolean);
    return hosts.includes(url.host);
  } catch {
    return false;
  }
}

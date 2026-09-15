import { createClient, type SanityClient } from "@sanity/client";
import { env } from "./env.js";

let client: SanityClient | null = null;

// Uncached API, published perspective, write token: prices and stock must be current.
export function sanity(): SanityClient {
  client ??= createClient({
    projectId: env.sanityProjectId,
    dataset: env.sanityDataset,
    apiVersion: "2026-09-14",
    token: env.sanityWriteToken,
    useCdn: false,
    perspective: "published",
  });
  return client;
}

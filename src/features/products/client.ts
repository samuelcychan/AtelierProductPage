import { createClient, type SanityClient } from "@sanity/client";
import { SANITY } from "./config";

let client: SanityClient | null = null;

// Created lazily: createClient throws without a project id, and an
// unconfigured build must still render its bundled products.
export function getClient(): SanityClient {
  client ??= createClient({
    projectId: SANITY.projectId,
    dataset: SANITY.dataset,
    apiVersion: SANITY.apiVersion,
    useCdn: true,             // apicdn.sanity.io
    perspective: "published", // never drafts; no token is sent
  });
  return client;
}

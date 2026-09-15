import Stripe from "stripe";
import { env } from "./env.js";

let client: Stripe | null = null;

// Created lazily so that a function without STRIPE_SECRET_KEY never constructs it.
// The API version is the one pinned by the installed stripe package; upgrade deliberately (§17).
export function stripe(): Stripe {
  client ??= new Stripe(env.stripeSecretKey);
  return client;
}

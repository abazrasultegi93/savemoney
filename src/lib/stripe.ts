import "server-only";
import Stripe from "stripe";

export const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;

let client: Stripe | null = null;
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Grants course access for a paid Checkout session. Safe to call more than once. */
export async function fulfillCheckout(sessionId: string) {
  const { db } = await import("./db");
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return false;
  const userId = session.metadata?.userId;
  const courseId = session.metadata?.courseId;
  if (!userId || !courseId) return false;
  await db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, source: "stripe", stripeSessionId: session.id, amountCents: session.amount_total ?? 0 },
    update: {},
  });
  return true;
}

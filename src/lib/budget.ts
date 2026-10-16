import "server-only";
import { db } from "./db";

/** month is "YYYY-MM"; returns transactions and totals for that calendar month (UTC). */
export async function getMonth(userId: string, month: string) {
  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 1));
  const items = await db.transaction.findMany({
    where: { userId, date: { gte: from, lt: to } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  let income = 0;
  let expense = 0;
  const byCategory = new Map<string, number>();
  for (const tx of items) {
    if (tx.type === "INCOME") income += tx.amountCents;
    else {
      expense += tx.amountCents;
      byCategory.set(tx.category, (byCategory.get(tx.category) ?? 0) + tx.amountCents);
    }
  }
  return {
    items,
    income,
    expense,
    balance: income - expense,
    categories: [...byCategory.entries()].sort((a, b) => b[1] - a[1]),
  };
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function addTransaction(form: FormData) {
  const user = await requireUser();
  const type = form.get("type") === "INCOME" ? "INCOME" : "EXPENSE";
  const amount = Number(String(form.get("amount") ?? "").replace(",", "."));
  const category = String(form.get("category") ?? "").trim().slice(0, 60);
  const note = String(form.get("note") ?? "").trim().slice(0, 200);
  const date = new Date(String(form.get("date") ?? ""));
  if (!Number.isFinite(amount) || amount <= 0 || !category || isNaN(date.getTime())) return;
  await db.transaction.create({
    data: { userId: user.id, type, amountCents: Math.round(amount * 100), category, note, date },
  });
  revalidatePath("/tools/budget");
}

export async function deleteTransaction(id: string) {
  const user = await requireUser();
  await db.transaction.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/tools/budget");
}

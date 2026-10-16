// Pure finance math shared by the calculators. Amounts are plain numbers in dollars.

export type SavingsRow = { year: number; balance: number; contributed: number; interest: number };

/** Monthly compounding with a contribution at the end of each month. */
export function savingsProjection(initial: number, monthly: number, annualRatePct: number, years: number): SavingsRow[] {
  const r = annualRatePct / 100 / 12;
  let balance = initial;
  let contributed = initial;
  const rows: SavingsRow[] = [];
  for (let m = 1; m <= Math.round(years * 12); m++) {
    balance = balance * (1 + r) + monthly;
    contributed += monthly;
    if (m % 12 === 0 || m === Math.round(years * 12)) {
      rows.push({ year: Math.ceil(m / 12), balance, contributed, interest: balance - contributed });
    }
  }
  return rows;
}

export type LoanRow = { month: number; payment: number; principal: number; interest: number; remaining: number };

export function annuityPayment(amount: number, annualRatePct: number, months: number) {
  const r = annualRatePct / 100 / 12;
  if (months <= 0) return 0;
  if (r === 0) return amount / months;
  return (amount * r) / (1 - Math.pow(1 + r, -months));
}

export function loanSchedule(amount: number, annualRatePct: number, months: number, type: "annuity" | "diff"): LoanRow[] {
  const r = annualRatePct / 100 / 12;
  const rows: LoanRow[] = [];
  let remaining = amount;
  const annuity = annuityPayment(amount, annualRatePct, months);
  const fixedPrincipal = amount / months;
  for (let m = 1; m <= months; m++) {
    const interest = remaining * r;
    let principal = type === "annuity" ? annuity - interest : fixedPrincipal;
    if (m === months) principal = remaining; // absorb rounding drift
    remaining = Math.max(0, remaining - principal);
    rows.push({ month: m, payment: principal + interest, principal, interest, remaining });
  }
  return rows;
}

export function money(n: number, locale: string) {
  return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

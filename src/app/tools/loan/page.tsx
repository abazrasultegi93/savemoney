import { requireUser } from "@/lib/auth";
import { getT } from "@/i18n/server";
import { LoanCalculator } from "./LoanCalculator";

export default async function LoanPage() {
  await requireUser();
  const { t } = await getT();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">{t("tools.loan")}</h1>
        <p className="muted mt-1">{t("tools.loan.desc")}</p>
      </div>
      <LoanCalculator />
    </div>
  );
}

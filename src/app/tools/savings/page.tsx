import { requireUser } from "@/lib/auth";
import { getT } from "@/i18n/server";
import { SavingsCalculator } from "./SavingsCalculator";

export default async function SavingsPage() {
  await requireUser();
  const { t } = await getT();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">{t("tools.savings")}</h1>
        <p className="muted mt-1">{t("tools.savings.desc")}</p>
      </div>
      <SavingsCalculator />
    </div>
  );
}

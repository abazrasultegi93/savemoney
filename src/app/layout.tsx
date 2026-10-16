import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { LocaleProvider } from "@/i18n/client";
import { getLocale } from "@/i18n/server";

export const metadata: Metadata = {
  title: "SaveMoney",
  description: "Financial education platform",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <LocaleProvider locale={locale}>
          <Header />
          <main className="container-page py-8">{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}

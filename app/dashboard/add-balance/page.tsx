import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings, getUserById } from "@/lib/db";
import type { PaymentMethodCard } from "./PaymentMethodCards";
import { BalancePageView } from "./BalancePageView";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/types";

function toWhatsAppDigits(input: string | null | undefined): string {
  if (!input) return "";
  const digits = String(input).replace(/\D+/g, "");
  return digits;
}

const ABS = "dashboard.addBalanceStudent";

type AddBalanceMsgKey =
  | "title"
  | "subtitle"
  | "methodTitle"
  | "transferInstruction"
  | "instapayMethodTitle"
  | "instapayTransferInstruction"
  | "confirmationNote"
  | "waitingNote"
  | "whatsappButton";

const ADD_BALANCE_FALLBACK_EN: Record<AddBalanceMsgKey, string> = {
  title: "Add balance",
  subtitle: "Choose a payment method then follow the instructions",
  methodTitle: "Vodafone Cash",
  transferInstruction: "Transfer the required amount to the following wallet number:",
  instapayMethodTitle: "InstaPay",
  instapayTransferInstruction: "Transfer the required amount to the following InstaPay address:",
  confirmationNote:
    "After transfer, send the transfer confirmation screenshot on WhatsApp to the number",
  waitingNote:
    "After sending the confirmation screenshot, your balance will be pending review and credited as soon as possible.",
  whatsappButton: "Send confirmation screenshot on WhatsApp",
};

function resolveAddBalanceCopy(
  locale: Locale,
  adminAr: string | null | undefined,
  adminEn: string | null | undefined,
  t: (key: string, fallback: string) => string,
  key: AddBalanceMsgKey,
): string {
  if (locale === "en") {
    const fromAdmin = (adminEn ?? "").trim();
    if (fromAdmin) return fromAdmin;
    return t(`${ABS}.${key}`, ADD_BALANCE_FALLBACK_EN[key]);
  }
  const fromAdmin = (adminAr ?? "").trim();
  if (fromAdmin) return fromAdmin;
  return t(`${ABS}.${key}`, ADD_BALANCE_FALLBACK_EN[key]);
}

export default async function AddBalancePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");
  const [settings, locale, t, user] = await Promise.all([
    getHomepageSettings(),
    getLocaleFromCookie(),
    getServerTranslator(),
    getUserById(session.user.id),
  ]);

  const walletNumber = settings.addBalanceWalletNumber?.trim() || "01023005622";
  const instapayAddress = settings.addBalanceInstapayAddress?.trim() || "";
  const whatsappNumber = toWhatsAppDigits(settings.addBalanceWhatsappNumber) || "966553612356";
  const pageTitle = resolveAddBalanceCopy(locale, settings.addBalanceTitle, settings.addBalanceTitleEn, t, "title");
  const pageSubtitle = resolveAddBalanceCopy(
    locale,
    settings.addBalanceSubtitle,
    settings.addBalanceSubtitleEn,
    t,
    "subtitle",
  );
  const methodTitle = resolveAddBalanceCopy(
    locale,
    settings.addBalanceMethodTitle,
    settings.addBalanceMethodTitleEn,
    t,
    "methodTitle",
  );
  const transferInstruction = resolveAddBalanceCopy(
    locale,
    settings.addBalanceTransferInstruction,
    settings.addBalanceTransferInstructionEn,
    t,
    "transferInstruction",
  );
  const instapayMethodTitle = resolveAddBalanceCopy(
    locale,
    settings.addBalanceInstapayMethodTitle,
    settings.addBalanceInstapayMethodTitleEn,
    t,
    "instapayMethodTitle",
  );
  const instapayTransferInstruction = resolveAddBalanceCopy(
    locale,
    settings.addBalanceInstapayTransferInstruction,
    settings.addBalanceInstapayTransferInstructionEn,
    t,
    "instapayTransferInstruction",
  );
  const confirmationNote = resolveAddBalanceCopy(
    locale,
    settings.addBalanceConfirmationNote,
    settings.addBalanceConfirmationNoteEn,
    t,
    "confirmationNote",
  );
  const waitingNote = resolveAddBalanceCopy(
    locale,
    settings.addBalanceWaitingNote,
    settings.addBalanceWaitingNoteEn,
    t,
    "waitingNote",
  );
  const whatsappButtonText = resolveAddBalanceCopy(
    locale,
    settings.addBalanceWhatsappButtonText,
    settings.addBalanceWhatsappButtonTextEn,
    t,
    "whatsappButton",
  );

  const copyLabel = t("dashboard.addBalanceStudent.copyWallet", "Copy");
  const copiedLabel = t("dashboard.addBalanceStudent.copiedWallet", "Copied");

  const methods: PaymentMethodCard[] = [
    {
      id: "vodafone",
      title: methodTitle,
      transferInstruction,
      destination: walletNumber,
      copyLabel,
      copiedLabel,
      copyAriaLabel: t("dashboard.addBalanceStudent.copyWalletAria", "Copy wallet number"),
    },
    {
      id: "instapay",
      title: instapayMethodTitle,
      transferInstruction: instapayTransferInstruction,
      destination: instapayAddress,
      copyLabel,
      copiedLabel,
      copyAriaLabel: t("dashboard.addBalanceStudent.copyInstapayAria", "Copy InstaPay address"),
    },
  ];

  const rawBalance = Number(user?.balance || 0);
  return <BalancePageView
    locale={locale}
    title={pageTitle}
    subtitle={pageSubtitle}
    balance={Number.isFinite(rawBalance) ? rawBalance : 0}
    methods={methods}
    confirmationNote={confirmationNote}
    waitingNote={waitingNote}
    whatsappNumber={whatsappNumber}
    whatsappButtonText={whatsappButtonText}
  />;
}
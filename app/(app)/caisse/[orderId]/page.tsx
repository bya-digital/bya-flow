import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintReceiptButton } from "@/components/caisse/PrintReceiptButton";
import { getPosOrderReceipt } from "@/lib/data/pos";
import { getCurrentStore } from "@/lib/data/store";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  card: "Carte",
  other: "Autre",
};

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function CaisseReceiptPage({
  params,
}: {
  params: { orderId: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  const receipt = await getPosOrderReceipt(params.orderId);
  if (!receipt) notFound();

  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store.currency,
  });

  return (
    <div className="mx-auto max-w-md">
      <div className="flex flex-col items-center text-center print:hidden">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" strokeWidth={1.75} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Vente enregistrée</h1>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 p-6">
        <div className="text-center">
          <p className="font-semibold text-slate-900">{store.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            Ticket #{receipt.orderNumber} · {dateTimeFormatter.format(new Date(receipt.createdAt))}
          </p>
          {receipt.customerName && (
            <p className="mt-1 text-xs text-slate-500">Client : {receipt.customerName}</p>
          )}
        </div>

        <div className="mt-4 divide-y divide-dashed divide-slate-200 border-y border-dashed border-slate-200">
          {receipt.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-600">
                {item.productName} × {item.quantity}
              </span>
              <span className="font-medium text-slate-900">
                {currencyFormatter.format(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">Total</span>
          <span className="text-lg font-bold text-slate-900">
            {currencyFormatter.format(receipt.total)}
          </span>
        </div>
        <p className="mt-1 text-right text-xs text-slate-500">
          Payé par {PAYMENT_METHOD_LABELS[receipt.paymentMethod ?? ""] ?? "—"}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 print:hidden">
        <PrintReceiptButton />
        <Link
          href="/caisse"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Nouvelle vente
        </Link>
      </div>
    </div>
  );
}

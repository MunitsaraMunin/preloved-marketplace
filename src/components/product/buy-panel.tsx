"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { OrderForm } from "@/components/product/order-form";
import type { Product } from "@/types";

export function BuyPanel({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const t = useTranslations("buyPanel");

  if (product.status !== "available") {
    const messageKey =
      product.status === "reserved"
        ? "reservedMessage"
        : product.status === "sold"
          ? "soldMessage"
          : "hiddenMessage";

    return (
      <div className="space-y-2">
        <Button className="w-full" size="lg" disabled>
          {product.status === "sold" ? t("sold") : t("unavailable")}
        </Button>
        <p className="text-sm text-neutral-500">{t(messageKey)}</p>
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSent(false);
      }}
    >
      <DialogContent
        onOpenAutoFocus={() => setSent(false)}
        className="sm:max-w-md"
      >
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <DialogTitle>{t("requestSentTitle")}</DialogTitle>
            <p className="text-sm text-neutral-500">
              {t("requestSentDescription", { name: product.name })}
            </p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("close")}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("dialogTitle")}</DialogTitle>
              <DialogDescription>{t("dialogDescription")}</DialogDescription>
            </DialogHeader>
            <OrderForm
              productId={product.id}
              productName={product.name}
              onSuccess={() => setSent(true)}
            />
          </>
        )}
      </DialogContent>
      <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
        {t("cta")}
      </Button>
    </Dialog>
  );
}

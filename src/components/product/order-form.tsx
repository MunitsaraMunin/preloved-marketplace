"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_METHOD_VALUES } from "@/lib/constants";
import { createOrderAction } from "@/lib/actions/orders";
import type { ContactMethod } from "@/types";

type FormValues = {
  customerName: string;
  contactMethod: ContactMethod;
  contactValue: string;
  message?: string;
};

const CONTACT_VALUE_LABEL_KEYS: Record<ContactMethod, string> = {
  phone: "contactValueLabelPhone",
  line: "contactValueLabelLine",
  instagram: "contactValueLabelInstagram",
  email: "contactValueLabelEmail",
  other: "contactValueLabelOther",
};

export function OrderForm({
  productId,
  productName,
  onSuccess,
}: {
  productId: string;
  productName: string;
  onSuccess: () => void;
}) {
  const t = useTranslations("orderForm");
  const tContactMethods = useTranslations("contactMethods");
  const [serverError, setServerError] = useState<string | null>(null);

  const formSchema = useMemo(
    () =>
      z.object({
        customerName: z.string().trim().min(2, t("nameRequired")),
        contactMethod: z.enum(["phone", "line", "instagram", "email", "other"]),
        contactValue: z.string().trim().min(2, t("contactValueRequired")),
        message: z.string().trim().max(1000).optional(),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { contactMethod: "line" },
  });

  const contactMethod = watch("contactMethod");

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = await createOrderAction({ productId, ...values });
    if ("error" in result) {
      setServerError(result.error || t("genericError"));
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-neutral-500">
        {t("intro", { name: productName })}
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="customerName">{t("nameLabel")}</Label>
        <Input
          id="customerName"
          {...register("customerName")}
          placeholder={t("namePlaceholder")}
        />
        {errors.customerName && (
          <p className="text-xs text-red-600">{errors.customerName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactMethod">{t("contactMethodLabel")}</Label>
        <Select
          value={contactMethod}
          onValueChange={(value) => setValue("contactMethod", value as ContactMethod)}
        >
          <SelectTrigger id="contactMethod">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTACT_METHOD_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {tContactMethods(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactValue">{t(CONTACT_VALUE_LABEL_KEYS[contactMethod])}</Label>
        <Input
          id="contactValue"
          {...register("contactValue")}
          placeholder={t("contactValuePlaceholder")}
        />
        {errors.contactValue && (
          <p className="text-xs text-red-600">{errors.contactValue.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">{t("messageLabel")}</Label>
        <Textarea id="message" {...register("message")} placeholder={t("messagePlaceholder")} />
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

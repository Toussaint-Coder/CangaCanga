import { z } from "zod";

import { isValidBurundiPhone } from "@/utils/phone";
import i18n from "@/i18n";

export function buildLoginSchema() {
  return z.object({
    phoneNumber: z
      .string()
      .min(1, i18n.t("validation.phoneRequired"))
      .refine(isValidBurundiPhone, i18n.t("validation.phoneInvalid")),
    password: z.string().min(6, i18n.t("validation.passwordMin")),
  });
}

export function buildRegisterSchema() {
  return z.object({
    fullName: z.string().min(2, i18n.t("validation.fullNameMin")),
    phoneNumber: z
      .string()
      .min(1, i18n.t("validation.phoneRequired"))
      .refine(isValidBurundiPhone, i18n.t("validation.phoneInvalid")),
    password: z.string().min(6, i18n.t("validation.passwordMin")),
    vehiclePlateNumber: z.string().optional(),
  });
}

export type LoginForm = z.infer<ReturnType<typeof buildLoginSchema>>;
export type RegisterForm = z.infer<ReturnType<typeof buildRegisterSchema>>;

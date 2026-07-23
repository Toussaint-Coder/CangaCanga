import { z } from "zod";

import i18n from "@/i18n";
import { MAX_SEATS } from "./rideDrafts";

function buildPlaceSchema() {
  return z.object({
    label: z.string().min(1, i18n.t("validation.required")),
    latitude: z.number(),
    longitude: z.number(),
  });
}

function buildSeatsSchema() {
  return z
    .number({ invalid_type_error: i18n.t("validation.enterNumber") })
    .int()
    .min(1, i18n.t("validation.seatsMin"))
    .max(MAX_SEATS, i18n.t("validation.seatsMax", { count: MAX_SEATS }));
}

export function buildCreateRideSchema() {
  return z.object({
    pickup: buildPlaceSchema(),
    destination: buildPlaceSchema(),
    departureTime: z
      .string()
      .refine(
        (iso) => new Date(iso).getTime() > Date.now() - 60_000,
        i18n.t("validation.departureFuture"),
      ),
    availableSeats: buildSeatsSchema(),
    price: z
      .number({ invalid_type_error: i18n.t("validation.enterPrice") })
      .min(0, i18n.t("validation.priceNegative")),
    note: z.string().max(300, i18n.t("validation.noteTooLong")).optional(),
  });
}

export function buildUpdateRideSchema(minSeats = 1) {
  return z.object({
    pickup: buildPlaceSchema(),
    destination: buildPlaceSchema(),
    departureTime: z
      .string()
      .refine(
        (iso) => new Date(iso).getTime() > Date.now() - 60_000,
        i18n.t("validation.departureFuture"),
      ),
    availableSeats: buildSeatsSchema().refine(
      (n) => n >= minSeats,
      i18n.t("validation.seatsReserved", { count: minSeats }),
    ),
    price: z
      .number({ invalid_type_error: i18n.t("validation.enterPrice") })
      .min(0, i18n.t("validation.priceNegative")),
    note: z.string().max(300, i18n.t("validation.noteTooLong")).optional(),
  });
}

export type CreateRideForm = z.infer<ReturnType<typeof buildCreateRideSchema>>;

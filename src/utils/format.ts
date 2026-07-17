import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import calendar from "dayjs/plugin/calendar";

import i18n from "@/i18n";

dayjs.extend(relativeTime);
dayjs.extend(calendar);

/** Burundian Franc, no decimals (prices are whole numbers in practice). */
export function formatPrice(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString("fr-FR")} FBu`;
}

export function formatDistance(meters?: number | null): string {
  if (meters == null) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

export function formatDuration(seconds?: number | null): string {
  if (seconds == null) return "—";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export function formatDeparture(iso: string): string {
  return dayjs(iso).calendar(null, {
    sameDay: `[${i18n.t("date.today")}] HH:mm`,
    nextDay: `[${i18n.t("date.tomorrow")}] HH:mm`,
    nextWeek: "dddd HH:mm",
    lastDay: `[${i18n.t("date.yesterday")}] HH:mm`,
    lastWeek: `[${i18n.t("date.last")}] dddd HH:mm`,
    sameElse: "DD MMM, HH:mm",
  });
}

export function formatRelative(iso: string): string {
  return dayjs(iso).fromNow();
}

export function formatRating(rating?: number | null): string {
  if (!rating || rating <= 0) return i18n.t("common.new");
  return rating.toFixed(1);
}

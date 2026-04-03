export * from "./constants/theme";
export * from "./constants/site-config";

export function formatDate(date: Date, locale: string = "en-US"): string {
  return new Intl.DateTimeFormat(locale).format(date);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

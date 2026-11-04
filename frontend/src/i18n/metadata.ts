import { getTranslations } from "next-intl/server";
const metadata = (key: string) => async () => {
  const t = await getTranslations("Shell");
  return { title: t(key) };
};
export const dashboardMetadata = metadata("dashboard");
export const claimsMetadata = metadata("claims");
export const screeningMetadata = metadata("preOrder");
export const navigationMetadata = metadata("navigation");
export const guideMetadata = metadata("guide");

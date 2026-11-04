"use server";
import { cookies } from "next/headers";

export async function setLocale(locale: string) {
  if (locale !== "id" && locale !== "en") throw new Error("Invalid locale");
  (await cookies()).set("hydrogig_locale", locale, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}

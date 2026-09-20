"use server";

import { cookies } from "next/headers";

export async function setLocale(locale: string) {
  if (locale !== "ar" && locale !== "en") return;
  (await cookies()).set("NEXT_LOCALE", locale, {
    path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production", httpOnly: true,
  });
}

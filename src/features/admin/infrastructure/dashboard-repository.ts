import "server-only";
import { getAdminDb } from "@/core/firebase/admin";
import { normalizeError, ErrorCode } from "@/core/errors";
import { listContactMessages } from "./messages";

export async function getDashboard() {
  try {
    const db = getAdminDb();
    const [products, published, messages, unread, media, initialized, recent] = await Promise.all([
      db.collection("products").count().get(), db.collection("products").where("isPublished", "==", true).count().get(),
      db.collection("contactMessages").count().get(), db.collection("contactMessages").where("status", "==", "new").count().get(),
      db.collection("media").count().get(), db.doc("system/contentImport").get(), listContactMessages(),
    ]);
    return { products: products.data().count, published: published.data().count, messages: messages.data().count,
      unread: unread.data().count, media: media.data().count, initialized: initialized.exists, recent: recent.messages.slice(0, 5) };
  } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
}

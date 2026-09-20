import "server-only";
import { Timestamp, type DocumentData } from "firebase-admin/firestore";
import { getAdminDb } from "@/core/firebase/admin";
import { normalizeError, ErrorCode } from "@/core/errors";
import { z } from "zod";

export const messageIdSchema = z.string().regex(/^[A-Za-z0-9]{20}$/);
export type AdminMessage = {
  id: string; name: string; email: string; phone: string; message: string;
  status: "new" | "read" | "replied"; createdAt: string;
};

function toMessage(id: string, data: DocumentData): AdminMessage {
  return {
    id, name: data.name, email: typeof data.email === "string" ? data.email : "", phone: data.phone, message: data.message,
    status: ["new", "read", "replied"].includes(data.status) ? data.status : "new",
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : "",
  };
}

export async function listContactMessages(after?: string) {
  try {
    const collection = getAdminDb().collection("contactMessages");
    let query = collection.orderBy("createdAt", "desc").limit(26);
    if (after && messageIdSchema.safeParse(after).success) {
      const cursor = await collection.doc(after).get();
      if (cursor.exists) query = query.startAfter(cursor);
    }
    const snapshots = await query.get();
    const messages = snapshots.docs.slice(0, 25).map((doc) => toMessage(doc.id, doc.data()));
    return { messages, next: snapshots.size > 25 ? messages.at(-1)!.id : null };
  } catch (error) {
    throw normalizeError(error, ErrorCode.DATABASE_ERROR);
  }
}

export async function getContactMessage(id: string) {
  if (!messageIdSchema.safeParse(id).success) return null;
  try {
    const doc = await getAdminDb().doc(`contactMessages/${id}`).get();
    return doc.exists ? toMessage(doc.id, doc.data()!) : null;
  } catch (error) {
    throw normalizeError(error, ErrorCode.DATABASE_ERROR);
  }
}

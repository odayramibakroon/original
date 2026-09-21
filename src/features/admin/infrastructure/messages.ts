import "server-only";
import { FieldValue, Timestamp, type DocumentData, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/core/firebase/admin";
import { normalizeError, ErrorCode } from "@/core/errors";
import { messageIdSchema, selectedMessagesSchema, messageQuerySchema, matchesMessage, deleteMessagesSchema, type MessageQuery } from "../domain/message-query";

export { messageIdSchema } from "../domain/message-query";
export type AdminMessage = {
  id: string; name: string; email: string; phone: string; message: string; ip: string;
  status: "new" | "read" | "replied"; createdAt: string;
};

function toMessage(id: string, data: DocumentData): AdminMessage {
  return {
    id, name: data.name, email: typeof data.email === "string" ? data.email : "", phone: data.phone, message: data.message,
    ip: typeof data.ip === "string" ? data.ip : "",
    status: ["new", "read", "replied"].includes(data.status) ? data.status : "new",
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : "",
  };
}

export async function listContactMessages(input: Partial<MessageQuery> = {}) {
  try {
    const filter = messageQuerySchema.parse(input);
    const collection = getAdminDb().collection("contactMessages");
    const base = collection.orderBy("createdAt", "desc");
    let query = base;
    if (filter.after) {
      const cursor = await collection.doc(filter.after).get();
      if (cursor.exists) query = query.startAfter(cursor);
    }
    const messages: AdminMessage[] = [];
    let next: string | null = null;
    let scanned = 0;
    // Bound reads for substring search, including older records without search indexes.
    const chunk = filter.q || filter.status !== "all" ? 100 : 26;
    while (scanned < 1000) {
      const snapshots = await query.limit(chunk).get();
      let last: QueryDocumentSnapshot | undefined;
      for (const doc of snapshots.docs) {
        last = doc; scanned++;
        const message = toMessage(doc.id, doc.data());
        if (matchesMessage(message, filter)) messages.push(message);
        if (messages.length === 26) return { messages: messages.slice(0, 25), next: messages[24].id, before: Date.now() };
      }
      if (snapshots.size < chunk || !last) break;
      if (scanned >= 1000) { next = last.id; break; }
      query = base.startAfter(last);
    }
    return { messages, next, before: Date.now() };
  } catch (error) {
    throw normalizeError(error, ErrorCode.DATABASE_ERROR);
  }
}

export async function deleteContactMessages(input: unknown) {
  const request = deleteMessagesSchema.parse(input);
  try {
    const db = getAdminDb();
    const collection = db.collection("contactMessages");
    const documents = request.mode === "selected"
      ? (await Promise.all([...new Set(request.ids)].map((id) => collection.doc(id).get()))).filter((doc) => doc.exists)
      : (await collection.where("createdAt", "<=", Timestamp.fromMillis(request.before)).orderBy("createdAt").limit(200).get()).docs;
    const batch = db.batch();
    for (const doc of documents) { batch.delete(doc.ref); batch.delete(db.doc(`notificationOutbox/${doc.id}`)); }
    if (documents.length) await batch.commit();
    return { deleted: documents.length, hasMore: request.mode === "all" && documents.length === 200 };
  } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
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

export async function markContactMessagesRead(input: unknown, uid: string) {
  const ids = [...new Set(selectedMessagesSchema.parse(input))];
  try {
    const db = getAdminDb();
    return await db.runTransaction(async (transaction) => {
      const snapshots = await transaction.getAll(...ids.map((id) => db.doc(`contactMessages/${id}`)));
      let updated = 0;
      for (const snapshot of snapshots) {
        // A replied message already counts as read; never downgrade its workflow status.
        if (!snapshot.exists || snapshot.data()?.status === "read" || snapshot.data()?.status === "replied") continue;
        transaction.update(snapshot.ref, { status: "read", updatedAt: FieldValue.serverTimestamp(), updatedBy: uid });
        updated++;
      }
      return { updated };
    });
  } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
}

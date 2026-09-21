import assert from "node:assert/strict";
import { before, after, beforeEach, test } from "node:test";
import { deleteApp, getApps } from "firebase-admin/app";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "../src/core/firebase/admin";
import { FirestoreContactRepository } from "../src/features/contact/infrastructure/firestore-contact-repository";
import { ContactPolicyRepository, contactIpKey } from "../src/features/contact/infrastructure/contact-policy-repository";
import { contactDay } from "../src/features/contact/domain/contact-policy";
import { deleteContactMessages, listContactMessages } from "../src/features/admin/infrastructure/messages";

// These tests never load .env.local and can only target the local demo emulator.
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-originalcompany";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
const db = getAdminDb();
const repository = new FirestoreContactRepository();
const policy = new ContactPolicyRepository();
let serial = 0;
const visitor = () => ({ name: "Test Visitor", email: "test@example.test", phone: `+966555${String(++serial).padStart(6, "0")}`, message: "Wholesale message for testing." });
const ip = "203.0.113.10";
before(async () => { await db.doc("system/integrationTest").set({ emulator: true }); });
beforeEach(async () => {
  for (const collection of ["contactMessages", "notificationOutbox", "contactRateLimits", "contactIpLimits", "blockedContactIps"]) {
    const docs = await db.collection(collection).get();
    const writer = db.bulkWriter();
    for (const doc of docs.docs) writer.delete(doc.ref);
    await writer.close();
  }
  await db.doc("system/contactPolicy").delete();
});
after(async () => { await db.terminate(); for (const app of getApps()) await deleteApp(app); });

test("default IP limit applies across phone numbers and clients; rejected requests create no message or job", async () => {
  for (let i = 0; i < 3; i++) await repository.create(visitor(), "en", ip);
  await assert.rejects(repository.create(visitor(), "en", `::ffff:${ip}`), { message: "dailyContactLimit" });
  assert.equal((await db.collection("contactMessages").get()).size, 3);
  assert.equal((await db.collection("notificationOutbox").get()).size, 3);
  await repository.create(visitor(), "en", "203.0.113.11");
});
test("concurrent requests cannot exceed the daily quota", async () => {
  const results = await Promise.allSettled(Array.from({ length: 10 }, () => repository.create(visitor(), "en", ip)));
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 3);
  assert.equal((await db.doc(`contactIpLimits/${contactIpKey(ip)}`).get()).data()?.count, 3);
});
test("policy changes apply immediately and an old day does not consume today's allowance", async () => {
  await policy.save({ dailyMessagesPerIp: 1 }, "test-admin");
  await repository.create(visitor(), "en", ip);
  await assert.rejects(repository.create(visitor(), "en", ip), { message: "dailyContactLimit" });
  await policy.save({ dailyMessagesPerIp: 2 }, "test-admin");
  await repository.create(visitor(), "en", ip);
  await db.doc(`contactIpLimits/${contactIpKey(ip)}`).update({ day: "2000-01-01", count: 100 });
  await repository.create(visitor(), "en", ip);
  const rate = (await db.doc(`contactIpLimits/${contactIpKey(ip)}`).get()).data();
  assert.equal(rate?.count, 1); assert.equal(rate?.day, contactDay(Date.now()));
});
test("blocking and unblocking canonical IP addresses does not reset counters", async () => {
  await repository.create(visitor(), "en", ip);
  await policy.setBlocked(`::ffff:${ip}`, true, "test-admin");
  await assert.rejects(repository.create(visitor(), "en", ip), { message: "contactBlocked" });
  assert.equal((await db.collection("notificationOutbox").get()).size, 1);
  await policy.setBlocked(ip, false, "test-admin");
  await repository.create(visitor(), "en", ip);
  assert.equal((await db.doc(`contactIpLimits/${contactIpKey(ip)}`).get()).data()?.count, 2);
});
test("selected deletion removes its pending notifications but retains quotas and blocks", async () => {
  const first = await repository.create(visitor(), "en", ip);
  const second = await repository.create(visitor(), "en", ip);
  await policy.setBlocked(ip, true, "test-admin");
  assert.deepEqual(await deleteContactMessages({ mode: "selected", ids: [first, first] }), { deleted: 1, hasMore: false });
  assert.equal((await db.doc(`contactMessages/${first}`).get()).exists, false);
  assert.equal((await db.doc(`notificationOutbox/${first}`).get()).exists, false);
  assert.equal((await db.doc(`contactMessages/${second}`).get()).exists, true);
  assert.equal((await db.doc(`contactIpLimits/${contactIpKey(ip)}`).get()).data()?.count, 2);
  assert.equal((await policy.blocked()).length, 1);
});
test("delete-all runs in bounded batches and preserves messages newer than its cutoff", async () => {
  const before = Date.now() - 2000;
  const writer = db.bulkWriter();
  for (let i = 0; i < 205; i++) {
    const ref = db.collection("contactMessages").doc();
    writer.set(ref, { ...visitor(), createdAt: Timestamp.fromMillis(before - 1000) });
    writer.set(db.doc(`notificationOutbox/${ref.id}`), { status: "pending" });
  }
  const newer = db.collection("contactMessages").doc();
  writer.set(newer, { ...visitor(), createdAt: Timestamp.now() });
  await writer.close();
  assert.deepEqual(await deleteContactMessages({ mode: "all", before }), { deleted: 200, hasMore: true });
  assert.deepEqual(await deleteContactMessages({ mode: "all", before }), { deleted: 5, hasMore: false });
  assert.equal((await db.collection("contactMessages").get()).size, 1);
  assert.equal((await newer.get()).exists, true);
  assert.equal((await db.collection("notificationOutbox").get()).size, 0);
});
test("search includes older messages, supports pagination, and does not lose matches", async () => {
  const writer = db.bulkWriter();
  for (let i = 0; i < 60; i++) writer.set(db.collection("contactMessages").doc(), { ...visitor(), name: `Search visitor ${i}`, status: "new", createdAt: Timestamp.fromMillis(Date.now() - i * 1000) });
  await writer.close();
  const first = await listContactMessages({ q: "search visitor" });
  assert.equal(first.messages.length, 25);
  const second = await listContactMessages({ q: "search visitor", after: first.next! });
  assert.equal(second.messages.length, 25);
  const third = await listContactMessages({ q: "search visitor", after: second.next! });
  assert.equal(third.messages.length, 10);
  assert.equal(third.next, null);
  assert.equal(new Set([...first.messages, ...second.messages, ...third.messages].map((item) => item.id)).size, 60);
  assert.equal((await listContactMessages({ q: "visitor 59" })).messages.length, 1);
});

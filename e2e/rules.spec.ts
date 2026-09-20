import { test, expect } from "@playwright/test";
import { initializeApp, deleteApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore, getDocFromServer, doc, setDoc, terminate } from "firebase/firestore";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { seedFixtures, password } from "./fixtures";
import { SITE_DOCUMENT_PATH } from "../src/core/firebase/site-database";

test.beforeAll(seedFixtures);

test("website rules reject direct reads and privilege writes without changing legacy access", async () => {
  const app = initializeApp({ apiKey: "demo-api-key", projectId: "demo-originalcompany" }, "rules-verification");
  const db = getFirestore(app); connectFirestoreEmulator(db, "127.0.0.1", 8080);
  const auth = getAuth(app); connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  try {
    expect((await getDocFromServer(doc(db, "products/legacy"))).exists()).toBe(true);
    await expect(getDocFromServer(doc(db, `${SITE_DOCUMENT_PATH}/products/chocolate-cookies`))).rejects.toMatchObject({ code: "permission-denied" });
    await expect(setDoc(doc(db, `${SITE_DOCUMENT_PATH}/users/injected`), { role: "admin", active: true })).rejects.toMatchObject({ code: "permission-denied" });
    await signInWithEmailAndPassword(auth, "test-visitor@example.test", password);
    await expect(getDocFromServer(doc(db, `${SITE_DOCUMENT_PATH}/contactMessages/private`))).rejects.toMatchObject({ code: "permission-denied" });
  } finally { await signOut(auth); await terminate(db); await deleteApp(app); }
});

import { test, expect } from "@playwright/test";
import { seedFixtures } from "./fixtures";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { siteDatabase } from "../src/core/firebase/site-database";

process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
const app = getApps().find((item) => item.name === "test-fixtures") ?? initializeApp({ projectId: "demo-originalcompany" }, "test-fixtures");
const db = siteDatabase(getFirestore(app));
const auth = getAuth(app);
const password = "Test-only-password-123!";

test.beforeAll(async () => {
  await seedFixtures();
  for (const [uid, role] of [["test-admin", "admin"], ["test-visitor", "visitor"]]) {
    const existing = await auth.getUser(uid).catch((error) => {
      if (error.code === "auth/user-not-found") return null;
      throw error;
    });
    if (!existing) await auth.createUser({ uid, email: `${uid}@example.test`, password });
    await db.doc(`users/${uid}`).set({ role, active: true });
  }
});

test("saves a contact and durable notification, then admin reads and updates it", async ({ browser }) => {
  const context = await browser.newContext({ locale: "en-US" });
  const page = await context.newPage();
  const name = `Visitor ${Date.now()}`;
  const phone = `+966${Date.now().toString().slice(-9)}`;
  await page.goto("/");
  await page.locator('[name="name"]').fill(name);
  await page.locator('[name="email"]').fill("visitor@example.com");
  await page.locator('[name="phone"]').fill(phone);
  await page.locator('[name="message"]').fill("Please contact me about a wholesale order.");
  await page.locator('.contact-form button[type="submit"]').click();
  await expect(page.locator(".form-result")).toHaveClass(/success/);
  const messages = await db.collection("contactMessages").where("name", "==", name).get();
  expect(messages.size).toBe(1);
  const message = messages.docs[0];
  expect(message.data().phone).toBe(phone);
  expect(message.data().email).toBe("visitor@example.com");
  expect((await db.doc(`notificationOutbox/${message.id}`).get()).data()).toMatchObject({ status: "pending", lastResult: "no-subscribers" });

  await page.goto(`/admin/messages/${message.id}`);
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email address").fill("test-admin@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/messages/${message.id}$`));
  await expect(page.locator(".message-details")).toContainText(name);
  await expect(page.locator(".message-details")).toContainText(phone);
  await page.getByLabel("Status", { exact: true }).selectOption("replied");
  await page.getByRole("button", { name: "Save status" }).click();
  await expect(page.getByRole("status")).toHaveText("Status saved.");
  expect((await message.ref.get()).data()?.status).toBe("replied");
  await page.goto("/admin/messages");
  await expect(page.getByRole("heading", { name: "Contact messages" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enable notifications" })).toBeEnabled();
  await page.screenshot({ path: "test-results/admin-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/admin-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/admin/messages");
  await expect(page).toHaveURL(/\/login/);
  await context.close();
});

test("rejects an authenticated account without admin role", async ({ browser }) => {
  const context = await browser.newContext({ locale: "en-US" });
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("Email address").fill("test-visitor@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".admin-login-form").getByRole("alert")).toHaveText("This account does not have admin access.");
  await page.goto("/admin/messages");
  await expect(page).toHaveURL(/\/login/);
  await context.close();
});

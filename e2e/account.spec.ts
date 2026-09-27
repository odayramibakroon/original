import { randomUUID } from "node:crypto";
import { test as base, expect, type Page } from "@playwright/test";
import { auth, db, password, seedFixtures } from "./fixtures";

const test = base.extend<{ account: { uid: string; email: string } }>({
  account: async ({}, runTest) => {
    const uid = `account-${randomUUID()}`;
    const email = `${uid}@example.test`;
    await auth.createUser({ uid, email, password });
    await db.doc(`users/${uid}`).set({ role: "admin", active: true });
    try { await runTest({ uid, email }); }
    finally {
      for (const name of ["adminSessions", "adminPushSubscriptions"]) {
        const rows = await db.collection(name).where("uid", "==", uid).get();
        const batch = db.batch();
        rows.docs.forEach((row) => batch.delete(row.ref));
        await batch.commit();
      }
      await db.doc(`users/${uid}`).delete(); await auth.deleteUser(uid);
    }
  },
});
test.use({ locale: "en-US" });
test.beforeAll(seedFixtures);

async function login(page: Page, email: string, value = password) {
  await page.goto("/admin/account");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(value);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/account$/);
}

test("signs out other devices, keeps current session, and normal sign-out affects only this device", async ({ page, browser, account, context }) => {
  const other = await browser.newContext({ locale: "en-US" });
  try {
    const otherPage = await other.newPage();
    await login(page, account.email); await login(otherPage, account.email);
    const current = (await context.cookies()).find((cookie) => cookie.name === "admin_device")!.value;
    const second = (await other.cookies()).find((cookie) => cookie.name === "admin_device")!.value;
    expect(current).not.toBe(second);
    await page.getByRole("button", { name: "Sign out all other devices", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("This device will stay signed in");
    await page.getByRole("dialog").getByRole("button", { name: "Sign out all other devices", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: "Other devices signed out" })).toBeVisible();
    await page.reload(); await expect(page).toHaveURL(/\/admin\/account$/);
    expect((await db.doc(`adminSessions/${current}`).get()).data()?.version).toBe(1);
    expect((await db.doc(`adminSessions/${second}`).get()).data()?.version).toBe(0);
    await otherPage.goto("/admin/account"); await expect(otherPage).toHaveURL(/\/login/);
    const blocked = await other.request.post("/api/admin/media", { headers: { Origin: "http://127.0.0.1:3101" } });
    expect(blocked.status()).toBe(403);
    const revokedAt = (await db.doc(`users/${account.uid}`).get()).data()!.sessionsRevokedAt;
    await expect.poll(() => Math.floor(Date.now() / 1000)).toBeGreaterThan(revokedAt);
    await login(otherPage, account.email);
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await otherPage.reload(); await expect(otherPage).toHaveURL(/\/admin\/account$/);
    expect((await db.doc(`adminSessions/${current}`).get()).exists).toBe(false);
  } finally { await other.close(); }
});

test("changes password only after current-password validation, preserves this browser and revokes the other", async ({ page, browser, account }) => {
  const other = await browser.newContext({ locale: "en-US" });
  const replacement = "New-test-password-987!";
  try {
    const otherPage = await other.newPage();
    await login(page, account.email); await login(otherPage, account.email);
    await page.getByLabel("Current password", { exact: true }).fill(password);
    await page.getByLabel("New password", { exact: true }).fill(replacement);
    await page.getByLabel("Confirm new password").fill("mismatch");
    await page.getByRole("button", { name: "Change password", exact: true }).click();
    await expect(page.locator(".account-form").getByRole("alert")).toHaveText("The passwords do not match.");
    await page.getByLabel("Confirm new password").fill(replacement);
    await page.getByLabel("Current password", { exact: true }).fill("Incorrect-password-1");
    await page.getByRole("button", { name: "Change password", exact: true }).click();
    await expect(page.locator(".account-form").getByRole("status")).toHaveText("Your current password is incorrect.");
    await page.getByLabel("Current password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Change password", exact: true }).click();
    await expect(page.locator(".account-form").getByRole("status")).toHaveText("Password changed. Other devices have been signed out.");
    await page.reload(); await expect(page).toHaveURL(/\/admin\/account$/);
    await otherPage.goto("/admin/account"); await expect(otherPage).toHaveURL(/\/login/);
    await otherPage.getByLabel("Email address").fill(account.email);
    await otherPage.getByLabel("Password", { exact: true }).fill(password);
    await otherPage.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(otherPage.locator(".admin-login-form").getByRole("alert")).toBeVisible();
    await login(otherPage, account.email, replacement);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: "test-results/account-desktop-en.png", animations: "disabled", caret: "initial" });
    await page.locator(".admin-topbar").getByRole("combobox").selectOption("ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: "test-results/account-mobile-ar.png", fullPage: true, animations: "disabled", caret: "initial" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await other.close(); }
});

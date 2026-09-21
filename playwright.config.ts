import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://127.0.0.1:3101",
    browserName: "chromium",
    channel: "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [{
    command: "node e2e/storage-server.mjs",
    url: "http://127.0.0.1:54329/health",
    reuseExistingServer: false,
  }, {
    command: "npm run dev -- --port 3101 --hostname 127.0.0.1",
    url: "http://127.0.0.1:3101/login",
    timeout: 120000,
    reuseExistingServer: false,
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-originalcompany",
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-originalcompany.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
      FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329",
      SUPABASE_SECRET_KEY: "local-storage-fixture-only",
      SUPABASE_MEDIA_BUCKET: "site-media",
    },
  }],
});

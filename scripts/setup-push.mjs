import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import webpush from "web-push";

const path = new URL("../.env.local", import.meta.url);
let source;
try { source = await readFile(path, "utf8"); }
catch (error) { if (error.code !== "ENOENT") throw error; source = ""; }
const present = (name) => {
  const value = source.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]?.trim();
  return Boolean(value && value !== '""' && value !== "''");
};
if (present("NEXT_PUBLIC_VAPID_PUBLIC_KEY") !== present("VAPID_PRIVATE_KEY")) {
  throw new Error("Incomplete VAPID key pair. Restore the missing matching key before continuing.");
}
const keys = webpush.generateVAPIDKeys();
const values = {
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: keys.publicKey,
  VAPID_PRIVATE_KEY: keys.privateKey,
  VAPID_SUBJECT: "mailto:info@factory.com",
  NOTIFICATION_CRON_SECRET: randomBytes(32).toString("hex"),
};
for (const [name, value] of Object.entries(values)) {
  const pattern = new RegExp(`^${name}=.*$`, "m");
  if (present(name)) continue;
  source = pattern.test(source) ? source.replace(pattern, `${name}=${value}`) : `${source.trimEnd()}\n${name}=${value}\n`;
}
await writeFile(path, source, { mode: 0o600 });
console.log("Push configuration saved to .env.local. Existing keys were preserved.");

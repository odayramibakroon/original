import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { initializeApp, applicationDefault, deleteApp } from "firebase-admin/app";

class RulesDeploymentError extends Error {}

createRequire(import.meta.url)("@next/env").loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const expected = process.argv[2];
const checkOnly = expected === "--check";
if (!checkOnly && (!expected || !/^projects\/[a-z0-9-]+\/rulesets\/[a-f0-9-]+$/.test(expected))) {
  console.error("Pass the reviewed current ruleset resource name. Deployment refuses unreviewed remote changes."); process.exit(1);
}
const project = `projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`;
if (!checkOnly && !expected.startsWith(`${project}/rulesets/`)) throw new Error("Ruleset project mismatch.");
const app = initializeApp({ credential: applicationDefault() });
try {
  const token = await app.options.credential.getAccessToken();
  const headers = { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" };
  async function api(path, method = "GET", data) {
    const response = await fetch(`https://firebaserules.googleapis.com/v1/${path}`, { method, headers, body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok) throw new RulesDeploymentError(`Rules API returned ${response.status}.`);
    return result;
  }
  const releasePath = `${project}/releases/cloud.firestore`;
  const release = await api(releasePath);
  if (checkOnly) {
    const current = await api(release.rulesetName);
    const prepared = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");
    const matches = current.source.files.length === 1 && current.source.files[0].content.trim() === prepared.trim();
    console.log(`Published rules match the tested website-only rules: ${matches}.`);
    console.log("Read-only check. No rules or data were changed.");
    if (!matches) process.exitCode = 1;
  } else {
    if (release.rulesetName !== expected) throw new RulesDeploymentError("Remote rules changed. Review again before deployment.");
    const current = await api(expected);
    const backup = await readFile(new URL("../.local-backups/firestore-before-website.rules", import.meta.url), "utf8");
    if (current.source.files.length !== 1 || current.source.files[0].content.trim() !== backup.trim()) throw new RulesDeploymentError("Remote source does not match the reviewed backup.");
    const content = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");
    const source = { files: [{ name: "firestore.rules", content }] };
    const tested = await api(`${project}:test`, "POST", { source });
    if (tested.issues?.some((issue) => issue.severity === "ERROR")) throw new RulesDeploymentError("Rules validation failed.");
    const created = await api(`${project}/rulesets`, "POST", { source });
    if ((await api(releasePath)).rulesetName !== expected) throw new RulesDeploymentError("Remote rules changed during validation. Nothing was released.");
    await api(releasePath, "PATCH", { release: { name: releasePath, rulesetName: created.name }, updateMask: "ruleset_name" });
    console.log(`Website-only protection deployed. Previous ruleset retained: ${expected}`);
    console.log(`Current ruleset: ${created.name}`);
    console.log("Legacy collections retain their previous permissions; no legacy data was changed.");
  }
} catch (error) {
  console.error(error instanceof RulesDeploymentError ? error.message : "Rules operation failed. Verify credentials, network and permissions; credential details are not logged."); process.exitCode = 1;
} finally { await deleteApp(app); }

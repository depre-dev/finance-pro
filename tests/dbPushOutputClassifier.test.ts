import assert from "node:assert/strict";
import { test } from "node:test";

import { classifyDbPushOutput } from "../scripts/dbPushOutputClassifier.ts";

test("reports a completed push as applied", () => {
  const outcome = classifyDbPushOutput({
    exitCode: 0,
    output: "[✓] Pulling schema from database...\n[✓] Changes applied\n",
  });

  assert.deepEqual(outcome, { status: "applied" });
});

test("reports an up-to-date schema as no-changes", () => {
  const outcome = classifyDbPushOutput({
    exitCode: 0,
    output: "[i] No changes detected\n",
  });

  assert.deepEqual(outcome, { status: "no-changes" });
});

test("reads the markers through the colour codes drizzle-kit writes", () => {
  const outcome = classifyDbPushOutput({
    exitCode: 0,
    output: "[[32m✓[39m] Changes applied\n",
  });

  assert.deepEqual(outcome, { status: "applied" });
});

test("reports a declined confirmation prompt as aborted", () => {
  const outcome = classifyDbPushOutput({
    exitCode: 0,
    output: "[x] All changes were aborted\n",
  });

  assert.deepEqual(outcome, { status: "aborted" });
});

// The regression this wrapper exists for: drizzle-kit catches the driver error,
// logs it, and still exits 0, so only the missing terminal marker distinguishes
// this run from a successful one.
test("reports a swallowed driver error as failed even though the exit code is 0", () => {
  const outcome = classifyDbPushOutput({
    exitCode: 0,
    output: [
      "[✓] Pulling schema from database...",
      "error: column \"amount\" cannot be cast automatically to type numeric",
      "    at Parser.parseErrorMessage (/app/node_modules/pg-protocol/src/parser.ts:369:69)",
      "",
    ].join("\n"),
  });

  assert.equal(outcome.status, "failed");
  assert.match(
    outcome.status === "failed" ? outcome.reason : "",
    /exited 0 without reporting a result/,
  );
});

test("reports an empty run as failed rather than guessing", () => {
  const outcome = classifyDbPushOutput({ exitCode: 0, output: "" });

  assert.deepEqual(outcome, {
    status: "failed",
    reason:
      "drizzle-kit push exited 0 without reporting a result, so the schema was not applied",
  });
});

test("reports a non-zero exit as failed and quotes the last output line", () => {
  const outcome = classifyDbPushOutput({
    exitCode: 1,
    output: "Error: DATABASE_URL, ensure the database is provisioned\n",
  });

  assert.deepEqual(outcome, {
    status: "failed",
    reason:
      "drizzle-kit push exited with code 1 (last output: Error: DATABASE_URL, ensure the database is provisioned)",
  });
});

test("prefers the failure when a success marker is followed by a non-zero exit", () => {
  const outcome = classifyDbPushOutput({
    exitCode: 1,
    output: "[✓] Changes applied\n",
  });

  assert.equal(outcome.status, "failed");
});

test("reports a signalled process as failed", () => {
  const outcome = classifyDbPushOutput({
    exitCode: null,
    signal: "SIGTERM",
    output: "[✓] Pulling schema from database...\n",
  });

  assert.equal(outcome.status, "failed");
  assert.match(outcome.status === "failed" ? outcome.reason : "", /terminated by SIGTERM/);
});

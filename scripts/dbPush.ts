/**
 * Wrapper around `drizzle-kit push` that exits non-zero when the push did not
 * apply. See ./dbPushOutputClassifier.ts for why the CLI's own exit code cannot
 * be trusted.
 *
 * Arguments are forwarded, so `npm run db:push -- --force` still works. Output
 * is piped so it can be classified, and written straight through so the run
 * still looks the same; the confirmation prompt drizzle-kit shows for
 * destructive changes stays answerable, but redraws instead of updating in
 * place. Pass `--force` to skip it.
 */

import { spawn } from "node:child_process";

import { classifyDbPushOutput, type DbPushOutcome } from "./dbPushOutputClassifier.ts";

const child = spawn("drizzle-kit", ["push", ...process.argv.slice(2)], {
  stdio: ["inherit", "pipe", "pipe"],
});

let output = "";

child.stdout.on("data", (chunk: Buffer) => {
  output += chunk.toString();
  process.stdout.write(chunk);
});

child.stderr.on("data", (chunk: Buffer) => {
  output += chunk.toString();
  process.stderr.write(chunk);
});

child.on("error", (error: Error) => {
  console.error(`Could not run drizzle-kit push: ${error.message}`);
  process.exit(1);
});

child.on("close", (exitCode: number | null, signal: string | null) => {
  const outcome = classifyDbPushOutput({ exitCode, signal, output });
  process.exit(reportOutcome(outcome));
});

/** Prints the verdict and returns the exit code to leave with. */
function reportOutcome(outcome: DbPushOutcome): number {
  switch (outcome.status) {
    case "applied":
    case "no-changes":
      return 0;
    case "aborted":
      console.error("Schema push aborted, the database was left unchanged.");
      return 1;
    case "failed":
      console.error(`Schema push failed: ${outcome.reason}`);
      return 1;
  }
}

/**
 * `drizzle-kit push` reports failures without failing.
 *
 * Each of its per-dialect push functions wraps the statement-apply loop in a
 * `try { ... } catch (e) { console.error(e) }`. The driver error is printed and
 * then dropped, the function returns normally, and the process exits 0 — so
 * `npm run db:push` looks successful after a push that applied nothing. That is
 * how a broken schema change reaches a deploy unnoticed.
 *
 * The exit code is therefore not usable on its own, but the output is: every
 * path that runs to completion prints exactly one terminal marker. A run that
 * ends without one ended in that catch.
 */

/** CSI sequences drizzle-kit uses to colour its markers. */
const ANSI_ESCAPE = /\[[0-9;]*[A-Za-z]/g;

/** Terminal markers, each printed as `[<glyph>] <text>`. */
const APPLIED = /\]\s*Changes applied/;
const NO_CHANGES = /\]\s*No changes detected/;
const ABORTED = /\]\s*All changes were aborted/;

export type DbPushOutcome =
  | { status: "applied" }
  | { status: "no-changes" }
  | { status: "aborted" }
  | { status: "failed"; reason: string };

export interface DbPushRun {
  /** Exit code of the drizzle-kit process, or null if it was signalled. */
  exitCode: number | null;
  /** Signal that terminated the process, if any. */
  signal?: string | null;
  /** stdout and stderr, interleaved in the order they were written. */
  output: string;
}

export function classifyDbPushOutput(run: DbPushRun): DbPushOutcome {
  const output = run.output.replace(ANSI_ESCAPE, "");

  if (run.signal) {
    return {
      status: "failed",
      reason: describeFailure(output, `drizzle-kit push was terminated by ${run.signal}`),
    };
  }

  if (run.exitCode !== 0) {
    return {
      status: "failed",
      reason: describeFailure(output, `drizzle-kit push exited with code ${run.exitCode}`),
    };
  }

  // Checked before the success markers: a run that reached the confirmation
  // prompt and was declined also exits 0, and it applied nothing.
  if (ABORTED.test(output)) {
    return { status: "aborted" };
  }

  if (APPLIED.test(output)) {
    return { status: "applied" };
  }

  if (NO_CHANGES.test(output)) {
    return { status: "no-changes" };
  }

  return {
    status: "failed",
    reason: describeFailure(
      output,
      "drizzle-kit push exited 0 without reporting a result, so the schema was not applied",
    ),
  };
}

function describeFailure(output: string, summary: string): string {
  const lastLine = output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .pop();

  return lastLine ? `${summary} (last output: ${lastLine})` : summary;
}

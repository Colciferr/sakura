// Minimal zero-dependency test harness.
//
// `npm test` runs each test file as its own ts-node process, so the counters
// below are per-file. Every file ends with summary(), which prints the tally
// and exits non-zero on any failure — that stops the `&&` chain in the test
// script, so a single broken assertion fails `npm test`.

let passed = 0;
let failed = 0;

// Asserts a boolean condition.
export function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`);
  }
}

// Asserts deep equality via JSON comparison (sufficient for the plain data
// these tests deal in — tokens, tree nodes, render segments).
export function equal(name: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  check(name, a === e, a === e ? undefined : `expected ${e}\n        got      ${a}`);
}

// Prints a heading for a group of assertions.
export function section(title: string): void {
  console.log(`\n${title}`);
}

// Prints the tally and exits non-zero if anything failed.
export function summary(): void {
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

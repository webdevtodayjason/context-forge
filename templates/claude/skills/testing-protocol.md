# Testing protocol for {{projectName}}

This skill tells Claude how tests are organized, how to run them, and what
counts as "tests pass" in this project. Load it before claiming the suite is
green, before declaring a feature complete, or whenever new tests are being
written.

## Running tests

Primary test command:

```bash
{{testCommand}}
```

Run this **from the project root**. The command exits non-zero on any
failure — treat a non-zero exit as the suite being broken, even if some
tests passed. Do not paper over by re-running selectively or by skipping
failing tests.

If you need to run a focused subset while iterating:

- **By file**: pass the test file path as the final argument to `{{testCommand}}`.
- **By name pattern**: most runners accept a `-t <pattern>` or `--testNamePattern <pattern>` flag.

Always re-run the full suite once before declaring done.

## Writing tests

Test framework in use: **{{testFramework}}**.

Conventions for new tests:

- Mirror the source layout. A test for `src/foo/bar.ts` lives next to it as
  `src/foo/bar.test.ts` (or `bar.spec.ts` if that's what the rest of the file
  tree uses — check first, don't mix styles).
- One `describe` block per unit under test. Nest `describe` for sub-behaviors.
- Test names are full sentences in present tense: `it("returns null when the
  input is empty")`, not `it("test empty case")`.
- Arrange / Act / Assert structure. One assertion focus per test where
  practical; multiple `expect` calls are fine when they verify the same
  behavior from different angles.
- Mock at the boundary (HTTP, filesystem, database, clock). Do not mock
  internal modules — if you feel the need to, the unit is too coupled.

## Conventions

- **Unit tests** live next to the code they test.
- **Integration tests** live in `__tests__/integration/` or `tests/integration/`,
  whichever the repo already uses.
- **End-to-end / smoke tests** live in `e2e/` or `tests/e2e/`.
- Test fixtures and shared helpers go in `__tests__/fixtures/` or
  `tests/helpers/` — never inline a 50-line fixture in the test body.
- Snapshots are acceptable for stable serialized output (rendered HTML,
  generated configs). They are **not** a substitute for behavioral assertions
  on the public API.

## Coverage targets

- Aim for **80%+ line coverage** on changed files. Lower on pure glue code is
  acceptable; higher on business logic is expected.
- Coverage is a floor, not a ceiling. A file at 100% coverage with no
  behavioral assertions is worse than a file at 70% with sharp tests.
- Branch coverage matters more than line coverage for conditional logic.

## Common failures and what they mean

- **Flaky tests** — almost always a timing issue (real timers, real network,
  shared global state). Fix the source of nondeterminism, do not add retries.
- **"Cannot find module" in tests** — path alias not configured for the test
  runner. Check the runner's config (`jest.config`, `vitest.config`, etc.) for
  the `moduleNameMapper` / `resolve.alias` block.
- **Tests pass locally, fail in CI** — environment difference. Usually
  timezone, locale, missing env var, or filesystem case sensitivity.
- **Snapshot mismatch** — read the diff before regenerating. A meaningful
  behavior change should not be silently rubber-stamped with `--updateSnapshot`.

## Definition of "tests pass"

All of the following must hold before you say tests pass:

1. `{{testCommand}}` exits with code 0.
2. No tests are skipped (`.skip`, `.only`, `xit`, `xdescribe`) that were not
   skipped before your change.
3. Coverage on changed files did not regress.
4. Any new behavior added in this change has at least one test that would
   fail if that behavior were removed.

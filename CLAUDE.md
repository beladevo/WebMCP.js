# webmcp-js — Coding Guidelines

## Project overview

webmcp-js is a TypeScript production toolkit for building agent-ready websites using the W3C WebMCP browser API (`navigator.modelContext`). It lets web pages expose typed, validated, approval-gated tools to browser AI agents.

**Tagline:** *"webmcp.js is a production toolkit for building agent-ready websites — with typed tools, safety policies, human approvals, traces, devtools, and tests."*

## Architecture

```
packages/
  core/       @webmcp/core — tool registration, approval, audit, conditions, dryRun
  react/      @webmcp/react — useWebMCPTool hook
  nextjs/     @webmcp/nextjs — SSR guard adapter
  testing/    @webmcp/testing — test utilities
```

All packages extend `tsconfig.base.json`. Source lives in `src/`, tests in `test/`.

## TypeScript rules

The tsconfig uses these strict flags — every change must comply:

- `strict: true` — no implicit any, no implicit returns, etc.
- `exactOptionalPropertyTypes: true` — `prop?: T` and `prop: T | undefined` are **not** interchangeable. Use conditional spreading when the value may be undefined:
  ```ts
  // WRONG
  const obj = { foo: maybeUndefined };          // TS2379 with exactOptionalPropertyTypes
  // CORRECT
  const obj = { ...(x ? { foo: x } : {}) };
  ```
- `noUncheckedIndexedAccess: true` — array/tuple indexing returns `T | undefined`. Always use optional chaining or check before using indexed results:
  ```ts
  // WRONG
  arr[0].value
  // CORRECT
  arr[0]?.value
  ```
- `isolatedModules: true` — use `import type` for type-only imports.

**Always run `npx tsc --noEmit` before declaring work complete. Never leave TypeScript errors.**

## Naming conventions

- `PascalCase` — types, interfaces, enums
- `camelCase` — functions, variables, properties
- Tool names follow `namespace.action` format (e.g. `cart.add`, `checkout.confirm`, `product.search`). This is enforced by the naming linter.
- Error codes are `SCREAMING_SNAKE_CASE` (e.g. `TOOL_CONDITION_FAILED`)

## Code style

- 2-space indentation (Prettier enforces this)
- Arrow functions for callbacks; named `function` declarations for top-level exports
- `async/await` over `.then()`/`.catch()`
- No comments explaining WHAT the code does — only WHY when non-obvious
- No docstrings or multi-line comment blocks
- No unused imports or blank lines left behind when removing imports
- `export type *` in index files for re-exporting types

## Key invariants to preserve

**Execution pipeline order** (in `execute()` inside `createWebMCP`):
1. `onToolCallStart` audit event
2. `enabledWhen` condition check → `TOOL_CONDITION_FAILED`
3. Schema validation → `VALIDATION_FAILED`
4. `decideApproval` (static: policy/rules/tool-level)
5. `confirmWhen` dynamic check (only if approval not already required)
6. If approval required: run `dryRun` (best-effort, swallow errors)
7. `requestApproval` → `APPROVAL_REQUIRED` or `APPROVAL_REJECTED`
8. `handler` → `TOOL_EXECUTION_FAILED`
9. `onToolCallSuccess` audit event

**Do not reorder these steps.**

**`dryRun` errors must never block execution.** If `dryRun` throws, log a warning and proceed without preview. The user approved the confirmation dialog — don't fail the action because of a preview failure.

**`confirmWhen` must not run if approval is already required.** Only evaluate it as a fallback when the static decision is `required: false`.

## SSR safety

`showApprovalDialog`, `createDevAdapter` badge and any DOM-touching code must guard with:
```ts
if (typeof document === "undefined") return;
```

Never assume a browser environment in `@webmcp/core` unless inside a function that is clearly browser-only.

## Testing

- Test framework: **Vitest** (`npx vitest run` in each package)
- Each new behavior gets a test. No shipping untested code.
- Use `silentAdapter()` pattern (no-op adapter) for unit tests — do not test against the real `navigator.modelContext`
- When testing approval flows, pass `{ mode: "custom", approve: vi.fn(...) }` — never mock `showApprovalDialog` directly
- When a mock needs type-safe parameter access, type the spy: `vi.fn(async (_req: ApprovalRequest) => true)`
- Prefer one `expect` per test behaviour over many assertions per test
- `onToolCallDenied` should fire for ALL denied paths: conditions, approval, validation

## Package boundaries

- `@webmcp/core` has zero runtime dependencies except `zod` and `zod-to-json-schema`
- Framework packages (`@webmcp/react`, `@webmcp/nextjs`) must not add logic — they wire `@webmcp/core` to framework lifecycle
- Never import from one package's `src/` into another package — only from the published interface

## Adding new features

Before implementing:
1. Check `TASKS.md` for the feature — it has the approved API shape
2. Add types to `types.ts` first
3. Update `execute()` pipeline if the feature is part of the execution path (respect the pipeline order above)
4. Export from `packages/core/src/index.ts`
5. Write tests before or alongside the implementation
6. Run `npx tsc --noEmit && npx vitest run` — both must pass clean

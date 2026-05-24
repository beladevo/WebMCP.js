# Architecture

webmcp.js is an execution and safety layer around WebMCP tool registration. It does not define a protocol.

![webmcp.js architecture diagram](/architecture.png)

## Adapter

The default adapter checks for:

```ts
globalThis.navigator?.modelContext?.registerTool;
```

When present, webmcp.js passes a registered tool to that function. When absent, behavior follows the `unavailable` option: `silent`, `warn`, or `throw`.

The adapter is replaceable because WebMCP runtime APIs are still subject to change.

## Registry

`createWebMCP` keeps local handles for registered tools. The registry supports tests, React cleanup, explicit unregister calls, and local execution when native WebMCP is unavailable.

## Execution Flow

1. Validate input.
2. Decide whether approval is required from risk defaults, approval rules, and tool overrides.
3. Ask the approval provider when required.
4. Run the tool function.
5. Return `{ ok: true, data }` or `{ ok: false, error }`.

## Packages

- `@webmcp-js/core`: core registration, validation, approvals, audit hooks, badge, and native adapter.
- `@webmcp-js/react`: React provider and tool registration hook.
- `@webmcp-js/testing`: in-memory adapter and assertion helpers.

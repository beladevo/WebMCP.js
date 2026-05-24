# @webmcp-js/core

Type-safe WebMCP toolkit for registering validated, approval-aware browser tools.

`@webmcp-js/core` gives product teams a small, practical layer for exposing page actions to WebMCP-capable browsers and agents. Define a tool once with TypeScript, validate input with Zod, generate JSON Schema for registration, and keep sensitive actions behind explicit approval.

Use it for actions like product search, cart operations, checkout starts, support ticket creation, dashboard queries, or any other workflow where an AI agent should call a narrow, structured browser capability instead of guessing through the DOM.

## Why Use It

- Register typed tools with `navigator.modelContext` when WebMCP is available.
- Keep the app usable in unsupported browsers through local tool handles.
- Validate every input with Zod before your application code runs.
- Generate JSON Schema-compatible input and output schemas.
- Mark tool risk levels and require approval for sensitive actions.
- Add custom approval flows for high-impact operations.
- Redact audit events before they reach logs.
- Ship a tiny ESM package with TypeScript types.

webmcp.js does not define a new protocol and does not install a WebMCP runtime. It is a developer toolkit for the browser API surface as it emerges.

## Install

```bash
pnpm add @webmcp-js/core zod
```

```bash
npm install @webmcp-js/core zod
```

## Quick Start

```ts
import { createWebMCP, z } from "@webmcp-js/core";

const mcp = createWebMCP({
  appName: "Storefront",
  debug: true,
  showSupportWebMCP: true,
  unavailable: "warn"
});

mcp.tool("products.search", {
  description: "Search products in the catalog",
  input: z.object({
    query: z.string().min(1),
    limit: z.number().min(1).max(50).default(10)
  }),
  risk: "read",
  run: async ({ query, limit }) => {
    return productService.search(query, limit);
  }
});
```

If `navigator.modelContext.registerTool` is available, the tool is registered with the native runtime. If it is unavailable, the local tool handle still exists for tests and progressive enhancement behavior.

## Common Use Cases

- Search and filtering tools for catalogs, docs, dashboards, and help centers.
- Safe write actions such as `cart.add`, `form.submit`, or `support.create_ticket`.
- High-risk workflows such as checkout, account changes, or data exports with approval gates.
- Agent-friendly interfaces for apps that should expose explicit capabilities instead of relying on UI automation.

## Sensitive Tools

High-impact tools should require approval:

```ts
mcp.tool("checkout.start", {
  description: "Start checkout for the current cart",
  input: z.object({ cartId: z.string() }),
  risk: "critical",
  approval: {
    required: true,
    reason: "Checkout starts a purchase flow."
  },
  audit: true,
  run: async ({ cartId }) => {
    return checkoutService.start(cartId);
  }
});
```

Tool execution returns structured results:

```ts
const result = await mcp.getTool("checkout.start")?.execute({ cartId: "cart_1" });

if (!result?.ok) {
  console.error(result?.error.code);
}
```

## Approval

The default approval policy is risk-based:

- `read`: allowed
- `low`: allowed
- `medium`: allowed
- `high`: approval required
- `critical`: approval required

Use a browser dialog:

```ts
const mcp = createWebMCP({
  approval: { mode: "browser-dialog" }
});
```

Use a custom approval provider:

```ts
const mcp = createWebMCP({
  approval: {
    mode: "custom",
    approve: async ({ tool, input, risk, reason }) => {
      return approvalService.request({ tool, input, risk, reason });
    }
  }
});
```

Use approval rules:

```ts
const mcp = createWebMCP({
  approval: {
    mode: "custom",
    approve: requestToolApproval,
    rules: [
      { match: "products.*", requireApproval: false },
      { match: "cart.add", requireApproval: true },
      { match: "checkout.*", requireApproval: true, reason: "Checkout starts a purchase flow." }
    ]
  }
});
```

Rules use simple `*` wildcard matching against tool names.

## Audit Hooks

Inputs are redacted by default before audit hooks receive them.

```ts
const mcp = createWebMCP({
  audit: {
    redact: (input) => ({ type: typeof input }),
    onToolCallStart: (event) => securityLog.info(event),
    onToolCallDenied: (event) => securityLog.warn(event),
    onToolCallError: (event) => securityLog.error(event)
  }
});
```

Do not log secrets, tokens, payment data, private messages, or full freeform user content unless your application policy explicitly allows it.

## Native Runtime

The default adapter uses `navigator.modelContext.registerTool` when it exists. It does not create `navigator.modelContext`.

If you use a polyfill, initialize it before creating the webmcp.js instance:

```ts
import { initializeWebMCPPolyfill } from "@mcp-b/webmcp-polyfill";

initializeWebMCPPolyfill();

const mcp = createWebMCP();
```

## Exports

```ts
import {
  createWebMCP,
  createNativeAdapter,
  decideApproval,
  matchesToolName,
  z
} from "@webmcp-js/core";
```

The package also exports its TypeScript types.

## License

MIT.

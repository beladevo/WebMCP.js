# @webmcp-js/core

Core TypeScript toolkit for exposing typed, validated, approval-aware WebMCP tools.

webmcp.js helps a web app register structured tools with `navigator.modelContext` when that API exists. It does not define a new protocol and does not install a WebMCP runtime.

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

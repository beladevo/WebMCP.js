# @webmcp-js/core

Type-safe WebMCP toolkit for registering validated, approval-aware browser tools and resources.

## Install

```bash
pnpm add @webmcp-js/core zod
```

## Quick Start

```ts
import { createWebMCP, z } from "@webmcp-js/core";

const mcp = createWebMCP({ appName: "Storefront" });

mcp.tool("products.search", {
  description: "Search products in the catalog",
  input: z.object({ query: z.string(), limit: z.number().default(10) }),
  risk: "read",
  run: async ({ query, limit }) => productService.search(query, limit)
});
```

Tools are registered with `navigator.modelContext` when available, and kept as local handles for tests and progressive enhancement when not.

## Key Features

- Zod input validation before approval or execution
- Risk-based approval (`read`/`low`/`medium` allowed, `high`/`critical` require approval)
- `dryRun` previews effects before the user approves
- `enabledWhen` conditions gate tool availability at runtime
- `confirmWhen` triggers approval dynamically per call
- Resources (static and URI template) for exposing read-only data
- `createDevAdapter()` for an in-browser dev panel during development
- Structured `ToolResult<T>` with typed error codes
- Audit hooks with built-in input redaction

## Documentation

Full docs at [webmcp.js docs site](https://beladevo.github.io/webmcp.js).

## License

MIT.

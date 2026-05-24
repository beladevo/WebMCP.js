# Getting Started

webmcp.js helps a web app expose explicit, structured actions through WebMCP when a compatible runtime is available. It also keeps local handles for tests and progressive enhancement when the runtime is unavailable.

## Install

```bash
pnpm add @webmcp-js/core zod
```

## Register a Tool

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
  run: async ({ query, limit }) => productService.search(query, limit)
});
```

If `navigator.modelContext.registerTool` exists, the native adapter registers the tool with the browser runtime. If it does not exist, the tool is still registered locally unless `unavailable` is set to `"throw"`.

## Execute Locally

Local execution is useful for tests, examples, and UI flows that should work without a WebMCP runtime.

```ts
const tool = mcp.getTool("products.search");
const result = await tool?.execute({ query: "keyboard", limit: 10 });

if (result?.ok) {
  console.log(result.data);
}
```

## Show the Support Badge

Set `showSupportWebMCP: true` to render a small page badge. The badge shows app name, runtime availability, and the tools registered on the page.

```ts
createWebMCP({
  appName: "Storefront",
  showSupportWebMCP: true,
  supportWebMCPBadgeText: "We support WebMCP"
});
```

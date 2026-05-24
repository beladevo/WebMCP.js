# Testing

The `@webmcp-js/testing` package provides an in-memory adapter and assertion helpers.

## Install

```bash
pnpm add -D @webmcp-js/testing
```

## Example

```ts
import { createTestWebMCP, expectTool } from "@webmcp-js/testing";
import { z } from "zod";

test("critical tool requires approval", async () => {
  const mcp = createTestWebMCP();

  const tool = mcp.tool("checkout.start", {
    description: "Start checkout",
    input: z.object({ cartId: z.string() }),
    risk: "critical",
    approval: true,
    run: async () => ({ checkoutId: "chk_1" })
  });

  await expectTool(tool).withInput({ cartId: "cart_1" }).toRequireApproval();
});
```

## Helpers

- `createTestAdapter()` returns an in-memory adapter and registered tool map.
- `createTestWebMCP(options)` creates a WebMCP instance with the test adapter by default.
- `expectTool(tool).withInput(input).toPass()` executes a tool and returns data.
- `toRequireApproval()`, `toRejectApproval()`, and `toFailValidation()` assert common failure modes.

# Core Concepts

## Tools

A tool is a named application action. Good tool names are narrow and action-oriented:

```ts
"products.search";
"cart.add";
"checkout.start";
```

Each tool has a description, optional input/output schemas, a risk level, optional approval config, and a `run` function.

## Input Validation

Zod schemas are validated before approval and execution.

```ts
mcp.tool("products.get_details", {
  description: "Get details for a product",
  input: z.object({ id: z.string() }),
  risk: "read",
  run: ({ id }) => products.find((p) => p.id === id) ?? null
});
```

When validation fails, execution returns `{ ok: false, error: { code: "VALIDATION_FAILED", ... } }`.

## Risk Levels

Risk levels communicate impact and drive approval defaults:

| Risk | Use for |
| --- | --- |
| `read` | Public or low-sensitivity reads |
| `low` | Small local changes with limited user impact |
| `medium` | User-visible changes or user-specific reads |
| `high` | Submissions, messages, cart changes, account changes |
| `critical` | Checkout, payments, destructive actions, privileged workflows |

High and critical tools require approval by default.

## Structured Results

Tool execution always returns a structured result:

```ts
type ToolResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: StructuredToolError };
```

The `run` function is not called when validation fails, required approval has no provider, or approval is rejected.

## Conditions

`enabledWhen` gates a tool behind runtime checks. Use the `condition()` helper to build conditions:

```ts
import { condition } from "@webmcp-js/core";

mcp.tool("checkout.start", {
  description: "Start checkout",
  input: z.object({ cartId: z.string() }),
  risk: "critical",
  enabledWhen: [
    condition(() => authStore.isLoggedIn(), "User must be logged in"),
    condition(() => cartStore.itemCount > 0, "Cart must not be empty")
  ],
  run: async ({ cartId }) => checkoutService.start(cartId)
});
```

A tool that fails its conditions returns `TOOL_CONDITION_FAILED` without running validation or the handler. Check why a tool is unavailable at any time:

```ts
const result = await mcp.explain("checkout.start");
// { tool: "checkout.start", available: false, reasons: ["Cart must not be empty"] }
```

## Dynamic Approval: confirmWhen

`confirmWhen` triggers approval based on the actual input values, evaluated per-call. It only runs when static approval rules would otherwise allow the call.

```ts
mcp.tool("order.cancel", {
  description: "Cancel an order",
  input: z.object({ orderId: z.string() }),
  risk: "medium",
  confirmWhen: async ({ orderId }) => {
    const order = await orderService.get(orderId);
    return order.totalCents > 10_000;
  },
  run: async ({ orderId }) => orderService.cancel(orderId)
});
```

## Dry Run

`dryRun` previews what a tool will do before the user approves it. When defined, it runs automatically before the approval dialog and its result is shown to the approver. Errors thrown by `dryRun` never block execution.

```ts
mcp.tool("cart.clear", {
  description: "Remove all items from the cart",
  input: z.object({ cartId: z.string() }),
  risk: "high",
  approval: { required: true },
  dryRun: async ({ cartId }) => {
    const cart = await cartService.get(cartId);
    return {
      summary: `Will remove ${cart.items.length} items`,
      effects: cart.items.map((i) => `- ${i.name}`)
    };
  },
  run: async ({ cartId }) => cartService.clear(cartId)
});
```

## Resources

Resources expose read-only data to agents. See the [Resources guide](/guide/resources) for details.

## Execution Context

The `run` handler receives a second argument with context about the current call:

```ts
run: async ({ format }, context) => {
  // context.tool          — tool name
  // context.risk          — effective risk level
  // context.approvalRequired — whether approval was required this call
}
```

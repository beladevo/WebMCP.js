# Approvals

Approvals decide whether a WebMCP tool may run now. They do not replace application authentication or authorization.

## Defaults

The default policy is `risk-based`:

| Risk | Default |
| --- | --- |
| `read` | Allowed |
| `low` | Allowed |
| `medium` | Allowed |
| `high` | Approval required |
| `critical` | Approval required |

## Approval Modes

**Browser dialog** — uses `window.confirm`. Useful for demos.

```ts
createWebMCP({ approval: { mode: "browser-dialog" } });
```

**Built-in dialog** — a styled in-page modal with tool name, risk, reason, and dry run preview.

```ts
createWebMCP({ approval: { mode: "built-in" } });
```

**Custom provider** — full control over the approval UI and flow.

```ts
createWebMCP({
  approval: {
    mode: "custom",
    approve: async ({ tool, input, risk, reason, dryRunResult }) => {
      return approvalService.request({ tool, input, risk, reason, dryRunResult });
    }
  }
});
```

**None** — no approval UI; any tool requiring approval returns `APPROVAL_REQUIRED`.

```ts
createWebMCP({ approval: { mode: "none" } });
```

## Policies and Rules

Override the global policy and add per-tool rules:

```ts
createWebMCP({
  approval: {
    mode: "custom",
    approve: requestApproval,
    policy: "risk-based",       // or "require-all" | "allow-all"
    rules: [
      { match: "products.*", requireApproval: false },
      { match: "cart.add", requireApproval: true },
      { match: "checkout.*", requireApproval: true, reason: "Checkout starts a purchase flow." }
    ]
  }
});
```

Rules are checked in order. `*` matches any sequence of characters.

## Tool-Level Overrides

```ts
mcp.tool("support.submit_ticket", {
  description: "Submit a support ticket",
  risk: "medium",
  approval: { required: true, reason: "Submitting a ticket sends user-provided content." },
  run: submitTicket
});
```

Use `approval: false` only when a high or critical tool has another explicit review step before it changes state.

## Dry Run

Define `dryRun` on a tool to show a preview inside the approval dialog before the user decides. The function runs after the static approval decision requires a prompt, but before the dialog is shown. Errors are swallowed — a failing dry run never blocks execution.

```ts
mcp.tool("cart.clear", {
  description: "Remove all items from the cart",
  risk: "high",
  approval: { required: true },
  dryRun: async ({ cartId }) => {
    const cart = await cartService.get(cartId);
    return { summary: `Will remove ${cart.items.length} items` };
  },
  run: async ({ cartId }) => cartService.clear(cartId)
});
```

## Dynamic Approval: confirmWhen

`confirmWhen` adds per-call approval logic that runs after static rules decide no approval is needed. Use it when the decision depends on the actual input values.

```ts
mcp.tool("order.cancel", {
  description: "Cancel an order",
  risk: "medium",
  confirmWhen: async ({ orderId }) => {
    const order = await orderService.get(orderId);
    return order.totalCents > 10_000;
  },
  run: async ({ orderId }) => orderService.cancel(orderId)
});
```

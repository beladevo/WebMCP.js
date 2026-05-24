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

## Browser Dialog

```ts
createWebMCP({
  approval: {
    mode: "browser-dialog"
  }
});
```

This is useful for local development and demos.

## Custom Provider

Production apps should usually use a custom provider so the approval UI can show app-specific details.

```ts
createWebMCP({
  approval: {
    mode: "custom",
    approve: async ({ tool, input, risk, reason }) => {
      return approvalService.request({ tool, input, risk, reason });
    }
  }
});
```

## Policies and Rules

```ts
createWebMCP({
  approval: {
    mode: "custom",
    approve: requestApproval,
    policy: "risk-based",
    rules: [
      { match: "products.*", requireApproval: false },
      { match: "cart.add", requireApproval: true },
      { match: "checkout.*", requireApproval: true, reason: "Checkout starts a purchase flow." }
    ]
  }
});
```

Rules are checked in order. `*` matches any sequence of characters.

## Tool Overrides

```ts
mcp.tool("support.submit_ticket", {
  description: "Submit a support ticket",
  risk: "medium",
  approval: {
    required: true,
    reason: "Submitting a ticket sends user-provided content."
  },
  run: submitTicket
});
```

Use `approval: false` only when a high or critical tool has another explicit review step before it changes state.

# Core Concepts

## Tools

A tool is a named application action. Good tool names are narrow and action-oriented:

```ts
"products.search";
"cart.add";
"checkout.start";
```

Each tool has a description, optional input and output schemas, a risk level, optional approval configuration, optional audit settings, and a `run` function.

## Input Validation

Zod schemas are validated before approval and execution.

```ts
mcp.tool("products.get_details", {
  description: "Get details for a product",
  input: z.object({ id: z.string() }),
  risk: "read",
  run: ({ id }) => products.find((product) => product.id === id) ?? null
});
```

When validation fails, execution returns:

```ts
{
  ok: false,
  error: {
    code: "VALIDATION_FAILED",
    message: "Invalid input for tool products.get_details.",
    risk: "read"
  }
}
```

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

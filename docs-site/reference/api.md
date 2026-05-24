# API Reference

## `createWebMCP(options?)`

Creates a WebMCP instance.

```ts
import { createWebMCP } from "@webmcp-js/core";

const mcp = createWebMCP({
  appName: "Storefront",
  unavailable: "warn"
});
```

## `WebMCPInstance`

```ts
interface WebMCPInstance {
  tool(name, definition): RegisteredToolHandle;
  unregister(name: string): Promise<void>;
  getTool(name: string): RegisteredToolHandle | undefined;
  listTools(): RegisteredToolHandle[];
}
```

## `tool(name, definition)`

Registers a tool locally and, when available, with `navigator.modelContext.registerTool`.

```ts
mcp.tool("cart.add", {
  description: "Add a product to the current cart",
  input: z.object({ productId: z.string(), quantity: z.number().min(1).default(1) }),
  risk: "high",
  approval: true,
  run: ({ productId, quantity }, context) => cart.add(productId, quantity)
});
```

## `ToolDefinition`

| Field | Type | Description |
| --- | --- | --- |
| `description` | `string` | Human-readable description of the tool. |
| `input` | `unknown` | Optional Zod schema or JSON Schema-compatible input schema. |
| `output` | `unknown` | Optional Zod schema or JSON Schema-compatible output schema. |
| `risk` | `ToolRisk` | Defaults to `read`. |
| `approval` | `boolean \| ApprovalOptions` | Tool-level approval override. |
| `audit` | `boolean \| AuditOptions` | Tool-level audit options. |
| `run` | `(input, context) => output` | Tool implementation. |

## `RegisteredToolHandle`

```ts
interface RegisteredToolHandle<TInput = unknown, TOutput = unknown> {
  name: string;
  definition: ToolDefinition<TInput, TOutput>;
  webmcpTool: RegisteredWebMCPTool;
  execute(input: unknown): Promise<ToolResult<TOutput>>;
  unregister(): Promise<void>;
}
```

## Result and Error Codes

```ts
type WebMCPErrorCode =
  | "WEBMCP_UNAVAILABLE"
  | "VALIDATION_FAILED"
  | "APPROVAL_REQUIRED"
  | "APPROVAL_REJECTED"
  | "TOOL_EXECUTION_FAILED";
```

Tool execution resolves to:

```ts
type ToolResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: StructuredToolError };
```

## React Exports

```ts
import { WebMCPProvider, useWebMCP, useWebMCPTool } from "@webmcp-js/react";
```

- `WebMCPProvider` accepts `CreateWebMCPOptions` as props.
- `useWebMCP()` returns the current instance.
- `useWebMCPTool(name, definition)` registers a tool for the component lifecycle.

## Testing Exports

```ts
import { createTestAdapter, createTestWebMCP, expectTool } from "@webmcp-js/testing";
```

- `createTestAdapter()` creates an in-memory adapter.
- `createTestWebMCP(options?)` creates a test instance.
- `expectTool(tool)` returns assertion helpers for local execution.

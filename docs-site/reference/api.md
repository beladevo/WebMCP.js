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
  // Tools
  tool(name, definition): RegisteredToolHandle;
  getTool(name: string): RegisteredToolHandle | undefined;
  listTools(): RegisteredToolHandle[];
  unregister(name: string): Promise<void>;
  call(name: string, input: unknown): Promise<ToolResult>;

  // Resources
  resource(name, definition): RegisteredResourceHandle;
  getResource(name: string): RegisteredResourceHandle | undefined;
  listResources(): RegisteredResourceHandle[];
  unregisterResource(name: string): Promise<void>;

  // Diagnostics
  explain(name: string): Promise<ExplainResult>;
  getRuntimeStatus(): RuntimeStatus;
}
```

`call(name, input)` is shorthand for `getTool(name)?.execute(input)`.

`explain(name)` evaluates `enabledWhen` conditions and returns `{ tool, available, reasons[] }`.

`getRuntimeStatus()` returns `{ native, adapterName, registeredTools, registeredResources }`.

## `tool(name, definition)`

Registers a tool locally and, when available, with `navigator.modelContext.registerTool`.

```ts
mcp.tool("cart.add", {
  description: "Add a product to the current cart",
  input: z.object({ productId: z.string(), quantity: z.number().min(1).default(1) }),
  risk: "high",
  approval: true,
  run: ({ productId, quantity }) => cart.add(productId, quantity)
});
```

## `ToolDefinition`

| Field | Type | Description |
| --- | --- | --- |
| `description` | `string` | Human-readable description. |
| `input` | `ZodSchema \| JSONSchema` | Input schema. Validated before execution. |
| `output` | `ZodSchema \| JSONSchema` | Output schema. Used for JSON Schema generation. |
| `risk` | `ToolRisk` | Defaults to `read`. |
| `approval` | `boolean \| ApprovalOptions` | Tool-level approval override. |
| `audit` | `boolean \| AuditOptions` | Tool-level audit options. |
| `enabledWhen` | `ToolCondition[]` | Runtime gate conditions. |
| `confirmWhen` | `(input) => boolean \| Promise<boolean>` | Dynamic per-call approval trigger. |
| `dryRun` | `(input) => DryRunResult \| Promise<DryRunResult>` | Preview shown before approval dialog. |
| `run` | `(input, context) => output` | Tool implementation. |

## `RegisteredToolHandle`

```ts
interface RegisteredToolHandle<TInput = unknown, TOutput = unknown> {
  name: string;
  definition: ToolDefinition<TInput, TOutput>;
  webmcpTool: RegisteredWebMCPTool;
  execute(input: unknown): Promise<ToolResult<TOutput>>;
  dryRun(input: unknown): Promise<ToolResult<DryRunResult>>;
  unregister(): Promise<void>;
}
```

## `resource(name, definition)`

Registers a resource. See the [Resources guide](/guide/resources) for examples.

## `RegisteredResourceHandle`

```ts
interface RegisteredResourceHandle<TParams = Record<string, string>> {
  name: string;
  definition: ResourceDefinition<TParams>;
  read(uri: string): Promise<ToolResult<string>>;
  unregister(): Promise<void>;
}
```

## `condition(check, reason)`

Helper to build `ToolCondition` objects for `enabledWhen`:

```ts
import { condition } from "@webmcp-js/core";

enabledWhen: [
  condition(() => authStore.isLoggedIn(), "User must be logged in")
]
```

## Result and Error Codes

```ts
type WebMCPErrorCode =
  | "WEBMCP_UNAVAILABLE"
  | "VALIDATION_FAILED"
  | "TOOL_CONDITION_FAILED"
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

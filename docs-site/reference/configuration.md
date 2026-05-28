# Configuration

## `CreateWebMCPOptions`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `appName` | `string` | `undefined` | App name shown in the support badge and approval surfaces. |
| `debug` | `boolean` | `false` | Enables debug logging. |
| `showSupportWebMCP` | `boolean` | `false` | Renders the WebMCP support badge in the browser. |
| `supportWebMCPBadgeText` | `string` | `"We support WebMCP"` | Custom badge text. |
| `unavailable` | `"silent" \| "warn" \| "throw"` | `"warn"` | Behavior when native WebMCP is unavailable. |
| `approval` | `ApprovalConfig` | `undefined` | Approval provider, policy, and rules. |
| `audit` | `AuditConfig` | `undefined` | Redaction and audit hooks. |
| `adapter` | `WebMCPAdapter` | native adapter | Custom WebMCP adapter. |

## Approval Config

```ts
type ApprovalPolicy = "risk-based" | "require-all" | "allow-all";

type ApprovalConfig =
  | { mode?: undefined; policy?: ApprovalPolicy; rules?: ApprovalRule[] }
  | { mode: "browser-dialog"; policy?: ApprovalPolicy; rules?: ApprovalRule[] }
  | { mode: "built-in"; policy?: ApprovalPolicy; rules?: ApprovalRule[] }
  | { mode: "custom"; approve: ApprovalProvider; policy?: ApprovalPolicy; rules?: ApprovalRule[] }
  | { mode: "none"; policy?: ApprovalPolicy; rules?: ApprovalRule[] };
```

- `browser-dialog` — uses `window.confirm`. Good for demos.
- `built-in` — styled in-page modal that shows tool name, risk, reason, and dry run preview.
- `custom` — full control; `approve` receives an `ApprovalRequest` and must return a boolean.
- `none` — no UI; any tool that requires approval returns `APPROVAL_REQUIRED`.

## Audit Config

```ts
interface AuditConfig {
  redact?: (input: unknown, event: Omit<AuditEvent, "input">) => unknown;
  onToolCallStart?: (event: AuditEvent) => void | Promise<void>;
  onToolCallSuccess?: (event: AuditSuccessEvent) => void | Promise<void>;
  onToolCallDenied?: (event: AuditErrorEvent) => void | Promise<void>;
  onToolCallError?: (event: AuditErrorEvent) => void | Promise<void>;
}
```

Inputs are redacted to `"[redacted]"` by default before audit hooks receive them.

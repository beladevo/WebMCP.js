# Security

WebMCP tools are executable application actions. Treat every registered tool as part of your app security surface.

## Rules

- Validate every input.
- Keep tools narrow and named for one action.
- Require approval for high-impact tools.
- Enforce app authentication and authorization in your services.
- Do not expose secrets in tool output.
- Redact audit events.
- Keep the human UI working without WebMCP.
- Review iframe and Permissions Policy behavior for the browser runtime you target.

## Authentication

Approvals are a confirmation gate, not an auth system. User-specific tools should call app services that enforce the current session and authorization checks.

## Audit Data

Audit hook input is redacted by default. Override `audit.redact` only with a function that removes secrets and personal data.

Do not log access tokens, payment data, session identifiers, private messages, passwords, recovery codes, or full freeform user content unless your application policy explicitly allows it.

```ts
createWebMCP({
  audit: {
    redact: (input) => ({ type: typeof input }),
    onToolCallDenied: (event) => securityLog.warn(event),
    onToolCallError: (event) => securityLog.error(event)
  }
});
```

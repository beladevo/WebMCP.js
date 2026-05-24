---
layout: home

hero:
  name: "webmcp.js"
  text: "Typed WebMCP tools for web apps"
  tagline: "Register validated, approval-aware browser tools with TypeScript, Zod, React bindings, and testing utilities."
  image:
    src: /webmcp_logo.png
    alt: webmcp.js logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /reference/api

features:
  - title: Typed tool definitions
    details: Define named tools with descriptions, input schemas, risk levels, and strongly typed run functions.
  - title: Validation and JSON Schema
    details: Use Zod as the developer-facing schema API while registering JSON Schema-compatible metadata.
  - title: Approval-aware execution
    details: Require human or agent approval for high-impact actions through browser dialogs or custom providers.
  - title: React and tests
    details: Register tools from React components and test validation, approval, rejection, and execution behavior in memory.
---

## Status

WebMCP is an emerging browser API proposal. This library is an execution and safety layer around `navigator.modelContext` when that API exists. It does not define a protocol, ship a browser runtime, or create `navigator.modelContext`.

```bash
pnpm add @webmcp-js/core zod
```

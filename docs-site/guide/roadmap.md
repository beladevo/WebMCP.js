# Roadmap

This list tracks work that directly improves WebMCP tool registration, approvals, safety, or tests.

## Core

- Add more JSON Schema conversion tests.
- Add runtime validation support for non-Zod JSON Schema input.
- Add approval-provider and audit hook assertions to `@webmcp-js/testing`.
- Add execution-error assertions to `@webmcp-js/testing`.

## Frameworks

- Add a Next.js example.
- Add Vue and Svelte adapters if the React API proves useful.

## Runtime

- Track WebMCP browser API changes.
- Add integration tests against a real WebMCP runtime when a stable test target is available.
- Add form-to-tool helpers only after the core registration API is stable.

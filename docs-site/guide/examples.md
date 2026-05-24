# Examples

The repository includes runnable examples under `examples/`.

## Vanilla TypeScript

The vanilla example registers product search, product details, and cart tools.

```bash
pnpm --filter ./examples/vanilla dev
```

Key behavior:

- `products.search` is a read tool with Zod input validation.
- `products.get_details` returns a single product or `null`.
- `cart.add` is a high-risk tool with explicit approval.
- The page also uses the local tool handle to run search from normal UI.

## React Vite

The React example demonstrates `WebMCPProvider` and `useWebMCPTool`.

```bash
pnpm --filter ./examples/react-vite dev
```

Use it as the starting point when tools are tied to component lifecycle.

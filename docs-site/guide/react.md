# React

The `@webmcp-js/react` package provides a context provider and a hook for registering tools from React components.

## Install

```bash
pnpm add @webmcp-js/react @webmcp-js/core zod
```

## Provider

```tsx
import { WebMCPProvider } from "@webmcp-js/react";

export function App() {
  return (
    <WebMCPProvider appName="Storefront" debug showSupportWebMCP approval={{ mode: "browser-dialog" }}>
      <ProductPage />
    </WebMCPProvider>
  );
}
```

The provider creates a `createWebMCP` instance and makes it available through context.

## Register a Tool

```tsx
import { useWebMCPTool } from "@webmcp-js/react";
import { z } from "zod";

function ProductPage({ product }) {
  useWebMCPTool("cart.add_current_product", {
    description: "Add the current product to the cart",
    input: z.object({ quantity: z.number().min(1).default(1) }),
    risk: "high",
    approval: true,
    run: async ({ quantity }) => cart.add(product.id, quantity)
  });

  return <ProductView product={product} />;
}
```

`useWebMCPTool` registers on mount and unregisters on cleanup when the adapter supports `unregisterTool`.

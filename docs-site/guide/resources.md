# Resources

Resources expose read-only data to agents using `mcp.resource()`. They are similar to tools but have no approval flow and are read by URI.

## Static Resource

A static resource has a fixed URI:

```ts
mcp.resource("site-config", {
  uri: "webmcp://config",
  description: "Current site configuration",
  mimeType: "application/json",
  read: async () => JSON.stringify(await configService.get())
});
```

## Template Resource

A template resource matches a URI pattern and extracts parameters automatically:

```ts
mcp.resource<{ id: string }>("product-detail", {
  uriTemplate: "webmcp://products/{id}",
  description: "Product detail by ID",
  mimeType: "application/json",
  read: async ({ id }) => JSON.stringify(await productService.get(id))
});
```

## Reading Directly

You can read a resource from its handle without going through the native runtime:

```ts
const result = await mcp.getResource("product-detail")?.read("webmcp://products/42");

if (result?.ok) {
  console.log(result.data); // JSON string
}
```

## Managing Resources

```ts
mcp.listResources();                      // all registered resource handles
await mcp.unregisterResource("site-config");
```

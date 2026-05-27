import { describe, expect, it, vi } from "vitest";
import { createWebMCP, extractUriParams, matchesUriTemplate } from "../src/index.js";
import type { WebMCPAdapter, RegisteredWebMCPResource } from "../src/index.js";

function silentAdapter(): WebMCPAdapter {
  return {
    isAvailable: () => true,
    registerTool: () => {},
    unregisterTool: () => {}
  };
}

function resourceTrackingAdapter() {
  const resources = new Map<string, RegisteredWebMCPResource>();
  const adapter: WebMCPAdapter = {
    name: "test",
    isAvailable: () => true,
    registerTool: () => {},
    unregisterTool: () => {},
    registerResource: (r) => { resources.set(r.name, r); },
    unregisterResource: (name) => { resources.delete(name); }
  };
  return { adapter, resources };
}

// ─── URI template utilities ──────────────────────────────────────────────────

describe("extractUriParams", () => {
  it("returns params for a matching template URI", () => {
    expect(extractUriParams("webml://articles/{slug}", "webml://articles/intro-to-webgpu"))
      .toEqual({ slug: "intro-to-webgpu" });
  });

  it("returns null for a non-matching URI", () => {
    expect(extractUriParams("webml://articles/{slug}", "webml://about")).toBeNull();
  });

  it("extracts multiple params", () => {
    expect(extractUriParams("webml://users/{userId}/posts/{postId}", "webml://users/42/posts/7"))
      .toEqual({ userId: "42", postId: "7" });
  });

  it("does not match partial paths", () => {
    expect(extractUriParams("webml://articles/{slug}", "webml://articles/foo/bar")).toBeNull();
  });
});

describe("matchesUriTemplate", () => {
  it("returns true when URI matches template", () => {
    expect(matchesUriTemplate("webml://articles/{slug}", "webml://articles/intro")).toBe(true);
  });

  it("returns false when URI does not match", () => {
    expect(matchesUriTemplate("webml://articles/{slug}", "webml://about")).toBe(false);
  });
});

// ─── Static resource ─────────────────────────────────────────────────────────

describe("static resource", () => {
  it("reads content from a static URI", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const res = mcp.resource("webml.about", {
      uri: "webml://about",
      description: "About WebML",
      mimeType: "text/markdown",
      read: () => "# About WebML"
    });

    const result = await res.read("webml://about");
    expect(result).toEqual({ ok: true, data: "# About WebML" });
  });

  it("returns error for wrong URI", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const res = mcp.resource("webml.about", {
      uri: "webml://about",
      description: "About WebML",
      read: () => "content"
    });

    const result = await res.read("webml://other");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("TOOL_EXECUTION_FAILED");
  });

  it("supports async read", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const res = mcp.resource("webml.about", {
      uri: "webml://about",
      description: "About WebML",
      read: async () => "async content"
    });

    const result = await res.read("webml://about");
    expect(result).toEqual({ ok: true, data: "async content" });
  });

  it("returns error when read throws", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const res = mcp.resource("webml.about", {
      uri: "webml://about",
      description: "About WebML",
      read: () => { throw new Error("DB down"); }
    });

    const result = await res.read("webml://about");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("TOOL_EXECUTION_FAILED");
  });
});

// ─── Template resource ───────────────────────────────────────────────────────

describe("template resource", () => {
  it("reads content with extracted URI params", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const res = mcp.resource<{ slug: string }>("webml.article", {
      uriTemplate: "webml://articles/{slug}",
      description: "Read an article",
      mimeType: "text/markdown",
      read: ({ slug }) => `# Article: ${slug}`
    });

    const result = await res.read("webml://articles/intro-to-webgpu");
    expect(result).toEqual({ ok: true, data: "# Article: intro-to-webgpu" });
  });

  it("returns error when URI does not match template", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const res = mcp.resource<{ slug: string }>("webml.article", {
      uriTemplate: "webml://articles/{slug}",
      description: "Read an article",
      read: ({ slug }) => slug
    });

    const result = await res.read("webml://about");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("TOOL_EXECUTION_FAILED");
  });

  it("supports multiple params in template", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const res = mcp.resource<{ category: string; page: string }>("webml.section", {
      uriTemplate: "webml://docs/{category}/{page}",
      description: "Read a docs page",
      read: ({ category, page }) => `${category}/${page}`
    });

    const result = await res.read("webml://docs/api/resources");
    expect(result).toEqual({ ok: true, data: "api/resources" });
  });
});

// ─── Adapter integration ─────────────────────────────────────────────────────

describe("resource adapter registration", () => {
  it("registers resource with adapter", async () => {
    const { adapter, resources } = resourceTrackingAdapter();
    const mcp = createWebMCP({ adapter });

    mcp.resource("webml.about", {
      uri: "webml://about",
      description: "About page",
      read: () => "content"
    });

    await Promise.resolve();
    expect(resources.has("webml.about")).toBe(true);
    expect(resources.get("webml.about")?.uri).toBe("webml://about");
  });

  it("registers template resource with uriTemplate on adapter", async () => {
    const { adapter, resources } = resourceTrackingAdapter();
    const mcp = createWebMCP({ adapter });

    mcp.resource("webml.article", {
      uriTemplate: "webml://articles/{slug}",
      description: "Article",
      read: () => "content"
    });

    await Promise.resolve();
    expect(resources.get("webml.article")?.uriTemplate).toBe("webml://articles/{slug}");
  });

  it("unregisters resource from adapter and instance", async () => {
    const { adapter, resources } = resourceTrackingAdapter();
    const mcp = createWebMCP({ adapter });

    const handle = mcp.resource("webml.about", {
      uri: "webml://about",
      description: "About",
      read: () => "content"
    });

    await Promise.resolve();
    await handle.unregister();
    expect(resources.has("webml.about")).toBe(false);
    expect(mcp.getResource("webml.about")).toBeUndefined();
  });

  it("replaces duplicate registration safely", async () => {
    const registerResource = vi.fn();
    const unregisterResource = vi.fn();
    const adapter: WebMCPAdapter = {
      isAvailable: () => true,
      registerTool: () => {},
      registerResource,
      unregisterResource
    };
    const mcp = createWebMCP({ adapter });

    mcp.resource("webml.about", { uri: "webml://about", description: "v1", read: () => "v1" });
    mcp.resource("webml.about", { uri: "webml://about", description: "v2", read: () => "v2" });

    await Promise.resolve();
    expect(unregisterResource).toHaveBeenCalledWith("webml.about");
    expect(registerResource).toHaveBeenCalledTimes(2);
    expect(mcp.listResources()).toHaveLength(1);
  });
});

// ─── listResources / getResource ─────────────────────────────────────────────

describe("listResources / getResource", () => {
  it("lists all registered resources", () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    mcp.resource("webml.about", { uri: "webml://about", description: "About", read: () => "" });
    mcp.resource("webml.article", { uriTemplate: "webml://articles/{slug}", description: "Article", read: () => "" });

    expect(mcp.listResources()).toHaveLength(2);
  });

  it("getResource returns handle by name", () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    mcp.resource("webml.about", { uri: "webml://about", description: "About", read: () => "" });

    expect(mcp.getResource("webml.about")).toBeDefined();
    expect(mcp.getResource("missing")).toBeUndefined();
  });
});

// ─── getRuntimeStatus ────────────────────────────────────────────────────────

describe("getRuntimeStatus", () => {
  it("returns runtime status with correct counts", () => {
    const mcp = createWebMCP({ adapter: { ...silentAdapter(), name: "test" } });
    mcp.tool("cart.add", { description: "Add to cart", run: () => ({}) });
    mcp.resource("webml.about", { uri: "webml://about", description: "About", read: () => "" });

    const status = mcp.getRuntimeStatus();
    expect(status.registeredTools).toBe(1);
    expect(status.registeredResources).toBe(1);
    expect(status.native).toBe(true);
    expect(status.adapterName).toBe("test");
  });

  it("returns native: false when adapter is unavailable", () => {
    const mcp = createWebMCP({
      adapter: { isAvailable: () => false, registerTool: () => {} },
      unavailable: "silent"
    });

    expect(mcp.getRuntimeStatus().native).toBe(false);
  });
});

// ─── mcp.call() ─────────────────────────────────────────────────────────────

describe("mcp.call()", () => {
  it("calls a registered tool by name", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    mcp.tool("product.search", {
      description: "Search products",
      run: () => [{ id: "abc" }]
    });

    const result = await mcp.call("product.search", {});
    expect(result).toEqual({ ok: true, data: [{ id: "abc" }] });
  });

  it("returns error for unregistered tool name", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });

    const result = await mcp.call("nonexistent.tool", {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TOOL_EXECUTION_FAILED");
      expect(result.error.message).toContain("nonexistent.tool");
    }
  });
});

// ─── Duplicate tool registration ────────────────────────────────────────────

describe("duplicate tool registration", () => {
  it("replaces existing tool without double-registering", async () => {
    const registerTool = vi.fn();
    const unregisterTool = vi.fn();
    const adapter: WebMCPAdapter = {
      isAvailable: () => true,
      registerTool,
      unregisterTool
    };
    const mcp = createWebMCP({ adapter });

    mcp.tool("cart.add", { description: "v1", run: () => "v1" });
    mcp.tool("cart.add", { description: "v2", run: () => "v2" });

    await Promise.resolve();
    expect(unregisterTool).toHaveBeenCalledWith("cart.add");
    expect(registerTool).toHaveBeenCalledTimes(2);
    expect(mcp.listTools()).toHaveLength(1);
  });

  it("uses the new handler after re-registration", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    mcp.tool("cart.add", { description: "v1", run: () => "v1" });
    mcp.tool("cart.add", { description: "v2", run: () => "v2" });

    const result = await mcp.call("cart.add", {});
    expect(result).toEqual({ ok: true, data: "v2" });
  });
});

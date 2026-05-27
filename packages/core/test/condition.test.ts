import { describe, expect, it, vi } from "vitest";
import { condition, createWebMCP, z } from "../src/index.js";
import type { WebMCPAdapter } from "../src/index.js";

function silentAdapter(): WebMCPAdapter {
  return {
    isAvailable: () => true,
    registerTool: () => {},
    unregisterTool: () => {}
  };
}

describe("condition()", () => {
  it("returns a ToolCondition with the given check and reason", () => {
    const cond = condition(() => true, "Not ready");
    expect(cond.reason).toBe("Not ready");
    expect(cond.check()).toBe(true);
  });

  it("supports async check functions", async () => {
    const cond = condition(async () => false, "Async not ready");
    await expect(cond.check()).resolves.toBe(false);
  });
});

describe("enabledWhen", () => {
  it("executes the tool when all conditions pass", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const tool = mcp.tool("cart.add", {
      description: "Add to cart",
      enabledWhen: [condition(() => true, "Always available")],
      run: () => ({ ok: true })
    });

    const result = await tool.execute({});
    expect(result.ok).toBe(true);
  });

  it("blocks execution when a condition fails", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const tool = mcp.tool("checkout.confirm", {
      description: "Confirm checkout",
      enabledWhen: [condition(() => false, "Cart is empty")],
      run: () => ({ confirmed: true })
    });

    const result = await tool.execute({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TOOL_CONDITION_FAILED");
      expect(result.error.details).toEqual(["Cart is empty"]);
    }
  });

  it("reports all failed conditions in details", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const tool = mcp.tool("checkout.confirm", {
      description: "Confirm checkout",
      enabledWhen: [
        condition(() => false, "User is not logged in"),
        condition(() => true, "Route is correct"),
        condition(() => false, "Cart is empty")
      ],
      run: () => ({ confirmed: true })
    });

    const result = await tool.execute({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details).toEqual(["User is not logged in", "Cart is empty"]);
    }
  });

  it("supports async conditions", async () => {
    let loggedIn = false;
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const tool = mcp.tool("checkout.confirm", {
      description: "Confirm checkout",
      enabledWhen: [condition(async () => loggedIn, "User is not logged in")],
      run: () => ({ confirmed: true })
    });

    expect((await tool.execute({})).ok).toBe(false);
    loggedIn = true;
    expect((await tool.execute({})).ok).toBe(true);
  });

  it("emits onToolCallDenied when a condition fails", async () => {
    const denied = vi.fn();
    const mcp = createWebMCP({
      adapter: silentAdapter(),
      audit: { onToolCallDenied: denied }
    });
    const tool = mcp.tool("checkout.confirm", {
      description: "Confirm checkout",
      enabledWhen: [condition(() => false, "Cart is empty")],
      run: () => ({ confirmed: true })
    });

    await tool.execute({});
    expect(denied).toHaveBeenCalledOnce();
    expect(denied.mock.calls[0]?.[0].error.code).toBe("TOOL_CONDITION_FAILED");
  });
});

describe("explain()", () => {
  it("returns available: true when all conditions pass", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    mcp.tool("product.search", {
      description: "Search products",
      enabledWhen: [condition(() => true, "Always available")],
      run: () => []
    });

    const result = await mcp.explain("product.search");
    expect(result).toEqual({ tool: "product.search", available: true, reasons: [] });
  });

  it("returns available: false with failed reasons", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    mcp.tool("checkout.confirm", {
      description: "Confirm checkout",
      enabledWhen: [
        condition(() => false, "User is not logged in"),
        condition(() => false, "Cart is empty")
      ],
      run: () => ({ confirmed: true })
    });

    const result = await mcp.explain("checkout.confirm");
    expect(result).toEqual({
      tool: "checkout.confirm",
      available: false,
      reasons: ["User is not logged in", "Cart is empty"]
    });
  });

  it("returns available: true for tools with no enabledWhen", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    mcp.tool("product.search", {
      description: "Search products",
      run: () => []
    });

    const result = await mcp.explain("product.search");
    expect(result).toEqual({ tool: "product.search", available: true, reasons: [] });
  });

  it("returns available: false for unregistered tools", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });

    const result = await mcp.explain("nonexistent.tool");
    expect(result).toEqual({
      tool: "nonexistent.tool",
      available: false,
      reasons: ["Tool not registered"]
    });
  });

  it("only reports currently failing conditions", async () => {
    let userLoggedIn = false;
    const mcp = createWebMCP({ adapter: silentAdapter() });
    mcp.tool("checkout.confirm", {
      description: "Confirm checkout",
      enabledWhen: [
        condition(() => userLoggedIn, "User is not logged in"),
        condition(() => true, "Cart has items")
      ],
      run: () => ({ confirmed: true })
    });

    const before = await mcp.explain("checkout.confirm");
    expect(before.available).toBe(false);
    expect(before.reasons).toEqual(["User is not logged in"]);

    userLoggedIn = true;
    const after = await mcp.explain("checkout.confirm");
    expect(after.available).toBe(true);
    expect(after.reasons).toEqual([]);
  });

  it("works with typed input schema alongside enabledWhen", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const tool = mcp.tool("cart.add", {
      description: "Add to cart",
      input: z.object({ productId: z.string() }),
      enabledWhen: [condition(() => false, "Cart service unavailable")],
      run: () => ({ ok: true })
    });

    const result = await tool.execute({ productId: "abc" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("TOOL_CONDITION_FAILED");
  });
});

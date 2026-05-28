import { describe, expect, it, vi } from "vitest";
import { createWebMCP, z } from "../src/index.js";
import type { ApprovalRequest, WebMCPAdapter } from "../src/index.js";

function silentAdapter(): WebMCPAdapter {
  return {
    isAvailable: () => true,
    registerTool: () => {},
    unregisterTool: () => {}
  };
}

function autoApproveConfig() {
  return { mode: "custom" as const, approve: async () => true };
}

describe("dryRun on handle", () => {
  it("returns dryRun result for valid input", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const tool = mcp.tool("checkout.confirm", {
      description: "Confirm checkout",
      input: z.object({ total: z.number() }),
      dryRun: ({ total }) => ({
        summary: `This will charge $${total}`,
        effects: ["payment", "email"]
      }),
      run: () => ({ confirmed: true })
    });

    const result = await tool.dryRun({ total: 420 });
    expect(result).toEqual({
      ok: true,
      data: { summary: "This will charge $420", effects: ["payment", "email"] }
    });
  });

  it("returns VALIDATION_FAILED for invalid input", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const tool = mcp.tool("checkout.confirm", {
      description: "Confirm checkout",
      input: z.object({ total: z.number() }),
      dryRun: ({ total }) => ({ summary: `$${total}` }),
      run: () => ({ confirmed: true })
    });

    const result = await tool.dryRun({ total: "not-a-number" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("returns TOOL_EXECUTION_FAILED when no dryRun defined", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const tool = mcp.tool("cart.add", {
      description: "Add to cart",
      run: () => ({ ok: true })
    });

    const result = await tool.dryRun({});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("TOOL_EXECUTION_FAILED");
  });

  it("returns TOOL_EXECUTION_FAILED when dryRun throws", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const tool = mcp.tool("checkout.confirm", {
      description: "Confirm checkout",
      dryRun: () => { throw new Error("preview unavailable"); },
      run: () => ({ confirmed: true })
    });

    const result = await tool.dryRun({});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("TOOL_EXECUTION_FAILED");
  });

  it("works with async dryRun", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const tool = mcp.tool("checkout.confirm", {
      description: "Confirm checkout",
      dryRun: async () => ({ summary: "async preview" }),
      run: () => ({ confirmed: true })
    });

    const result = await tool.dryRun({});
    expect(result).toEqual({ ok: true, data: { summary: "async preview" } });
  });
});

describe("dryRun auto-called before confirmation dialog", () => {
  it("passes dryRunResult to custom approval provider", async () => {
    const approve = vi.fn<(req: ApprovalRequest) => Promise<boolean>>(async () => true);
    const mcp = createWebMCP({
      adapter: silentAdapter(),
      approval: { mode: "custom", approve }
    });
    const tool = mcp.tool("checkout.confirm", {
      description: "Confirm checkout",
      risk: "critical",
      dryRun: () => ({ summary: "Charges $420", effects: ["payment"] }),
      run: () => ({ confirmed: true })
    });

    await tool.execute({});
    expect(approve).toHaveBeenCalledOnce();
    expect(approve.mock.calls[0]?.[0]?.dryRunResult).toEqual({
      summary: "Charges $420",
      effects: ["payment"]
    });
  });

  it("proceeds with execution even if dryRun throws", async () => {
    const mcp = createWebMCP({
      adapter: silentAdapter(),
      approval: autoApproveConfig()
    });
    const tool = mcp.tool("checkout.confirm", {
      description: "Confirm checkout",
      risk: "critical",
      dryRun: () => { throw new Error("preview service down"); },
      run: () => ({ confirmed: true })
    });

    const result = await tool.execute({});
    expect(result.ok).toBe(true);
  });

  it("does not call dryRun when approval is not required", async () => {
    const dryRun = vi.fn(() => ({ summary: "preview" }));
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const tool = mcp.tool("product.search", {
      description: "Search products",
      risk: "read",
      dryRun,
      run: () => []
    });

    await tool.execute({});
    expect(dryRun).not.toHaveBeenCalled();
  });
});

describe("confirmWhen", () => {
  it("does not require approval when confirmWhen returns false", async () => {
    const approve = vi.fn(async () => true);
    const mcp = createWebMCP({
      adapter: silentAdapter(),
      approval: { mode: "custom", approve }
    });
    const tool = mcp.tool("cart.add", {
      description: "Add to cart",
      risk: "medium",
      input: z.object({ quantity: z.number() }),
      confirmWhen: ({ quantity }) => quantity > 5,
      run: () => ({ ok: true })
    });

    await tool.execute({ quantity: 2 });
    expect(approve).not.toHaveBeenCalled();
  });

  it("requires approval when confirmWhen returns true", async () => {
    const approve = vi.fn(async () => true);
    const mcp = createWebMCP({
      adapter: silentAdapter(),
      approval: { mode: "custom", approve }
    });
    const tool = mcp.tool("cart.add", {
      description: "Add to cart",
      risk: "medium",
      input: z.object({ quantity: z.number() }),
      confirmWhen: ({ quantity }) => quantity > 5,
      run: () => ({ ok: true })
    });

    await tool.execute({ quantity: 10 });
    expect(approve).toHaveBeenCalledOnce();
  });

  it("rejects when confirmWhen triggers approval but no provider configured", async () => {
    const mcp = createWebMCP({ adapter: silentAdapter() });
    const tool = mcp.tool("cart.add", {
      description: "Add to cart",
      risk: "medium",
      input: z.object({ quantity: z.number() }),
      confirmWhen: ({ quantity }) => quantity > 5,
      run: () => ({ ok: true })
    });

    const result = await tool.execute({ quantity: 10 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("APPROVAL_REQUIRED");
  });

  it("supports async confirmWhen", async () => {
    const approve = vi.fn(async () => true);
    const mcp = createWebMCP({
      adapter: silentAdapter(),
      approval: { mode: "custom", approve }
    });
    const tool = mcp.tool("cart.add", {
      description: "Add to cart",
      risk: "medium",
      confirmWhen: async () => true,
      run: () => ({ ok: true })
    });

    await tool.execute({});
    expect(approve).toHaveBeenCalledOnce();
  });

  it("does not evaluate confirmWhen if approval is already required by policy", async () => {
    const confirmWhen = vi.fn(() => true);
    const approve = vi.fn(async () => true);
    const mcp = createWebMCP({
      adapter: silentAdapter(),
      approval: { mode: "custom", approve, policy: "require-all" }
    });
    const tool = mcp.tool("cart.add", {
      description: "Add to cart",
      confirmWhen,
      run: () => ({ ok: true })
    });

    await tool.execute({});
    expect(approve).toHaveBeenCalledOnce();
    expect(confirmWhen).not.toHaveBeenCalled();
  });

  it("confirmWhen + dryRun work together", async () => {
    const approve = vi.fn<(req: ApprovalRequest) => Promise<boolean>>(async () => true);
    const mcp = createWebMCP({
      adapter: silentAdapter(),
      approval: { mode: "custom", approve }
    });
    const tool = mcp.tool("cart.add", {
      description: "Add to cart",
      risk: "medium",
      input: z.object({ quantity: z.number() }),
      confirmWhen: ({ quantity }) => quantity > 5,
      dryRun: ({ quantity }) => ({ summary: `Adding ${quantity} items`, effects: ["cart-update"] }),
      run: () => ({ ok: true })
    });

    await tool.execute({ quantity: 10 });
    expect(approve.mock.calls[0]?.[0]?.dryRunResult).toEqual({
      summary: "Adding 10 items",
      effects: ["cart-update"]
    });
  });
});

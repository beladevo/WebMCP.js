import { act, render } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { z } from "@webmcp-js/core";
import type { RegisteredWebMCPTool, WebMCPAdapter } from "@webmcp-js/core";
import { WebMCPProvider, useWebMCPResource, useWebMCPTool } from "../src/index.js";

function memoryAdapter() {
  const tools = new Map<string, RegisteredWebMCPTool>();
  const adapter: WebMCPAdapter = {
    name: "memory",
    isAvailable: () => true,
    registerTool: (tool) => { tools.set(tool.name, tool); },
    unregisterTool: (name) => { tools.delete(name); }
  };
  return { adapter, tools };
}

function ProductTool() {
  useWebMCPTool("cart.add_current_product", {
    description: "Add current product",
    input: z.object({ quantity: z.number().min(1).default(1) }),
    risk: "high",
    approval: true,
    run: ({ quantity }) => ({ quantity })
  });
  return null;
}

describe("@webmcp-js/react — useWebMCPTool", () => {
  it("registers on mount and unregisters on unmount", async () => {
    const { adapter, tools } = memoryAdapter();
    const result = render(
      <WebMCPProvider adapter={adapter}>
        <ProductTool />
      </WebMCPProvider>
    );
    await Promise.resolve();
    expect(tools.has("cart.add_current_product")).toBe(true);

    result.unmount();
    await Promise.resolve();
    expect(tools.has("cart.add_current_product")).toBe(false);
  });

  it("does not re-register when definition object changes on re-render", async () => {
    const registerTool = vi.fn();
    const adapter: WebMCPAdapter = {
      isAvailable: () => true,
      registerTool,
      unregisterTool: vi.fn()
    };

    let triggerRerender: () => void;
    function Comp() {
      const [count, setCount] = useState(0);
      triggerRerender = () => setCount(c => c + 1);
      // definition is a new object on every render
      useWebMCPTool("product.search", {
        description: "Search",
        run: () => [count]
      });
      return null;
    }

    render(
      <WebMCPProvider adapter={adapter}>
        <Comp />
      </WebMCPProvider>
    );
    await Promise.resolve();
    const firstCallCount = registerTool.mock.calls.length;

    await act(() => { triggerRerender(); });
    await act(() => { triggerRerender(); });

    // Should still be the same number of registrations — no re-registration on re-render
    expect(registerTool.mock.calls.length).toBe(firstCallCount);
  });

  it("uses latest run handler after re-render without re-registering", async () => {
    const { adapter, tools } = memoryAdapter();
    let triggerRerender: (val: number) => void;

    function Comp() {
      const [value, setValue] = useState(1);
      triggerRerender = setValue;
      useWebMCPTool("product.get", {
        description: "Get product",
        run: () => ({ value }) // closes over state
      });
      return null;
    }

    render(
      <WebMCPProvider adapter={adapter}>
        <Comp />
      </WebMCPProvider>
    );
    await Promise.resolve();

    const tool = tools.get("product.get");
    expect(tool).toBeDefined();
    expect((await tool!.execute({})).ok).toBe(true);
    if ((await tool!.execute({})).ok) {
      expect((await tool!.execute({})).data).toEqual({ value: 1 });
    }

    await act(() => { triggerRerender(42); });

    const result = await tool!.execute({});
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ value: 42 }); // latest handler
  });

  it("re-registers when tool name changes", async () => {
    const { adapter, tools } = memoryAdapter();
    let setName: (n: string) => void;

    function Comp() {
      const [name, setN] = useState("product.search");
      setName = setN;
      useWebMCPTool(name, { description: "Tool", run: () => ({}) });
      return null;
    }

    render(<WebMCPProvider adapter={adapter}><Comp /></WebMCPProvider>);
    await Promise.resolve();
    expect(tools.has("product.search")).toBe(true);

    await act(() => { setName("product.filter"); });
    await Promise.resolve();

    expect(tools.has("product.search")).toBe(false);
    expect(tools.has("product.filter")).toBe(true);
  });
});

describe("@webmcp-js/react — useWebMCPResource", () => {
  it("registers and unregisters a static resource", async () => {
    const resources = new Map<string, unknown>();
    const adapter: WebMCPAdapter = {
      isAvailable: () => true,
      registerTool: () => {},
      registerResource: (r) => { resources.set(r.name, r); },
      unregisterResource: (n) => { resources.delete(n); }
    };

    function Comp() {
      useWebMCPResource("webml.about", {
        uri: "webml://about",
        description: "About page",
        mimeType: "text/markdown",
        read: () => "# About"
      });
      return null;
    }

    const result = render(
      <WebMCPProvider adapter={adapter}>
        <Comp />
      </WebMCPProvider>
    );
    await Promise.resolve();
    expect(resources.has("webml.about")).toBe(true);

    result.unmount();
    await Promise.resolve();
    expect(resources.has("webml.about")).toBe(false);
  });

  it("uses latest read handler after re-render", async () => {
    const resources = new Map<string, WebMCPAdapter["registerResource"] extends ((r: infer R) => void) | undefined ? R : never>();
    const adapter: WebMCPAdapter = {
      isAvailable: () => true,
      registerTool: () => {},
      registerResource: (r) => { resources.set(r.name, r); },
      unregisterResource: (n) => { resources.delete(n); }
    };
    let setContent: (s: string) => void;

    function Comp() {
      const [content, setC] = useState("v1");
      setContent = setC;
      useWebMCPResource("webml.about", {
        uri: "webml://about",
        description: "About",
        read: () => content
      });
      return null;
    }

    render(<WebMCPProvider adapter={adapter}><Comp /></WebMCPProvider>);
    await Promise.resolve();

    const resource = resources.get("webml.about");
    expect((await resource!.read("webml://about"))).toEqual({ ok: true, data: "v1" });

    await act(() => { setContent("v2"); });
    expect((await resource!.read("webml://about"))).toEqual({ ok: true, data: "v2" });
  });
});

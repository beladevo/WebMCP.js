import type { RegisteredWebMCPTool, WebMCPAdapter } from "./types.js";

type ModelContextLike = {
  registerTool?: (tool: RegisteredWebMCPTool) => void | Promise<void>;
  unregisterTool?: (name: string) => void | Promise<void>;
};

declare global {
  interface Navigator {
    modelContext?: ModelContextLike;
  }
}

export function createNativeAdapter(): WebMCPAdapter {
  return {
    name: "native",
    isAvailable() {
      return typeof globalThis.navigator?.modelContext?.registerTool === "function";
    },
    async registerTool(tool) {
      const registerTool = globalThis.navigator?.modelContext?.registerTool;
      if (typeof registerTool !== "function") {
        throw new Error("navigator.modelContext.registerTool is not available.");
      }
      await registerTool.call(globalThis.navigator.modelContext, tool);
    },
    async unregisterTool(name) {
      const unregisterTool = globalThis.navigator?.modelContext?.unregisterTool;
      if (typeof unregisterTool === "function") {
        await unregisterTool.call(globalThis.navigator.modelContext, name);
      }
    }
  };
}

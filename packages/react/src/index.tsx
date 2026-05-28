import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type PropsWithChildren
} from "react";
import {
  createWebMCP,
  type CreateWebMCPOptions,
  type InferSchemaOutput,
  type ResourceDefinition,
  type StaticResourceDefinition,
  type TemplateResourceDefinition,
  type ToolDefinition,
  type WebMCPInstance
} from "@webmcp-js/core";

const WebMCPContext = createContext<WebMCPInstance | null>(null);

export type WebMCPProviderProps = PropsWithChildren<CreateWebMCPOptions>;

export function WebMCPProvider({ children, ...options }: WebMCPProviderProps) {
  const instance = useMemo(() => createWebMCP(options), [options.adapter]);
  return createElement(WebMCPContext.Provider, { value: instance }, children);
}

export function useWebMCP(): WebMCPInstance {
  const instance = useContext(WebMCPContext);
  if (!instance) {
    throw new Error("useWebMCP must be used within a WebMCPProvider.");
  }
  return instance;
}

// Stable-ref pattern: register once per [mcp, name], always delegate callbacks
// to the latest definition via a ref. Prevents stale-closure bugs without
// triggering re-registration on every render.
export function useWebMCPTool<TSchema = undefined, TOutput = unknown>(
  name: string,
  definition: ToolDefinition<
    TSchema extends undefined ? unknown : InferSchemaOutput<TSchema>,
    TOutput
  > & { input?: TSchema }
): void;
export function useWebMCPTool<TInput, TOutput>(
  name: string,
  definition: ToolDefinition<TInput, TOutput>
): void {
  const mcp = useWebMCP();
  const latestDef = useRef(definition);

  // Sync latest definition on every render — no deps needed, runs before
  // the registration effect so the first execution always sees the latest.
  useEffect(() => {
    latestDef.current = definition;
  });

  useEffect(() => {
    const snap = latestDef.current;
    const stable: ToolDefinition<TInput, TOutput> = {
      description: snap.description,
      ...(snap.input !== undefined ? { input: snap.input } : {}),
      ...(snap.output !== undefined ? { output: snap.output } : {}),
      ...(snap.risk !== undefined ? { risk: snap.risk } : {}),
      ...(snap.approval !== undefined ? { approval: snap.approval } : {}),
      ...(snap.enabledWhen !== undefined ? {
        enabledWhen: snap.enabledWhen.map((c, i) => ({
          // Forward to latest condition in case the check closure changes
          check: () => latestDef.current.enabledWhen?.[i]?.check() ?? c.check(),
          reason: c.reason,
        })),
      } : {}),
      ...(snap.confirmWhen !== undefined ? {
        confirmWhen: (input: TInput) => latestDef.current.confirmWhen!(input),
      } : {}),
      ...(snap.dryRun !== undefined ? {
        dryRun: (input: TInput) => latestDef.current.dryRun!(input),
      } : {}),
      run: (input: TInput, ctx) => latestDef.current.run(input, ctx),
    };

    const registerTool = mcp.tool as <I, O>(
      n: string,
      d: ToolDefinition<I, O>
    ) => { unregister(): Promise<void> };
    const handle = registerTool(name, stable);
    return () => void handle.unregister();
  }, [mcp, name]);
}

export function useWebMCPResource<
  TParams extends Record<string, string> = Record<string, string>
>(name: string, definition: ResourceDefinition<TParams>): void {
  const mcp = useWebMCP();
  const latestDef = useRef(definition);

  useEffect(() => {
    latestDef.current = definition;
  });

  useEffect(() => {
    const snap = latestDef.current;
    let stable: ResourceDefinition<TParams>;

    if ("uri" in snap) {
      stable = {
        uri: snap.uri,
        description: snap.description,
        ...(snap.mimeType !== undefined ? { mimeType: snap.mimeType } : {}),
        read: () => (latestDef.current as StaticResourceDefinition).read(),
      } as StaticResourceDefinition;
    } else {
      const tSnap = snap as TemplateResourceDefinition<TParams>;
      stable = {
        uriTemplate: tSnap.uriTemplate,
        description: tSnap.description,
        ...(tSnap.mimeType !== undefined ? { mimeType: tSnap.mimeType } : {}),
        read: (params: TParams) =>
          (latestDef.current as TemplateResourceDefinition<TParams>).read(params),
      } as TemplateResourceDefinition<TParams>;
    }

    const handle = mcp.resource<TParams>(name, stable);
    return () => void handle.unregister();
  }, [mcp, name]);
}

export type { CreateWebMCPOptions, ToolDefinition, WebMCPInstance } from "@webmcp-js/core";

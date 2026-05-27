import type { z } from "zod";

export type ToolRisk = "read" | "low" | "medium" | "high" | "critical";
export type UnavailableBehavior = "silent" | "warn" | "throw";
export type ApprovalPolicy = "risk-based" | "require-all" | "allow-all";

export type WebMCPErrorCode =
  | "WEBMCP_UNAVAILABLE"
  | "VALIDATION_FAILED"
  | "APPROVAL_REQUIRED"
  | "APPROVAL_REJECTED"
  | "TOOL_EXECUTION_FAILED"
  | "TOOL_CONDITION_FAILED";

export interface ToolCondition {
  check: () => boolean | Promise<boolean>;
  reason: string;
}

export interface ExplainResult {
  tool: string;
  available: boolean;
  reasons: string[];
}

export interface StructuredToolError {
  code: WebMCPErrorCode;
  message: string;
  risk?: ToolRisk;
  details?: unknown;
}

export type ToolResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: StructuredToolError };

export interface ApprovalRule {
  match: string;
  requireApproval: boolean;
  reason?: string;
}

export interface DryRunResult {
  summary: string;
  effects?: string[];
}

export interface ApprovalRequest {
  tool: string;
  description: string;
  input: unknown;
  risk: ToolRisk;
  reason: string;
  dryRunResult?: DryRunResult;
}

export type ApprovalProvider = (request: ApprovalRequest) => boolean | Promise<boolean>;

interface ApprovalSettings {
  policy?: ApprovalPolicy;
  rules?: ApprovalRule[];
}

export type ApprovalConfig = ApprovalSettings &
  (
    | { mode?: undefined }
    | { mode: "browser-dialog" }
    | { mode: "built-in" }
    | { mode: "custom"; approve: ApprovalProvider }
    | { mode: "none" }
  );

export interface ApprovalOptions {
  required?: boolean;
  reason?: string;
}

export interface AuditOptions {
  redactInput?: boolean;
}

export interface AuditEvent {
  tool: string;
  risk: ToolRisk;
  input: unknown;
  timestamp: number;
}

export interface AuditErrorEvent extends AuditEvent {
  error: StructuredToolError;
}

export interface AuditSuccessEvent extends AuditEvent {
  output: unknown;
}

export interface AuditConfig {
  redact?: (input: unknown, event: Omit<AuditEvent, "input">) => unknown;
  onToolCallStart?: (event: AuditEvent) => void | Promise<void>;
  onToolCallSuccess?: (event: AuditSuccessEvent) => void | Promise<void>;
  onToolCallDenied?: (event: AuditErrorEvent) => void | Promise<void>;
  onToolCallError?: (event: AuditErrorEvent) => void | Promise<void>;
}

// ─── Resources ───────────────────────────────────────────────────────────────

export interface StaticResourceDefinition {
  uri: string;
  description: string;
  mimeType?: string;
  read: () => string | Promise<string>;
}

export interface TemplateResourceDefinition<
  TParams extends Record<string, string> = Record<string, string>
> {
  uriTemplate: string;
  description: string;
  mimeType?: string;
  read: (params: TParams) => string | Promise<string>;
}

export type ResourceDefinition<TParams extends Record<string, string> = Record<string, string>> =
  | StaticResourceDefinition
  | TemplateResourceDefinition<TParams>;

export interface RegisteredWebMCPResource {
  name: string;
  description: string;
  mimeType?: string;
  uri?: string;
  uriTemplate?: string;
  read(uri: string): Promise<ToolResult<string>>;
}

export interface RegisteredResourceHandle<
  TParams extends Record<string, string> = Record<string, string>
> {
  name: string;
  definition: ResourceDefinition<TParams>;
  webmcpResource: RegisteredWebMCPResource;
  read(uri: string): Promise<ToolResult<string>>;
  unregister(): Promise<void>;
}

// ─── Runtime status ──────────────────────────────────────────────────────────

export interface RuntimeStatus {
  native: boolean;
  adapterName: string;
  registeredTools: number;
  registeredResources: number;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export interface WebMCPAdapter {
  name?: string;
  isAvailable(): boolean;
  registerTool(tool: RegisteredWebMCPTool): void | Promise<void>;
  unregisterTool?(name: string): void | Promise<void>;
  registerResource?(resource: RegisteredWebMCPResource): void | Promise<void>;
  unregisterResource?(name: string): void | Promise<void>;
}

export interface RegisteredWebMCPTool {
  name: string;
  description: string;
  risk: ToolRisk;
  inputSchema?: unknown;
  outputSchema?: unknown;
  execute: (input: unknown) => Promise<ToolResult>;
}

export interface CreateWebMCPOptions {
  appName?: string;
  debug?: boolean;
  showSupportWebMCP?: boolean;
  supportWebMCPBadgeText?: string;
  unavailable?: UnavailableBehavior;
  approval?: ApprovalConfig;
  audit?: AuditConfig;
  adapter?: WebMCPAdapter;
}

export interface ToolExecutionContext {
  tool: string;
  risk: ToolRisk;
  approvalRequired: boolean;
}

export interface ToolDefinition<TInput, TOutput> {
  description: string;
  input?: unknown;
  output?: unknown;
  risk?: ToolRisk;
  approval?: boolean | ApprovalOptions;
  audit?: boolean | AuditOptions;
  enabledWhen?: ToolCondition[];
  confirmWhen?: (input: TInput) => boolean | Promise<boolean>;
  dryRun?: (input: TInput) => DryRunResult | Promise<DryRunResult>;
  run: (input: TInput, context: ToolExecutionContext) => Promise<TOutput> | TOutput;
}

export type InferSchemaInput<TSchema> = TSchema extends z.ZodTypeAny ? z.input<TSchema> : unknown;
export type InferSchemaOutput<TSchema> = TSchema extends z.ZodTypeAny ? z.output<TSchema> : unknown;

export interface RegisteredToolHandle<TInput = unknown, TOutput = unknown> {
  name: string;
  definition: ToolDefinition<TInput, TOutput>;
  webmcpTool: RegisteredWebMCPTool;
  execute(input: unknown): Promise<ToolResult<TOutput>>;
  dryRun(input: unknown): Promise<ToolResult<DryRunResult>>;
  unregister(): Promise<void>;
}

export interface WebMCPInstance {
  tool<TSchema = undefined, TOutput = unknown>(
    name: string,
    definition: ToolDefinition<
      TSchema extends undefined ? unknown : InferSchemaOutput<TSchema>,
      TOutput
    > & {
      input?: TSchema;
    }
  ): RegisteredToolHandle<
    TSchema extends undefined ? unknown : InferSchemaOutput<TSchema>,
    TOutput
  >;
  tool<TInput = unknown, TOutput = unknown>(
    name: string,
    definition: ToolDefinition<TInput, TOutput>
  ): RegisteredToolHandle<TInput, TOutput>;
  resource<TParams extends Record<string, string> = Record<string, string>>(
    name: string,
    definition: ResourceDefinition<TParams>
  ): RegisteredResourceHandle<TParams>;
  unregister(name: string): Promise<void>;
  unregisterResource(name: string): Promise<void>;
  getTool(name: string): RegisteredToolHandle | undefined;
  getResource(name: string): RegisteredResourceHandle | undefined;
  listTools(): RegisteredToolHandle[];
  listResources(): RegisteredResourceHandle[];
  explain(name: string): Promise<ExplainResult>;
  getRuntimeStatus(): RuntimeStatus;
  call(name: string, input: unknown): Promise<ToolResult>;
}

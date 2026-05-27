export { createNativeAdapter } from "./adapter.js";
export { matchesToolName, decideApproval } from "./approval.js";
export { createDevAdapter } from "./dev-adapter.js";
export { showApprovalDialog } from "./approval-dialog.js";
export type * from "./types.js";
export { condition } from "./condition.js";

import { createNativeAdapter } from "./adapter.js";
import { decideApproval } from "./approval.js";
import { showApprovalDialog } from "./approval-dialog.js";
import { createBadge } from "./badge.js";
import { createLogger } from "./logger.js";
import { toJsonSchema, validateInput } from "./schema.js";
import { condition as _condition } from "./condition.js";
import type {
  AuditEvent,
  CreateWebMCPOptions,
  ExplainResult,
  RegisteredToolHandle,
  RegisteredWebMCPTool,
  StructuredToolError,
  ToolCondition,
  ToolDefinition,
  ToolResult,
  ToolRisk,
  WebMCPInstance
} from "./types.js";

export { z } from "zod";

async function evaluateConditions(conditions: ToolCondition[]): Promise<string[]> {
  const results = await Promise.all(conditions.map((c) => c.check()));
  return conditions.filter((_, i) => !results[i]).map((c) => c.reason);
}

export function createWebMCP(options: CreateWebMCPOptions = {}): WebMCPInstance {
  const adapter = options.adapter ?? createNativeAdapter();
  const unavailable = options.unavailable ?? "warn";
  const logger = createLogger(options.debug);
  const tools = new Map<string, RegisteredToolHandle>();
  const badge = options.showSupportWebMCP
    ? createBadge({
        ...(options.appName ? { appName: options.appName } : {}),
        text: options.supportWebMCPBadgeText ?? "We support WebMCP",
        isRuntimeAvailable: () => adapter.isAvailable(),
        listTools: () => [...tools.values()]
      })
    : undefined;

  function redact(input: unknown, event: Omit<AuditEvent, "input">) {
    return options.audit?.redact ? options.audit.redact(input, event) : "[redacted]";
  }

  async function emitDenied(
    name: string,
    risk: ToolRisk,
    input: unknown,
    error: StructuredToolError
  ) {
    await options.audit?.onToolCallDenied?.({
      tool: name,
      risk,
      input: redact(input, { tool: name, risk, timestamp: Date.now() }),
      timestamp: Date.now(),
      error
    });
  }

  function buildError(
    code: StructuredToolError["code"],
    message: string,
    risk: ToolRisk,
    details?: unknown
  ) {
    return { code, message, risk, details };
  }

  async function requestApproval(request: {
    name: string;
    description: string;
    input: unknown;
    risk: ToolRisk;
    reason: string;
  }): Promise<ToolResult<true>> {
    const provider = options.approval;
    if (!provider || !provider.mode || provider.mode === "none") {
      return {
        ok: false,
        error: buildError(
          "APPROVAL_REQUIRED",
          `Tool ${request.name} requires approval, but no approval provider is configured.`,
          request.risk
        )
      };
    }

    let accepted: boolean;
    if (provider.mode === "custom") {
      accepted = await provider.approve({
        tool: request.name,
        description: request.description,
        input: request.input,
        risk: request.risk,
        reason: request.reason
      });
    } else if (provider.mode === "built-in") {
      accepted = await showApprovalDialog({
        tool: request.name,
        description: request.description,
        input: request.input,
        risk: request.risk,
        reason: request.reason
      });
    } else {
      accepted =
        typeof globalThis.confirm === "function" &&
        globalThis.confirm(
          `Allow ${request.name} to run?\n\n${request.description}\n\n${request.reason}`
        );
    }

    if (!accepted) {
      return {
        ok: false,
        error: buildError(
          "APPROVAL_REJECTED",
          `Approval was rejected for ${request.name}.`,
          request.risk
        )
      };
    }

    return { ok: true, data: true };
  }

  function tool<TInput, TOutput>(
    name: string,
    definition: ToolDefinition<TInput, TOutput>
  ): RegisteredToolHandle<TInput, TOutput> {
    const risk = definition.risk ?? "read";
    const inputSchema = toJsonSchema(definition.input);
    const outputSchema = toJsonSchema(definition.output);

    const execute = async (rawInput: unknown): Promise<ToolResult<TOutput>> => {
      const auditInput = redact(rawInput, { tool: name, risk, timestamp: Date.now() });
      const baseEvent = { tool: name, risk, input: auditInput, timestamp: Date.now() };

      logger.debug(`Executing tool ${name}.`, { risk });
      await options.audit?.onToolCallStart?.(baseEvent);

      if (definition.enabledWhen && definition.enabledWhen.length > 0) {
        const failedReasons = await evaluateConditions(definition.enabledWhen);
        if (failedReasons.length > 0) {
          logger.debug(`Conditions failed for ${name}.`, failedReasons);
          const error = buildError(
            "TOOL_CONDITION_FAILED",
            `Tool ${name} is not currently available.`,
            risk,
            failedReasons
          );
          await emitDenied(name, risk, rawInput, error);
          return { ok: false, error };
        }
      }

      const validation = validateInput(definition.input, rawInput);
      if (!validation.success) {
        logger.debug(`Validation failed for ${name}.`, validation.error);
        const error = buildError(
          "VALIDATION_FAILED",
          `Invalid input for tool ${name}.`,
          risk,
          validation.error
        );
        await emitDenied(name, risk, rawInput, error);
        return { ok: false, error };
      }

      const toolApproval =
        typeof definition.approval === "boolean"
          ? definition.approval
          : definition.approval?.required;
      const approvalRequest: Parameters<typeof decideApproval>[0] = {
        name,
        risk
      };
      if (toolApproval !== undefined) {
        approvalRequest.toolApproval = toolApproval;
      }
      if (options.approval !== undefined) {
        approvalRequest.config = options.approval;
      }

      const approval = decideApproval(approvalRequest);
      logger.debug(`Approval decision for ${name}.`, approval);

      if (approval.required) {
        logger.debug(`Approval required for ${name}.`);
        const approvalResult = await requestApproval({
          name,
          description: definition.description,
          input: validation.data,
          risk,
          reason:
            definition.approval && typeof definition.approval !== "boolean"
              ? (definition.approval.reason ?? approval.reason)
              : approval.reason
        });
        if (!approvalResult.ok) {
          logger.debug(`Approval rejected or unavailable for ${name}.`, approvalResult.error);
          await emitDenied(name, risk, rawInput, approvalResult.error);
          return approvalResult;
        }
      }

      try {
        const output = await definition.run(validation.data as TInput, {
          tool: name,
          risk,
          approvalRequired: approval.required
        });
        logger.debug(`Execution succeeded for ${name}.`);
        await options.audit?.onToolCallSuccess?.({ ...baseEvent, output: "[redacted]" });
        return { ok: true, data: output };
      } catch (cause) {
        logger.debug(`Execution failed for ${name}.`, cause);
        const error = buildError(
          "TOOL_EXECUTION_FAILED",
          `Tool ${name} failed during execution.`,
          risk,
          cause
        );
        await options.audit?.onToolCallError?.({ ...baseEvent, error });
        return { ok: false, error };
      }
    };

    const webmcpTool: RegisteredWebMCPTool = {
      name,
      description: definition.description,
      risk,
      inputSchema,
      outputSchema,
      execute
    };

    const handle: RegisteredToolHandle<TInput, TOutput> = {
      name,
      definition,
      webmcpTool,
      execute,
      async unregister() {
        await unregister(name);
      }
    };
    tools.set(name, handle as RegisteredToolHandle);
    badge?.update();

    logger.debug(`Registering tool ${name}.`, { risk });
    if (adapter.isAvailable()) {
      void Promise.resolve(adapter.registerTool(webmcpTool)).catch((cause) => {
        logger.warn(`Failed to register tool ${name}.`, cause);
      });
    } else {
      const message = "WebMCP runtime is unavailable; tool is registered locally only.";
      if (unavailable === "throw") {
        throw Object.assign(new Error(message), {
          code: "WEBMCP_UNAVAILABLE"
        });
      }
      if (unavailable === "warn") logger.warn(message, { tool: name });
      logger.debug(`Unavailable WebMCP runtime for ${name}.`);
    }

    return handle;
  }

  async function unregister(name: string) {
    tools.delete(name);
    badge?.update();
    if (adapter.isAvailable()) {
      await adapter.unregisterTool?.(name);
    }
  }

  async function explain(name: string): Promise<ExplainResult> {
    const handle = tools.get(name);
    if (!handle) {
      return { tool: name, available: false, reasons: ["Tool not registered"] };
    }
    const conditions = handle.definition.enabledWhen;
    if (!conditions || conditions.length === 0) {
      return { tool: name, available: true, reasons: [] };
    }
    const failedReasons = await evaluateConditions(conditions);
    return {
      tool: name,
      available: failedReasons.length === 0,
      reasons: failedReasons
    };
  }

  return {
    tool: tool as WebMCPInstance["tool"],
    unregister,
    getTool(name) {
      return tools.get(name);
    },
    listTools() {
      return [...tools.values()];
    },
    explain
  };
}

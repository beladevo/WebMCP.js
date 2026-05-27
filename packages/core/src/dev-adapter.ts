import type { RegisteredWebMCPTool, WebMCPAdapter } from "./types.js";

const PANEL_ID = "webmcp-js-dev-panel";

const RISK_COLORS: Record<string, string> = {
  read: "#059669",
  low: "#16a34a",
  medium: "#d97706",
  high: "#dc2626",
  critical: "#7c3aed"
};

function schemaToExample(schema: unknown): unknown {
  if (!schema || typeof schema !== "object") return {};
  const s = schema as Record<string, unknown>;
  if (s["type"] === "string") return "";
  if (s["type"] === "number" || s["type"] === "integer") return 0;
  if (s["type"] === "boolean") return false;
  if (s["type"] === "array") return [];
  if (s["type"] === "object" && s["properties"] && typeof s["properties"] === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(s["properties"])) {
      result[key] = schemaToExample(val);
    }
    return result;
  }
  return {};
}

interface DevPanelController {
  update(): void;
}

function createDevPanel(tools: Map<string, RegisteredWebMCPTool>): DevPanelController {
  if (typeof document === "undefined") return { update() {} };
  if (document.getElementById(PANEL_ID)) return { update() {} };

  const expandedTools = new Set<string>();
  const toolResults = new Map<string, string>();
  const toolInputs = new Map<string, string>();

  const root = document.createElement("div");
  root.id = PANEL_ID;
  root.style.cssText = [
    "position:fixed",
    "left:16px",
    "bottom:16px",
    "z-index:2147483646",
    "font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace",
    "font-size:13px",
    "color:#e5e7eb",
    "max-width:min(460px,calc(100vw - 32px))"
  ].join(";");

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.style.cssText = [
    "border:1px solid #374151",
    "border-radius:6px",
    "background:#1f2937",
    "color:#d1d5db",
    "cursor:pointer",
    "font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace",
    "padding:7px 11px",
    "display:flex",
    "align-items:center",
    "gap:6px",
    "box-shadow:0 4px 12px rgba(0,0,0,0.4)"
  ].join(";");

  const panel = document.createElement("div");
  panel.hidden = true;
  panel.style.cssText = [
    "border:1px solid #374151",
    "border-radius:8px",
    "background:#111827",
    "box-shadow:0 20px 60px rgba(0,0,0,0.6)",
    "margin-bottom:8px",
    "overflow:hidden",
    "width:min(460px,calc(100vw - 32px))",
    "max-height:min(520px,calc(100vh - 100px))",
    "display:flex",
    "flex-direction:column"
  ].join(";");

  root.append(panel, toggle);
  document.body.append(root);

  function renderToggle() {
    const count = tools.size;
    toggle.textContent = "";
    const dot = document.createElement("span");
    dot.style.cssText = `width:7px;height:7px;border-radius:50%;background:${count > 0 ? "#22c55e" : "#6b7280"};flex-shrink:0`;
    const label = document.createElement("span");
    label.textContent = `WebMCP Dev${count > 0 ? ` (${count})` : ""}`;
    toggle.append(dot, label);
  }

  function renderPanel() {
    panel.replaceChildren();

    const header = document.createElement("div");
    header.style.cssText = [
      "display:flex",
      "align-items:center",
      "justify-content:space-between",
      "padding:10px 14px",
      "border-bottom:1px solid #1f2937",
      "background:#0f172a",
      "flex-shrink:0"
    ].join(";");

    const title = document.createElement("span");
    title.style.cssText = "font:700 13px/1 ui-monospace,Menlo,monospace;color:#f9fafb";
    title.textContent = `WebMCP Dev Tools`;

    const meta = document.createElement("span");
    meta.style.cssText = "font:400 11px/1 ui-monospace,Menlo,monospace;color:#6b7280;margin-left:8px";
    meta.textContent = `${tools.size} tool${tools.size !== 1 ? "s" : ""}`;

    const titleGroup = document.createElement("div");
    titleGroup.style.cssText = "display:flex;align-items:baseline;gap:0";
    titleGroup.append(title, meta);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "×";
    closeBtn.style.cssText = [
      "background:none",
      "border:none",
      "color:#6b7280",
      "cursor:pointer",
      "font:400 18px/1 ui-sans-serif",
      "padding:0 2px",
      "line-height:1"
    ].join(";");
    closeBtn.addEventListener("click", () => {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    });

    header.append(titleGroup, closeBtn);
    panel.append(header);

    if (tools.size === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "padding:24px 16px;color:#6b7280;text-align:center;font-size:12px";
      empty.textContent = "No tools registered yet.";
      panel.append(empty);
      return;
    }

    const list = document.createElement("div");
    list.style.cssText = "overflow-y:auto;flex:1";

    for (const tool of tools.values()) {
      const risk = tool.risk;
      const riskColor = RISK_COLORS[risk] ?? "#6b7280";
      const isExpanded = expandedTools.has(tool.name);

      const row = document.createElement("div");
      row.style.cssText = [
        "border-bottom:1px solid #1f2937",
        "padding:10px 14px"
      ].join(";");

      const rowHeader = document.createElement("div");
      rowHeader.style.cssText = "display:flex;align-items:center;justify-content:space-between;cursor:pointer;gap:8px";

      const nameGroup = document.createElement("div");
      nameGroup.style.cssText = "display:flex;align-items:center;gap:8px;min-width:0";

      const arrow = document.createElement("span");
      arrow.textContent = isExpanded ? "▾" : "▸";
      arrow.style.cssText = "color:#6b7280;font-size:10px;flex-shrink:0";

      const nameEl = document.createElement("span");
      nameEl.textContent = tool.name;
      nameEl.style.cssText = "color:#93c5fd;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";

      nameGroup.append(arrow, nameEl);

      const riskBadge = document.createElement("span");
      riskBadge.textContent = risk;
      riskBadge.style.cssText = [
        `background:${riskColor}20`,
        `color:${riskColor}`,
        "border:1px solid currentColor",
        "border-radius:4px",
        "padding:1px 6px",
        "font-size:10px",
        "font-weight:600",
        "flex-shrink:0",
        "text-transform:uppercase",
        "letter-spacing:0.04em"
      ].join(";");

      rowHeader.append(nameGroup, riskBadge);

      rowHeader.addEventListener("click", () => {
        if (expandedTools.has(tool.name)) {
          expandedTools.delete(tool.name);
        } else {
          expandedTools.add(tool.name);
        }
        renderPanel();
      });

      row.append(rowHeader);

      if (isExpanded) {
        const body = document.createElement("div");
        body.style.cssText = "margin-top:10px;display:flex;flex-direction:column;gap:8px";

        const desc = document.createElement("div");
        desc.textContent = tool.description;
        desc.style.cssText = "color:#9ca3af;font-size:12px;line-height:1.5;font-family:ui-sans-serif,system-ui,sans-serif";
        body.append(desc);

        const inputLabel = document.createElement("label");
        inputLabel.textContent = "Input JSON";
        inputLabel.style.cssText = "color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.06em";
        body.append(inputLabel);

        const textarea = document.createElement("textarea");
        const example = schemaToExample(tool.inputSchema);
        textarea.value = toolInputs.get(tool.name) ?? JSON.stringify(example, null, 2);
        textarea.rows = 4;
        textarea.spellcheck = false;
        textarea.style.cssText = [
          "width:100%",
          "box-sizing:border-box",
          "background:#0f172a",
          "border:1px solid #374151",
          "border-radius:6px",
          "color:#e5e7eb",
          "font:400 12px/1.5 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace",
          "padding:8px",
          "resize:vertical",
          "outline:none"
        ].join(";");
        textarea.addEventListener("focus", () => {
          textarea.style.borderColor = "#3b82f6";
        });
        textarea.addEventListener("blur", () => {
          textarea.style.borderColor = "#374151";
          toolInputs.set(tool.name, textarea.value);
        });
        body.append(textarea);

        const runBtn = document.createElement("button");
        runBtn.type = "button";
        runBtn.textContent = "▶  Run Tool";
        runBtn.style.cssText = [
          "align-self:flex-end",
          "background:#2563eb",
          "border:none",
          "border-radius:6px",
          "color:#fff",
          "cursor:pointer",
          "font:600 12px/1 ui-monospace,Menlo,monospace",
          "padding:7px 14px"
        ].join(";");

        const resultBox = document.createElement("div");
        const existing = toolResults.get(tool.name);
        if (existing) {
          renderResult(resultBox, existing);
        }

        runBtn.addEventListener("click", async () => {
          toolInputs.set(tool.name, textarea.value);
          runBtn.textContent = "⏳ Running…";
          runBtn.style.opacity = "0.6";
          runBtn.disabled = true;

          let parsed: unknown;
          try {
            parsed = JSON.parse(textarea.value || "{}");
          } catch {
            const msg = "JSON parse error: " + (textarea.value || "{}");
            toolResults.set(tool.name, JSON.stringify({ error: msg }));
            renderResult(resultBox, toolResults.get(tool.name)!);
            runBtn.textContent = "▶  Run Tool";
            runBtn.style.opacity = "1";
            runBtn.disabled = false;
            return;
          }

          const result = await tool.execute(parsed);
          const serialized = JSON.stringify(result, null, 2);
          toolResults.set(tool.name, serialized);
          renderResult(resultBox, serialized);
          runBtn.textContent = "▶  Run Tool";
          runBtn.style.opacity = "1";
          runBtn.disabled = false;
        });

        body.append(runBtn, resultBox);
        row.append(body);
      }

      list.append(row);
    }

    panel.append(list);
  }

  function renderResult(container: HTMLElement, json: string) {
    container.replaceChildren();
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      parsed = json;
    }

    const isOk = parsed && typeof parsed === "object" && "ok" in (parsed as object) && (parsed as { ok: unknown }).ok === true;
    const isErr = parsed && typeof parsed === "object" && "ok" in (parsed as object) && (parsed as { ok: unknown }).ok === false;

    const label = document.createElement("div");
    label.style.cssText = "display:flex;align-items:center;gap:6px;margin-bottom:6px";

    const badge = document.createElement("span");
    badge.style.cssText = `font-size:11px;font-weight:700;color:${isOk ? "#22c55e" : isErr ? "#ef4444" : "#9ca3af"}`;
    badge.textContent = isOk ? "✓ Success" : isErr ? "✗ Error" : "Result";
    label.append(badge);
    container.append(label);

    const pre = document.createElement("pre");
    pre.style.cssText = [
      "background:#0f172a",
      "border:1px solid #1f2937",
      "border-radius:6px",
      "color:#d1d5db",
      "font:400 11px/1.5 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace",
      "margin:0",
      "max-height:140px",
      "overflow:auto",
      "padding:8px",
      "white-space:pre-wrap",
      "word-break:break-all"
    ].join(";");
    pre.textContent = JSON.stringify(parsed, null, 2);
    container.append(pre);
  }

  renderToggle();

  toggle.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) renderPanel();
  });

  return {
    update() {
      renderToggle();
      if (!panel.hidden) renderPanel();
    }
  };
}

export function createDevAdapter(): WebMCPAdapter {
  const tools = new Map<string, RegisteredWebMCPTool>();
  let controller: DevPanelController | undefined;

  function getPanel() {
    if (!controller && typeof document !== "undefined") {
      controller = createDevPanel(tools);
    }
    return controller;
  }

  return {
    name: "dev",
    isAvailable: () => typeof document !== "undefined",
    registerTool(tool) {
      tools.set(tool.name, tool);
      getPanel()?.update();
    },
    unregisterTool(name) {
      tools.delete(name);
      getPanel()?.update();
    }
  };
}
